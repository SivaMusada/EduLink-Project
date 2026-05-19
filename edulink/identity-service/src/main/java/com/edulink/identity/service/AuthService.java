package com.edulink.identity.service;

import com.edulink.identity.dto.AuditLogDto;
import com.edulink.identity.dto.AuthDto;
import com.edulink.identity.dto.UserDto;
import com.edulink.identity.entity.AuditLog;
import com.edulink.identity.entity.User;
import com.edulink.identity.exception.ResourceNotFoundException;
import com.edulink.identity.repository.AuditLogRepository;
import com.edulink.identity.repository.UserRepository;
import com.edulink.identity.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new IllegalArgumentException("Invalid credentials");

        if (user.getStatus() == User.Status.PENDING)
            throw new IllegalStateException("Your registration is still under review. Please wait for admin approval.");

        if (user.getStatus() == User.Status.REJECTED)
            throw new IllegalStateException("Your registration has been rejected. Please contact the administrator.");

        if (user.getStatus() == User.Status.INACTIVE)
            throw new IllegalStateException("Your account is inactive. Please contact the administrator.");

        auditLogRepository.save(AuditLog.builder()
                .userId(user.getUserId()).action("LOGIN")
                .resource("AUTH").timestamp(LocalDateTime.now()).build());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());
        return new AuthDto.AuthResponse(token, user.getRole().name(), user.getEmail(), user.getName());
    }

    public UserDto.Response registerStudent(AuthDto.StudentRegistrationRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent())
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.STUDENT)
                .status(User.Status.PENDING)
                .dob(request.getDob())
                .gender(request.getGender())
                .address(request.getAddress())
                .idProofFileName(request.getIdProofFileName())
                .idProofFileType(request.getIdProofFileType())
                .idProofData(request.getIdProofData())
                .admissionLetterFileName(request.getAdmissionLetterFileName())
                .admissionLetterFileType(request.getAdmissionLetterFileType())
                .admissionLetterData(request.getAdmissionLetterData())
                .gradeLevel(request.getGradeLevel())
                .build();

        return UserDto.Response.fromWithoutFiles(userRepository.save(user));
    }

    public UserDto.Response register(AuthDto.RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent())
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole()))
                .status(User.Status.ACTIVE)
                .build();

        return UserDto.Response.fromWithoutFiles(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        auditLogRepository.deleteByUserId(id);
        userRepository.deleteById(id);

        if (user.getRole() == User.Role.STUDENT) {
            deleteStudentRecord(user.getName(), user.getPhone());
        }
    }

    private void deleteStudentRecord(String name, String phone) {
        try {
            String url = "http://localhost:8082/api/students/internal/by-contact?name={name}&contactInfo={contactInfo}";
            Object[] students = restTemplate.getForObject(url, Object[].class, name, phone);
            if (students != null) {
                for (Object s : students) {
                    if (s instanceof Map) {
                        Object studentId = ((Map<?, ?>) s).get("studentId");
                        if (studentId != null) {
                            restTemplate.delete("http://localhost:8082/api/students/internal/" + studentId);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not delete student record: " + e.getMessage());
        }
    }

    public UserDto.Response approveStudent(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getRole() != User.Role.STUDENT)
            throw new IllegalArgumentException("Only student registrations can be approved or rejected");

        user.setStatus(User.Status.valueOf(status));
        UserDto.Response response = UserDto.Response.fromWithoutFiles(userRepository.save(user));

        if ("ACTIVE".equals(status)) {
            createStudentRecord(user);
        }

        return response;
    }

    private void createStudentRecord(User user) {
        try {
            Map<String, Object> studentRequest = new HashMap<>();
            studentRequest.put("userId", user.getUserId());
            studentRequest.put("name", user.getName());
            studentRequest.put("dob", user.getDob());
            studentRequest.put("gender", user.getGender());
            studentRequest.put("address", user.getAddress());
            studentRequest.put("contactInfo", user.getPhone());
            studentRequest.put("enrollmentDate", java.time.LocalDate.now().toString());
            studentRequest.put("status", "ACTIVE");
            studentRequest.put("gradeLevel", user.getGradeLevel());

            restTemplate.postForObject(
                "http://localhost:8082/api/students/internal",
                studentRequest,
                Object.class
            );
        } catch (Exception e) {
            System.err.println("Warning: Could not create student record for user " + user.getEmail() + ": " + e.getMessage());
        }
    }

    public List<UserDto.Response> getPendingStudents() {
        return userRepository.findByRoleAndStatus(User.Role.STUDENT, User.Status.PENDING)
                .stream().map(UserDto.Response::fromWithoutFiles).toList();
    }

    public List<UserDto.Response> getAllStudents() {
        return userRepository.findByRole(User.Role.STUDENT)
                .stream().map(UserDto.Response::fromWithoutFiles).toList();
    }

    public UserDto.Response getStudentWithFiles(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDto.Response.from(user);
    }

    public UserDto.Response getUserByEmail(String email) {
        return UserDto.Response.fromWithoutFiles(userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email)));
    }

    public List<UserDto.Response> getAllUsers() {
        return userRepository.findAll().stream().map(UserDto.Response::fromWithoutFiles).toList();
    }

    public UserDto.Response getUserById(Long id) {
        return UserDto.Response.fromWithoutFiles(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id)));
    }

    public UserDto.Response updateUser(Long id, UserDto.Request request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        if (request.getStatus() != null) user.setStatus(User.Status.valueOf(request.getStatus()));
        if (request.getPassword() != null && !request.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        return UserDto.Response.fromWithoutFiles(userRepository.save(user));
    }

    public void changePassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public List<AuditLogDto.Response> getAuditLogs() {
        return auditLogRepository.findAll().stream().map(AuditLogDto.Response::from).toList();
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));
        String token = java.util.UUID.randomUUID().toString();
        user.setResetToken(token);
        userRepository.save(user);
        return token;
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired reset token"));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        userRepository.save(user);
    }

    public void verifyEmail(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address"));
    }

    public void resetPasswordByEmail(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address"));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        userRepository.save(user);
    }
}
