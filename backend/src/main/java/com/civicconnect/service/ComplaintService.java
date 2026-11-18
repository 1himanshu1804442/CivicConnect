package com.civicconnect.service;

import com.civicconnect.dto.ComplaintRequest;
import com.civicconnect.dto.ComplaintResponse;
import com.civicconnect.dto.HotspotResponse;
import com.civicconnect.dto.ResolveRequest;
import com.civicconnect.dto.StatusUpdateRequest;
import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.entity.ComplaintStatus;
import com.civicconnect.entity.Department;
import com.civicconnect.exception.BadRequestException;
import com.civicconnect.exception.ResourceNotFoundException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core business service implementing civic grievance intake, SLA monitoring,
 * automated spatial duplicate detection, and dynamic priority triage formula:
 * U = 0.35*severity + 0.20*log2(1+volume) + 0.15*typeWeight + 0.15*zoneWeight + 0.15*ageWeight.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository;

    // Threshold radius in kilometers for duplicate spatial matching (50 meters = 0.05 km)
    public static final double DUPLICATE_RADIUS_KM = 0.05;

    /**
     * Calculates priority score according to the civic triage formula:
     * U = 0.35*severity + 0.20*log2(1+volume) + 0.15*typeWeight + 0.15*zoneWeight + 0.15*ageWeight
     *
     * Why: This formula balances physical hazard severity, citizen volume/outcry,
     * infrastructure category criticality, urban zone density, and unresolved aging.
     */
    public double calculatePriorityScore(
            double severity,
            int volume,
            double typeWeight,
            double zoneWeight,
            double ageWeight
    ) {
        // Log base 2 of (1 + volume) ensures diminishing returns as duplicate reports grow
        double log2Volume = Math.log(1.0 + Math.max(1, volume)) / Math.log(2.0);

        double score = (0.35 * severity)
                + (0.20 * log2Volume)
                + (0.15 * typeWeight)
                + (0.15 * zoneWeight)
                + (0.15 * ageWeight);

        // Round to 2 decimal places for clean UI visualization
        return Math.round(score * 100.0) / 100.0;
    }

    /**
     * Computes age weight based on hours elapsed since initial report.
     * Capped at 10.0 to prevent unbounded growth.
     */
    public double calculateAgeWeight(LocalDateTime reportedAt) {
        if (reportedAt == null) {
            return 0.0;
        }
        long hoursElapsed = ChronoUnit.HOURS.between(reportedAt, LocalDateTime.now());
        // Each 12 hours increments age weight by 1.0, capped at 10.0
        return Math.min(10.0, Math.max(0.0, hoursElapsed / 12.0));
    }

    /**
     * Calculates Haversine distance in kilometers between two geo-coordinates.
     */
    public static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    /**
     * Submits and triages a new complaint, performing automated duplicate detection
     * and SLA turnaround deadline computation.
     */
    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request) {
        log.info("Creating complaint: category={}, lat={}, lng={}",
                request.getCategory(), request.getLatitude(), request.getLongitude());

        LocalDateTime now = LocalDateTime.now();
        double severity = request.getSeverityScore() != null ? request.getSeverityScore() : 5.0;
        double zoneWeight = request.getZoneWeight() != null ? request.getZoneWeight() : 1.0;
        double typeWeight = request.getCategory().getBaseWeight();

        // 1. Department Lookup & SLA deadline assignment
        Department department = departmentRepository.findByCategoryHandled(request.getCategory())
                .orElse(null);
        int slaHours = department != null ? department.getSlaHours() : getDefaultSlaHours(request.getCategory());
        LocalDateTime slaDeadline = now.plusHours(slaHours);

        // 2. Automated Duplicate Detection: Search within 50m radius for active complaints in same category
        List<Complaint> nearbyCandidates = complaintRepository.findNearbyActiveByCategory(
                request.getLatitude(),
                request.getLongitude(),
                request.getCategory().name(),
                DUPLICATE_RADIUS_KM
        );

        String clusterId;
        int volume;

        if (!nearbyCandidates.isEmpty()) {
            Complaint primaryMatch = nearbyCandidates.get(0);
            if (primaryMatch.getClusterId() != null) {
                clusterId = primaryMatch.getClusterId();
            } else {
                clusterId = "CLUSTER-" + primaryMatch.getId();
                primaryMatch.setClusterId(clusterId);
            }

            // Increment duplicate volume count
            int updatedVolume = primaryMatch.getDuplicateCount() + 1;
            primaryMatch.setDuplicateCount(updatedVolume);

            // Recompute priority score for the primary clustered complaint
            double updatedPrimaryScore = calculatePriorityScore(
                    primaryMatch.getSeverityScore(),
                    updatedVolume,
                    primaryMatch.getCategory().getBaseWeight(),
                    primaryMatch.getZoneWeight(),
                    calculateAgeWeight(primaryMatch.getReportedAt())
            );
            primaryMatch.setPriorityScore(updatedPrimaryScore);
            complaintRepository.save(primaryMatch);

            volume = updatedVolume;
            log.info("Duplicate complaint detected! Merged into cluster {} with new volume count {}", clusterId, volume);
        } else {
            // New unique grievance
            clusterId = "CLUSTER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            volume = 1;
            log.info("New unique grievance cluster created: {}", clusterId);
        }

        // 3. Compute initial priority score for this complaint
        double initialPriorityScore = calculatePriorityScore(
                severity,
                volume,
                typeWeight,
                zoneWeight,
                0.0 // 0 age weight at submission time
        );

        Complaint complaint = Complaint.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory())
                .severityScore(severity)
                .priorityScore(initialPriorityScore)
                .status(ComplaintStatus.REPORTED)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .imageUrl(request.getImageUrl())
                .reportedAt(now)
                .slaDeadline(slaDeadline)
                .clusterId(clusterId)
                .duplicateCount(volume)
                .zoneWeight(zoneWeight)
                .reportedBy(request.getReportedBy())
                .assignedDepartment(department)
                .build();

        Complaint savedComplaint = complaintRepository.save(complaint);
        log.info("Complaint saved successfully with ID: {}, Priority Score: {}", savedComplaint.getId(), initialPriorityScore);

        return ComplaintResponse.fromEntity(savedComplaint);
    }

    /**
     * Retrieves all complaints with optional filtering by category, status, and clusterId.
     */
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getAllComplaints(
            ComplaintCategory category,
            ComplaintStatus status,
            String clusterId
    ) {
        log.info("Querying complaints: category={}, status={}, clusterId={}", category, status, clusterId);

        List<Complaint> complaints;

        if (clusterId != null && !clusterId.isBlank()) {
            complaints = complaintRepository.findByClusterId(clusterId);
        } else if (category != null && status != null) {
            complaints = complaintRepository.findByCategoryAndStatusIn(category, Collections.singletonList(status));
        } else if (category != null) {
            complaints = complaintRepository.findByCategory(category);
        } else if (status != null) {
            complaints = complaintRepository.findByStatus(status);
        } else {
            complaints = complaintRepository.findAllByOrderByPriorityScoreDesc();
        }

        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves single complaint by ID.
     */
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(Long id) {
        log.info("Fetching complaint with ID: {}", id);
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Complaint ID {} not found", id);
                    return new ResourceNotFoundException("Complaint with ID " + id + " was not found");
                });
        return ComplaintResponse.fromEntity(complaint);
    }

    /**
     * Updates complaint lifecycle status.
     */
    @Transactional
    public ComplaintResponse updateStatus(Long id, StatusUpdateRequest request) {
        log.info("Updating status for complaint ID {} to {}", id, request.getStatus());

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Complaint ID {} not found for status update", id);
                    return new ResourceNotFoundException("Complaint with ID " + id + " was not found");
                });

        complaint.setStatus(request.getStatus());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            complaint.setResolutionNotes(request.getNotes().trim());
        }

        Complaint updated = complaintRepository.save(complaint);
        log.info("Complaint ID {} transitioned to status {}", id, updated.getStatus());

        return ComplaintResponse.fromEntity(updated);
    }

    /**
     * Resolves a complaint with post-fix photograph and officer verification notes.
     */
    @Transactional
    public ComplaintResponse resolveComplaint(Long id, ResolveRequest request) {
        log.info("Resolving complaint ID: {}", id);

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Complaint ID {} not found for resolution", id);
                    return new ResourceNotFoundException("Complaint with ID " + id + " was not found");
                });

        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedImageUrl(request.getResolvedImageUrl());
        complaint.setResolutionNotes(request.getResolutionNotes());

        Complaint resolved = complaintRepository.save(complaint);
        log.info("Complaint ID {} marked as RESOLVED successfully", id);

        return ComplaintResponse.fromEntity(resolved);
    }

    /**
     * Upvotes a complaint, incrementing community volume and recalculating dynamic priority.
     */
    @Transactional
    public ComplaintResponse upvoteComplaint(Long id) {
        log.info("Processing community upvote for complaint ID: {}", id);

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Complaint ID {} not found for upvote", id);
                    return new ResourceNotFoundException("Complaint with ID " + id + " was not found");
                });

        int newVolume = (complaint.getDuplicateCount() != null ? complaint.getDuplicateCount() : 1) + 1;
        complaint.setDuplicateCount(newVolume);

        double newPriority = calculatePriorityScore(
                complaint.getSeverityScore(),
                newVolume,
                complaint.getCategory().getBaseWeight(),
                complaint.getZoneWeight(),
                calculateAgeWeight(complaint.getReportedAt())
        );
        complaint.setPriorityScore(newPriority);

        Complaint updated = complaintRepository.save(complaint);
        log.info("Complaint ID {} upvoted. New volume: {}, new priority: {}", id, newVolume, newPriority);

        return ComplaintResponse.fromEntity(updated);
    }

    /**
     * Aggregates active complaints into high-density geographic hotspots for municipal heatmaps.
     */
    @Transactional(readOnly = true)
    public List<HotspotResponse> getHotspots() {
        log.info("Aggregating active civic complaint hotspots");

        List<Complaint> activeComplaints = complaintRepository.findTop20ByStatusNotOrderByPriorityScoreDesc(ComplaintStatus.RESOLVED);

        // Group complaints by clusterId
        Map<String, List<Complaint>> clusterGroups = activeComplaints.stream()
                .filter(c -> c.getClusterId() != null)
                .collect(Collectors.groupingBy(Complaint::getClusterId));

        List<HotspotResponse> hotspots = new ArrayList<>();

        for (Map.Entry<String, List<Complaint>> entry : clusterGroups.entrySet()) {
            String clusterId = entry.getKey();
            List<Complaint> clusterList = entry.getValue();

            if (clusterList.isEmpty()) {
                continue;
            }

            Complaint sample = clusterList.get(0);
            double avgLat = clusterList.stream().mapToDouble(Complaint::getLatitude).average().orElse(sample.getLatitude());
            double avgLng = clusterList.stream().mapToDouble(Complaint::getLongitude).average().orElse(sample.getLongitude());
            double avgPriority = clusterList.stream().mapToDouble(Complaint::getPriorityScore).average().orElse(sample.getPriorityScore());
            double maxSeverity = clusterList.stream().mapToDouble(Complaint::getSeverityScore).max().orElse(sample.getSeverityScore());
            int totalVolume = clusterList.stream().mapToInt(Complaint::getDuplicateCount).max().orElse(clusterList.size());

            hotspots.add(HotspotResponse.builder()
                    .clusterId(clusterId)
                    .category(sample.getCategory())
                    .categoryDisplayName(sample.getCategory().getDisplayName())
                    .latitude(Math.round(avgLat * 100000.0) / 100000.0)
                    .longitude(Math.round(avgLng * 100000.0) / 100000.0)
                    .complaintCount(totalVolume)
                    .averagePriority(Math.round(avgPriority * 100.0) / 100.0)
                    .maxSeverity(maxSeverity)
                    .title(sample.getTitle())
                    .address(sample.getAddress())
                    .build());
        }

        // Sort hotspots by average priority descending
        hotspots.sort(Comparator.comparingDouble(HotspotResponse::getAveragePriority).reversed());
        return hotspots;
    }

    /**
     * Identifies overdue complaints past SLA deadline and escalates them automatically.
     * Evaluated every 60 seconds via Spring Task Scheduling.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public int escalateOverdueComplaints() {
        LocalDateTime now = LocalDateTime.now();
        List<Complaint> overdueList = complaintRepository.findOverdueComplaints(now);

        if (overdueList.isEmpty()) {
            return 0;
        }

        log.info("Found {} overdue complaints requiring escalation", overdueList.size());

        for (Complaint complaint : overdueList) {
            complaint.setStatus(ComplaintStatus.ESCALATED);
            complaint.setEscalatedAt(now);
            // Boost priority score upon escalation
            complaint.setPriorityScore(Math.round((complaint.getPriorityScore() + 2.0) * 100.0) / 100.0);
            complaintRepository.save(complaint);
            log.info("Escalated complaint ID: {} due to SLA breach deadline: {}", complaint.getId(), complaint.getSlaDeadline());
        }

        return overdueList.size();
    }

    /**
     * Default SLA turnaround hours if department record has not yet been initialized in DB.
     */
    private int getDefaultSlaHours(ComplaintCategory category) {
        return switch (category) {
            case WATER_LEAK -> 12; // Emergency water flood/leakage
            case POTHOLE -> 48;   // Road pothole repair
            case GARBAGE -> 24;   // Sanitation waste clearance
            case STREETLIGHT -> 36; // Electrical hazard / lighting
        };
    }
}
