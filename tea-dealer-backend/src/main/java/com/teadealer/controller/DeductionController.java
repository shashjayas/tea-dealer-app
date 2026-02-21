package com.teadealer.controller;

import com.teadealer.model.Collection;
import com.teadealer.model.Customer;
import com.teadealer.model.Deduction;
import com.teadealer.model.Invoice;
import com.teadealer.model.MonthlyRate;
import com.teadealer.model.TeaGrade;
import com.teadealer.repository.InvoiceRepository;
import com.teadealer.service.AppSettingsService;
import com.teadealer.service.CollectionService;
import com.teadealer.service.CustomerService;
import com.teadealer.service.DeductionService;
import com.teadealer.service.MonthlyRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/deductions")
public class DeductionController {

    private static final String AUTO_ARREARS_SETTING_KEY = "auto_arrears_carry_forward";
    private static final String DEDUCTION_ROUNDING_MODE_KEY = "deduction_rounding_mode";

    // Deduction rounding modes
    private static final String ROUNDING_MODE_HALF_UP = "half_up";
    private static final String ROUNDING_MODE_INCLUDE_DECIMALS = "include_decimals";
    private static final String ROUNDING_MODE_CEILING = "ceiling";
    private static final String ROUNDING_MODE_FLOOR = "floor";

    @Autowired
    private DeductionService deductionService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private MonthlyRateService monthlyRateService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private AppSettingsService appSettingsService;

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

    @GetMapping("/auto-arrears/{customerId}/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getAutoArrears(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        Map<String, Object> result = new HashMap<>();

        // Check if auto-arrears feature is enabled
        String autoArrearsSetting = appSettingsService.getSettingValue(AUTO_ARREARS_SETTING_KEY);
        boolean autoArrearsEnabled = "true".equalsIgnoreCase(autoArrearsSetting);

        result.put("autoArrearsEnabled", autoArrearsEnabled);
        result.put("autoArrearsAmount", BigDecimal.ZERO);
        result.put("previousMonth", null);
        result.put("previousYear", null);
        result.put("previousNetAmount", null);

        if (autoArrearsEnabled) {
            // Calculate previous month
            int prevMonth = month - 1;
            int prevYear = year;
            if (prevMonth < 1) {
                prevMonth = 12;
                prevYear = year - 1;
            }

            result.put("previousMonth", prevMonth);
            result.put("previousYear", prevYear);

            // Get previous month's invoice
            Optional<Invoice> prevInvoiceOpt = invoiceRepository.findByCustomerIdAndYearAndMonth(customerId, prevYear, prevMonth);
            if (prevInvoiceOpt.isPresent()) {
                Invoice prevInvoice = prevInvoiceOpt.get();
                BigDecimal prevNetAmount = prevInvoice.getNetAmount();
                result.put("previousNetAmount", prevNetAmount);

                // If previous net amount is negative, it becomes arrears (as positive amount)
                if (prevNetAmount != null && prevNetAmount.compareTo(BigDecimal.ZERO) < 0) {
                    result.put("autoArrearsAmount", prevNetAmount.abs());
                }
            }
        }

        return ResponseEntity.ok(result);
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

            // Calculate total kg
            BigDecimal totalKg = grade1Total.add(grade2Total);

            // Get supply deduction percentage (default 4% if not set)
            BigDecimal supplyDeductionPercentage = monthlyRate.getSupplyDeductionPercentage() != null ?
                    monthlyRate.getSupplyDeductionPercentage() : new BigDecimal("4.00");

            // Calculate supply deduction in kg with configurable rounding
            BigDecimal rawSupplyDeductionKg = totalKg.multiply(supplyDeductionPercentage)
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal supplyDeductionKg = applyDeductionRounding(rawSupplyDeductionKg);

            // Calculate payable kg (after deduction)
            BigDecimal payableKg = totalKg.subtract(supplyDeductionKg);

            // Calculate amounts based on payable kg (proportionally reduced from each grade)
            // Use the actual rounded deduction to calculate the reduction ratio
            BigDecimal grade1Rate = monthlyRate.getGrade1Rate() != null ? monthlyRate.getGrade1Rate() : BigDecimal.ZERO;
            BigDecimal grade2Rate = monthlyRate.getGrade2Rate() != null ? monthlyRate.getGrade2Rate() : BigDecimal.ZERO;

            BigDecimal reductionMultiplier = totalKg.compareTo(BigDecimal.ZERO) > 0
                    ? payableKg.divide(totalKg, 6, RoundingMode.HALF_UP)
                    : BigDecimal.ONE;

            BigDecimal payableGrade1Kg = grade1Total.multiply(reductionMultiplier).setScale(2, RoundingMode.HALF_UP);
            BigDecimal payableGrade2Kg = grade2Total.multiply(reductionMultiplier).setScale(2, RoundingMode.HALF_UP);

            BigDecimal grade1Amount = payableGrade1Kg.multiply(grade1Rate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal grade2Amount = payableGrade2Kg.multiply(grade2Rate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalAmount = grade1Amount.add(grade2Amount);

            // Calculate transport deduction (per kg based on payable kg)
            // Skip transport deduction if customer is transport exempt
            BigDecimal transportRatePerKg = monthlyRate.getTransportRatePerKg() != null ?
                    monthlyRate.getTransportRatePerKg() : BigDecimal.ZERO;
            Boolean isTransportExempt = customer.getTransportExempt() != null && customer.getTransportExempt();
            BigDecimal transportDeduction = isTransportExempt ? BigDecimal.ZERO :
                    payableKg.multiply(transportRatePerKg).setScale(2, RoundingMode.HALF_UP);

            Map<String, Object> result = new HashMap<>();
            result.put("grade1Kg", grade1Total);
            result.put("grade2Kg", grade2Total);
            result.put("totalKg", totalKg);
            result.put("supplyDeductionPercentage", supplyDeductionPercentage);
            result.put("supplyDeductionKg", supplyDeductionKg);
            result.put("payableKg", payableKg);
            result.put("grade1Rate", grade1Rate);
            result.put("grade2Rate", grade2Rate);
            result.put("grade1Amount", grade1Amount);
            result.put("grade2Amount", grade2Amount);
            result.put("totalAmount", totalAmount);
            result.put("transportRatePerKg", transportRatePerKg);
            result.put("transportDeduction", transportDeduction);
            result.put("transportExempt", isTransportExempt);
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

            // Store advance entries as JSON string
            if (deductionData.get("advanceEntries") != null) {
                deduction.setAdvanceEntries(deductionData.get("advanceEntries").toString());
            }

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

    /**
     * Apply rounding to supply deduction kg based on the configured rounding mode.
     */
    private BigDecimal applyDeductionRounding(BigDecimal value) {
        String roundingMode = appSettingsService.getSettingValue(DEDUCTION_ROUNDING_MODE_KEY);
        if (roundingMode == null) {
            roundingMode = ROUNDING_MODE_HALF_UP; // Default
        }

        switch (roundingMode) {
            case ROUNDING_MODE_INCLUDE_DECIMALS:
                return value.setScale(2, RoundingMode.HALF_UP);
            case ROUNDING_MODE_CEILING:
                return value.setScale(0, RoundingMode.CEILING);
            case ROUNDING_MODE_FLOOR:
                return value.setScale(0, RoundingMode.FLOOR);
            case ROUNDING_MODE_HALF_UP:
            default:
                return value.setScale(0, RoundingMode.HALF_UP);
        }
    }
}
