package com.springmind.ai.config;
import org.springframework.context.annotation.Lazy;
import com.springmind.ai.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.*;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
public class SecurityConfig {

    private final AuthService authService;
    private final JwtUtils    jwtUtils;

    public SecurityConfig(@Lazy AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils    = jwtUtils;
    }

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(c -> c.disable())
            .cors(c -> c.configurationSource(corsSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                // ── CORS preflight — must be first, always permit ─────────
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // ── Public endpoints ──────────────────────────────────────
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/tickets").permitAll()
                // ── AI Tools — permitAll (rule-based, no sensitive data) ───────
                .requestMatchers("/ai/**").permitAll()
                .requestMatchers("/analytics/**").permitAll()

                // ── Customer portal — ALL permitAll ───────────────────────
                .requestMatchers("/customer/**").permitAll()

                // ── Everything else requires JWT ──────────────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class)
            .headers(h -> h.frameOptions(f -> f.sameOrigin()));

        return http.build();
    }

    @Bean
    public OncePerRequestFilter jwtFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                            FilterChain chain) throws ServletException, IOException {
                String header = req.getHeader("Authorization");
                if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
                    chain.doFilter(req, res); return;
                }
                String token = header.substring(7);
                try {
                    String email = jwtUtils.extractUsername(token);
                    if (email != null && org.springframework.security.core.context
                            .SecurityContextHolder.getContext().getAuthentication() == null) {
                        var ud = authService.loadUserByUsername(email);
                        if (jwtUtils.isTokenValid(token, ud)) {
                            var auth = new UsernamePasswordAuthenticationToken(
                                ud, null, ud.getAuthorities());
                            auth.setDetails(new org.springframework.security.web.authentication
                                .WebAuthenticationDetailsSource().buildDetails(req));
                            org.springframework.security.core.context
                                .SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    }
                } catch (Exception e) {
                    log.debug("JWT filter skip: {}", e.getMessage());
                }
                chain.doFilter(req, res);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        var config = new CorsConfiguration();
        for (String origin : allowedOrigins.split(",")) {
            config.addAllowedOriginPattern(origin.trim());
        }
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
}
