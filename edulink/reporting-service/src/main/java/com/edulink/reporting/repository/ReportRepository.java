package com.edulink.reporting.repository;

import com.edulink.reporting.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByScope(Report.ReportScope scope);
}
