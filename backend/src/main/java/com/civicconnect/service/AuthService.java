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
     * Registers a new citizen or municipal officer.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Processing registration request for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Registration failed: Email {} is already in use", request.getEmail());
            throw new DuplicateResourceException("An account with email " + request.getEmail() + " already exists");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.CITIZEN;

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
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
        log.info("Processing login request for email: {}", request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().trim().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            log.error("Login authentication failed for email {}: Invalid credentials", request.getEmail());
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("User profile not found for " + request.getEmail()));

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
