package com.civicconnect.dto;

import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.entity.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing detailed complaint response for frontend UI rendering.
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
    private String reportedBy;

    /**
     * Factory mapping method from JPA entity to clean DTO.
     */
    public static ComplaintResponse fromEntity(Complaint complaint) {
        if (complaint == null) {
            return null;
        }

        boolean overdue = complaint.getStatus() != ComplaintStatus.RESOLVED
                && complaint.getSlaDeadline() != null
                && LocalDateTime.now().isAfter(complaint.getSlaDeadline());

        String deptName = complaint.getAssignedDepartment() != null
                ? complaint.getAssignedDepartment().getName()
                : null;

        return ComplaintResponse.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .category(complaint.getCategory())
                .categoryDisplayName(complaint.getCategory() != null ? complaint.getCategory().getDisplayName() : null)
                .severityScore(complaint.getSeverityScore())
                .priorityScore(complaint.getPriorityScore())
                .status(complaint.getStatus())
                .latitude(complaint.getLatitude())
                .longitude(complaint.getLongitude())
                .address(complaint.getAddress())
                .imageUrl(complaint.getImageUrl())
                .resolvedImageUrl(complaint.getResolvedImageUrl())
                .reportedAt(complaint.getReportedAt())
                .slaDeadline(complaint.getSlaDeadline())
                .escalatedAt(complaint.getEscalatedAt())
                .clusterId(complaint.getClusterId())
                .duplicateCount(complaint.getDuplicateCount())
                .zoneWeight(complaint.getZoneWeight())
                .resolutionNotes(complaint.getResolutionNotes())
                .departmentName(deptName)
                .isOverdue(overdue)
                .reportedBy(complaint.getReportedBy())
                .build();
    }
}
