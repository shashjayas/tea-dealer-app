package com.teadealer.service;

import com.teadealer.model.AppSettings;
import com.teadealer.repository.AppSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppSettingsService {

    @Autowired
    private AppSettingsRepository appSettingsRepository;

    public List<AppSettings> getAllSettings() {
        return appSettingsRepository.findAll();
    }

    public Optional<AppSettings> getSettingByKey(String key) {
        return appSettingsRepository.findBySettingKey(key);
    }

    public String getSettingValue(String key) {
        return appSettingsRepository.findBySettingKey(key)
                .map(AppSettings::getSettingValue)
                .orElse(null);
    }

    public AppSettings saveSetting(String key, String value) {
        AppSettings setting = appSettingsRepository.findBySettingKey(key)
                .orElse(new AppSettings());
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        return appSettingsRepository.save(setting);
    }

    public void deleteSetting(String key) {
        appSettingsRepository.findBySettingKey(key)
                .ifPresent(appSettingsRepository::delete);
    }
}
