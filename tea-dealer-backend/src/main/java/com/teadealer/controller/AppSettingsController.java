package com.teadealer.controller;

import com.teadealer.model.AppSettings;
import com.teadealer.service.AppSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class AppSettingsController {

    @Autowired
    private AppSettingsService appSettingsService;

    @GetMapping
    public ResponseEntity<List<AppSettings>> getAllSettings() {
        return ResponseEntity.ok(appSettingsService.getAllSettings());
    }

    @GetMapping("/{key}")
    public ResponseEntity<?> getSettingByKey(@PathVariable String key) {
        return appSettingsService.getSettingByKey(key)
                .map(setting -> ResponseEntity.ok((Object) setting))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{key}/value")
    public ResponseEntity<?> getSettingValue(@PathVariable String key) {
        String value = appSettingsService.getSettingValue(key);
        if (value != null) {
            Map<String, String> response = new HashMap<>();
            response.put("key", key);
            response.put("value", value);
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<AppSettings> saveSetting(@RequestBody Map<String, String> request) {
        String key = request.get("key");
        String value = request.get("value");

        if (key == null || key.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        AppSettings saved = appSettingsService.saveSetting(key, value);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<?> deleteSetting(@PathVariable String key) {
        appSettingsService.deleteSetting(key);
        return ResponseEntity.ok().build();
    }
}
