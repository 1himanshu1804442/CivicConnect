package com.civicconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for CivicConnect Intelligent Grievance & Triage System.
 * Enables scheduled background tasks for automated SLA escalation checks.
 */
@SpringBootApplication
@EnableScheduling
public class CivicConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicConnectApplication.class, args);
    }
}
