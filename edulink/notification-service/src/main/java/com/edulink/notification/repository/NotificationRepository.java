package com.edulink.notification.repository;

import com.edulink.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByCategory(String category);
    List<Notification> findByUserIdAndIsRead(Long userId, boolean isRead);
}
