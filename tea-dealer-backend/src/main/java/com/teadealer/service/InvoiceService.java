package com.teadealer.service;

import com.teadealer.model.Collection;
import com.teadealer.model.Customer;
import com.teadealer.model.Deduction;
import com.teadealer.model.Invoice;
import com.teadealer.model.MonthlyRate;
import com.teadealer.model.TeaGrade;
import com.teadealer.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private MonthlyRateService monthlyRateService;

    @Autowired
    private DeductionService deductionService;

    @Autowired
    private AppSettingsService appSettingsService;

    private static final String AUTO_ARREARS_SETTING_KEY = "auto_arrears_carry_forward";

    public Optional<Invoice> getInvoiceById(Long id) {
        return invoiceRepository.findById(id);
    }

    public Optional<Invoice> getInvoiceByCustomerAndPeriod(Long customerId, Integer year, Integer month) {
        return invoiceRepository.findByCustomerIdAndYearAndMonth(customerId, year, month);
    }

    public List<Invoice> getInvoicesByPeriod(Integer year, Integer month) {
        return invoiceRepository.findByYearAndMonth(year, month);
    }

    public List<Invoice> getInvoicesByCustomer(Long customerId) {
        return invoiceRepository.findByCustomerId(customerId);
    }

    public long getInvoiceCountByPeriod(Integer year, Integer month) {
        return invoiceRepository.countByYearAndMonth(year, month);
    }

    public boolean isInvoiceGenerated(Long customerId, Integer year, Integer month) {
        return invoiceRepository.existsByCustomerIdAndYearAndMonth(customerId, year, month);
    }

    @Transactional
    public Invoice generateInvoice(Long customerId, Integer year, Integer month) {
        Customer customer = customerService.getCustomerById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Check if invoice already exists
        Optional<Invoice> existingInvoice = invoiceRepository.findByCustomerIdAndYearAndMonth(customerId, year, month);

        Invoice invoice = existingInvoice.orElse(new Invoice());

        // Set customer info
        invoice.setCustomer(customer);
        invoice.setBookNumber(customer.getBookNumber());
        invoice.setCustomerName(customer.getGrowerNameEnglish());
        invoice.setCustomerNameSinhala(customer.getGrowerNameSinhala());
        invoice.setYear(year);
        invoice.setMonth(month);

        // Get monthly rate
        MonthlyRate monthlyRate = monthlyRateService.getRateByYearAndMonth(year, month)
                .orElse(new MonthlyRate());

        // Get collections for the month
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        List<Collection> collections = collectionService.getCollectionsByBookNumberAndDateRange(
                customer.getBookNumber(), startDate, endDate);

        // Calculate grade totals
        BigDecimal grade1Kg = BigDecimal.ZERO;
        BigDecimal grade2Kg = BigDecimal.ZERO;

        // Build collection details for storage as simple JSON array
        StringBuilder detailsBuilder = new StringBuilder("[");
        boolean first = true;

        for (Collection col : collections) {
            if (!first) {
                detailsBuilder.append(",");
            }
            first = false;

            detailsBuilder.append("{\"date\":\"")
                    .append(col.getCollectionDate().toString())
                    .append("\",\"grade\":\"")
                    .append(col.getGrade().name())
                    .append("\",\"weightKg\":")
                    .append(col.getWeightKg() != null ? col.getWeightKg().toString() : "0")
                    .append("}");

            if (col.getGrade() == TeaGrade.GRADE_1) {
                grade1Kg = grade1Kg.add(col.getWeightKg() != null ? col.getWeightKg() : BigDecimal.ZERO);
            } else if (col.getGrade() == TeaGrade.GRADE_2) {
                grade2Kg = grade2Kg.add(col.getWeightKg() != null ? col.getWeightKg() : BigDecimal.ZERO);
            }
        }
        detailsBuilder.append("]");

        // Store collection details
        invoice.setCollectionDetails(detailsBuilder.toString());

        // Set kg totals (original collected amounts)
        invoice.setGrade1Kg(grade1Kg);
        invoice.setGrade2Kg(grade2Kg);
        BigDecimal totalKg = grade1Kg.add(grade2Kg);

        // Get supply deduction percentage (default 4% if not set)
        BigDecimal supplyDeductionPercentage = monthlyRate.getSupplyDeductionPercentage() != null ?
                monthlyRate.getSupplyDeductionPercentage() : new BigDecimal("4.00");

        // Calculate supply deduction in kg
        BigDecimal supplyDeductionKg = totalKg.multiply(supplyDeductionPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Calculate payable kg (after deduction)
        BigDecimal payableKg = totalKg.subtract(supplyDeductionKg);

        invoice.setSupplyDeductionPercentage(supplyDeductionPercentage);
        invoice.setSupplyDeductionKg(supplyDeductionKg);
        invoice.setPayableKg(payableKg);

        // Set rates
        BigDecimal grade1Rate = monthlyRate.getGrade1Rate() != null ? monthlyRate.getGrade1Rate() : BigDecimal.ZERO;
        BigDecimal grade2Rate = monthlyRate.getGrade2Rate() != null ? monthlyRate.getGrade2Rate() : BigDecimal.ZERO;
        invoice.setGrade1Rate(grade1Rate);
        invoice.setGrade2Rate(grade2Rate);

        // Calculate amounts based on payable kg (proportionally reduced from each grade)
        // Each grade is reduced by the same percentage
        BigDecimal reductionMultiplier = BigDecimal.ONE.subtract(
                supplyDeductionPercentage.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));

        BigDecimal payableGrade1Kg = grade1Kg.multiply(reductionMultiplier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal payableGrade2Kg = grade2Kg.multiply(reductionMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal grade1Amount = payableGrade1Kg.multiply(grade1Rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grade2Amount = payableGrade2Kg.multiply(grade2Rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = grade1Amount.add(grade2Amount);

        invoice.setGrade1Amount(grade1Amount);
        invoice.setGrade2Amount(grade2Amount);
        invoice.setTotalAmount(totalAmount);

        // Calculate transport deduction (per kg based on payable kg)
        // Skip transport deduction if customer is transport exempt
        BigDecimal transportRatePerKg = monthlyRate.getTransportRatePerKg() != null ?
                monthlyRate.getTransportRatePerKg() : BigDecimal.ZERO;
        Boolean isTransportExempt = customer.getTransportExempt() != null && customer.getTransportExempt();
        BigDecimal transportDeduction = isTransportExempt ? BigDecimal.ZERO :
                payableKg.multiply(transportRatePerKg).setScale(2, RoundingMode.HALF_UP);

        invoice.setTransportRatePerKg(transportRatePerKg);
        invoice.setTransportDeduction(transportDeduction);
        invoice.setTransportExempt(isTransportExempt);

        // Set stamp fee
        invoice.setStampFee(monthlyRate.getStampFee());

        // Get deductions
        Optional<Deduction> deductionOpt = deductionService.getDeductionByCustomerAndPeriod(customerId, year, month);
        BigDecimal manualArrears = BigDecimal.ZERO;
        if (deductionOpt.isPresent()) {
            Deduction deduction = deductionOpt.get();
            manualArrears = deduction.getLastMonthArrears() != null ? deduction.getLastMonthArrears() : BigDecimal.ZERO;
            invoice.setAdvanceAmount(deduction.getAdvanceAmount());
            invoice.setLoanAmount(deduction.getLoanAmount());
            invoice.setFertilizer1Amount(deduction.getFertilizer1Amount());
            invoice.setFertilizer2Amount(deduction.getFertilizer2Amount());
            invoice.setTeaPacketsCount(deduction.getTeaPacketsCount());
            invoice.setTeaPacketsTotal(deduction.getTeaPacketsTotal());
            invoice.setAgrochemicalsAmount(deduction.getAgrochemicalsAmount());
            invoice.setOtherDeductions(deduction.getOtherDeductions());
            invoice.setOtherDeductionsNote(deduction.getOtherDeductionsNote());
        }

        // Check for automatic arrears carry-forward from previous month's negative net pay
        BigDecimal autoArrears = BigDecimal.ZERO;
        String autoArrearsSetting = appSettingsService.getSettingValue(AUTO_ARREARS_SETTING_KEY);
        boolean autoArrearsEnabled = "true".equalsIgnoreCase(autoArrearsSetting);

        if (autoArrearsEnabled) {
            // Calculate previous month
            int prevMonth = month - 1;
            int prevYear = year;
            if (prevMonth < 1) {
                prevMonth = 12;
                prevYear = year - 1;
            }

            // Get previous month's invoice
            Optional<Invoice> prevInvoiceOpt = invoiceRepository.findByCustomerIdAndYearAndMonth(customerId, prevYear, prevMonth);
            if (prevInvoiceOpt.isPresent()) {
                Invoice prevInvoice = prevInvoiceOpt.get();
                BigDecimal prevNetAmount = prevInvoice.getNetAmount();
                // If previous net amount is negative, it becomes arrears (as positive amount)
                if (prevNetAmount != null && prevNetAmount.compareTo(BigDecimal.ZERO) < 0) {
                    autoArrears = prevNetAmount.abs();
                }
            }
        }

        // Set total arrears (manual + auto)
        BigDecimal totalArrears = manualArrears.add(autoArrears);
        invoice.setLastMonthArrears(totalArrears.compareTo(BigDecimal.ZERO) > 0 ? totalArrears : null);

        // Set status
        invoice.setStatus(Invoice.InvoiceStatus.GENERATED);

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public List<Invoice> generateAllInvoicesForPeriod(Integer year, Integer month) {
        List<Customer> customers = customerService.getAllCustomers();
        List<Invoice> generatedInvoices = new ArrayList<>();

        for (Customer customer : customers) {
            try {
                Invoice invoice = generateInvoice(customer.getId(), year, month);
                generatedInvoices.add(invoice);
            } catch (Exception e) {
                // Log error but continue with other customers
                System.err.println("Error generating invoice for customer " + customer.getId() + ": " + e.getMessage());
            }
        }

        return generatedInvoices;
    }

    @Transactional
    public Invoice regenerateInvoice(Long customerId, Integer year, Integer month) {
        // Simply call generateInvoice - it handles both create and update
        return generateInvoice(customerId, year, month);
    }

    @Transactional
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }

    public Invoice updateInvoiceStatus(Long id, Invoice.InvoiceStatus status) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        invoice.setStatus(status);
        return invoiceRepository.save(invoice);
    }
}
