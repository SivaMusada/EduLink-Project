package com.edulink.notification.service;

import com.edulink.notification.dto.NotificationDto;
import com.edulink.notification.entity.Notification;
import com.edulink.notification.exception.ResourceNotFoundException;
import com.edulink.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<NotificationDto.Response> getAllNotifications() {
        return notificationRepository.findAll().stream().map(NotificationDto.Response::from).toList();
    }

    public NotificationDto.Response getNotification(Long id) {
        return NotificationDto.Response.from(notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id)));
    }

    public NotificationDto.Response saveNotification(NotificationDto.Request request) {
        Notification n = Notification.builder()
                .userId(request.getUserId())
                .entityId(request.getEntityId())
                .message(request.getMessage())
                .category(request.getCategory() != null ? request.getCategory() : "GENERAL")
                .status(request.getStatus() != null ? request.getStatus() : "SENT")
                .createdDate(LocalDateTime.now())
                .isRead(false)
                .build();
        return NotificationDto.Response.from(notificationRepository.save(n));
    }

    public NotificationDto.Response updateNotification(Long id, NotificationDto.Request request) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        n.setUserId(request.getUserId());
        n.setEntityId(request.getEntityId());
        n.setMessage(request.getMessage());
        n.setCategory(request.getCategory() != null ? request.getCategory() : "GENERAL");
        n.setStatus(request.getStatus() != null ? request.getStatus() : "SENT");
        return NotificationDto.Response.from(notificationRepository.save(n));
    }

    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id))
            throw new ResourceNotFoundException("Notification not found with id: " + id);
        notificationRepository.deleteById(id);
    }

    public List<NotificationDto.Response> getByUser(Long userId) {
        return notificationRepository.findByUserId(userId).stream().map(NotificationDto.Response::from).toList();
    }

    public NotificationDto.Response markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        n.setRead(true);
        return NotificationDto.Response.from(notificationRepository.save(n));
    }

    public List<NotificationDto.Response> getUnreadByUser(Long userId) {
        return notificationRepository.findByUserIdAndIsRead(userId, false)
                .stream().map(NotificationDto.Response::from).toList();
    }
}
