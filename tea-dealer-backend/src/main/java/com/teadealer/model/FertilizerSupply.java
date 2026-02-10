package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fertilizer_supply")
@Data
public class FertilizerSupply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "fertilizer_type_id", nullable = false)
    private FertilizerType fertilizerType;

    @Column(name = "supply_date", nullable = false)
    private LocalDate supplyDate;

    // Quantity in kg
    @Column(name = "quantity_kg", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantityKg;

    // Number of bags supplied
    @Column(name = "bags_count")
    private Integer bagsCount;

    // Bag size used
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
