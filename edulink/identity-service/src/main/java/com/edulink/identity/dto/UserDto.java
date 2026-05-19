package com.edulink.identity.dto;

import com.edulink.identity.entity.User;
import lombok.Builder;
import lombok.Data;

public class UserDto {

    @Data
    public static class Request {
        private String name;
        private String email;
        private String phone;
        private String password;
        private String role;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long userId;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String status;
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

        public static Response from(User user) {
            return Response.builder()
                    .userId(user.getUserId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .dob(user.getDob())
                    .gender(user.getGender())
                    .address(user.getAddress())
                    .gradeLevel(user.getGradeLevel())
                    .idProofFileName(user.getIdProofFileName())
                    .idProofFileType(user.getIdProofFileType())
                    .idProofData(user.getIdProofData())
                    .admissionLetterFileName(user.getAdmissionLetterFileName())
                    .admissionLetterFileType(user.getAdmissionLetterFileType())
                    .admissionLetterData(user.getAdmissionLetterData())
                    .build();
        }

        public static Response fromWithoutFiles(User user) {
            return Response.builder()
                    .userId(user.getUserId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .dob(user.getDob())
                    .gender(user.getGender())
                    .address(user.getAddress())
                    .gradeLevel(user.getGradeLevel())
                    .idProofFileName(user.getIdProofFileName())
                    .idProofFileType(user.getIdProofFileType())
                    .admissionLetterFileName(user.getAdmissionLetterFileName())
                    .admissionLetterFileType(user.getAdmissionLetterFileType())
                    .build();
        }
    }
}
