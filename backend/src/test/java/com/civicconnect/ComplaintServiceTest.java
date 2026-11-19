package com.civicconnect;

import com.civicconnect.dto.ComplaintRequest;
import com.civicconnect.dto.ComplaintResponse;
import com.civicconnect.dto.HotspotResponse;
import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.entity.ComplaintStatus;
import com.civicconnect.exception.BadRequestException;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests verifying business service calculations, defensive validations,
 * fallback values, SLA countdown clamps, and edge case handling.
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
    @DisplayName("Verify Age Weight Increases With Hours Elapsed and Caps at 10.0")
    void testCalculateAgeWeight() {
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        double ageWeight = complaintService.calculateAgeWeight(twentyFourHoursAgo);
        assertEquals(2.0, ageWeight, 0.1, "24 hours elapsed should result in age weight of 2.0");

        // Verify cap at 10.0
        LocalDateTime veryOld = LocalDateTime.now().minusHours(500);
        double cappedWeight = complaintService.calculateAgeWeight(veryOld);
        assertEquals(10.0, cappedWeight, 0.01, "Age weight must cap at 10.0");

        // Null handling
        assertEquals(0.0, complaintService.calculateAgeWeight(null), "Null timestamp should yield 0.0 age weight");
    }

    @Test
    @DisplayName("Edge Case: Reject Malformed Coordinates (Outside -90..90 and -180..180)")
    void testCreateComplaintWithMalformedCoordinates() {
        // Latitude out of bounds (> 90.0)
        ComplaintRequest invalidLat = ComplaintRequest.builder()
                .title("Invalid Latitude")
                .description("Testing out of bounds latitude")
                .category(ComplaintCategory.POTHOLE)
                .latitude(95.5)
                .longitude(77.2)
                .build();

        BadRequestException exLat = assertThrows(BadRequestException.class, () ->
                complaintService.createComplaint(invalidLat)
        );
        assertTrue(exLat.getMessage().contains("Latitude must be between -90.0 and 90.0"));

        // Longitude out of bounds (< -180.0)
        ComplaintRequest invalidLng = ComplaintRequest.builder()
                .title("Invalid Longitude")
                .description("Testing out of bounds longitude")
                .category(ComplaintCategory.POTHOLE)
                .latitude(28.5)
                .longitude(-195.0)
                .build();

        BadRequestException exLng = assertThrows(BadRequestException.class, () ->
                complaintService.createComplaint(invalidLng)
        );
        assertTrue(exLng.getMessage().contains("Longitude must be between -180.0 and 180.0"));
    }

    @Test
    @DisplayName("Edge Case: Reject Empty or Blank Strings in Title and Description")
    void testCreateComplaintWithBlankStrings() {
        // Blank Title
        ComplaintRequest blankTitle = ComplaintRequest.builder()
                .title("   ")
                .description("Valid description text")
                .category(ComplaintCategory.GARBAGE)
                .latitude(28.5)
                .longitude(77.2)
                .build();

        assertThrows(BadRequestException.class, () -> complaintService.createComplaint(blankTitle));

        // Blank Description
        ComplaintRequest blankDesc = ComplaintRequest.builder()
                .title("Valid Title")
                .description("   ")
                .category(ComplaintCategory.GARBAGE)
                .latitude(28.5)
                .longitude(77.2)
                .build();

        assertThrows(BadRequestException.class, () -> complaintService.createComplaint(blankDesc));
    }

    @Test
    @DisplayName("Edge Case: Fallback Values When Citizen Name, Phone, and Address are Null")
    void testFallbackValuesWhenCitizenMetadataNull() {
        ComplaintRequest request = ComplaintRequest.builder()
                .title("Burst Pipe")
                .description("Water gushing onto main road")
                .category(ComplaintCategory.WATER_LEAK)
                .latitude(28.4744)
                .longitude(77.5040)
                .reportedBy(null)
                .reporterName(null)
                .reporterPhone(null)
                .address(null)
                .build();

        when(departmentRepository.findByCategoryHandled(ComplaintCategory.WATER_LEAK))
                .thenReturn(Optional.empty());
        when(complaintRepository.findNearbyActiveByCategory(anyDouble(), anyDouble(), anyString(), anyDouble()))
                .thenReturn(Collections.emptyList());
        when(complaintRepository.save(any(Complaint.class)))
                .thenAnswer(invocation -> {
                    Complaint saved = invocation.getArgument(0);
                    saved.setId(101L);
                    return saved;
                });

        ComplaintResponse response = complaintService.createComplaint(request);

        assertNotNull(response);
        assertEquals("Concerned Citizen", response.getReporterName(), "Citizen name should fallback to 'Concerned Citizen'");
        assertEquals("+91 98765 43210", response.getReporterPhone(), "Citizen phone should fallback to default contact");
        assertTrue(response.getAddress().contains("Geo-Coordinates: 28.4744, 77.5040"), "Address should fallback to coordinates");
    }

    @Test
    @DisplayName("Edge Case: SLA Countdown When Deadline Passed Clamps Remaining Minutes to 0 and Reports Elapsed Overdue")
    void testSlaCountdownWhenDeadlinePassed() {
        LocalDateTime pastDeadline = LocalDateTime.now().minusHours(3);

        Complaint overdueComplaint = Complaint.builder()
                .id(202L)
                .title("Overdue Water Hazard")
                .description("Unresolved emergency")
                .category(ComplaintCategory.WATER_LEAK)
                .status(ComplaintStatus.REPORTED)
                .slaDeadline(pastDeadline)
                .reportedAt(pastDeadline.minusHours(12))
                .latitude(28.4)
                .longitude(77.5)
                .build();

        ComplaintResponse response = ComplaintResponse.fromEntity(overdueComplaint);

        assertTrue(response.isOverdue(), "isOverdue should be true when deadline is in the past");
        assertEquals(0L, response.getRemainingSlaMinutes(), "Remaining SLA minutes should clamp to 0 and never return negative numbers");
        assertTrue(response.getOverdueSlaMinutes() >= 179L, "Overdue SLA minutes should record elapsed overdue time (~180 mins)");
    }

    @Test
    @DisplayName("Edge Case: SLA Countdown When Deadline Active Returns Positive Remaining Minutes")
    void testSlaCountdownWhenDeadlineActive() {
        LocalDateTime futureDeadline = LocalDateTime.now().plusHours(4);

        Complaint activeComplaint = Complaint.builder()
                .id(203L)
                .title("Active Pothole Issue")
                .description("Road repair pending")
                .category(ComplaintCategory.POTHOLE)
                .status(ComplaintStatus.REPORTED)
                .slaDeadline(futureDeadline)
                .reportedAt(LocalDateTime.now())
                .latitude(28.4)
                .longitude(77.5)
                .build();

        ComplaintResponse response = ComplaintResponse.fromEntity(activeComplaint);

        assertFalse(response.isOverdue(), "isOverdue should be false for active SLA");
        assertTrue(response.getRemainingSlaMinutes() >= 238L, "Remaining SLA minutes should reflect positive remaining time (~240 mins)");
        assertEquals(0L, response.getOverdueSlaMinutes(), "Overdue minutes must be 0 when SLA is not overdue");
    }

    @Test
    @DisplayName("Edge Case: Upvoting Already Resolved Complaint Throws BadRequestException")
    void testUpvoteResolvedComplaintThrowsBadRequest() {
        Complaint resolvedComplaint = Complaint.builder()
                .id(301L)
                .title("Fixed Streetlight")
                .description("Repaired luminaire")
                .category(ComplaintCategory.STREETLIGHT)
                .status(ComplaintStatus.RESOLVED)
                .duplicateCount(1)
                .severityScore(4.0)
                .zoneWeight(1.0)
                .reportedAt(LocalDateTime.now().minusDays(1))
                .build();

        when(complaintRepository.findByIdWithPessimisticLock(301L)).thenReturn(Optional.of(resolvedComplaint));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                complaintService.upvoteComplaint(301L)
        );
        assertTrue(ex.getMessage().contains("Cannot upvote a complaint that is already RESOLVED"));
    }

    @Test
    @DisplayName("Hotspots Aggregation Safely Handles Null Fields and Empty Clusters")
    void testGetHotspotsNullSafety() {
        Complaint complaintWithNulls = Complaint.builder()
                .id(401L)
                .title(null)
                .description("Test")
                .category(ComplaintCategory.GARBAGE)
                .status(ComplaintStatus.REPORTED)
                .clusterId(null)
                .severityScore(null)
                .priorityScore(null)
                .latitude(28.5)
                .longitude(77.5)
                .duplicateCount(null)
                .build();

        when(complaintRepository.findTop20ByStatusNotOrderByPriorityScoreDesc(ComplaintStatus.RESOLVED))
                .thenReturn(List.of(complaintWithNulls));

        List<HotspotResponse> hotspots = complaintService.getHotspots();

        assertNotNull(hotspots);
        assertEquals(1, hotspots.size());
        assertEquals("CLUSTER-401", hotspots.get(0).getClusterId(), "Null clusterId should fallback to CLUSTER-ID");
        assertEquals(5.0, hotspots.get(0).getMaxSeverity(), "Null severity should fallback safely to 5.0");
    }
}
