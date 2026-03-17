package com.springmind.ai.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    public enum TicketStatus   { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
    public enum TicketPriority { LOW, MEDIUM, HIGH, CRITICAL }
    public enum TicketCategory { BILLING, TECHNICAL, ACCOUNT, REFUND, FEATURE_REQUEST, GENERAL }
    public enum SentimentType  { POSITIVE, NEUTRAL, NEGATIVE }
    public enum CustomerTier   { FREE, BASIC, PREMIUM, ENTERPRISE }
    public enum Channel        { EMAIL, CHAT, WEB_FORM, API, PHONE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String ticketNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String customerName;

    @Column(nullable = false, length = 150)
    private String customerEmail;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CustomerTier customerTier = CustomerTier.FREE;

    @Enumerated(EnumType.STRING)
    private TicketCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    private SentimentType sentiment;

    private Double aiConfidence;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(columnDefinition = "TEXT")
    private String aiKeywords;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Channel channel = Channel.WEB_FORM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    private LocalDateTime slaDeadline;

    @Builder.Default
    private boolean slaBreached = false;

    private Integer predictedResolutionHours;

    private LocalDateTime resolvedAt;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
