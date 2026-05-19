package com.edulink.attendance.repository;

import com.edulink.attendance.entity.PerformanceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PerformanceMetricRepository extends JpaRepository<PerformanceMetric, Long> {
    List<PerformanceMetric> findByStudentId(Long studentId);
    List<PerformanceMetric> findByCourseId(Long courseId);
}
