package com.civicconnect.dto;

import com.civicconnect.entity.ComplaintCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing an aggregated civic hotspot cluster on the GIS map.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotspotResponse {

    private String clusterId;
    private ComplaintCategory category;
    private String categoryDisplayName;
    private Double latitude;
    private Double longitude;
    private Integer complaintCount;
    private Double averagePriority;
    private Double maxSeverity;
    private String title;
    private String address;
}
