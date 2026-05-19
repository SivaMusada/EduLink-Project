package com.edulink.learning.controller;

import com.edulink.learning.dto.AssignmentDto;
import com.edulink.learning.dto.LearningMaterialDto;
import com.edulink.learning.service.LearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @Value("${file.upload-dir:uploads/materials}")
    private String uploadDir;

    @PostMapping("/api/materials/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) ext = original.substring(original.lastIndexOf('.'));
        String filename = UUID.randomUUID() + ext;
        Path target = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return ResponseEntity.ok(Map.of(
            "fileUri", filename,
            "mimeType", file.getContentType() != null ? file.getContentType() : "application/octet-stream"
        ));
    }

    @GetMapping("/api/materials/file/{filename}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD')")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) throws IOException {
        Path file = Paths.get(uploadDir).resolve(filename).normalize();
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        String contentType = Files.probeContentType(file);
        if (contentType == null) contentType = "application/octet-stream";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType(contentType))
            .body(resource);
    }

    @GetMapping("/api/materials")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD')")
    public ResponseEntity<List<LearningMaterialDto.Response>> getAllMaterials() { return ResponseEntity.ok(learningService.getAllMaterials()); }

    @GetMapping("/api/materials/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD')")
    public ResponseEntity<LearningMaterialDto.Response> getMaterial(@PathVariable Long id) { return ResponseEntity.ok(learningService.getMaterial(id)); }

    @PostMapping("/api/materials")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<LearningMaterialDto.Response> createMaterial(@RequestBody LearningMaterialDto.Request request) { return ResponseEntity.ok(learningService.saveMaterial(request)); }

    @PutMapping("/api/materials/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<LearningMaterialDto.Response> updateMaterial(@PathVariable Long id, @RequestBody LearningMaterialDto.Request request) {
        return ResponseEntity.ok(learningService.updateMaterial(id, request));
    }

    @DeleteMapping("/api/materials/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        learningService.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<AssignmentDto.Response>> getAllAssignments() { return ResponseEntity.ok(learningService.getAllAssignments()); }

    @GetMapping("/api/assignments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<AssignmentDto.Response> getAssignment(@PathVariable Long id) { return ResponseEntity.ok(learningService.getAssignment(id)); }

    @PostMapping("/api/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<AssignmentDto.Response> createAssignment(@RequestBody AssignmentDto.Request request) { return ResponseEntity.ok(learningService.saveAssignment(request)); }

    @PutMapping("/api/assignments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<AssignmentDto.Response> updateAssignment(@PathVariable Long id, @RequestBody AssignmentDto.Request request) {
        return ResponseEntity.ok(learningService.updateAssignment(id, request));
    }

    @DeleteMapping("/api/assignments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        learningService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
