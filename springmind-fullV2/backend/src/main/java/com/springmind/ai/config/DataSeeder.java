package com.springmind.ai.config;

import com.springmind.ai.model.*;
import com.springmind.ai.repository.*;
import com.springmind.ai.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository           userRepo;
    private final TicketRepository         ticketRepo;
    private final KnowledgeBaseRepository  kbRepo;
    private final PasswordEncoder          encoder;
    private final TicketService            ticketService;

    @Override
    public void run(String... args) {

        // ── Users ─────────────────────────────────────────────────────────────
        User admin, priya, amit, demoCustomer;

        if (userRepo.count() == 0) {
            log.info("Seeding users and KB articles...");

            admin = userRepo.save(User.builder()
                .fullName("Admin User").email("admin@springmind.ai")
                .passwordHash(encoder.encode("Admin@123"))
                .department("Management").roles(Set.of("ADMIN","MANAGER","AGENT")).build());

            priya = userRepo.save(User.builder()
                .fullName("Priya Mehta").email("priya@springmind.ai")
                .passwordHash(encoder.encode("Agent@123"))
                .department("Billing").roles(Set.of("AGENT")).build());

            amit = userRepo.save(User.builder()
                .fullName("Amit Sharma").email("amit@springmind.ai")
                .passwordHash(encoder.encode("Agent@123"))
                .department("Technical").roles(Set.of("AGENT")).build());

            // ── Demo customer account (visible in customer portal) ─────────────
            demoCustomer = userRepo.save(User.builder()
                .fullName("John Smith").email("john@demo.com")
                .passwordHash(encoder.encode("Demo@123"))
                .department("CUSTOMER").roles(Set.of("CUSTOMER")).build());

            // ── KB Articles ──────────────────────────────────────────────────
            kbRepo.save(kb("Billing dispute resolution process",
                Ticket.TicketCategory.BILLING, "billing,refund,charge,invoice,dispute"));
            kbRepo.save(kb("How to process refunds for premium customers",
                Ticket.TicketCategory.REFUND, "refund,premium,cancel,money,credit"));
            kbRepo.save(kb("Duplicate charge investigation guide",
                Ticket.TicketCategory.BILLING, "duplicate,charge,billing,overcharged"));
            kbRepo.save(kb("Two-factor authentication troubleshooting",
                Ticket.TicketCategory.ACCOUNT, "2fa,login,authentication,sms,code"));
            kbRepo.save(kb("API rate limiting and quota management",
                Ticket.TicketCategory.TECHNICAL, "api,rate limit,429,quota,webhook"));
            kbRepo.save(kb("Account suspension review procedure",
                Ticket.TicketCategory.ACCOUNT, "account,suspended,locked,access,freeze"));
            kbRepo.save(kb("Password reset and account recovery",
                Ticket.TicketCategory.ACCOUNT, "password,reset,recovery,email,otp"));
            kbRepo.save(kb("Integration setup guide — Zapier and Webhooks",
                Ticket.TicketCategory.TECHNICAL, "integration,zapier,webhook,connect,setup"));

        } else {
            log.info("Users already exist, skipping user/KB seeding.");
            admin       = userRepo.findByEmail("admin@springmind.ai").orElse(null);
            priya       = userRepo.findByEmail("priya@springmind.ai").orElse(null);
            amit        = userRepo.findByEmail("amit@springmind.ai").orElse(null);
            demoCustomer = userRepo.findByEmail("john@demo.com").orElse(null);
        }

        // ── Sample Tickets ────────────────────────────────────────────────────
        if (ticketRepo.count() > 0) {
            log.info("Tickets already exist, skipping ticket seeding.");
            return;
        }

        log.info("Seeding sample tickets...");

        // --- Admin-visible tickets from various customers ---
        saveTicket("Duplicate charge on invoice",
            "I was charged twice for my Pro plan subscription in April. Please investigate and refund.",
            "Rajesh Kumar", "rajesh@example.com", "PREMIUM",
            "BILLING", "CRITICAL", priya, Ticket.TicketStatus.OPEN);

        saveTicket("Cannot login — 2FA not working",
            "My authentication codes are not being received via SMS. I have been locked out for 2 hours.",
            "Sarah Chen", "sarah@example.com", "BASIC",
            "ACCOUNT", "HIGH", amit, Ticket.TicketStatus.IN_PROGRESS);

        saveTicket("API rate limit exceeded in production",
            "We are getting 429 errors on our production webhooks. This is urgent and blocking our business.",
            "TechCorp Inc.", "dev@techcorp.com", "ENTERPRISE",
            "TECHNICAL", "HIGH", amit, Ticket.TicketStatus.IN_PROGRESS);

        saveTicket("Request refund for 8 unused seats",
            "We are downsizing our team and need a refund for 8 unused premium seats.",
            "Globex Ltd.", "billing@globex.com", "PREMIUM",
            "REFUND", "MEDIUM", null, Ticket.TicketStatus.OPEN);

        saveTicket("Feature request: dark mode for dashboard",
            "Many users have been requesting a dark theme for the main dashboard. Please add this.",
            "Community User", "community@example.com", "FREE",
            "FEATURE_REQUEST", "LOW", null, Ticket.TicketStatus.RESOLVED);

        saveTicket("Wrong subscription tier being billed",
            "We are being charged for Enterprise but are on the Business plan. This is urgent!",
            "MegaCorp", "finance@megacorp.com", "ENTERPRISE",
            "BILLING", "CRITICAL", priya, Ticket.TicketStatus.IN_PROGRESS);

        saveTicket("Data export timing out",
            "The CSV export for 50k records keeps timing out. We need this data for a report.",
            "DataPro SA", "admin@datapro.com", "PREMIUM",
            "TECHNICAL", "MEDIUM", amit, Ticket.TicketStatus.RESOLVED);

        saveTicket("Account flagged by fraud system incorrectly",
            "My account has been suspended by your fraud detection system but I have done nothing wrong.",
            "Marcus Lee", "marcus@example.com", "BASIC",
            "ACCOUNT", "HIGH", null, Ticket.TicketStatus.OPEN);

        // --- NEW: More diverse tickets for richer analytics ---
        saveTicket("Cannot integrate Stripe webhook",
            "Stripe webhook events are not reaching our endpoint. We verified the endpoint URL is correct.",
            "StartupXYZ", "dev@startupxyz.com", "PREMIUM",
            "TECHNICAL", "HIGH", amit, Ticket.TicketStatus.OPEN);

        saveTicket("Invoice PDF not generating",
            "Clicking 'Download Invoice' shows a blank PDF. This has been happening since yesterday.",
            "Acme Corp", "finance@acme.com", "BASIC",
            "BILLING", "MEDIUM", priya, Ticket.TicketStatus.OPEN);

        saveTicket("Need to change registered email address",
            "I recently changed my company email and need to update the account email for our team.",
            "Nadia Patel", "nadia@oldcompany.com", "FREE",
            "ACCOUNT", "LOW", null, Ticket.TicketStatus.RESOLVED);

        saveTicket("Mobile app crashes on Android 14",
            "The mobile app crashes immediately on launch for all Android 14 devices in our organisation.",
            "BetaTesters Ltd.", "qa@betatesters.io", "ENTERPRISE",
            "TECHNICAL", "CRITICAL", amit, Ticket.TicketStatus.IN_PROGRESS);

        // --- Demo customer tickets linked to john@demo.com ---
        // These appear on the customer portal when logged in as john@demo.com / Demo@123
        saveTicket("Overcharged on last month's invoice",
            "I was billed $299 instead of $99 on my Basic plan for March. Please correct the invoice and refund the difference.",
            "John Smith", "john@demo.com", "BASIC",
            "BILLING", "HIGH", priya, Ticket.TicketStatus.IN_PROGRESS);

        saveTicket("Cannot access reports section",
            "After upgrading to Premium I should have access to the Advanced Reports section but I'm still seeing 'Upgrade required'.",
            "John Smith", "john@demo.com", "BASIC",
            "ACCOUNT", "MEDIUM", null, Ticket.TicketStatus.OPEN);

        saveTicket("Request to add team member seats",
            "We need to add 3 more seats to our account. Please advise on the pricing and process.",
            "John Smith", "john@demo.com", "BASIC",
            "FEATURE_REQUEST", "LOW", null, Ticket.TicketStatus.RESOLVED);

        log.info("Demo data seeded successfully.");
        log.info("Admin login:    admin@springmind.ai / Admin@123");
        log.info("Agent login:    priya@springmind.ai / Agent@123");
        log.info("Customer login: john@demo.com / Demo@123  (3 pre-existing tickets)");
    }

    private KnowledgeBaseArticle kb(String title, Ticket.TicketCategory cat, String tags) {
        return KnowledgeBaseArticle.builder()
            .title(title).category(cat).tags(tags)
            .content("Detailed resolution guide for: " + title)
            .viewCount(0).helpfulVotes(0).build();
    }

    private void saveTicket(String title, String desc, String name, String email,
                             String tier, String category, String priority,
                             User agent, Ticket.TicketStatus status) {
        try {
            Ticket t = ticketService.create(title, desc, name, email, tier, category, priority, "WEB_FORM");
            boolean changed = false;
            if (agent != null && t.getAssignedAgent() == null) {
                t.setAssignedAgent(agent);
                changed = true;
            }
            if (status != null && t.getStatus() != status) {
                t.setStatus(status);
                if (status == Ticket.TicketStatus.RESOLVED || status == Ticket.TicketStatus.CLOSED) {
                    t.setResolvedAt(LocalDateTime.now().minusHours((long)(Math.random() * 48)));
                }
                changed = true;
            }
            if (changed) ticketRepo.save(t);
        } catch (Exception e) {
            log.warn("Could not seed ticket '{}': {}", title, e.getMessage());
        }
    }
}
