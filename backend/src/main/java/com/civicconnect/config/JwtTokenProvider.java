package com.civicconnect.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Service component responsible for generating, signing, and parsing JSON Web Tokens.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    // Configurable JWT secret; defaults to empty so dynamic key is generated if not set via environment
    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    // 24 hours expiration time in milliseconds
    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private Key signingKey;

    @PostConstruct
    public void init() {
        if (jwtSecret != null && jwtSecret.trim().length() >= 32) {
            this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            log.info("Loaded external JWT signing key from environment");
        } else {
            // Securely generate in-memory HMAC-SHA256 key for development/testing
            this.signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            log.info("Initialized dynamic cryptographic HMAC-SHA256 JWT key for local environment");
        }
    }

    private Key getSigningKey() {
        return this.signingKey;
    }

    /**
     * Generates a signed JWT token containing email, user role, and expiration.
     */
    public String generateToken(String email, String role, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("userId", userId);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extracts email (subject) from token.
     */
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * Validates cryptographic signature and expiration of JWT token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT cryptographic signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT format: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Empty or null JWT claims string: {}", e.getMessage());
        }
        return false;
    }
}
