package com.civicconnect.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing a municipal department responsible for resolving specific categories
 * of civic complaints. Defines SLA (Service Level Agreement) turnaround hours.
 */
@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "contact_email", nullable = false, length = 120)
    private String contactEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_handled", nullable = false, length = 30)
    private ComplaintCategory categoryHandled;

    /**
     * Target resolution timeframe in hours (e.g. 24h for urgent water leaks, 48h for potholes).
     */
    @Column(name = "sla_hours", nullable = false)
    private Integer slaHours;
}
