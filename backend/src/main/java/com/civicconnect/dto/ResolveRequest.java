package com.civicconnect.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for resolving a complaint with post-fix photograph and officer resolution notes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveRequest {

    private String resolvedImageUrl;

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;
}
