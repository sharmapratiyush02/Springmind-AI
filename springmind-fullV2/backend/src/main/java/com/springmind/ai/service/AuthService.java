package com.springmind.ai.service;

import com.springmind.ai.config.JwtUtils;
import com.springmind.ai.model.User;
import com.springmind.ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService implements UserDetailsService {

    private final UserRepository  userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtils        jwtUtils;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public Map<String, Object> login(String email, String password) {
        User user = (User) loadUserByUsername(email);
        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid password");
        }
        String token = jwtUtils.generateToken(user);

        return Map.of(
            "accessToken", token,
            "tokenType",   "Bearer",
            "user", Map.of(
                "id",    user.getId(),
                "name",  user.getFullName(),
                "email", user.getEmail(),
                "roles", user.getRoles()
            )
        );
    }

    public User register(String fullName, String email, String password,
                         String department, String role) {
        if (userRepo.existsByEmail(email))
            throw new IllegalArgumentException("Email already registered: " + email);

        Set<String> roles = new HashSet<>();
        roles.add(role == null || role.isBlank() ? "AGENT" : role.toUpperCase());

        User user = User.builder()
            .fullName(fullName)
            .email(email)
            .passwordHash(encoder.encode(password))
            .department(department)
            .roles(roles)
            .build();
        return userRepo.save(user);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAgentPerformance() {
        List<Object[]> rows = userRepo.agentPerformanceStats();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            long total    = r[2] != null ? ((Number) r[2]).longValue() : 0;
            long resolved = r[3] != null ? ((Number) r[3]).longValue() : 0;
            double score  = total == 0 ? 100.0 : Math.round((resolved * 100.0 / total) * 10) / 10.0;
            result.add(Map.of(
                "name",           r[0].toString(),
                "email",          r[1].toString(),
                "totalTickets",   total,
                "resolvedTickets",resolved,
                "score",          score
            ));
        }
        return result;
    }
}
