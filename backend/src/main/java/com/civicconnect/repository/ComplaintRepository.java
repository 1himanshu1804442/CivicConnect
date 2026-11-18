package com.civicconnect.repository;

import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Spring Data JPA repository for Complaint entity.
 * Includes spatial Haversine distance calculations and SLA deadline tracking queries.
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    /**
     * Finds complaints overdue according to their SLA deadline that have not yet been resolved.
     * Used by escalation triage routines.
     */
    @Query("SELECT c FROM Complaint c WHERE c.status NOT IN ('RESOLVED') AND c.slaDeadline < :now AND c.escalatedAt IS NULL")
    List<Complaint> findOverdueComplaints(@Param("now") LocalDateTime now);

    /**
     * Finds nearby complaints within a given radius in kilometers using the Haversine formula.
     * Uses LEAST/GREATEST to protect against floating point precision errors exceeding [-1, 1] range for acos.
     * Works seamlessly in both PostgreSQL and H2 test databases.
     */
    @Query(value = """
        SELECT * FROM complaints c
        WHERE (6371.0 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(:lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(c.latitude))
            ))
        )) <= :radiusKm
        ORDER BY c.priority_score DESC
        """, nativeQuery = true)
    List<Complaint> findNearbyComplaints(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusKm") double radiusKm
    );

    /**
     * Finds nearby complaints within a given radius of the same category and not yet resolved.
     * Essential for automated duplicate detection and cluster grouping.
     */
    @Query(value = """
        SELECT * FROM complaints c
        WHERE c.category = :category
          AND c.status NOT IN ('RESOLVED')
          AND (6371.0 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(:lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(c.latitude))
            ))
        )) <= :radiusKm
        ORDER BY c.reported_at ASC
        """, nativeQuery = true)
    List<Complaint> findNearbyActiveByCategory(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("category") String category,
        @Param("radiusKm") double radiusKm
    );

    List<Complaint> findByCategory(ComplaintCategory category);

    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByClusterId(String clusterId);

    List<Complaint> findByCategoryAndStatusIn(ComplaintCategory category, Collection<ComplaintStatus> statuses);

    /**
     * Retrieves the highest priority active complaints for hotspot and dashboard triage.
     */
    List<Complaint> findTop20ByStatusNotOrderByPriorityScoreDesc(ComplaintStatus status);

    /**
     * Retrieves all complaints ordered by priority score descending.
     */
    List<Complaint> findAllByOrderByPriorityScoreDesc();
}
