package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tea_packet_supply")
@Data
public class TeaPacketSupply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "tea_packet_type_id")
    private TeaPacketType teaPacketType;

    @Column(name = "supply_date", nullable = false)
    private LocalDate supplyDate;

    @Column(name = "packets_count", nullable = false)
    private Integer packetsCount;

    @Column(name = "packet_weight_grams")
    private BigDecimal packetWeightGrams;

    @Column(name = "total_weight_grams")
    private BigDecimal totalWeightGrams;

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
