package com.teadealer.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "book_number", unique = true, nullable = false)
    private String bookNumber;

    @Column(name = "grower_name_sinhala", nullable = false)
    private String growerNameSinhala;

    @Column(name = "grower_name_english", nullable = false)
    private String growerNameEnglish;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "nic")
    private String nic;

    @Column(name = "land_name")
    private String landName;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "route")
    private String route;

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