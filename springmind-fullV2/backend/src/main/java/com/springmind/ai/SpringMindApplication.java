package com.springmind.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SpringMindApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringMindApplication.class, args);
    }
}
