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
     * Submits and triages a new complaint, performing defensive input sanitization,
     * automated duplicate detection, and SLA turnaround deadline computation.
     */
    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request) {
        log.info("Intake grievance request received: title='{}', category={}", request.getTitle(), request.getCategory());

        // 1. Defensive parameter validation for coordinates and required strings
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            log.error("Complaint validation failed: Title is empty");
            throw new BadRequestException("Complaint title cannot be blank");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            log.error("Complaint validation failed: Description is empty");
            throw new BadRequestException("Complaint description cannot be blank");
        }
        if (request.getCategory() == null) {
            log.error("Complaint validation failed: Category is null");
            throw new BadRequestException("Complaint category is required");
        }
        if (request.getLatitude() == null || request.getLatitude() < -90.0 || request.getLatitude() > 90.0) {
            log.error("Complaint validation failed: Invalid latitude {}", request.getLatitude());
            throw new BadRequestException("Latitude must be between -90.0 and 90.0 degrees");
        }
        if (request.getLongitude() == null || request.getLongitude() < -180.0 || request.getLongitude() > 180.0) {
            log.error("Complaint validation failed: Invalid longitude {}", request.getLongitude());
            throw new BadRequestException("Longitude must be between -180.0 and 180.0 degrees");
        }

        LocalDateTime now = LocalDateTime.now();
        double severity = (request.getSeverityScore() != null) ? request.getSeverityScore() : 5.0;
        double zoneWeight = (request.getZoneWeight() != null) ? request.getZoneWeight() : 1.0;
        double typeWeight = request.getCategory().getBaseWeight();

        // 2. Department Lookup & SLA deadline assignment
        Department department = departmentRepository.findByCategoryHandled(request.getCategory())
                .orElse(null);
        int slaHours = department != null ? department.getSlaHours() : getDefaultSlaHours(request.getCategory());
        LocalDateTime slaDeadline = now.plusHours(slaHours);

        // 3. Automated Duplicate Detection: Search within 50m radius for active complaints in same category
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
            int updatedVolume = (primaryMatch.getDuplicateCount() != null ? primaryMatch.getDuplicateCount() : 1) + 1;
            primaryMatch.setDuplicateCount(updatedVolume);

            // Recompute priority score for the primary clustered complaint
            double updatedPrimaryScore = calculatePriorityScore(
                    primaryMatch.getSeverityScore() != null ? primaryMatch.getSeverityScore() : 5.0,
                    updatedVolume,
                    primaryMatch.getCategory().getBaseWeight(),
                    primaryMatch.getZoneWeight() != null ? primaryMatch.getZoneWeight() : 1.0,
                    calculateAgeWeight(primaryMatch.getReportedAt())
            );
            primaryMatch.setPriorityScore(updatedPrimaryScore);
            complaintRepository.save(primaryMatch);

            volume = updatedVolume;
            log.info("Duplicate complaint detected! Merged into cluster {} with new volume count {}", clusterId, volume);
        } else {
            // New unique grievance cluster
            clusterId = "CLUSTER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            volume = 1;
            log.info("New unique grievance cluster created: {}", clusterId);
        }

        // 4. Compute initial priority score for this complaint
        double initialPriorityScore = calculatePriorityScore(
                severity,
                volume,
                typeWeight,
                zoneWeight,
                0.0 // 0 age weight at submission time
        );

        // 5. Fallback values when citizen names, phones, or addresses are omitted
        String resolvedReporterName = (request.getReporterName() != null && !request.getReporterName().isBlank())
                ? request.getReporterName().trim()
                : ((request.getReportedBy() != null && !request.getReportedBy().isBlank())
                        ? request.getReportedBy().trim()
                        : "Concerned Citizen");

        String resolvedReporterPhone = (request.getReporterPhone() != null && !request.getReporterPhone().isBlank())
                ? request.getReporterPhone().trim()
                : "+91 98765 43210";

        String resolvedAddress = (request.getAddress() != null && !request.getAddress().isBlank())
                ? request.getAddress().trim()
                : String.format("Geo-Coordinates: %.4f, %.4f", request.getLatitude(), request.getLongitude());

        Complaint complaint = Complaint.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory())
                .severityScore(severity)
                .priorityScore(initialPriorityScore)
                .status(ComplaintStatus.REPORTED)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(resolvedAddress)
                .imageUrl(request.getImageUrl())
                .reportedAt(now)
                .slaDeadline(slaDeadline)
                .clusterId(clusterId)
                .duplicateCount(volume)
                .zoneWeight(zoneWeight)
                .reportedBy(resolvedReporterName)
                .reporterName(resolvedReporterName)
                .reporterPhone(resolvedReporterPhone)
                .assignedDepartment(department)
                .build();

        Complaint savedComplaint = complaintRepository.save(complaint);
        log.info("Complaint saved successfully with ID: {}, Priority Score: {}", savedComplaint.getId(), initialPriorityScore);

        return ComplaintResponse.fromEntity(savedComplaint);
    }

    /**
     * Retrieves all complaints with optional filtering by category, status, and clusterId.
     * Always sorted by priority score descending.
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
            complaints = complaintRepository.findByClusterIdOrderByPriorityScoreDesc(clusterId);
        } else if (category != null && status != null) {
            complaints = complaintRepository.findByCategoryAndStatusInOrderByPriorityScoreDesc(category, Collections.singletonList(status));
        } else if (category != null) {
            complaints = complaintRepository.findByCategoryOrderByPriorityScoreDesc(category);
        } else if (status != null) {
            complaints = complaintRepository.findByStatusOrderByPriorityScoreDesc(status);
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
        if (id == null || id <= 0) {
            throw new BadRequestException("Invalid complaint ID: " + id);
        }
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Complaint ID {} not found", id);
                    return new ResourceNotFoundException("Complaint with ID " + id + " was not found");
                });
        return ComplaintResponse.fromEntity(complaint);
    }

    /**
     * Updates complaint lifecycle status with validation.
     */
    @Transactional
    public ComplaintResponse updateStatus(Long id, StatusUpdateRequest request) {
        log.info("Updating status for complaint ID {} to {}", id, request != null ? request.getStatus() : null);

        if (id == null || id <= 0) {
            throw new BadRequestException("Invalid complaint ID: " + id);
        }
        if (request == null || request.getStatus() == null) {
            throw new BadRequestException("Target status is required");
        }

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

        if (id == null || id <= 0) {
            throw new BadRequestException("Invalid complaint ID: " + id);
        }
        if (request == null) {
            throw new BadRequestException("Resolution request body is required");
        }
        if (request.getResolutionNotes() == null || request.getResolutionNotes().trim().isEmpty()) {
            throw new BadRequestException("Resolution notes are required");
        }

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Complaint ID {} not found for resolution", id);
                    return new ResourceNotFoundException("Complaint with ID " + id + " was not found");
                });

        complaint.setStatus(ComplaintStatus.RESOLVED);
        String resolvedImage = (request.getResolvedImageUrl() != null && !request.getResolvedImageUrl().isBlank())
                ? request.getResolvedImageUrl().trim()
                : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800";
        complaint.setResolvedImageUrl(resolvedImage);
        complaint.setResolutionNotes(request.getResolutionNotes().trim());

        Complaint resolved = complaintRepository.save(complaint);
        log.info("Complaint ID {} marked as RESOLVED successfully", id);

        return ComplaintResponse.fromEntity(resolved);
    }

    /**
     * Upvotes a complaint using pessimistic write locking to prevent race conditions
     * under concurrent citizen voting traffic. Recalculates dynamic priority atomically.
     */
    @Transactional
    public ComplaintResponse upvoteComplaint(Long id) {
        log.info("Processing community upvote for complaint ID: {}", id);

        if (id == null || id <= 0) {
            throw new BadRequestException("Invalid complaint ID: " + id);
        }

        // Acquire pessimistic write lock (SELECT ... FOR UPDATE) to serialize concurrent increments
        Complaint complaint = complaintRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(() -> {
                    log.error("Complaint ID {} not found for upvote", id);
                    return new ResourceNotFoundException("Complaint with ID " + id + " was not found");
                });

        if (complaint.getStatus() == ComplaintStatus.RESOLVED) {
            log.warn("Cannot upvote closed complaint ID {}", id);
            throw new BadRequestException("Cannot upvote a complaint that is already RESOLVED");
        }

        int newVolume = (complaint.getDuplicateCount() != null ? complaint.getDuplicateCount() : 1) + 1;
        complaint.setDuplicateCount(newVolume);

        double newPriority = calculatePriorityScore(
                complaint.getSeverityScore() != null ? complaint.getSeverityScore() : 5.0,
                newVolume,
                complaint.getCategory() != null ? complaint.getCategory().getBaseWeight() : 3.0,
                complaint.getZoneWeight() != null ? complaint.getZoneWeight() : 1.0,
                calculateAgeWeight(complaint.getReportedAt())
        );
        complaint.setPriorityScore(newPriority);

        Complaint updated = complaintRepository.save(complaint);
        log.info("Complaint ID {} upvoted. New volume: {}, new priority: {}", id, newVolume, newPriority);

        return ComplaintResponse.fromEntity(updated);
    }

    /**
     * Aggregates active complaints into high-density geographic hotspots for municipal heatmaps.
     * Defensive against null fields and unassigned cluster IDs.
     */
    @Transactional(readOnly = true)
    public List<HotspotResponse> getHotspots() {
        log.info("Aggregating active civic complaint hotspots");

        List<Complaint> activeComplaints = complaintRepository.findTop20ByStatusNotOrderByPriorityScoreDesc(ComplaintStatus.RESOLVED);

        // Group complaints by clusterId (fallback to CLUSTER-ID if clusterId is null)
        Map<String, List<Complaint>> clusterGroups = activeComplaints.stream()
                .collect(Collectors.groupingBy(c -> (c.getClusterId() != null && !c.getClusterId().isBlank())
                        ? c.getClusterId()
                        : "CLUSTER-" + c.getId()));

        List<HotspotResponse> hotspots = new ArrayList<>();

        for (Map.Entry<String, List<Complaint>> entry : clusterGroups.entrySet()) {
            String clusterId = entry.getKey();
            List<Complaint> clusterList = entry.getValue();

            if (clusterList == null || clusterList.isEmpty()) {
                continue;
            }

            Complaint sample = clusterList.get(0);
            double avgLat = clusterList.stream()
                    .mapToDouble(c -> c.getLatitude() != null ? c.getLatitude() : 0.0)
                    .average()
                    .orElse(sample.getLatitude() != null ? sample.getLatitude() : 0.0);

            double avgLng = clusterList.stream()
                    .mapToDouble(c -> c.getLongitude() != null ? c.getLongitude() : 0.0)
                    .average()
                    .orElse(sample.getLongitude() != null ? sample.getLongitude() : 0.0);

            double avgPriority = clusterList.stream()
                    .mapToDouble(c -> c.getPriorityScore() != null ? c.getPriorityScore() : 0.0)
                    .average()
                    .orElse(sample.getPriorityScore() != null ? sample.getPriorityScore() : 0.0);

            double maxSeverity = clusterList.stream()
                    .mapToDouble(c -> c.getSeverityScore() != null ? c.getSeverityScore() : 5.0)
                    .max()
                    .orElse(5.0);

            int totalVolume = clusterList.stream()
                    .mapToInt(c -> c.getDuplicateCount() != null ? c.getDuplicateCount() : 1)
                    .max()
                    .orElse(clusterList.size());

            String categoryName = sample.getCategory() != null ? sample.getCategory().getDisplayName() : "General Grievance";

            hotspots.add(HotspotResponse.builder()
                    .clusterId(clusterId)
                    .category(sample.getCategory())
                    .categoryDisplayName(categoryName)
                    .latitude(Math.round(avgLat * 100000.0) / 100000.0)
                    .longitude(Math.round(avgLng * 100000.0) / 100000.0)
                    .complaintCount(totalVolume)
                    .averagePriority(Math.round(avgPriority * 100.0) / 100.0)
                    .maxSeverity(maxSeverity)
                    .title(sample.getTitle() != null ? sample.getTitle() : "Civic Cluster " + clusterId)
                    .address(sample.getAddress() != null ? sample.getAddress() : "Location Cluster")
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
            double currentPriority = complaint.getPriorityScore() != null ? complaint.getPriorityScore() : 5.0;
            complaint.setPriorityScore(Math.round((currentPriority + 2.0) * 100.0) / 100.0);
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
