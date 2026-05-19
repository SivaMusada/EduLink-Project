package com.edulink.identity.repository;

import com.edulink.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    List<User> findByRoleAndStatus(User.Role role, User.Status status);
    List<User> findByRole(User.Role role);
}
