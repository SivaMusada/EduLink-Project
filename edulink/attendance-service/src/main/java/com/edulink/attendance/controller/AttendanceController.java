package com.edulink.attendance.controller;

import com.edulink.attendance.dto.AttendanceDto;
import com.edulink.attendance.dto.PerformanceMetricDto;
import com.edulink.attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/api/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<AttendanceDto.Response>> getAllAttendance() { return ResponseEntity.ok(attendanceService.getAllAttendance()); }

    @GetMapping("/api/attendance/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE')")
    public ResponseEntity<List<AttendanceDto.Response>> getByStudent(@PathVariable Long studentId) { return ResponseEntity.ok(attendanceService.getByStudentId(studentId)); }

    @GetMapping("/api/attendance/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<AttendanceDto.Response> getAttendance(@PathVariable Long id) { return ResponseEntity.ok(attendanceService.getAttendance(id)); }

    @PostMapping("/api/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<AttendanceDto.Response> createAttendance(@RequestBody AttendanceDto.Request request) { return ResponseEntity.ok(attendanceService.saveAttendance(request)); }

    @PutMapping("/api/attendance/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<AttendanceDto.Response> updateAttendance(@PathVariable Long id, @RequestBody AttendanceDto.Request request) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, request));
    }

    @DeleteMapping("/api/attendance/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<PerformanceMetricDto.Response>> getAllMetrics() { return ResponseEntity.ok(attendanceService.getAllMetrics()); }

    @GetMapping("/api/performance/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<PerformanceMetricDto.Response> getMetric(@PathVariable Long id) { return ResponseEntity.ok(attendanceService.getMetric(id)); }

    @PostMapping("/api/performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<PerformanceMetricDto.Response> createMetric(@RequestBody PerformanceMetricDto.Request request) { return ResponseEntity.ok(attendanceService.saveMetric(request)); }

    @PutMapping("/api/performance/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<PerformanceMetricDto.Response> updateMetric(@PathVariable Long id, @RequestBody PerformanceMetricDto.Request request) {
        return ResponseEntity.ok(attendanceService.updateMetric(id, request));
    }
}
