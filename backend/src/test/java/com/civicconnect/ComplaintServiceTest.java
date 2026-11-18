package com.civicconnect;

import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.DepartmentRepository;
import com.civicconnect.service.ComplaintService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test verifying the core mathematical triage formula and Haversine spatial calculations.
 */
@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private ComplaintService complaintService;

    @Test
    @DisplayName("Verify Exact Priority Score Formula: U = 0.35*S + 0.20*log2(1+V) + 0.15*TW + 0.15*ZW + 0.15*AW")
    void testCalculatePriorityScore() {
        // Given parameters:
        // severity = 8.0
        // volume = 3 (log2(1 + 3) = log2(4) = 2.0)
        // typeWeight = 4.5 (WATER_LEAK)
        // zoneWeight = 2.0 (Hospital zone)
        // ageWeight = 1.0
        double severity = 8.0;
        int volume = 3;
        double typeWeight = 4.5;
        double zoneWeight = 2.0;
        double ageWeight = 1.0;

        // Expected calculation:
        // 0.35 * 8.0 = 2.80
        // 0.20 * 2.0 = 0.40
        // 0.15 * 4.5 = 0.675
        // 0.15 * 2.0 = 0.30
        // 0.15 * 1.0 = 0.15
        // Total = 2.80 + 0.40 + 0.675 + 0.30 + 0.15 = 4.325 -> 4.33
        double expected = 4.33;

        double calculated = complaintService.calculatePriorityScore(severity, volume, typeWeight, zoneWeight, ageWeight);

        assertEquals(expected, calculated, 0.01, "Priority formula output should match exact weighted sum");
    }

    @Test
    @DisplayName("Verify Haversine Distance Calculation Between Two Coordinates")
    void testCalculateDistanceKm() {
        // Validation across two known coordinates: distance is ~1.46 km
        double lat1 = 37.7955;
        double lon1 = -122.3937;
        double lat2 = 37.7879;
        double lon2 = -122.4074;

        double distance = ComplaintService.calculateDistanceKm(lat1, lon1, lat2, lon2);

        assertTrue(distance > 1.3 && distance < 1.6, "Distance should be approximately 1.46 km");
    }

    @Test
    @DisplayName("Verify Age Weight Increases With Hours Elapsed")
    void testCalculateAgeWeight() {
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        double ageWeight = complaintService.calculateAgeWeight(twentyFourHoursAgo);

        assertEquals(2.0, ageWeight, 0.1, "24 hours elapsed should result in age weight of 2.0");
    }
}
