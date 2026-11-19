package com.civicconnect.dto;

import com.civicconnect.entity.ComplaintCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for submitting a new grievance complaint.
 * Enforces strict boundary validation for physical coordinates (-90..90 lat, -180..180 lng)
 * and severity levels (1.0..10.0).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 3000, message = "Description must be between 5 and 3000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private ComplaintCategory category;

    /**
     * Optional physical severity score (1.0 to 10.0). Defaults to 5.0 if omitted.
     */
    @DecimalMin(value = "1.0", message = "Severity score must be at least 1.0")
    @DecimalMax(value = "10.0", message = "Severity score cannot exceed 10.0")
    private Double severityScore;

    /**
     * Latitude coordinate bounded between -90.0 and 90.0 degrees.
     */
    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90.0 and 90.0 degrees")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90.0 and 90.0 degrees")
    private Double latitude;

    /**
     * Longitude coordinate bounded between -180.0 and 180.0 degrees.
     */
    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180.0 and 180.0 degrees")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180.0 and 180.0 degrees")
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

    /**
     * Optional reporter display name (falls back to 'Concerned Citizen').
     */
    private String reporterName;

    /**
     * Optional reporter contact phone number (falls back to municipal default).
     */
    private String reporterPhone;
}
