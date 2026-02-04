package com.teadealer.controller;

import com.teadealer.model.Collection;
import com.teadealer.model.Customer;
import com.teadealer.model.Deduction;
import com.teadealer.model.MonthlyRate;
import com.teadealer.model.TeaGrade;
import com.teadealer.service.CollectionService;
import com.teadealer.service.CustomerService;
import com.teadealer.service.DeductionService;
import com.teadealer.service.MonthlyRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deductions")
public class DeductionController {

    @Autowired
    private DeductionService deductionService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private MonthlyRateService monthlyRateService;

    @GetMapping("/customer/{customerId}/period/{year}/{month}")
    public ResponseEntity<Deduction> getDeductionByCustomerAndPeriod(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        return deductionService.getDeductionByCustomerAndPeriod(customerId, year, month)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/book-number/{bookNumber}/period/{year}/{month}")
    public ResponseEntity<Deduction> getDeductionByBookNumberAndPeriod(
            @PathVariable String bookNumber,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        return deductionService.getDeductionByBookNumberAndPeriod(bookNumber, year, month)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Deduction>> getDeductionsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(deductionService.getDeductionsByCustomer(customerId));
    }

    @GetMapping("/period/{year}/{month}")
    public ResponseEntity<List<Deduction>> getDeductionsByPeriod(
            @PathVariable Integer year,
            @PathVariable Integer month) {
        return ResponseEntity.ok(deductionService.getDeductionsByPeriod(year, month));
    }

    @GetMapping("/calculate/{customerId}/{year}/{month}")
    public ResponseEntity<Map<String, Object>> calculateMonthlyTotals(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        try {
            Customer customer = customerService.getCustomerById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // Get monthly rate
            MonthlyRate monthlyRate = monthlyRateService.getRateByYearAndMonth(year, month)
                    .orElse(new MonthlyRate());

            // Get collections for the month
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

            List<Collection> collections = collectionService.getCollectionsByBookNumberAndDateRange(
                    customer.getBookNumber(), startDate, endDate);

            // Calculate grade totals
            BigDecimal grade1Total = BigDecimal.ZERO;
            BigDecimal grade2Total = BigDecimal.ZERO;

            for (Collection col : collections) {
                if (col.getGrade() == TeaGrade.GRADE_1) {
                    grade1Total = grade1Total.add(col.getWeightKg() != null ? col.getWeightKg() : BigDecimal.ZERO);
                } else if (col.getGrade() == TeaGrade.GRADE_2) {
                    grade2Total = grade2Total.add(col.getWeightKg() != null ? col.getWeightKg() : BigDecimal.ZERO);
                }
            }

            // Calculate total amount
            BigDecimal grade1Rate = monthlyRate.getGrade1Rate() != null ? monthlyRate.getGrade1Rate() : BigDecimal.ZERO;
            BigDecimal grade2Rate = monthlyRate.getGrade2Rate() != null ? monthlyRate.getGrade2Rate() : BigDecimal.ZERO;

            BigDecimal grade1Amount = grade1Total.multiply(grade1Rate);
            BigDecimal grade2Amount = grade2Total.multiply(grade2Rate);
            BigDecimal totalAmount = grade1Amount.add(grade2Amount);

            // Calculate transport deduction
            BigDecimal transportPercentage = monthlyRate.getTransportPercentage() != null ? monthlyRate.getTransportPercentage() : BigDecimal.ZERO;
            BigDecimal transportDeduction = totalAmount.multiply(transportPercentage).divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);

            Map<String, Object> result = new HashMap<>();
            result.put("grade1Kg", grade1Total);
            result.put("grade2Kg", grade2Total);
            result.put("grade1Rate", grade1Rate);
            result.put("grade2Rate", grade2Rate);
            result.put("grade1Amount", grade1Amount);
            result.put("grade2Amount", grade2Amount);
            result.put("totalAmount", totalAmount);
            result.put("transportPercentage", transportPercentage);
            result.put("transportDeduction", transportDeduction);
            result.put("stampFee", monthlyRate.getStampFee() != null ? monthlyRate.getStampFee() : BigDecimal.ZERO);
            result.put("teaPacketPrice", monthlyRate.getTeaPacketPrice() != null ? monthlyRate.getTeaPacketPrice() : BigDecimal.ZERO);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> saveDeduction(@RequestBody Map<String, Object> deductionData) {
        try {
            Long customerId = Long.valueOf(deductionData.get("customerId").toString());
            Integer year = Integer.valueOf(deductionData.get("year").toString());
            Integer month = Integer.valueOf(deductionData.get("month").toString());

            Customer customer = customerService.getCustomerById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // Get or create deduction
            Deduction deduction = deductionService.getDeductionByCustomerAndPeriod(customerId, year, month)
                    .orElse(new Deduction());

            deduction.setCustomer(customer);
            deduction.setBookNumber(customer.getBookNumber());
            deduction.setYear(year);
            deduction.setMonth(month);

            // Set values if provided (handle null properly)
            if (deductionData.containsKey("monthTotalAmount") && deductionData.get("monthTotalAmount") != null) {
                deduction.setMonthTotalAmount(new BigDecimal(deductionData.get("monthTotalAmount").toString()));
            }

            deduction.setLastMonthArrears(deductionData.get("lastMonthArrears") != null ?
                new BigDecimal(deductionData.get("lastMonthArrears").toString()) : null);

            deduction.setAdvanceAmount(deductionData.get("advanceAmount") != null ?
                new BigDecimal(deductionData.get("advanceAmount").toString()) : null);

            deduction.setAdvanceDate(deductionData.get("advanceDate") != null ?
                LocalDate.parse(deductionData.get("advanceDate").toString()) : null);

            deduction.setLoanAmount(deductionData.get("loanAmount") != null ?
                new BigDecimal(deductionData.get("loanAmount").toString()) : null);

            deduction.setLoanDate(deductionData.get("loanDate") != null ?
                LocalDate.parse(deductionData.get("loanDate").toString()) : null);

            deduction.setFertilizer1Amount(deductionData.get("fertilizer1Amount") != null ?
                new BigDecimal(deductionData.get("fertilizer1Amount").toString()) : null);

            deduction.setFertilizer1Date(deductionData.get("fertilizer1Date") != null ?
                LocalDate.parse(deductionData.get("fertilizer1Date").toString()) : null);

            deduction.setFertilizer2Amount(deductionData.get("fertilizer2Amount") != null ?
                new BigDecimal(deductionData.get("fertilizer2Amount").toString()) : null);

            deduction.setFertilizer2Date(deductionData.get("fertilizer2Date") != null ?
                LocalDate.parse(deductionData.get("fertilizer2Date").toString()) : null);

            deduction.setTeaPacketsCount(deductionData.get("teaPacketsCount") != null ?
                Integer.valueOf(deductionData.get("teaPacketsCount").toString()) : null);

            deduction.setTeaPacketsTotal(deductionData.get("teaPacketsTotal") != null ?
                new BigDecimal(deductionData.get("teaPacketsTotal").toString()) : null);

            deduction.setAgrochemicalsAmount(deductionData.get("agrochemicalsAmount") != null ?
                new BigDecimal(deductionData.get("agrochemicalsAmount").toString()) : null);

            deduction.setAgrochemicalsDate(deductionData.get("agrochemicalsDate") != null ?
                LocalDate.parse(deductionData.get("agrochemicalsDate").toString()) : null);

            deduction.setTransportDeduction(deductionData.get("transportDeduction") != null ?
                new BigDecimal(deductionData.get("transportDeduction").toString()) : null);

            deduction.setStampFee(deductionData.get("stampFee") != null ?
                new BigDecimal(deductionData.get("stampFee").toString()) : null);

            deduction.setOtherDeductions(deductionData.get("otherDeductions") != null ?
                new BigDecimal(deductionData.get("otherDeductions").toString()) : null);

            deduction.setOtherDeductionsNote(deductionData.get("otherDeductionsNote") != null ?
                deductionData.get("otherDeductionsNote").toString() : null);

            Deduction saved = deductionService.saveDeduction(deduction);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeduction(@PathVariable Long id) {
        deductionService.deleteDeduction(id);
        return ResponseEntity.noContent().build();
    }
}
