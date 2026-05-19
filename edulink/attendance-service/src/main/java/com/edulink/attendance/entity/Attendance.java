package com.edulink.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "attendance")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Attendance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attendanceId;
    private Long studentId;
    private Long classId;
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private Status status;
    public enum Status { PRESENT, ABSENT, LATE }
}
