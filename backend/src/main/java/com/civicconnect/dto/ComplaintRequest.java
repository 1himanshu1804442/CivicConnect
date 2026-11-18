package com.civicconnect.dto;

import com.civicconnect.entity.ComplaintCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for submitting a new grievance complaint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Category is required")
    private ComplaintCategory category;

    /**
     * Optional physical severity score (1.0 to 10.0). Defaults to 5.0 if omitted.
     */
    @DecimalMin(value = "1.0", message = "Severity score must be at least 1.0")
    @DecimalMax(value = "10.0", message = "Severity score cannot exceed 10.0")
    private Double severityScore;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String address;

    private String imageUrl;

    /**
     * Optional urban zone weight (e.g. 1.0 = residential, 2.0 = school/hospital vicinity, 2.5 = highway).
     */
    private Double zoneWeight;

    /**
     * Optional reporter identity or email.
     */
    private String reportedBy;
}
