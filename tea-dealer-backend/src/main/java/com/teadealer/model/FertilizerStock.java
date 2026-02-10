package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fertilizer_stock",
    uniqueConstraints = @UniqueConstraint(columnNames = {"fertilizer_type_id", "year", "month", "bag_size_kg"}))
@Data
public class FertilizerStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "fertilizer_type_id", nullable = false)
    private FertilizerType fertilizerType;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    // Stock added in kg
    @Column(name = "stock_added_kg", precision = 10, scale = 2)
    private BigDecimal stockAddedKg = BigDecimal.ZERO;

    // Number of bags added (for reference)
    @Column(name = "bags_added")
    private Integer bagsAdded = 0;

    // Bag size used when adding
    @Column(name = "bag_size_kg", precision = 10, scale = 2)
    private BigDecimal bagSizeKg;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
