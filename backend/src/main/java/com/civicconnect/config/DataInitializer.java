package com.civicconnect.config;

import com.civicconnect.entity.*;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.DepartmentRepository;
import com.civicconnect.repository.UserRepository;
import com.civicconnect.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Initializes baseline seed data (Municipal Departments, Seed Users, and Initial Complaints)
 * on application startup if the tables are empty.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintService complaintService;

    @Override
    public void run(String... args) {
        log.info("Checking database initialization status...");
        initDepartments();
        initUsers();
        initComplaints();
        log.info("Database initialization sequence completed.");
    }

    private void initDepartments() {
        if (departmentRepository.count() > 0) {
            log.info("Departments already seeded (count={}). Skipping.", departmentRepository.count());
            return;
        }

        log.info("Seeding municipal departments...");

        Department roads = Department.builder()
                .name("Roads & Bridges Infrastructure")
                .contactEmail("roads@civicconnect.gov")
                .categoryHandled(ComplaintCategory.POTHOLE)
                .slaHours(48)
                .build();

        Department sanitation = Department.builder()
                .name("Department of Waste & Sanitation")
                .contactEmail("sanitation@civicconnect.gov")
                .categoryHandled(ComplaintCategory.GARBAGE)
                .slaHours(24)
                .build();

        Department water = Department.builder()
                .name("Municipal Water Supply & Drainage Board")
                .contactEmail("water@civicconnect.gov")
                .categoryHandled(ComplaintCategory.WATER_LEAK)
                .slaHours(12)
                .build();

        Department lighting = Department.builder()
                .name("Public Lighting & Electrical Bureau")
                .contactEmail("lighting@civicconnect.gov")
                .categoryHandled(ComplaintCategory.STREETLIGHT)
                .slaHours(36)
                .build();

        departmentRepository.saveAll(List.of(roads, sanitation, water, lighting));
        log.info("Seeded 4 municipal departments with SLA timeframes.");
    }

    private void initUsers() {
        if (userRepository.count() > 0) {
            log.info("Users already seeded (count={}). Skipping.", userRepository.count());
            return;
        }

        log.info("Seeding default administrative, officer, and citizen credentials...");

        User admin = User.builder()
                .name("Municipal Admin")
                .email("admin@civicconnect.gov")
                .password(passwordEncoder.encode(System.getenv().getOrDefault("SEED_ADMIN_PASSWORD", "civic_dev_pwd")))
                .role(Role.ADMIN)
                .build();

        User officer = User.builder()
                .name("Chief Field Officer")
                .email("officer@civicconnect.gov")
                .password(passwordEncoder.encode(System.getenv().getOrDefault("SEED_OFFICER_PASSWORD", "civic_dev_pwd")))
                .role(Role.OFFICER)
                .build();

        User citizen = User.builder()
                .name("Priya Sharma")
                .email("citizen@civicconnect.gov")
                .password(passwordEncoder.encode(System.getenv().getOrDefault("SEED_CITIZEN_PASSWORD", "civic_dev_pwd")))
                .role(Role.CITIZEN)
                .build();

        userRepository.saveAll(List.of(admin, officer, citizen));
        log.info("Seeded 3 primary role users (Admin, Officer, Citizen).");
    }

    private void initComplaints() {
        if (complaintRepository.count() > 0) {
            log.info("Complaints already exist (count={}). Skipping seed complaints.", complaintRepository.count());
            return;
        }

        log.info("Seeding initial geographic complaints for triage and hotspot demonstration...");

        Department waterDept = departmentRepository.findByCategoryHandled(ComplaintCategory.WATER_LEAK).orElse(null);
        Department roadDept = departmentRepository.findByCategoryHandled(ComplaintCategory.POTHOLE).orElse(null);
        Department sanitationDept = departmentRepository.findByCategoryHandled(ComplaintCategory.GARBAGE).orElse(null);
        Department lightDept = departmentRepository.findByCategoryHandled(ComplaintCategory.STREETLIGHT).orElse(null);

        LocalDateTime now = LocalDateTime.now();

        // 1. Critical Water Leak near Hospital
        double waterScore = complaintService.calculatePriorityScore(8.5, 3, ComplaintCategory.WATER_LEAK.getBaseWeight(), 2.0, 1.0);
        Complaint waterLeak = Complaint.builder()
                .title("Major Water Main Burst outside City Hospital")
                .description("High-pressure water main rupture causing severe roadway flooding and low pressure to emergency wing.")
                .category(ComplaintCategory.WATER_LEAK)
                .severityScore(8.5)
                .priorityScore(waterScore)
                .status(ComplaintStatus.IN_PROGRESS)
                .latitude(37.7749)
                .longitude(-122.4194)
                .address("750 Main Hospital Blvd, Civic District")
                .imageUrl("https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800")
                .reportedAt(now.minusHours(4))
                .slaDeadline(now.plusHours(8))
                .clusterId("CLUSTER-WATER-001")
                .duplicateCount(3)
                .zoneWeight(2.0)
                .reportedBy("citizen@civicconnect.gov")
                .assignedDepartment(waterDept)
                .build();

        // 2. High traffic Pothole Cluster
        double potholeScore = complaintService.calculatePriorityScore(7.0, 5, ComplaintCategory.POTHOLE.getBaseWeight(), 1.5, 2.0);
        Complaint pothole1 = Complaint.builder()
                .title("Deep Dangerous Pothole on Commuter Expressway")
                .description("Approx 10-inch deep pothole causing vehicle tire damage and sudden lane swerving.")
                .category(ComplaintCategory.POTHOLE)
                .severityScore(7.0)
                .priorityScore(potholeScore)
                .status(ComplaintStatus.REPORTED)
                .latitude(37.7833)
                .longitude(-122.4167)
                .address("Market & 4th Street Junction")
                .imageUrl("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800")
                .reportedAt(now.minusHours(18))
                .slaDeadline(now.plusHours(30))
                .clusterId("CLUSTER-POTHOLE-001")
                .duplicateCount(5)
                .zoneWeight(1.5)
                .reportedBy("citizen@civicconnect.gov")
                .assignedDepartment(roadDept)
                .build();

        // 3. Overflowing Dumpster in Market Area
        double garbageScore = complaintService.calculatePriorityScore(6.0, 2, ComplaintCategory.GARBAGE.getBaseWeight(), 1.0, 0.5);
        Complaint garbage = Complaint.builder()
                .title("Overflowing Garbage Dumpster Blocking Sidewalk")
                .description("Commercial waste has spilled across pedestrian walkways attracting stray animals.")
                .category(ComplaintCategory.GARBAGE)
                .severityScore(6.0)
                .priorityScore(garbageScore)
                .status(ComplaintStatus.ASSIGNED)
                .latitude(37.7651)
                .longitude(-122.4201)
                .address("Mission Commercial Strip #42")
                .imageUrl("https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800")
                .reportedAt(now.minusHours(6))
                .slaDeadline(now.plusHours(18))
                .clusterId("CLUSTER-GARBAGE-001")
                .duplicateCount(2)
                .zoneWeight(1.0)
                .reportedBy("citizen@civicconnect.gov")
                .assignedDepartment(sanitationDept)
                .build();

        // 4. Resolved Streetlight Outage with Proof Photo
        double lightScore = complaintService.calculatePriorityScore(4.0, 1, ComplaintCategory.STREETLIGHT.getBaseWeight(), 1.0, 0.0);
        Complaint streetlight = Complaint.builder()
                .title("Flickering Streetlight in School Zone")
                .description("Streetlight luminaire shorted during rainfall causing complete dark spot.")
                .category(ComplaintCategory.STREETLIGHT)
                .severityScore(4.0)
                .priorityScore(lightScore)
                .status(ComplaintStatus.RESOLVED)
                .latitude(37.7580)
                .longitude(-122.4300)
                .address("Oak Street Elementary Crossing")
                .imageUrl("https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800")
                .resolvedImageUrl("https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800")
                .reportedAt(now.minusHours(30))
                .slaDeadline(now.plusHours(6))
                .clusterId("CLUSTER-LIGHT-001")
                .duplicateCount(1)
                .zoneWeight(1.0)
                .resolutionNotes("Replaced LED luminaire driver unit and tested illumination lux level.")
                .reportedBy("citizen@civicconnect.gov")
                .assignedDepartment(lightDept)
                .build();

        complaintRepository.saveAll(List.of(waterLeak, pothole1, garbage, streetlight));
        log.info("Seeded 4 realistic complaints across multiple statuses and clusters.");
    }
}
