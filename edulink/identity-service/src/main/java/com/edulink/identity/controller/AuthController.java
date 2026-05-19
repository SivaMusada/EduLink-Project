package com.edulink.identity.controller;

import com.edulink.identity.dto.AuditLogDto;
import com.edulink.identity.dto.AuthDto;
import com.edulink.identity.dto.UserDto;
import com.edulink.identity.service.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDto.LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(403).body(java.util.Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto.Response> register(@RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/register/student")
    public ResponseEntity<UserDto.Response> registerStudent(@RequestBody AuthDto.StudentRegistrationRequest request) {
        return ResponseEntity.ok(authService.registerStudent(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto.Response> getMe(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();
        return ResponseEntity.ok(authService.getUserByEmail(claims.getSubject()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto.Response> updateMe(@RequestHeader("Authorization") String authHeader,
                                                     @RequestBody UserDto.Request request) {
        String token = authHeader.replace("Bearer ", "");
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();
        UserDto.Response user = authService.getUserByEmail(claims.getSubject());
        return ResponseEntity.ok(authService.updateUser(user.getUserId(), request));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<UserDto.Response>> getUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<UserDto.Response> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserById(id));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.Response> updateUser(@PathVariable Long id, @RequestBody UserDto.Request request) {
        return ResponseEntity.ok(authService.updateUser(id, request));
    }

    @PutMapping("/users/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody AuthDto.ChangePasswordRequest request) {
        authService.changePassword(id, request.getNewPassword());
        return ResponseEntity.ok(java.util.Map.of("message", "Password updated successfully"));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/students/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto.Response>> getPendingStudents() {
        return ResponseEntity.ok(authService.getPendingStudents());
    }

    @GetMapping("/students/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD')")
    public ResponseEntity<List<UserDto.Response>> getAllStudents() {
        return ResponseEntity.ok(authService.getAllStudents());
    }

    @GetMapping("/students/{id}/details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.Response> getStudentWithFiles(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getStudentWithFiles(id));
    }

    @PutMapping("/students/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.Response> approveStudent(@PathVariable Long id, @RequestBody AuthDto.ApprovalRequest request) {
        return ResponseEntity.ok(authService.approveStudent(id, request.getStatus()));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<AuditLogDto.Response>> getAuditLogs() {
        return ResponseEntity.ok(authService.getAuditLogs());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody AuthDto.ForgotPasswordRequest request) {
        try {
            authService.verifyEmail(request.getEmail());
            return ResponseEntity.ok(java.util.Map.of("message", "Email verified"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody AuthDto.ResetPasswordByEmailRequest request) {
        try {
            authService.resetPasswordByEmail(request.getEmail(), request.getNewPassword());
            return ResponseEntity.ok(java.util.Map.of("message", "Password reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
