package com.edulink.student.controller;

import com.edulink.student.dto.EnrollmentDto;
import com.edulink.student.dto.StudentDocumentDto;
import com.edulink.student.dto.StudentDto;
import com.edulink.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<StudentDto.Response>> getAll() { return ResponseEntity.ok(studentService.getAllStudents()); }
    @GetMapping("/my-enrollments")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<EnrollmentDto.Response>> getMyEnrollments(
            org.springframework.security.core.Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        return ResponseEntity.ok(studentService.getMyEnrollments(userId, null, null));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDto.Response> getMe(
            org.springframework.security.core.Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        return ResponseEntity.ok(studentService.getStudentByUserId(userId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<StudentDto.Response> getById(@PathVariable Long id) { return ResponseEntity.ok(studentService.getStudent(id)); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentDto.Response> create(@RequestBody StudentDto.Request request) { return ResponseEntity.ok(studentService.saveStudent(request)); }

    @PostMapping("/internal")
    public ResponseEntity<StudentDto.Response> createInternal(@RequestBody StudentDto.Request request) {
        return ResponseEntity.ok(studentService.saveStudent(request));
    }

    @GetMapping("/internal/by-contact")
    public ResponseEntity<List<StudentDto.Response>> findByContact(@RequestParam String name, @RequestParam String contactInfo) {
        return ResponseEntity.ok(studentService.findByNameAndContact(name, contactInfo));
    }

    @DeleteMapping("/internal/{id}")
    public ResponseEntity<Void> deleteInternal(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentDto.Response> update(@PathVariable Long id, @RequestBody StudentDto.Request request) {
        return ResponseEntity.ok(studentService.updateStudent(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'COMPLIANCE')")
    public ResponseEntity<List<StudentDocumentDto.Response>> getDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getDocuments(id));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentDocumentDto.Response> addDocument(@PathVariable Long id, @RequestBody StudentDocumentDto.Request request) {
        return ResponseEntity.ok(studentService.saveDocument(id, request));
    }

    @PostMapping("/enroll")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EnrollmentDto.Response> enroll(@RequestBody EnrollmentDto.Request request) {
        return ResponseEntity.ok(studentService.enroll(request));
    }

    @PostMapping("/enroll/grade")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EnrollmentDto.Response>> enrollByGrade(
            @RequestParam Long courseId,
            @RequestParam Long classId,
            @RequestParam Long teacherId,
            @RequestParam String gradeLevel) {
        return ResponseEntity.ok(studentService.autoEnrollByGrade(courseId, classId, teacherId, gradeLevel));
    }

    @DeleteMapping("/enroll/{enrollmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unenroll(@PathVariable Long enrollmentId) {
        studentService.unenroll(enrollmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/enrollments")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD', 'COMPLIANCE')")
    public ResponseEntity<List<EnrollmentDto.Response>> getAllEnrollments() {
        return ResponseEntity.ok(studentService.getAllEnrollments());
    }

    @GetMapping("/{id}/enrollments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE')")
    public ResponseEntity<List<EnrollmentDto.Response>> getEnrollmentsByStudent(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getEnrollmentsByStudent(id));
    }

    @GetMapping("/enrollments/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'BOARD')")
    public ResponseEntity<List<EnrollmentDto.Response>> getEnrollmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(studentService.getEnrollmentsByCourse(courseId));
    }

    @GetMapping("/enrollments/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<EnrollmentDto.Response>> getEnrollmentsByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(studentService.getEnrollmentsByTeacher(teacherId));
    }


}
