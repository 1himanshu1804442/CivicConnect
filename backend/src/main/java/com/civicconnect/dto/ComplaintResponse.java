package com.civicconnect.dto;

import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.entity.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * DTO representing detailed complaint response for frontend UI rendering.
 * Provides transparent SLA countdown figures (clamped cleanly to 0 when overdue,
 * with elapsed overdue time tracked separately).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {

    private Long id;
    private String title;
    private String description;
    private ComplaintCategory category;
    private String categoryDisplayName;
    private Double severityScore;
    private Double priorityScore;
    private ComplaintStatus status;
    private Double latitude;
    private Double longitude;
    private String address;
    private String imageUrl;
    private String resolvedImageUrl;
    private LocalDateTime reportedAt;
    private LocalDateTime slaDeadline;
    private LocalDateTime escalatedAt;
    private String clusterId;
    private Integer duplicateCount;
    private Double zoneWeight;
    private String resolutionNotes;
    private String departmentName;
    private boolean isOverdue;
    private Long remainingSlaMinutes;
    private Long overdueSlaMinutes;
    private String reportedBy;
    private String reporterName;
    private String reporterPhone;

    /**
     * Factory mapping method from JPA entity to clean DTO with defensive fallbacks.
     */
    public static ComplaintResponse fromEntity(Complaint complaint) {
        if (complaint == null) {
            return null;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean overdue = complaint.getStatus() != ComplaintStatus.RESOLVED
                && complaint.getSlaDeadline() != null
                && now.isAfter(complaint.getSlaDeadline());

        long remainingSlaMinutes = 0L;
        long overdueSlaMinutes = 0L;

        if (complaint.getSlaDeadline() != null) {
            long diffMinutes = ChronoUnit.MINUTES.between(now, complaint.getSlaDeadline());
            if (diffMinutes > 0) {
                // SLA is active: countdown shows positive remaining minutes
                remainingSlaMinutes = diffMinutes;
                overdueSlaMinutes = 0L;
            } else {
                // SLA deadline has lapsed: remaining countdown is clamped to 0 (never negative),
                // and overdue minutes represent elapsed overdue duration.
                remainingSlaMinutes = 0L;
                overdueSlaMinutes = Math.abs(diffMinutes);
            }
        }

        String deptName = complaint.getAssignedDepartment() != null
                ? complaint.getAssignedDepartment().getName()
                : null;

        String repName = (complaint.getReporterName() != null && !complaint.getReporterName().isBlank())
                ? complaint.getReporterName()
                : ((complaint.getReportedBy() != null && !complaint.getReportedBy().isBlank())
                        ? complaint.getReportedBy()
                        : "Concerned Citizen");

        String repPhone = (complaint.getReporterPhone() != null && !complaint.getReporterPhone().isBlank())
                ? complaint.getReporterPhone()
                : "+91 98765 43210";

        String formattedAddress = (complaint.getAddress() != null && !complaint.getAddress().isBlank())
                ? complaint.getAddress()
                : (complaint.getLatitude() != null && complaint.getLongitude() != null
                        ? String.format("Geo-Coordinates: %.4f, %.4f", complaint.getLatitude(), complaint.getLongitude())
                        : "Unspecified Location");

        return ComplaintResponse.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .category(complaint.getCategory())
                .categoryDisplayName(complaint.getCategory() != null ? complaint.getCategory().getDisplayName() : null)
                .severityScore(complaint.getSeverityScore() != null ? complaint.getSeverityScore() : 5.0)
                .priorityScore(complaint.getPriorityScore() != null ? complaint.getPriorityScore() : 0.0)
                .status(complaint.getStatus())
                .latitude(complaint.getLatitude())
                .longitude(complaint.getLongitude())
                .address(formattedAddress)
                .imageUrl(complaint.getImageUrl())
                .resolvedImageUrl(complaint.getResolvedImageUrl())
                .reportedAt(complaint.getReportedAt())
                .slaDeadline(complaint.getSlaDeadline())
                .escalatedAt(complaint.getEscalatedAt())
                .clusterId(complaint.getClusterId())
                .duplicateCount(complaint.getDuplicateCount() != null ? complaint.getDuplicateCount() : 1)
                .zoneWeight(complaint.getZoneWeight() != null ? complaint.getZoneWeight() : 1.0)
                .resolutionNotes(complaint.getResolutionNotes())
                .departmentName(deptName)
                .isOverdue(overdue)
                .remainingSlaMinutes(remainingSlaMinutes)
                .overdueSlaMinutes(overdueSlaMinutes)
                .reportedBy(complaint.getReportedBy() != null ? complaint.getReportedBy() : repName)
                .reporterName(repName)
                .reporterPhone(repPhone)
                .build();
    }
}
