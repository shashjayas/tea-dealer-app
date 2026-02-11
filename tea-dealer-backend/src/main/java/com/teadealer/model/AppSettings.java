package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_settings")
@Data
public class AppSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", unique = true, nullable = false)
    private String settingKey;

    @Lob
    @Column(name = "setting_value", columnDefinition = "LONGTEXT")
    private String settingValue;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}
