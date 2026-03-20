package com.springmind.ai.controller;

import com.springmind.ai.repository.TicketRepository;
import com.springmind.ai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final TicketRepository ticketRepo;
    private final AuthService      authService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        long total         = ticketRepo.count();
        long breaches      = ticketRepo.countBySlaBreachedTrue();
        long compliant     = ticketRepo.countSlaCompliant();
        double slaRate     = total == 0 ? 100.0 : (compliant * 100.0 / total);
        Double avgHours    = ticketRepo.avgResolutionHours();
        long resolvedToday = ticketRepo.countResolvedSince(LocalDateTime.now().withHour(0).withMinute(0));

        List<Map<String, Object>> catDist = ticketRepo.countByCategory().stream()
            .map(row -> Map.<String, Object>of(
                "category",   row[0].toString(),
                "count",      row[1],
                "percentage", total == 0 ? 0.0 : Math.round(((Long) row[1]) * 1000.0 / total) / 10.0
            )).collect(Collectors.toList());

        List<Map<String, Object>> priDist = ticketRepo.countByPriority().stream()
            .map(row -> Map.<String, Object>of(
                "priority",   row[0].toString(),
                "count",      row[1],
                "percentage", total == 0 ? 0.0 : Math.round(((Long) row[1]) * 1000.0 / total) / 10.0
            )).collect(Collectors.toList());

        List<Map<String, Object>> daily = ticketRepo
            .dailyVolumeSince(LocalDateTime.now().minusDays(7)).stream()
            .map(row -> Map.<String, Object>of("date", row[0].toString(), "count", row[1]))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "totalTickets",         total,
            "resolvedToday",        resolvedToday,
            "avgResolutionHours",   avgHours != null ? Math.round(avgHours * 10.0) / 10.0 : 0.0,
            "slaBreaches",          breaches,
            "slaComplianceRate",    Math.round(slaRate * 10.0) / 10.0,
            "categoryDistribution", catDist,
            "priorityDistribution", priDist,
            "dailyVolume",          daily,
            "csatScore",            4.6,
            "aiAutoResolvedPercent",38.0
        ));
    }

    @GetMapping("/agents")
    public ResponseEntity<List<Map<String, Object>>> agents() {
        return ResponseEntity.ok(authService.getAgentPerformance());
    }
}
