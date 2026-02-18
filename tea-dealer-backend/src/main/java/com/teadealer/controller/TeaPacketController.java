package com.teadealer.controller;

import com.teadealer.model.TeaPacketStock;
import com.teadealer.model.TeaPacketSupply;
import com.teadealer.model.TeaPacketType;
import com.teadealer.service.TeaPacketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tea-packets")
public class TeaPacketController {

    @Autowired
    private TeaPacketService teaPacketService;

    // ============ Tea Packet Type Endpoints ============

    @GetMapping("/types")
    public ResponseEntity<List<TeaPacketType>> getAllTypes() {
        return ResponseEntity.ok(teaPacketService.getAllTeaPacketTypes());
    }

    @GetMapping("/types/active")
    public ResponseEntity<List<TeaPacketType>> getActiveTypes() {
        return ResponseEntity.ok(teaPacketService.getActiveTeaPacketTypes());
    }

    @GetMapping("/types/{id}")
    public ResponseEntity<TeaPacketType> getTypeById(@PathVariable Long id) {
        return teaPacketService.getTeaPacketTypeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/types")
    public ResponseEntity<TeaPacketType> createType(@RequestBody TeaPacketType type) {
        return ResponseEntity.ok(teaPacketService.createTeaPacketType(type));
    }

    @PutMapping("/types/{id}")
    public ResponseEntity<TeaPacketType> updateType(@PathVariable Long id, @RequestBody TeaPacketType type) {
        try {
            return ResponseEntity.ok(teaPacketService.updateTeaPacketType(id, type));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        teaPacketService.deleteTeaPacketType(id);
        return ResponseEntity.noContent().build();
    }

    // ============ Stock Endpoints ============

    @GetMapping("/stock/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getStockSummary(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(teaPacketService.getStockSummary(year, month));
    }

    @PostMapping("/stock")
    public ResponseEntity<?> addStock(@RequestBody Map<String, Object> request) {
        try {
            Long typeId = Long.valueOf(request.get("teaPacketTypeId").toString());
            Integer year = Integer.valueOf(request.get("year").toString());
            Integer month = Integer.valueOf(request.get("month").toString());
            BigDecimal packetWeightGrams = new BigDecimal(request.get("packetWeightGrams").toString());
            Integer packetsCount = Integer.valueOf(request.get("packetsCount").toString());
            String notes = request.get("notes") != null ? request.get("notes").toString() : null;

            TeaPacketStock stock = teaPacketService.addStock(typeId, year, month, packetWeightGrams, packetsCount, notes);
            return ResponseEntity.ok(stock);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/stock/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        teaPacketService.deleteStock(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stock/available/{typeId}/{packetWeightGrams}/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getAvailablePacketsByTypeAndWeight(
            @PathVariable Long typeId, @PathVariable BigDecimal packetWeightGrams,
            @PathVariable Integer year, @PathVariable Integer month) {
        Integer available = teaPacketService.getAvailablePacketsByTypeAndWeight(typeId, packetWeightGrams, year, month);
        return ResponseEntity.ok(Map.of(
            "typeId", typeId,
            "packetWeightGrams", packetWeightGrams,
            "year", year,
            "month", month,
            "availablePackets", available
        ));
    }

    // ============ Supply Endpoints ============

    @GetMapping("/supply/{year}/{month}")
    public ResponseEntity<List<TeaPacketSupply>> getSuppliesByPeriod(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(teaPacketService.getSuppliesByPeriod(year, month));
    }

    @GetMapping("/supply/customer/{customerId}/{year}/{month}")
    public ResponseEntity<List<TeaPacketSupply>> getSuppliesByCustomerAndPeriod(
            @PathVariable Long customerId, @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(teaPacketService.getSuppliesByCustomer(customerId));
    }

    @PostMapping("/supply")
    public ResponseEntity<?> recordSupply(@RequestBody Map<String, Object> request) {
        try {
            Long customerId = Long.valueOf(request.get("customerId").toString());
            LocalDate supplyDate = LocalDate.parse(request.get("supplyDate").toString());
            Integer packetsCount = Integer.valueOf(request.get("packetsCount").toString());
            String notes = request.get("notes") != null ? request.get("notes").toString() : null;

            // Optional: tea packet type and weight
            Long typeId = request.get("teaPacketTypeId") != null
                    ? Long.valueOf(request.get("teaPacketTypeId").toString())
                    : null;
            BigDecimal packetWeightGrams = request.get("packetWeightGrams") != null
                    ? new BigDecimal(request.get("packetWeightGrams").toString())
                    : null;

            TeaPacketSupply supply = teaPacketService.recordSupply(
                    customerId, typeId, supplyDate, packetsCount, packetWeightGrams, notes);
            return ResponseEntity.ok(supply);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/supply/{id}")
    public ResponseEntity<Void> deleteSupply(@PathVariable Long id) {
        teaPacketService.deleteSupply(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/supply/customer/{customerId}/total/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getCustomerTotal(
            @PathVariable Long customerId, @PathVariable Integer year, @PathVariable Integer month) {
        Integer total = teaPacketService.getTotalSuppliedToCustomerInMonth(customerId, year, month);
        return ResponseEntity.ok(Map.of(
            "customerId", customerId,
            "year", year,
            "month", month,
            "totalPackets", total
        ));
    }
}
