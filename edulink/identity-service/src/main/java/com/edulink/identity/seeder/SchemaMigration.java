package com.edulink.identity.seeder;

import com.edulink.identity.entity.User;
import com.edulink.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
public class SchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN status VARCHAR(20) NOT NULL");
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL");
        } catch (Exception ignored) {}

        if (userRepository.findByEmail("admin@edulink.com").isEmpty()) {
            userRepository.save(User.builder()
                    .name("Admin")
                    .email("admin@edulink.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .status(User.Status.ACTIVE)
                    .gender("Male")
                    .address("Coimbatore, Tamil Nadu")
                    .phone("9876543210")
                    .dob("1990-01-01")
                    .build());
        }
    }
}
