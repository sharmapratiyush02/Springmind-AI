package com.springmind.ai.service;

import com.springmind.ai.config.JwtUtils;
import com.springmind.ai.model.AuthOtp;
import com.springmind.ai.model.PasswordResetToken;
import com.springmind.ai.model.User;
import com.springmind.ai.repository.AuthOtpRepository;
import com.springmind.ai.repository.PasswordResetTokenRepository;
import com.springmind.ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService implements UserDetailsService {

    private final UserRepository  userRepo;
    private final AuthOtpRepository authOtpRepo;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final PasswordEncoder encoder;
    private final JwtUtils        jwtUtils;
    private final EmailService emailService;

    @Value("${app.auth.otp-expiration-minutes:5}") private long otpExpirationMinutes;
    @Value("${app.auth.reset-token-expiration-minutes:30}") private long resetExpirationMinutes;
    @Value("${app.auth.reset-url:http://localhost:5173/login}") private String resetUrl;
    @Value("${app.auth.customer-reset-url:http://localhost:5173/customer-portal.html}") private String customerResetUrl;
    @Value("${app.email.enabled:false}") private boolean emailEnabled;

    private final SecureRandom secureRandom = new SecureRandom();

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

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        String challengeToken = randomToken();
        authOtpRepo.deleteByUserAndVerifiedAtIsNull(user);
        authOtpRepo.save(AuthOtp.builder()
            .user(user)
            .challengeToken(challengeToken)
            .otpHash(encoder.encode(otp))
            .expiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
            .build());

        emailService.sendText(
            user.getEmail(),
            "SpringMind login verification code",
            "Your SpringMind verification code is " + otp + ". It expires in " + otpExpirationMinutes + " minutes."
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("otpRequired", true);
        response.put("challengeToken", challengeToken);
        response.put("message", "Verification code sent to registered email");
        if (!emailEnabled) {
            // Local development helper only; production email-enabled deployments never expose OTP values.
            response.put("debugOtp", otp);
        }
        return response;
    }

    public Map<String, Object> verifyOtp(String challengeToken, String otp) {
        AuthOtp authOtp = authOtpRepo.findByChallengeTokenAndVerifiedAtIsNull(challengeToken)
            .orElseThrow(() -> new BadCredentialsException("Invalid or expired verification challenge"));
        if (authOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Verification code expired");
        }
        if (authOtp.getAttempts() >= 5) {
            throw new BadCredentialsException("Too many verification attempts");
        }
        authOtp.setAttempts(authOtp.getAttempts() + 1);
        if (!encoder.matches(otp, authOtp.getOtpHash())) {
            authOtpRepo.save(authOtp);
            throw new BadCredentialsException("Invalid verification code");
        }
        authOtp.setVerifiedAt(LocalDateTime.now());
        authOtpRepo.save(authOtp);
        return tokenResponse(authOtp.getUser());
    }

    public void requestPasswordReset(String email) {
        requestPasswordReset(email, resetUrl);
    }

    public void requestCustomerPasswordReset(String email) {
        requestPasswordReset(email, customerResetUrl);
    }

    private void requestPasswordReset(String email, String targetResetUrl) {
        userRepo.findByEmail(email).ifPresent(user -> {
            String token = randomToken();
            resetTokenRepo.deleteByUserAndUsedAtIsNull(user);
            resetTokenRepo.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(sha256(token))
                .expiresAt(LocalDateTime.now().plusMinutes(resetExpirationMinutes))
                .build());
            String separator = targetResetUrl.contains("?") ? "&" : "?";
            emailService.sendText(
                user.getEmail(),
                "SpringMind password reset",
                "Use this secure link to reset your password: " + targetResetUrl + separator + "resetToken=" + token
                    + "\nThis link expires in " + resetExpirationMinutes + " minutes."
            );
        });
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokenRepo.findByTokenHashAndUsedAtIsNull(sha256(token))
            .orElseThrow(() -> new BadCredentialsException("Invalid or expired reset token"));
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Reset token expired");
        }
        User user = resetToken.getUser();
        user.setPasswordHash(encoder.encode(newPassword));
        userRepo.save(user);
        resetToken.setUsedAt(LocalDateTime.now());
        resetTokenRepo.save(resetToken);
        authOtpRepo.deleteByUserAndVerifiedAtIsNull(user);
    }

    @Scheduled(fixedDelayString = "${app.auth.token-cleanup-delay-ms:300000}")
    public void cleanExpiredAuthTokens() {
        LocalDateTime now = LocalDateTime.now();
        authOtpRepo.deleteByExpiresAtBefore(now);
        resetTokenRepo.deleteByExpiresAtBefore(now);
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

    private Map<String, Object> tokenResponse(User user) {
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

    private String randomToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not hash token", e);
        }
    }
}
