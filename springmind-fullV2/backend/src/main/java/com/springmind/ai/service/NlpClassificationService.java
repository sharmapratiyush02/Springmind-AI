package com.springmind.ai.service;

import com.springmind.ai.model.Ticket;
import com.springmind.ai.model.Ticket.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * NLP Classification Service
 * Rule-based engine — swap for ML model by setting app.nlp.enabled=true
 * and pointing app.nlp.service-url at a Python microservice.
 */
@Service
@Slf4j
public class NlpClassificationService {

    @Value("${app.sla.critical:2}")   private int slaCritical;
    @Value("${app.sla.high:8}")       private int slaHigh;
    @Value("${app.sla.medium:24}")    private int slaMedium;
    @Value("${app.sla.low:72}")       private int slaLow;

    // ── Keyword maps ────────────────────────────────────────────────────────
    private static final Map<TicketCategory, List<String>> CAT_KEYWORDS = Map.of(
        TicketCategory.BILLING,          List.of("charge","invoice","payment","billing","subscription","refund","charged","price","fee","plan","upgrade","downgrade","credit","debit","transaction","receipt"),
        TicketCategory.TECHNICAL,        List.of("error","bug","crash","api","integration","broken","not working","failed","500","404","timeout","exception","ssl","certificate","webhook","performance","slow"),
        TicketCategory.ACCOUNT,          List.of("login","password","account","2fa","two-factor","authentication","access","locked","suspended","email","username","profile","settings","sso","saml"),
        TicketCategory.REFUND,           List.of("refund","money back","reimburse","overcharged","duplicate charge","cancel","cancellation"),
        TicketCategory.FEATURE_REQUEST,  List.of("feature","request","suggestion","would like","please add","can you add","enhancement","improvement","dark mode","export","import","integration","support for")
    );

    private static final List<String> URGENT_WORDS   = List.of("urgent","asap","immediately","critical","emergency","business","production","down","outage","breach","losing money","cannot work");
    private static final List<String> NEG_WORDS      = List.of("angry","frustrated","unacceptable","terrible","worst","awful","disgusting","never again","ridiculous","useless","pathetic","fix this","still not","keeps happening");
    private static final List<String> POS_WORDS      = List.of("thanks","thank you","great","love","amazing","excellent","happy","pleased","appreciate","perfect","wonderful");

    // ── Main classify method ─────────────────────────────────────────────────
    public ClassificationResult classify(String text) {
        String lower = text.toLowerCase();

        TicketCategory category = detectCategory(lower);
        SentimentType  sentiment = detectSentiment(lower);
        TicketPriority priority  = detectPriority(lower, category, sentiment);
        double confidence = computeConfidence(lower, category);
        List<String> keywords = extractKeywords(lower);
        int resolutionHours = predictResolutionHours(category, priority, CustomerTier.FREE);
        int slaHours = slaFor(priority);
        String summary = buildSummary(text, category, priority, sentiment);

        return ClassificationResult.builder()
            .category(category)
            .priority(priority)
            .sentiment(sentiment)
            .confidence(confidence)
            .keywords(keywords)
            .predictedResolutionHours(resolutionHours)
            .slaHours(slaHours)
            .aiSummary(summary)
            .build();
    }

    public int predictResolutionHours(TicketCategory cat, TicketPriority pri, CustomerTier tier) {
        int base = switch (cat) {
            case BILLING         -> switch (pri) { case CRITICAL -> 1; case HIGH -> 4;  case MEDIUM -> 12; default -> 24; };
            case TECHNICAL       -> switch (pri) { case CRITICAL -> 2; case HIGH -> 6;  case MEDIUM -> 16; default -> 48; };
            case ACCOUNT         -> switch (pri) { case CRITICAL -> 1; case HIGH -> 4;  case MEDIUM -> 12; default -> 36; };
            case REFUND          -> switch (pri) { case CRITICAL -> 2; case HIGH -> 8;  case MEDIUM -> 24; default -> 72; };
            case FEATURE_REQUEST -> switch (pri) { case CRITICAL -> 24; case HIGH -> 48; case MEDIUM -> 96; default -> 168; };
            default              -> switch (pri) { case CRITICAL -> 2; case HIGH -> 8;  case MEDIUM -> 24; default -> 72; };
        };
        double mult = switch (tier) {
            case ENTERPRISE -> 0.4;
            case PREMIUM    -> 0.6;
            case BASIC      -> 0.8;
            default         -> 1.0;
        };
        return Math.max(1, (int) Math.round(base * mult));
    }

