package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tea_packet_stock",
    uniqueConstraints = @UniqueConstraint(columnNames = {"year", "month", "tea_packet_type_id", "packet_weight_grams"}))
@Data
public class TeaPacketStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tea_packet_type_id", nullable = false)
    private TeaPacketType teaPacketType;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "packet_weight_grams", nullable = false)
    private BigDecimal packetWeightGrams;

    @Column(name = "packets_added", nullable = false)
    private Integer packetsAdded = 0;

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
