package com.teadealer.controller;

import com.teadealer.model.FertilizerType;
import com.teadealer.model.FertilizerStock;
import com.teadealer.model.FertilizerSupply;
import com.teadealer.service.FertilizerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fertilizer")
public class FertilizerController {

    @Autowired
    private FertilizerService fertilizerService;

    // ============ Fertilizer Type Endpoints ============

    @GetMapping("/types")
    public ResponseEntity<List<FertilizerType>> getAllTypes() {
        return ResponseEntity.ok(fertilizerService.getAllFertilizerTypes());
    }

    @GetMapping("/types/active")
    public ResponseEntity<List<FertilizerType>> getActiveTypes() {
        return ResponseEntity.ok(fertilizerService.getActiveFertilizerTypes());
    }

    @GetMapping("/types/{id}")
    public ResponseEntity<FertilizerType> getTypeById(@PathVariable Long id) {
        return fertilizerService.getFertilizerTypeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/types")
    public ResponseEntity<FertilizerType> createType(@RequestBody FertilizerType type) {
        return ResponseEntity.ok(fertilizerService.createFertilizerType(type));
    }

    @PutMapping("/types/{id}")
    public ResponseEntity<FertilizerType> updateType(@PathVariable Long id, @RequestBody FertilizerType type) {
        try {
            return ResponseEntity.ok(fertilizerService.updateFertilizerType(id, type));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        fertilizerService.deleteFertilizerType(id);
        return ResponseEntity.noContent().build();
    }

    // ============ Stock Endpoints ============

    @GetMapping("/stock/{year}/{month}")
    public ResponseEntity<List<FertilizerStock>> getStockByPeriod(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(fertilizerService.getStockByPeriod(year, month));
    }

    @GetMapping("/stock/available/{typeId}/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getAvailableStock(
            @PathVariable Long typeId, @PathVariable Integer year, @PathVariable Integer month) {
        BigDecimal available = fertilizerService.getAvailableStock(typeId, year, month);
        Map<String, Object> result = new HashMap<>();
        result.put("typeId", typeId);
        result.put("year", year);
        result.put("month", month);
        result.put("availableKg", available);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/stock")
    public ResponseEntity<?> addStock(@RequestBody Map<String, Object> request) {
        try {
            Long typeId = Long.valueOf(request.get("fertilizerTypeId").toString());
            Integer year = Integer.valueOf(request.get("year").toString());
            Integer month = Integer.valueOf(request.get("month").toString());
            BigDecimal bagSizeKg = new BigDecimal(request.get("bagSizeKg").toString());
            Integer bagsCount = Integer.valueOf(request.get("bagsCount").toString());
            String notes = request.get("notes") != null ? request.get("notes").toString() : null;

            FertilizerStock stock = fertilizerService.addStock(typeId, year, month, bagSizeKg, bagsCount, notes);
            return ResponseEntity.ok(stock);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/stock/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        fertilizerService.deleteStock(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stock/available/{typeId}/{bagSizeKg}/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getAvailableBagsByTypeAndSize(
            @PathVariable Long typeId, @PathVariable BigDecimal bagSizeKg,
            @PathVariable Integer year, @PathVariable Integer month) {
        Integer available = fertilizerService.getAvailableBagsByTypeAndSize(typeId, bagSizeKg, year, month);
        Map<String, Object> result = new HashMap<>();
        result.put("typeId", typeId);
        result.put("bagSizeKg", bagSizeKg);
        result.put("year", year);
        result.put("month", month);
        result.put("availableBags", available);
        return ResponseEntity.ok(result);
    }

    // ============ Supply Endpoints ============

    @GetMapping("/supply/{year}/{month}")
    public ResponseEntity<List<FertilizerSupply>> getSuppliesByPeriod(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(fertilizerService.getSuppliesByPeriod(year, month));
    }

    @GetMapping("/supply/customer/{customerId}")
    public ResponseEntity<List<FertilizerSupply>> getSuppliesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(fertilizerService.getSuppliesByCustomer(customerId));
    }

    @GetMapping("/supply/type/{typeId}")
    public ResponseEntity<List<FertilizerSupply>> getSuppliesByType(@PathVariable Long typeId) {
        return ResponseEntity.ok(fertilizerService.getSuppliesByType(typeId));
    }

    @PostMapping("/supply")
    public ResponseEntity<?> recordSupply(@RequestBody Map<String, Object> request) {
        try {
            Long customerId = Long.valueOf(request.get("customerId").toString());
            Long typeId = Long.valueOf(request.get("fertilizerTypeId").toString());
            LocalDate supplyDate = LocalDate.parse(request.get("supplyDate").toString());
            BigDecimal bagSizeKg = new BigDecimal(request.get("bagSizeKg").toString());
            Integer bagsCount = Integer.valueOf(request.get("bagsCount").toString());
            String notes = request.get("notes") != null ? request.get("notes").toString() : null;

            FertilizerSupply supply = fertilizerService.recordSupply(customerId, typeId, supplyDate, bagSizeKg, bagsCount, notes);
            return ResponseEntity.ok(supply);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/supply/{id}")
    public ResponseEntity<Void> deleteSupply(@PathVariable Long id) {
        fertilizerService.deleteSupply(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/supply/customer/{customerId}/type/{typeId}/total")
    public ResponseEntity<Map<String, Object>> getCustomerTypeTotal(
            @PathVariable Long customerId, @PathVariable Long typeId) {
        BigDecimal total = fertilizerService.getTotalSuppliedToCustomer(customerId, typeId);
        Map<String, Object> result = new HashMap<>();
        result.put("customerId", customerId);
        result.put("typeId", typeId);
        result.put("totalKg", total);
        return ResponseEntity.ok(result);
    }
}
