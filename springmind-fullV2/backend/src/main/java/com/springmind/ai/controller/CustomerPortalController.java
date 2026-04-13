package com.springmind.ai.controller;

import com.springmind.ai.config.JwtUtils;
import com.springmind.ai.exception.ResourceNotFoundException;
import com.springmind.ai.model.Ticket;
import com.springmind.ai.model.User;
import com.springmind.ai.repository.TicketCommentRepository;
import com.springmind.ai.repository.TicketRepository;
import com.springmind.ai.repository.UserRepository;
import com.springmind.ai.service.TicketService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * CustomerPortalController
 * ─────────────────────────────────────────────────────────────────────────────
 * All public and customer-authenticated endpoints.
 *
 * Option A — No-login lookup (public):
 *   POST /customer/lookup          → find tickets by email + ticket number
 *   GET  /customer/tickets/{num}   → ticket status by ticket number (public)
 *
 * Option B — Full customer account (JWT-based):
 *   POST /customer/register        → create customer account
 *   POST /customer/login           → login, get JWT
 *   GET  /customer/my-tickets      → all tickets for logged-in customer
 *   GET  /customer/my-tickets/{id} → single ticket detail with comments
 *   POST /customer/my-tickets/{id}/reply → customer replies to ticket
 *   POST /customer/submit          → submit new ticket (authenticated)
 */
@RestController
@RequestMapping("/customer")
@RequiredArgsConstructor
public class CustomerPortalController {

    private final TicketRepository        ticketRepo;
    private final TicketCommentRepository commentRepo;
    private final UserRepository          userRepo;
    private final PasswordEncoder         encoder;
    private final JwtUtils                jwtUtils;
    private final TicketService           ticketService;

    // ── OPTION A: No-login lookup ─────────────────────────────────────────────

    /**
     * Public lookup: customer enters their email + ticket number
     * No account needed. Returns ticket status and timeline.
     */
    @PostMapping("/lookup")
    public ResponseEntity<Map<String, Object>> lookup(@Valid @RequestBody LookupRequest req) {
        Ticket ticket = ticketRepo
            .findByTicketNumberAndCustomerEmail(req.getTicketNumber().trim().toUpperCase(), req.getEmail().trim())
            .orElseThrow(() -> new ResourceNotFoundException(
                "No ticket found with number " + req.getTicketNumber() + " for email " + req.getEmail()));
        return ResponseEntity.ok(toPublicMap(ticket));
    }

