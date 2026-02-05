package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deductions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"customer_id", "year", "month"}))
@Data
public class Deduction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "book_number", nullable = false)
    private String bookNumber;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    // Last month arrears
    @Column(name = "last_month_arrears", precision = 10, scale = 2)
    private BigDecimal lastMonthArrears;

    // Advance
    @Column(name = "advance_amount", precision = 10, scale = 2)
    private BigDecimal advanceAmount;

    @Column(name = "advance_date")
    private LocalDate advanceDate;

    // Loans
    @Column(name = "loan_amount", precision = 10, scale = 2)
    private BigDecimal loanAmount;

    @Column(name = "loan_date")
    private LocalDate loanDate;

    // Fertilizer 1
    @Column(name = "fertilizer1_amount", precision = 10, scale = 2)
    private BigDecimal fertilizer1Amount;

    @Column(name = "fertilizer1_date")
    private LocalDate fertilizer1Date;

    // Fertilizer 2
    @Column(name = "fertilizer2_amount", precision = 10, scale = 2)
    private BigDecimal fertilizer2Amount;

    @Column(name = "fertilizer2_date")
    private LocalDate fertilizer2Date;

    // Tea packets
    @Column(name = "tea_packets_count")
    private Integer teaPacketsCount;

    @Column(name = "tea_packets_total", precision = 10, scale = 2)
    private BigDecimal teaPacketsTotal;

    // Agrochemicals
    @Column(name = "agrochemicals_amount", precision = 10, scale = 2)
    private BigDecimal agrochemicalsAmount;

    @Column(name = "agrochemicals_date")
    private LocalDate agrochemicalsDate;

    // Transport (calculated)
    @Column(name = "transport_deduction", precision = 10, scale = 2)
    private BigDecimal transportDeduction;

    // Stamp fee (from monthly rate)
    @Column(name = "stamp_fee", precision = 10, scale = 2)
    private BigDecimal stampFee;

    // Other deductions
    @Column(name = "other_deductions", precision = 10, scale = 2)
    private BigDecimal otherDeductions;

    @Column(name = "other_deductions_note", columnDefinition = "TEXT")
    private String otherDeductionsNote;

    // Calculated totals
    @Column(name = "month_total_amount", precision = 10, scale = 2)
    private BigDecimal monthTotalAmount;

    @Column(name = "total_deductions", precision = 10, scale = 2)
    private BigDecimal totalDeductions;

    @Column(name = "net_amount", precision = 10, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        // Auto-set book number from customer if not already set
        if (customer != null && bookNumber == null) {
            bookNumber = customer.getBookNumber();
        }

        calculateTotals();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateTotals();
    }

    private void calculateTotals() {
        BigDecimal total = BigDecimal.ZERO;

        if (lastMonthArrears != null) total = total.add(lastMonthArrears);
        if (advanceAmount != null) total = total.add(advanceAmount);
        if (loanAmount != null) total = total.add(loanAmount);
        if (fertilizer1Amount != null) total = total.add(fertilizer1Amount);
        if (fertilizer2Amount != null) total = total.add(fertilizer2Amount);
        if (teaPacketsTotal != null) total = total.add(teaPacketsTotal);
        if (agrochemicalsAmount != null) total = total.add(agrochemicalsAmount);
        if (transportDeduction != null) total = total.add(transportDeduction);
        if (stampFee != null) total = total.add(stampFee);
        if (otherDeductions != null) total = total.add(otherDeductions);

        this.totalDeductions = total;

        // Calculate net amount
        if (monthTotalAmount != null) {
            this.netAmount = monthTotalAmount.subtract(totalDeductions);
        }
    }
}
