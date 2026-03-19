package com.springmind.ai.service;

import com.springmind.ai.model.KnowledgeBaseArticle;
import com.springmind.ai.repository.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class KnowledgeBaseService {

    private final KnowledgeBaseRepository kbRepo;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> search(String query, String categoryStr, int limit) {
        List<KnowledgeBaseArticle> results = kbRepo.searchByKeyword(
            query, PageRequest.of(0, Math.max(limit * 2, 10)));

        String[] tokens = query.toLowerCase().split("\\s+");

        return results.stream().map(a -> {
            long hits = Arrays.stream(tokens)
                .filter(t -> a.getTitle().toLowerCase().contains(t)
                          || (a.getTags() != null && a.getTags().toLowerCase().contains(t)))
                .count();
            double score = Math.min(0.99, 0.5 + hits * 0.1);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            a.getId());
            m.put("title",         a.getTitle());
            m.put("category",      a.getCategory() != null ? a.getCategory().name() : "GENERAL");
            m.put("relevanceScore",Math.round(score * 100.0) / 100.0);
            m.put("viewCount",     a.getViewCount());
            m.put("updatedAt",     a.getUpdatedAt());
            return m;
        })
        .sorted(Comparator.<Map<String, Object>, Double>comparing(
            mm -> (Double) mm.get("relevanceScore")).reversed())
        .limit(limit)
        .collect(Collectors.toList());
    }

    public void incrementViewCount(Long id) {
        kbRepo.findById(id).ifPresent(a -> {
            a.setViewCount(a.getViewCount() + 1);
            kbRepo.save(a);
        });
    }
}
