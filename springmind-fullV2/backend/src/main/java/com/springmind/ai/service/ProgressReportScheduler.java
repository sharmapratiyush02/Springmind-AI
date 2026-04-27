package com.springmind.ai.service;

import com.springmind.ai.model.Ticket;
import com.springmind.ai.model.User;
import com.springmind.ai.model.UserProgressEmailLog;
import com.springmind.ai.repository.TicketRepository;
import com.springmind.ai.repository.UserProgressEmailLogRepository;
import com.springmind.ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressReportScheduler {

    private final UserRepository userRepo;
    private final TicketRepository ticketRepo;
    private final UserProgressEmailLogRepository progressLogRepo;
    private final PdfReportService pdfReportService;
    private final EmailService emailService;

    @Value("${app.progress-email.enabled:true}") private boolean enabled;
    @Value("${app.progress-email.interval-minutes:10}") private long intervalMinutes;

    @Scheduled(fixedDelayString = "${app.progress-email.scan-delay-ms:60000}", initialDelayString = "${app.progress-email.initial-delay-ms:30000}")
    @Transactional
    public void sendDueProgressReports() {
        if (!enabled) return;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueBefore = now.minusMinutes(intervalMinutes);
        for (User user : userRepo.findByActiveTrue()) {
            UserProgressEmailLog logEntry = progressLogRepo.findByUser(user)
                .orElseGet(() -> progressLogRepo.save(UserProgressEmailLog.builder().user(user).build()));
            if (logEntry.getLastSentAt() != null && logEntry.getLastSentAt().isAfter(dueBefore)) {
                continue;
            }

            List<Ticket> tickets = ticketRepo.findByCustomerEmailOrderBySlaDeadlineAscCreatedAtAsc(user.getEmail());
            byte[] pdf = pdfReportService.buildProgressReport(user.getFullName(), tickets, now);
            boolean sent = emailService.sendProgressReport(
                user.getEmail(),
                "SpringMind ticket progress report",
                "Your latest ticket progress report is attached.",
                pdf,
                "springmind-progress-report.pdf"
            );
            if (sent) {
                logEntry.setLastSentAt(now);
                progressLogRepo.save(logEntry);
            }
        }
    }
}
