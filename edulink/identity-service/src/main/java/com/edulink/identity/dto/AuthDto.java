package com.edulink.identity.dto;

import lombok.Data;

public class AuthDto {

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String phone;
        private String password;
        private String role;
    }

    @Data
    public static class StudentRegistrationRequest {
        private String name;
        private String email;
        private String phone;
        private String password;
        private String dob;
        private String gender;
        private String address;
        private String idProofFileName;
        private String idProofFileType;
        private String idProofData;
        private String admissionLetterFileName;
        private String admissionLetterFileType;
        private String admissionLetterData;
        private String gradeLevel;
    }

    @Data
    public static class ApprovalRequest {
        private String status;
    }

    @Data
    public static class ForgotPasswordRequest {
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        private String token;
        private String newPassword;
    }

    @Data
    public static class ResetPasswordByEmailRequest {
        private String email;
        private String newPassword;
    }

    @Data
    public static class ChangePasswordRequest {
        private String newPassword;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String role;
        private String email;
        private String name;

        public AuthResponse(String token, String role, String email, String name) {
            this.token = token;
            this.role = role;
            this.email = email;
            this.name = name;
        }
    }
}
