package com.edulink.attendance.service;

import com.edulink.attendance.dto.AttendanceDto;
import com.edulink.attendance.dto.PerformanceMetricDto;
import com.edulink.attendance.entity.Attendance;
import com.edulink.attendance.entity.PerformanceMetric;
import com.edulink.attendance.exception.ResourceNotFoundException;
import com.edulink.attendance.repository.AttendanceRepository;
import com.edulink.attendance.repository.PerformanceMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final PerformanceMetricRepository performanceMetricRepository;

    public List<AttendanceDto.Response> getAllAttendance() {
        return attendanceRepository.findAll().stream().map(AttendanceDto.Response::from).toList();
    }

    public List<AttendanceDto.Response> getByStudentId(Long studentId) {
        return attendanceRepository.findByStudentId(studentId).stream().map(AttendanceDto.Response::from).toList();
    }

    public AttendanceDto.Response getAttendance(Long id) {
        return AttendanceDto.Response.from(attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id)));
    }

    public AttendanceDto.Response saveAttendance(AttendanceDto.Request request) {
        Attendance a = Attendance.builder()
                .studentId(request.getStudentId())
                .classId(request.getClassId())
                .date(request.getDate())
                .status(Attendance.Status.valueOf(request.getStatus()))
                .build();
        return AttendanceDto.Response.from(attendanceRepository.save(a));
    }

    public AttendanceDto.Response updateAttendance(Long id, AttendanceDto.Request request) {
        Attendance a = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));
        a.setStudentId(request.getStudentId());
        a.setClassId(request.getClassId());
        a.setDate(request.getDate());
        a.setStatus(Attendance.Status.valueOf(request.getStatus()));
        return AttendanceDto.Response.from(attendanceRepository.save(a));
    }

    public void deleteAttendance(Long id) {
        if (!attendanceRepository.existsById(id))
            throw new ResourceNotFoundException("Attendance record not found with id: " + id);
        attendanceRepository.deleteById(id);
    }

    public List<PerformanceMetricDto.Response> getAllMetrics() {
        return performanceMetricRepository.findAll().stream().map(PerformanceMetricDto.Response::from).toList();
    }

    public PerformanceMetricDto.Response getMetric(Long id) {
        return PerformanceMetricDto.Response.from(performanceMetricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Performance metric not found with id: " + id)));
    }

    public PerformanceMetricDto.Response saveMetric(PerformanceMetricDto.Request request) {
        PerformanceMetric m = PerformanceMetric.builder()
                .studentId(request.getStudentId())
                .courseId(request.getCourseId())
                .score(request.getScore())
                .date(request.getDate())
                .status(PerformanceMetric.Status.valueOf(request.getStatus()))
                .build();
        return PerformanceMetricDto.Response.from(performanceMetricRepository.save(m));
    }

    public PerformanceMetricDto.Response updateMetric(Long id, PerformanceMetricDto.Request request) {
        PerformanceMetric m = performanceMetricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Performance metric not found with id: " + id));
        m.setStudentId(request.getStudentId());
        m.setCourseId(request.getCourseId());
        m.setScore(request.getScore());
        m.setDate(request.getDate());
        m.setStatus(PerformanceMetric.Status.valueOf(request.getStatus()));
        return PerformanceMetricDto.Response.from(performanceMetricRepository.save(m));
    }

    public void deleteMetric(Long id) {
        if (!performanceMetricRepository.existsById(id))
            throw new ResourceNotFoundException("Performance metric not found with id: " + id);
        performanceMetricRepository.deleteById(id);
    }
}
