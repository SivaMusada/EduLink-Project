package com.edulink.reporting.service;

import com.edulink.reporting.dto.ReportDto;
import com.edulink.reporting.entity.Report;
import com.edulink.reporting.exception.ResourceNotFoundException;
import com.edulink.reporting.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private final ReportRepository reportRepository;

    public List<ReportDto.Response> getAllReports() {
        return reportRepository.findAll().stream().map(ReportDto.Response::from).toList();
    }

    public ReportDto.Response getReport(Long id) {
        return ReportDto.Response.from(reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id)));
    }

    public ReportDto.Response saveReport(ReportDto.Request request) {
        Report report = Report.builder()
                .scope(Report.ReportScope.valueOf(request.getScope()))
                .metrics(request.getMetrics())
                .generatedDate(request.getGeneratedDate())
                .build();
        return ReportDto.Response.from(reportRepository.save(report));
    }

    public ReportDto.Response updateReport(Long id, ReportDto.Request request) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        report.setScope(Report.ReportScope.valueOf(request.getScope()));
        report.setMetrics(request.getMetrics());
        report.setGeneratedDate(request.getGeneratedDate());
        return ReportDto.Response.from(reportRepository.save(report));
    }

    public void deleteReport(Long id) {
        if (!reportRepository.existsById(id))
            throw new ResourceNotFoundException("Report not found with id: " + id);
        reportRepository.deleteById(id);
    }

    public List<ReportDto.Response> getByScope(Report.ReportScope scope) {
        return reportRepository.findByScope(scope).stream().map(ReportDto.Response::from).toList();
    }
}
