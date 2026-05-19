package com.edulink.reporting.controller;

import com.edulink.reporting.dto.ReportDto;
import com.edulink.reporting.entity.Report;
import com.edulink.reporting.service.ReportingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<ReportDto.Response>> getAllReports() { return ResponseEntity.ok(reportingService.getAllReports()); }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<ReportDto.Response> getReport(@PathVariable Long id) { return ResponseEntity.ok(reportingService.getReport(id)); }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD')")
    public ResponseEntity<ReportDto.Response> createReport(@RequestBody ReportDto.Request request) { return ResponseEntity.ok(reportingService.saveReport(request)); }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD')")
    public ResponseEntity<ReportDto.Response> updateReport(@PathVariable Long id, @RequestBody ReportDto.Request request) {
        return ResponseEntity.ok(reportingService.updateReport(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        reportingService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/scope/{scope}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<ReportDto.Response>> getByScope(@PathVariable Report.ReportScope scope) {
        return ResponseEntity.ok(reportingService.getByScope(scope));
    }
}
