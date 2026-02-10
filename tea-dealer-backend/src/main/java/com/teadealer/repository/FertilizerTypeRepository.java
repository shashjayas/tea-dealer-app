package com.teadealer.repository;

import com.teadealer.model.FertilizerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FertilizerTypeRepository extends JpaRepository<FertilizerType, Long> {
    List<FertilizerType> findByActiveTrue();
    List<FertilizerType> findByActiveTrueOrderByNameAsc();
}
