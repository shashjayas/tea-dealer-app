package com.teadealer.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "collections",
    uniqueConstraints = @UniqueConstraint(columnNames = {"book_number", "collection_date", "grade"}))
@Data
public class Collection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "book_number", nullable = false)
    private String bookNumber;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "collection_date", nullable = false)
    private LocalDate collectionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "grade", nullable = false)
    private TeaGrade grade = TeaGrade.GRADE_2;

    @Column(name = "weight_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal weightKg;
    
    @Column(name = "rate_per_kg", precision = 10, scale = 2)
    private BigDecimal ratePerKg;
    
    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
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
        // Auto-calculate total amount
        if (weightKg != null && ratePerKg != null) {
            totalAmount = weightKg.multiply(ratePerKg);
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        // Auto-calculate total amount
        if (weightKg != null && ratePerKg != null) {
            totalAmount = weightKg.multiply(ratePerKg);
        }
    }
}