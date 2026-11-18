package com.civicconnect.controller;

import com.civicconnect.dto.ComplaintRequest;
import com.civicconnect.dto.ComplaintResponse;
import com.civicconnect.dto.HotspotResponse;
import com.civicconnect.dto.ResolveRequest;
import com.civicconnect.dto.StatusUpdateRequest;
import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.entity.ComplaintStatus;
import com.civicconnect.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing grievance intake, triage, geospatial hotspot aggregation,
 * and resolution workflows.
 *
 * Adheres strictly to the layered architecture: no business logic resides here;
 * requests are routed directly to the transactional ComplaintService.
 */
@Slf4j
@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    /**
     * Retrieves list of complaints with optional query filters.
     */
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(
            @RequestParam(required = false) ComplaintCategory category,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String clusterId
    ) {
        log.info("HTTP GET /api/complaints with category={}, status={}, clusterId={}", category, status, clusterId);
        List<ComplaintResponse> complaints = complaintService.getAllComplaints(category, status, clusterId);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Retrieves detailed information of a specific grievance by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaintById(@PathVariable Long id) {
        log.info("HTTP GET /api/complaints/{}", id);
        ComplaintResponse complaint = complaintService.getComplaintById(id);
        return ResponseEntity.ok(complaint);
    }

    /**
     * Submits a new grievance report with automated duplicate detection and priority triage.
     */
    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(@Valid @RequestBody ComplaintRequest request) {
        log.info("HTTP POST /api/complaints: title='{}', category={}", request.getTitle(), request.getCategory());
        ComplaintResponse created = complaintService.createComplaint(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates complaint lifecycle state (REPORTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED).
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        log.info("HTTP PUT /api/complaints/{}/status to {}", id, request.getStatus());
        ComplaintResponse updated = complaintService.updateStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Retrieves aggregated high-density civic hotspots for GIS visualization.
     */
    @GetMapping("/hotspots")
    public ResponseEntity<List<HotspotResponse>> getHotspots() {
        log.info("HTTP GET /api/complaints/hotspots");
        List<HotspotResponse> hotspots = complaintService.getHotspots();
        return ResponseEntity.ok(hotspots);
    }

    /**
     * Submits resolution documentation with post-fix photographic proof and verification notes.
     */
    @PostMapping("/{id}/resolve")
    public ResponseEntity<ComplaintResponse> resolveComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ResolveRequest request
    ) {
        log.info("HTTP POST /api/complaints/{}/resolve", id);
        ComplaintResponse resolved = complaintService.resolveComplaint(id, request);
        return ResponseEntity.ok(resolved);
    }

    /**
     * Triggers SLA escalation for all overdue, unresolved complaints.
     */
    @PostMapping("/escalate-overdue")
    public ResponseEntity<String> triggerEscalation() {
        log.info("HTTP POST /api/complaints/escalate-overdue triggered");
        int count = complaintService.escalateOverdueComplaints();
        return ResponseEntity.ok("Successfully escalated " + count + " overdue complaints.");
    }
}