    /**
     * Public status check by ticket number alone (for sharing ticket links)
     */
    @GetMapping("/tickets/{ticketNumber}")
    public ResponseEntity<Map<String, Object>> publicStatus(@PathVariable String ticketNumber) {
        Ticket ticket = ticketRepo.findByTicketNumber(ticketNumber.toUpperCase())
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketNumber));
        return ResponseEntity.ok(toPublicMap(ticket));
    }

    // ── OPTION B: Full customer account ──────────────────────────────────────

    /**
     * Customer self-registration
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody CustomerRegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        User customer = User.builder()
            .fullName(req.getFullName())
            .email(req.getEmail())
            .passwordHash(encoder.encode(req.getPassword()))
            .department("CUSTOMER")
            .roles(Set.of("CUSTOMER"))
            .build();
        User saved = userRepo.save(customer);
        String token = jwtUtils.generateToken(saved);
        return ResponseEntity.status(201).body(Map.of(
            "message",     "Account created successfully",
            "accessToken", token,
            "user", Map.of(
                "id",    saved.getId(),
                "name",  saved.getFullName(),
                "email", saved.getEmail(),
                "roles", saved.getRoles()
            )
        ));
    }

    /**
     * Customer login
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody CustomerLoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
            .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid email or password"));
        if (!encoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid email or password");
        }
        if (!user.getRoles().contains("CUSTOMER")) {
            throw new org.springframework.security.authentication.BadCredentialsException("Please use the admin login instead");
        }
        String token = jwtUtils.generateToken(user);
        return ResponseEntity.ok(Map.of(
            "accessToken", token,
            "tokenType",   "Bearer",
            "user", Map.of(
                "id",    user.getId(),
                "name",  user.getFullName(),
                "email", user.getEmail(),
                "roles", user.getRoles()
            )
        ));
    }

    /**
     * Get all tickets for the logged-in customer (by their email in JWT)
     */
    @GetMapping("/my-tickets")
    public ResponseEntity<List<Map<String, Object>>> myTickets(
            @RequestHeader("Authorization") String authHeader) {
        String email = extractEmail(authHeader);
        List<Ticket> tickets = ticketRepo.findByCustomerEmailOrderByCreatedAtDesc(email);
        return ResponseEntity.ok(tickets.stream().map(this::toPublicMap).collect(Collectors.toList()));
    }

    /**
     * Get single ticket detail (customer must own the ticket)
     */
    @GetMapping("/my-tickets/{ticketNumber}")
    public ResponseEntity<Map<String, Object>> myTicketDetail(
            @PathVariable String ticketNumber,
            @RequestHeader("Authorization") String authHeader) {
        String email = extractEmail(authHeader);
        Ticket ticket = ticketRepo.findByTicketNumberAndCustomerEmail(ticketNumber.toUpperCase(), email)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketNumber));

        Map<String, Object> result = new LinkedHashMap<>(toPublicMap(ticket));

        // Include public comments (exclude internal notes)
        List<Map<String, Object>> comments = commentRepo
            .findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
            .filter(c -> !c.isInternalNote())
            .map(c -> Map.<String, Object>of(
                "id",        c.getId(),
                "body",      c.getBody(),
                "author",    c.getAuthor() != null ? c.getAuthor().getFullName() : "Support Team",
                "createdAt", c.getCreatedAt()
            ))
            .collect(Collectors.toList());
        result.put("comments", comments);
        return ResponseEntity.ok(result);
    }

    /**
     * Customer replies to their own ticket
     */
    @PostMapping("/my-tickets/{ticketNumber}/reply")
    public ResponseEntity<Map<String, Object>> reply(
            @PathVariable String ticketNumber,
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ReplyRequest req) {
        String email = extractEmail(authHeader);
        Ticket ticket = ticketRepo.findByTicketNumberAndCustomerEmail(ticketNumber.toUpperCase(), email)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketNumber));

        // Reopen ticket if it was closed
        if (ticket.getStatus() == Ticket.TicketStatus.CLOSED ||
            ticket.getStatus() == Ticket.TicketStatus.RESOLVED) {
            ticket.setStatus(Ticket.TicketStatus.OPEN);
            ticketRepo.save(ticket);
        }

        User customer = userRepo.findByEmail(email).orElse(null);
        com.springmind.ai.model.TicketComment comment = com.springmind.ai.model.TicketComment.builder()
            .ticket(ticket).author(customer)
            .body("[Customer] " + req.getMessage())
            .internalNote(false)
            .build();
        commentRepo.save(comment);

        return ResponseEntity.status(201).body(Map.of(
            "message",   "Reply sent successfully",
            "ticketNumber", ticketNumber,
            "status",    ticket.getStatus()
        ));
    }

    /**
     * Authenticated customer submits a new ticket
     */
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submit(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody SubmitRequest req) {
        String email = extractEmail(authHeader);
        User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Ticket ticket = ticketService.create(
            req.getTitle(), req.getDescription(),
            user.getFullName(), email,
            req.getCustomerTier(), req.getCategory(),
            null, "WEB_FORM"
        );
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message",      "Ticket submitted successfully. Our team will respond within " + ticket.getPredictedResolutionHours() + " hours.");
        response.put("ticketNumber", ticket.getTicketNumber());
        response.put("priority",     ticket.getPriority()  != null ? ticket.getPriority().name()  : "MEDIUM");
        response.put("category",     ticket.getCategory()  != null ? ticket.getCategory().name()  : "TECHNICAL");
        response.put("slaDeadline",  ticket.getSlaDeadline() != null ? ticket.getSlaDeadline().toString() : "");
        return ResponseEntity.status(201).body(response);    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toPublicMap(Ticket t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ticketNumber",             t.getTicketNumber());
        m.put("title",                    t.getTitle());
        m.put("description",              t.getDescription());
        m.put("category",                 t.getCategory());
        m.put("priority",                 t.getPriority());
        m.put("status",                   t.getStatus());
        m.put("customerName",             t.getCustomerName());
        m.put("customerEmail",            t.getCustomerEmail());
        m.put("predictedResolutionHours", t.getPredictedResolutionHours());
        m.put("slaDeadline",              t.getSlaDeadline());
        m.put("assignedAgent",            t.getAssignedAgent() != null ? t.getAssignedAgent().getFullName() : "Being assigned");
        m.put("createdAt",                t.getCreatedAt());
        m.put("updatedAt",                t.getUpdatedAt());
        m.put("resolvedAt",               t.getResolvedAt());
        // Progress percentage for customer display
        int progress = switch (t.getStatus()) {
            case OPEN        -> 10;
            case IN_PROGRESS -> 50;
            case RESOLVED    -> 100;
            case CLOSED      -> 100;
        };
        m.put("progressPercent", progress);
        m.put("statusLabel", switch (t.getStatus()) {
            case OPEN        -> "Received — reviewing your issue";
            case IN_PROGRESS -> "In progress — agent is working on it";
            case RESOLVED    -> "Resolved — please confirm or reopen";
            case CLOSED      -> "Closed";
        });
        return m;
    }

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        return jwtUtils.extractUsername(authHeader.substring(7));
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    @Data static class LookupRequest {
        @NotBlank private String ticketNumber;
        @NotBlank @Email private String email;
    }

    @Data static class CustomerRegisterRequest {
        @NotBlank private String fullName;
        @NotBlank @Email private String email;
        @NotBlank @jakarta.validation.constraints.Size(min = 6) private String password;
    }

    @Data static class CustomerLoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }

    @Data static class ReplyRequest {
        @NotBlank private String message;
    }

    @Data static class SubmitRequest {
        @NotBlank private String title;
        @NotBlank private String description;
        private String category;
        private String customerTier = "FREE";
    }
}
