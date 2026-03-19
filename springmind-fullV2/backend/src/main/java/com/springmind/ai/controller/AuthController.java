package com.springmind.ai.controller;

import com.springmind.ai.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req.getEmail(), req.getPassword()));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
        var user = authService.register(
            req.getFullName(), req.getEmail(), req.getPassword(),
            req.getDepartment(), req.getRole()
        );
        return ResponseEntity.status(201).body(Map.of(
            "id",      user.getId(),
            "name",    user.getFullName(),
            "email",   user.getEmail(),
            "message", "Registration successful"
        ));
    }

    @Data static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank @Size(min=6) private String password;
    }

    @Data static class RegisterRequest {
        @NotBlank @Size(min=2,max=100) private String fullName;
        @NotBlank @Email               private String email;
        @NotBlank @Size(min=8)         private String password;
        private String department;
        private String role = "AGENT";
    }
}
