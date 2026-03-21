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
        if (userRepo.count() > 0) { log.info("Data already seeded, skipping."); return; }
        log.info("Seeding demo data...");

        // ── Users ────────────────────────────────────────────────────────────
        User admin = userRepo.save(User.builder()
            .fullName("Admin User").email("admin@springmind.ai")
            .passwordHash(encoder.encode("Admin@123"))
            .department("Management").roles(Set.of("ADMIN","MANAGER","AGENT")).build());

        User priya = userRepo.save(User.builder()
            .fullName("Priya Mehta").email("priya@springmind.ai")
            .passwordHash(encoder.encode("Agent@123"))
            .department("Billing").roles(Set.of("AGENT")).build());

        User amit = userRepo.save(User.builder()
            .fullName("Amit Sharma").email("amit@springmind.ai")
            .passwordHash(encoder.encode("Agent@123"))
            .department("Technical").roles(Set.of("AGENT")).build());

        // ── KB Articles ──────────────────────────────────────────────────────
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

        // ── Sample Tickets ───────────────────────────────────────────────────
        saveTicket("Duplicate charge on invoice",
            "I was charged twice for my Pro plan subscription in April. Please investigate and refund.",
            "Rajesh Kumar", "rajesh@example.com", "PREMIUM",
            "BILLING", "CRITICAL", priya);

        saveTicket("Cannot login — 2FA not working",
            "My authentication codes are not being received via SMS. I have been locked out for 2 hours.",
            "Sarah Chen", "sarah@example.com", "BASIC",
            "ACCOUNT", "HIGH", amit);

        saveTicket("API rate limit exceeded in production",
            "We are getting 429 errors on our production webhooks. This is urgent and blocking our business.",
            "TechCorp Inc.", "dev@techcorp.com", "ENTERPRISE",
            "TECHNICAL", "HIGH", amit);

        saveTicket("Request refund for 8 unused seats",
            "We are downsizing our team and need a refund for 8 unused premium seats.",
            "Globex Ltd.", "billing@globex.com", "PREMIUM",
            "REFUND", "MEDIUM", null);

        saveTicket("Feature request: dark mode for dashboard",
            "Many users have been requesting a dark theme for the main dashboard. Please add this.",
            "Community User", "community@example.com", "FREE",
            "FEATURE_REQUEST", "LOW", null);

        saveTicket("Wrong subscription tier being billed",
            "We are being charged for Enterprise but are on the Business plan. This is urgent!",
            "MegaCorp", "finance@megacorp.com", "ENTERPRISE",
            "BILLING", "CRITICAL", priya);

        saveTicket("Data export timing out",
            "The CSV export for 50k records keeps timing out. We need this data for a report.",
            "DataPro SA", "admin@datapro.com", "PREMIUM",
            "TECHNICAL", "MEDIUM", amit);

        saveTicket("Account flagged by fraud system incorrectly",
            "My account has been suspended by your fraud detection system but I have done nothing wrong.",
            "Marcus Lee", "marcus@example.com", "BASIC",
            "ACCOUNT", "HIGH", null);

        log.info("Demo data seeded. Login: admin@springmind.ai / Admin@123");
    }

    private KnowledgeBaseArticle kb(String title, Ticket.TicketCategory cat, String tags) {
        return KnowledgeBaseArticle.builder()
            .title(title).category(cat).tags(tags)
            .content("Detailed resolution guide for: " + title)
            .viewCount(0).helpfulVotes(0).build();
    }

    private void saveTicket(String title, String desc, String name, String email,
                             String tier, String category, String priority, User agent) {
        try {
            Ticket t = ticketService.create(title, desc, name, email, tier, category, priority, "WEB_FORM");
            if (agent != null) {
                t.setAssignedAgent(agent);
                ticketRepo.save(t);
            }
        } catch (Exception e) {
            log.warn("Could not seed ticket '{}': {}", title, e.getMessage());
        }
    }
}
