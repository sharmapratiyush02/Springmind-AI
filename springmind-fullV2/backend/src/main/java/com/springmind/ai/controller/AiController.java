package com.springmind.ai.controller;

import com.springmind.ai.model.Ticket;
import com.springmind.ai.service.KnowledgeBaseService;
import com.springmind.ai.service.NlpClassificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final NlpClassificationService nlpService;
    private final KnowledgeBaseService     kbService;

    @PostMapping("/classify")
    public ResponseEntity<Map<String, Object>> classify(@Valid @RequestBody ClassifyRequest req) {
        var result = nlpService.classify(req.getText());
        LocalDateTime slaDeadline = LocalDateTime.now().plusHours(result.getSlaHours());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("category",                 result.getCategory().name());
        response.put("priority",                 result.getPriority().name());
        response.put("sentiment",                result.getSentiment().name());
        response.put("confidence",               result.getConfidence());
        response.put("aiSummary",                result.getAiSummary());
        response.put("predictedResolutionHours", result.getPredictedResolutionHours());
        response.put("slaDeadline",              slaDeadline.format(DateTimeFormatter.ISO_DATE_TIME));
        response.put("slaHours",                 result.getSlaHours());
        response.put("detectedKeywords",         result.getKeywords());
        response.put("suggestedDepartment",      departmentFor(result.getCategory()));
        response.put("routingAdvice",            routingAdvice(result.getPriority(), result.getSentiment()));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/predict")
    public ResponseEntity<Map<String, Object>> predict(@Valid @RequestBody PredictRequest req) {
        Ticket.TicketCategory cat  = parseEnum(req.getCategory(),     Ticket.TicketCategory.class, Ticket.TicketCategory.GENERAL);
        Ticket.TicketPriority pri  = parseEnum(req.getPriority(),     Ticket.TicketPriority.class, Ticket.TicketPriority.MEDIUM);
        Ticket.CustomerTier   tier = parseEnum(req.getCustomerTier(), Ticket.CustomerTier.class,   Ticket.CustomerTier.FREE);

        int hours = nlpService.predictResolutionHours(cat, pri, tier);
        String risk = hours <= 2 ? "CRITICAL" : hours <= 8 ? "HIGH" : hours <= 24 ? "MEDIUM" : "LOW";

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("estimatedHours",       hours);
        response.put("confidence",           0.87);
        response.put("slaRisk",              risk);
        response.put("recommendedAgentTier", pri == Ticket.TicketPriority.CRITICAL || pri == Ticket.TicketPriority.HIGH ? "Senior Agent" : "Any Agent");
        response.put("category",             cat.name());
        response.put("priority",             pri.name());
        response.put("customerTier",         tier.name());
        response.put("reasoning",            String.format("Base resolution for %s/%s adjusted by %s tier. SLA: %s.", cat, pri, tier, risk));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/kb/search")
    public ResponseEntity<List<Map<String, Object>>> kbSearch(@Valid @RequestBody KBSearchRequest req) {
        return ResponseEntity.ok(kbService.search(req.getQuery(), req.getCategory(), req.getLimit()));
    }

    @GetMapping("/kb/{id}/view")
    public ResponseEntity<Void> trackView(@PathVariable Long id) {
        kbService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }

    private String departmentFor(Ticket.TicketCategory cat) {
        return switch (cat) {
            case BILLING         -> "Finance & Billing Team";
            case TECHNICAL       -> "Engineering / Dev Team";
            case ACCOUNT         -> "Account Management";
            case REFUND          -> "Finance & Refunds";
            case FEATURE_REQUEST -> "Product Management";
            default              -> "General Support";
        };
    }

    private String routingAdvice(Ticket.TicketPriority pri, Ticket.SentimentType sent) {
        if (pri == Ticket.TicketPriority.CRITICAL) return "Immediate escalation — page on-call engineer";
        if (sent == Ticket.SentimentType.NEGATIVE && pri == Ticket.TicketPriority.HIGH)
            return "Assign to senior agent — customer appears frustrated";
        return "Route to next available agent";
    }

    private <E extends Enum<E>> E parseEnum(String val, Class<E> cls, E def) {
        if (val == null || val.isBlank()) return def;
        try { return Enum.valueOf(cls, val.toUpperCase()); } catch (Exception e) { return def; }
    }

    @Data static class ClassifyRequest { @NotBlank private String text; }

    @Data static class PredictRequest {
        @NotBlank private String category;
        @NotBlank private String priority;
        private String customerTier = "FREE";
        private String channel;
    }

    @Data static class KBSearchRequest {
        @NotBlank private String query;
        private String category;
        private int limit = 5;
    }
}