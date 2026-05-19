package com.edulink.attendance.dto;

import com.edulink.attendance.entity.Attendance;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

public class AttendanceDto {

    @Data
    public static class Request {
        private Long studentId;
        private Long classId;
        private LocalDate date;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long attendanceId;
        private Long studentId;
        private Long classId;
        private LocalDate date;
        private String status;

        public static Response from(Attendance a) {
            return Response.builder()
                    .attendanceId(a.getAttendanceId())
                    .studentId(a.getStudentId())
                    .classId(a.getClassId())
                    .date(a.getDate())
                    .status(a.getStatus().name())
                    .build();
        }
    }
}
