package com.civicconnect.repository;

import com.civicconnect.entity.ComplaintCategory;
import com.civicconnect.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for Department management and category assignments.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByCategoryHandled(ComplaintCategory categoryHandled);

    Optional<Department> findByName(String name);
}
