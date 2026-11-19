package com.civicconnect.service;

import com.civicconnect.config.JwtTokenProvider;
import com.civicconnect.dto.AuthRequest;
import com.civicconnect.dto.AuthResponse;
import com.civicconnect.dto.RegisterRequest;
import com.civicconnect.entity.Role;
import com.civicconnect.entity.User;
import com.civicconnect.exception.BadRequestException;
import com.civicconnect.exception.DuplicateResourceException;
import com.civicconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service orchestrating user onboarding and token issuance.
 * Employs constructor injection for immutability and testability.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new citizen or municipal officer with fallback name handling.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Processing registration request for email: {}", request != null ? request.getEmail() : null);

        if (request == null) {
            throw new BadRequestException("Registration request payload is required");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.error("Registration failed: Email {} is already in use", normalizedEmail);
            throw new DuplicateResourceException("An account with email " + normalizedEmail + " already exists");
        }

        String citizenName = (request.getName() != null && !request.getName().isBlank())
                ? request.getName().trim()
                : "Anonymous Citizen";

        Role role = request.getRole() != null ? request.getRole() : Role.CITIZEN;

        User user = User.builder()
                .name(citizenName)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {} and Role: {}", savedUser.getId(), savedUser.getRole());

        String token = tokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    /**
     * Authenticates existing user credentials and returns JWT session token.
     */
    public AuthResponse login(AuthRequest request) {
        log.info("Processing login request for email: {}", request != null ? request.getEmail() : null);

        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()
                || request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new BadRequestException("Email and password credentials are required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            normalizedEmail,
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            log.error("Login authentication failed for email {}: Invalid credentials", normalizedEmail);
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("User profile not found for " + normalizedEmail));

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        log.info("User {} logged in successfully with Role: {}", user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
