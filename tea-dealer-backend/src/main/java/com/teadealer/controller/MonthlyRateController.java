package com.teadealer.controller;

import com.teadealer.model.MonthlyRate;
import com.teadealer.service.MonthlyRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rates")
public class MonthlyRateController {

    @Autowired
    private MonthlyRateService monthlyRateService;

    @GetMapping("/year/{year}")
    public ResponseEntity<List<MonthlyRate>> getRatesByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(monthlyRateService.getRatesByYear(year));
    }

    @GetMapping("/{year}/{month}")
    public ResponseEntity<?> getRateByYearAndMonth(
            @PathVariable Integer year,
            @PathVariable Integer month) {
        return monthlyRateService.getRateByYearAndMonth(year, month)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> saveRate(@RequestBody Map<String, Object> rateData) {
        try {
            Integer year = Integer.valueOf(rateData.get("year").toString());
            Integer month = Integer.valueOf(rateData.get("month").toString());

            // Validate month range
            if (month < 1 || month > 12) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Month must be between 1 and 12"));
            }

            // Check if rate exists for update or create new
            MonthlyRate rate = monthlyRateService.getRateByYearAndMonth(year, month)
                    .orElse(new MonthlyRate());

            rate.setYear(year);
            rate.setMonth(month);

            if (rateData.get("teaPacketPrice") != null) {
                rate.setTeaPacketPrice(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("teaPacketPrice").toString()))
                );
            }

            if (rateData.get("transportPercentage") != null) {
                rate.setTransportPercentage(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("transportPercentage").toString()))
                );
            }

            if (rateData.get("stampFee") != null) {
                rate.setStampFee(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("stampFee").toString()))
                );
            }

            if (rateData.get("grade1Rate") != null) {
                rate.setGrade1Rate(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("grade1Rate").toString()))
                );
            }

            if (rateData.get("grade2Rate") != null) {
                rate.setGrade2Rate(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("grade2Rate").toString()))
                );
            }

            MonthlyRate saved = monthlyRateService.saveRate(rate);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRate(
            @PathVariable Long id,
            @RequestBody Map<String, Object> rateData) {
        try {
            MonthlyRate rate = monthlyRateService.getRateById(id)
                    .orElseThrow(() -> new RuntimeException("Rate not found"));

            if (rateData.get("teaPacketPrice") != null) {
                rate.setTeaPacketPrice(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("teaPacketPrice").toString()))
                );
            }

            if (rateData.get("transportPercentage") != null) {
                rate.setTransportPercentage(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("transportPercentage").toString()))
                );
            }

            if (rateData.get("stampFee") != null) {
                rate.setStampFee(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("stampFee").toString()))
                );
            }

            if (rateData.get("grade1Rate") != null) {
                rate.setGrade1Rate(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("grade1Rate").toString()))
                );
            }

            if (rateData.get("grade2Rate") != null) {
                rate.setGrade2Rate(
                    java.math.BigDecimal.valueOf(Double.valueOf(rateData.get("grade2Rate").toString()))
                );
            }

            MonthlyRate updated = monthlyRateService.saveRate(rate);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRate(@PathVariable Long id) {
        monthlyRateService.deleteRate(id);
        return ResponseEntity.noContent().build();
    }
}
