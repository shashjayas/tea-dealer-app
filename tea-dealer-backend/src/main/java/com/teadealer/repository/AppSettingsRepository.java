package com.teadealer.repository;

import com.teadealer.model.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AppSettingsRepository extends JpaRepository<AppSettings, Long> {
    Optional<AppSettings> findBySettingKey(String settingKey);
}
