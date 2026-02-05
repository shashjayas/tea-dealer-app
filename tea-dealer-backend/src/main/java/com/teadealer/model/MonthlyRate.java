package com.teadealer.model;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_rates",
    uniqueConstraints = @UniqueConstraint(columnNames = {"year", "month"}))
@Data
public class MonthlyRate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month; // 1-12

    @Column(name = "tea_packet_price", precision = 10, scale = 2)
    private BigDecimal teaPacketPrice;

    @Column(name = "transport_percentage", precision = 5, scale = 2)
    private BigDecimal transportPercentage;

    @Column(name = "stamp_fee", precision = 10, scale = 2)
    private BigDecimal stampFee;

    @Column(name = "grade1_rate", precision = 10, scale = 2)
    private BigDecimal grade1Rate;

    @Column(name = "grade2_rate", precision = 10, scale = 2)
    private BigDecimal grade2Rate;

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
