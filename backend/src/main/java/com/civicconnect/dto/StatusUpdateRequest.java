package com.civicconnect.dto;

import com.civicconnect.entity.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for transitioning complaint status (e.g. REPORTED -> ASSIGNED -> IN_PROGRESS).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ComplaintStatus status;

    private String notes;
}
