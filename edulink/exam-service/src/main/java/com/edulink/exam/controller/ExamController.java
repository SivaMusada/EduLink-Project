package com.edulink.exam.controller;

import com.edulink.exam.dto.ExamDto;
import com.edulink.exam.dto.GradeDto;
import com.edulink.exam.dto.SubmissionDto;
import com.edulink.exam.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    // ── Exams ────────────────────────────────────────────────────────────────

    @GetMapping("/api/exams")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<ExamDto.Response>> getAllExams() { return ResponseEntity.ok(examService.getAllExams()); }

    @GetMapping("/api/exams/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<ExamDto.Response> getExam(@PathVariable Long id) { return ResponseEntity.ok(examService.getExam(id)); }

    @GetMapping("/api/exams/grade/{gradeLevel}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<ExamDto.Response>> getExamsByGrade(@PathVariable String gradeLevel) {
        return ResponseEntity.ok(examService.getExamsByGrade(gradeLevel));
    }

    @GetMapping("/api/exams/student/{studentId}/unattempted")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<ExamDto.Response>> getUnattemptedExams(
            @PathVariable Long studentId,
            @RequestParam String gradeLevel) {
        return ResponseEntity.ok(examService.getUnattemptedExamsByStudent(studentId, gradeLevel));
    }

    @GetMapping("/api/exams/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<ExamDto.Response>> getExamsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(examService.getExamsByStudent(studentId));
    }

    @PostMapping("/api/exams")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ExamDto.Response> createExam(@RequestBody ExamDto.Request request) {
        return ResponseEntity.ok(examService.saveExam(request));
    }

    @PutMapping("/api/exams/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ExamDto.Response> updateExam(@PathVariable Long id, @RequestBody ExamDto.Request request) {
        return ResponseEntity.ok(examService.updateExam(id, request));
    }

    @DeleteMapping("/api/exams/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteExam(@PathVariable Long id) {
        examService.deleteExam(id); return ResponseEntity.noContent().build();
    }

    // ── Exam Enrollment ──────────────────────────────────────────────────────

    @PostMapping("/api/exams/{examId}/enroll/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, Object>> enrollStudent(@PathVariable Long examId, @PathVariable Long studentId) {
        return ResponseEntity.ok(examService.enrollStudentInExam(examId, studentId));
    }

    @DeleteMapping("/api/exams/{examId}/enroll/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unenrollStudent(@PathVariable Long examId, @PathVariable Long studentId) {
        examService.unenrollStudentFromExam(examId, studentId); return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/exams/{examId}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<Map<String, Object>>> getStudentsForExam(@PathVariable Long examId) {
        return ResponseEntity.ok(examService.getStudentsForExam(examId));
    }

    // ── Quiz Submissions ─────────────────────────────────────────────────────

    @PostMapping("/api/submissions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SubmissionDto.Response> submitQuiz(@RequestBody SubmissionDto.Request request) {
        return ResponseEntity.ok(examService.submitQuiz(request));
    }

    @GetMapping("/api/submissions/exam/{examId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<SubmissionDto.Response>> getSubmissionsByExam(@PathVariable Long examId) {
        return ResponseEntity.ok(examService.getSubmissionsByExam(examId));
    }

    @GetMapping("/api/submissions/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<SubmissionDto.Response>> getSubmissionsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(examService.getSubmissionsByStudent(studentId));
    }

    // ── Grades ───────────────────────────────────────────────────────────────

    @GetMapping("/api/grades")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<GradeDto.Response>> getAllGrades() { return ResponseEntity.ok(examService.getAllGrades()); }

    @GetMapping("/api/grades/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<GradeDto.Response> getGrade(@PathVariable Long id) { return ResponseEntity.ok(examService.getGrade(id)); }

    @PostMapping("/api/grades")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<GradeDto.Response> createGrade(@RequestBody GradeDto.Request request) {
        return ResponseEntity.ok(examService.saveGrade(request));
    }

    @PutMapping("/api/grades/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<GradeDto.Response> updateGrade(@PathVariable Long id, @RequestBody GradeDto.Request request) {
        return ResponseEntity.ok(examService.updateGrade(id, request));
    }

    @GetMapping("/api/grades/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD')")
    public ResponseEntity<List<GradeDto.Response>> getGradesByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(examService.getGradesByStudent(studentId));
    }

    @GetMapping("/api/grades/exam/{examId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'BOARD')")
    public ResponseEntity<List<GradeDto.Response>> getGradesByExam(@PathVariable Long examId) {
        return ResponseEntity.ok(examService.getGradesByExam(examId));
    }

    // ── Dashboard Endpoints ──────────────────────────────────────────────────

    /** Student dashboard: upcoming exams */
    @GetMapping("/api/dashboard/student/{studentId}/upcoming-exams")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<ExamDto.Response>> getUpcomingExams(@PathVariable Long studentId) {
        return ResponseEntity.ok(examService.getUpcomingExamsForStudent(studentId));
    }

    /** Student dashboard: submitted quizzes */
    @GetMapping("/api/dashboard/student/{studentId}/submissions")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<SubmissionDto.Response>> getStudentSubmissions(@PathVariable Long studentId) {
        return ResponseEntity.ok(examService.getSubmissionsByStudent(studentId));
    }

    /** Student dashboard: grades */
    @GetMapping("/api/dashboard/student/{studentId}/grades")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<GradeDto.Response>> getStudentGrades(@PathVariable Long studentId) {
        return ResponseEntity.ok(examService.getGradesByStudent(studentId));
    }

    /** Teacher dashboard: quizzes created */
    @GetMapping("/api/dashboard/teacher/{teacherId}/exams")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<ExamDto.Response>> getTeacherExams(@PathVariable Long teacherId) {
        return ResponseEntity.ok(examService.getExamsByTeacher(teacherId));
    }

    /** Teacher dashboard: student submissions */
    @GetMapping("/api/dashboard/teacher/{teacherId}/submissions")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<SubmissionDto.Response>> getTeacherSubmissions(@PathVariable Long teacherId) {
        return ResponseEntity.ok(examService.getSubmissionsByTeacher(teacherId));
    }

    /** Teacher/Admin dashboard: published grades */
    @GetMapping("/api/dashboard/teacher/{teacherId}/grades")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<GradeDto.Response>> getTeacherGrades(@PathVariable Long teacherId) {
        return ResponseEntity.ok(examService.getGradesByTeacher(teacherId));
    }
}
