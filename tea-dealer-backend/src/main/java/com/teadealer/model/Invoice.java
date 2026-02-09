package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices",
    uniqueConstraints = @UniqueConstraint(columnNames = {"customer_id", "year", "month"}))
@Data
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "book_number", nullable = false)
    private String bookNumber;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_name_sinhala")
    private String customerNameSinhala;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    // Tea collection totals
    @Column(name = "grade1_kg", precision = 10, scale = 2)
    private BigDecimal grade1Kg;

    @Column(name = "grade2_kg", precision = 10, scale = 2)
    private BigDecimal grade2Kg;

    @Column(name = "total_kg", precision = 10, scale = 2)
    private BigDecimal totalKg;

    // Supply deduction (kg deducted before calculating amount)
    @Column(name = "supply_deduction_percentage", precision = 5, scale = 2)
    private BigDecimal supplyDeductionPercentage;

    @Column(name = "supply_deduction_kg", precision = 10, scale = 2)
    private BigDecimal supplyDeductionKg;

    @Column(name = "payable_kg", precision = 10, scale = 2)
    private BigDecimal payableKg;

    // Rates
    @Column(name = "grade1_rate", precision = 10, scale = 2)
    private BigDecimal grade1Rate;

    @Column(name = "grade2_rate", precision = 10, scale = 2)
    private BigDecimal grade2Rate;

    // Amounts
    @Column(name = "grade1_amount", precision = 10, scale = 2)
    private BigDecimal grade1Amount;

    @Column(name = "grade2_amount", precision = 10, scale = 2)
    private BigDecimal grade2Amount;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // Deductions (stored as snapshot)
    @Column(name = "last_month_arrears", precision = 10, scale = 2)
    private BigDecimal lastMonthArrears;

    @Column(name = "advance_amount", precision = 10, scale = 2)
    private BigDecimal advanceAmount;

    @Column(name = "loan_amount", precision = 10, scale = 2)
    private BigDecimal loanAmount;

    @Column(name = "fertilizer1_amount", precision = 10, scale = 2)
    private BigDecimal fertilizer1Amount;

    @Column(name = "fertilizer2_amount", precision = 10, scale = 2)
    private BigDecimal fertilizer2Amount;

    @Column(name = "tea_packets_count")
    private Integer teaPacketsCount;

    @Column(name = "tea_packets_total", precision = 10, scale = 2)
    private BigDecimal teaPacketsTotal;

    @Column(name = "agrochemicals_amount", precision = 10, scale = 2)
    private BigDecimal agrochemicalsAmount;

    @Column(name = "transport_rate_per_kg", precision = 10, scale = 2)
    private BigDecimal transportRatePerKg;

    @Column(name = "transport_deduction", precision = 10, scale = 2)
    private BigDecimal transportDeduction;

    @Column(name = "transport_exempt")
    private Boolean transportExempt = false;

    @Column(name = "stamp_fee", precision = 10, scale = 2)
    private BigDecimal stampFee;

    @Column(name = "other_deductions", precision = 10, scale = 2)
    private BigDecimal otherDeductions;

    @Column(name = "other_deductions_note")
    private String otherDeductionsNote;

    @Column(name = "total_deductions", precision = 10, scale = 2)
    private BigDecimal totalDeductions;

    // Final amount
    @Column(name = "net_amount", precision = 10, scale = 2)
    private BigDecimal netAmount;

    // Collection details stored as JSON string
    @Column(name = "collection_details", columnDefinition = "TEXT")
    private String collectionDetails;

    // Status and timestamps
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvoiceStatus status = InvoiceStatus.GENERATED;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateTotals();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateTotals();
    }

    private void calculateTotals() {
        // Calculate total kg
        BigDecimal g1 = grade1Kg != null ? grade1Kg : BigDecimal.ZERO;
        BigDecimal g2 = grade2Kg != null ? grade2Kg : BigDecimal.ZERO;
        this.totalKg = g1.add(g2);

        // Calculate total deductions
        BigDecimal deductions = BigDecimal.ZERO;
        if (lastMonthArrears != null) deductions = deductions.add(lastMonthArrears);
        if (advanceAmount != null) deductions = deductions.add(advanceAmount);
        if (loanAmount != null) deductions = deductions.add(loanAmount);
        if (fertilizer1Amount != null) deductions = deductions.add(fertilizer1Amount);
        if (fertilizer2Amount != null) deductions = deductions.add(fertilizer2Amount);
        if (teaPacketsTotal != null) deductions = deductions.add(teaPacketsTotal);
        if (agrochemicalsAmount != null) deductions = deductions.add(agrochemicalsAmount);
        if (transportDeduction != null) deductions = deductions.add(transportDeduction);
        if (stampFee != null) deductions = deductions.add(stampFee);
        if (otherDeductions != null) deductions = deductions.add(otherDeductions);
        this.totalDeductions = deductions;

        // Calculate net amount
        BigDecimal total = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        this.netAmount = total.subtract(this.totalDeductions);
    }

    public enum InvoiceStatus {
        GENERATED,
        PAID,
        CANCELLED
    }
}
