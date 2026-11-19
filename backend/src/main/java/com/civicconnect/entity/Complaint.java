package com.civicconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Core entity representing a citizen civic complaint.
 * Contains geospatial coordinates, algorithmic priority score, SLA deadlines,
 * reporter contact metadata with fallback handling, and cluster identifier
 * for automated duplicate detection and hotspot aggregation.
 */
@Entity
@Table(name = "complaints", indexes = {
    @Index(name = "idx_complaint_status", columnList = "status"),
    @Index(name = "idx_complaint_category", columnList = "category"),
    @Index(name = "idx_complaint_geo", columnList = "latitude, longitude"),
    @Index(name = "idx_complaint_cluster", columnList = "cluster_id"),
    @Index(name = "idx_complaint_sla", columnList = "sla_deadline")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 3000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintCategory category;

    /**
     * Physical severity score from 1.0 (minor nuisance) to 10.0 (hazardous/emergency),
     * determined either via user assessment or automated image/text classification.
     */
    @Column(name = "severity_score", nullable = false)
    private Double severityScore;

    /**
     * Algorithmic priority score computed via multi-factor weighted triage formula:
     * U = 0.35*severity + 0.20*log2(1+volume) + 0.15*typeWeight + 0.15*zoneWeight + 0.15*ageWeight
     */
    @Column(name = "priority_score", nullable = false)
    private Double priorityScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 255)
    private String address;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "resolved_image_url", length = 1000)
    private String resolvedImageUrl;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;

    @Column(name = "sla_deadline", nullable = false)
    private LocalDateTime slaDeadline;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    /**
     * Unique cluster identifier to group duplicates within 50m radius.
     */
    @Column(name = "cluster_id", length = 64)
    private String clusterId;

    /**
     * Number of civic reports merged into this cluster.
     */
    @Column(name = "duplicate_count", nullable = false)
    @Builder.Default
    private Integer duplicateCount = 1;

    /**
     * Weight of the urban zone (e.g. 2.0 for hospital/school zones, 1.0 for residential).
     */
    @Column(name = "zone_weight", nullable = false)
    @Builder.Default
    private Double zoneWeight = 1.0;

    @Column(name = "resolution_notes", length = 2000)
    private String resolutionNotes;

    @Column(name = "reported_by", length = 120)
    private String reportedBy;

    @Column(name = "reporter_name", length = 120)
    private String reporterName;

    @Column(name = "reporter_phone", length = 30)
    private String reporterPhone;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department assignedDepartment;

    @PrePersist
    protected void onCreate() {
        if (this.reportedAt == null) {
            this.reportedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = ComplaintStatus.REPORTED;
        }
        if (this.duplicateCount == null) {
            this.duplicateCount = 1;
        }
        if (this.zoneWeight == null) {
            this.zoneWeight = 1.0;
        }
        if (this.severityScore == null) {
            this.severityScore = 5.0; // Default moderate severity
        }
        // Fallback handling when citizen name or phone is omitted
        if (this.reporterName == null || this.reporterName.isBlank()) {
            this.reporterName = (this.reportedBy != null && !this.reportedBy.isBlank())
                    ? this.reportedBy
                    : "Concerned Citizen";
        }
        if (this.reportedBy == null || this.reportedBy.isBlank()) {
            this.reportedBy = this.reporterName;
        }
        if (this.reporterPhone == null || this.reporterPhone.isBlank()) {
            this.reporterPhone = "+91 98765 43210";
        }
        if (this.address == null || this.address.isBlank()) {
            if (this.latitude != null && this.longitude != null) {
                this.address = String.format("Geo-Coordinates: %.4f, %.4f", this.latitude, this.longitude);
            } else {
                this.address = "Unspecified Location";
            }
        }
    }
}
