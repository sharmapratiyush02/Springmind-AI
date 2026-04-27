package com.springmind.ai.service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${app.email.enabled:false}") private boolean enabled;
    @Value("${app.email.from:support@springmind.ai}") private String from;
    @Value("${spring.mail.host:}") private String host;
    @Value("${spring.mail.port:587}") private int port;
    @Value("${spring.mail.username:}") private String username;
    @Value("${spring.mail.password:}") private String password;
    @Value("${spring.mail.properties.mail.smtp.auth:true}") private String smtpAuth;
    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") private String startTls;

    private JavaMailSenderImpl sender;

    @PostConstruct
    void init() {
        if (!enabled) {
            log.info("Email service is disabled; messages will be logged only.");
            return;
        }
        sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", smtpAuth);
        props.put("mail.smtp.starttls.enable", startTls);
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");
    }

    @Async
    public void sendText(String to, String subject, String body) {
        if (!enabled || sender == null) {
            log.info("Email disabled. To={} Subject={} Body={}", to, subject, body);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false);
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            sender.send(message);
        } catch (Exception e) {
            log.warn("Could not send email to {}: {}", to, e.getMessage());
        }
    }

    public boolean sendProgressReport(String to, String subject, String body, byte[] pdfBytes, String filename) {
        if (!enabled || sender == null) {
            log.info("Email disabled. Progress report for {} would include {} bytes as {}", to, pdfBytes.length, filename);
            return true;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            helper.addAttachment(filename, () -> new java.io.ByteArrayInputStream(pdfBytes), "application/pdf");
            sender.send(message);
            return true;
        } catch (Exception e) {
            log.warn("Could not send progress report to {}: {}", to, e.getMessage());
            return false;
        }
    }
}
