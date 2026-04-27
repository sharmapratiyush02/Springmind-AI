package com.springmind.ai.controller;

import com.springmind.ai.service.TicketService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<?> list(
        @RequestParam(required=false) String status,
        @RequestParam(required=false) String priority,
        @RequestParam(required=false) String category,
        @RequestParam(required=false) String search,
        @RequestParam(defaultValue="0") int page,
        @RequestParam(defaultValue="20") int size
    ) {
        return ResponseEntity.ok(ticketService.list(status, priority, category, search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateRequest req) {
        var ticket = ticketService.create(
            req.getTitle(), req.getDescription(),
            req.getCustomerName(), req.getCustomerEmail(),
            req.getCustomerTier(), req.getCategory(),
            req.getPriority(), req.getChannel()
        );
        return ResponseEntity.status(201).body(ticket);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> fields) {
        return ResponseEntity.ok(ticketService.update(id, fields));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id,
                                         @Valid @RequestBody CommentRequest req) {
        return ResponseEntity.status(201)
            .body(ticketService.addComment(id, req.getBody(), req.isInternalNote()));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(id).get("comments"));
    }

    @PostMapping("/auto-assign")
    public ResponseEntity<?> autoAssign() {
        int count = ticketService.autoAssignUnassigned();
        return ResponseEntity.ok(Map.of("assigned", count));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(ticketService.dashboardStats());
    }

    @Data static class CreateRequest {
        @NotBlank private String title;
        @NotBlank private String description;
        @NotBlank private String customerName;
        @NotBlank private String customerEmail;
        private String customerTier;
        private String category;
        private String priority;
        private String channel;
    }

    @Data static class CommentRequest {
        @NotBlank private String body;
        private boolean internalNote = false;
    }
}