    // ── Private helpers ──────────────────────────────────────────────────────
    private TicketCategory detectCategory(String lower) {
        Map<TicketCategory, Integer> scores = new EnumMap<>(TicketCategory.class);
        for (var entry : CAT_KEYWORDS.entrySet()) {
            int score = (int) entry.getValue().stream().filter(lower::contains).count();
            if (score > 0) scores.put(entry.getKey(), score);
        }
        return scores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(TicketCategory.GENERAL);
    }

    private SentimentType detectSentiment(String lower) {
        long neg = NEG_WORDS.stream().filter(lower::contains).count();
        long pos = POS_WORDS.stream().filter(lower::contains).count();
        // Exclamation marks and caps bias toward negative
        long exclamations = lower.chars().filter(c -> c == '!').count();
        if (neg > pos || exclamations >= 2) return SentimentType.NEGATIVE;
        if (pos > neg) return SentimentType.POSITIVE;
        return SentimentType.NEUTRAL;
    }

    private TicketPriority detectPriority(String lower, TicketCategory cat, SentimentType sentiment) {
        long urgentHits = URGENT_WORDS.stream().filter(lower::contains).count();
        if (urgentHits >= 2 || lower.contains("production") && lower.contains("down"))
            return TicketPriority.CRITICAL;
        if (urgentHits >= 1 || sentiment == SentimentType.NEGATIVE && cat == TicketCategory.BILLING)
            return TicketPriority.HIGH;
        if (cat == TicketCategory.FEATURE_REQUEST)
            return TicketPriority.LOW;
        return TicketPriority.MEDIUM;
    }

    private double computeConfidence(String lower, TicketCategory cat) {
        if (cat == TicketCategory.GENERAL) return 0.55;
        long hits = CAT_KEYWORDS.getOrDefault(cat, List.of()).stream().filter(lower::contains).count();
        return Math.min(0.99, 0.65 + hits * 0.04);
    }

    private List<String> extractKeywords(String lower) {
        List<String> found = new ArrayList<>();
        CAT_KEYWORDS.values().forEach(kws -> kws.stream()
            .filter(lower::contains).limit(3).forEach(found::add));
        URGENT_WORDS.stream().filter(lower::contains).limit(2).forEach(found::add);
        return found.stream().distinct().limit(8).toList();
    }

    private int slaFor(TicketPriority pri) {
        return switch (pri) {
            case CRITICAL -> slaCritical;
            case HIGH     -> slaHigh;
            case MEDIUM   -> slaMedium;
            default       -> slaLow;
        };
    }

    private String buildSummary(String text, TicketCategory cat, TicketPriority pri, SentimentType sent) {
        String preview = text.length() > 80 ? text.substring(0, 80) + "..." : text;
        return String.format("AI classified as %s/%s (sentiment: %s). Issue: %s",
            cat.name(), pri.name(), sent.name(), preview);
    }

    // ── Result DTO ───────────────────────────────────────────────────────────
    @Data
    @lombok.Builder
    public static class ClassificationResult {
        private TicketCategory category;
        private TicketPriority priority;
        private SentimentType  sentiment;
        private double         confidence;
        private List<String>   keywords;
        private int            predictedResolutionHours;
        private int            slaHours;
        private String         aiSummary;
    }
}
