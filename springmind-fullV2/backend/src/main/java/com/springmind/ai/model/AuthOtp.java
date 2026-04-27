package com.springmind.ai.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auth_otps", indexes = {
    @Index(name = "idx_auth_otps_token", columnList = "challenge_token", unique = true),
    @Index(name = "idx_auth_otps_user_expires", columnList = "user_id,expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthOtp {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "challenge_token", nullable = false, unique = true, length = 96)
    private String challengeToken;

    @Column(name = "otp_hash", nullable = false, length = 120)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    private int attempts = 0;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
