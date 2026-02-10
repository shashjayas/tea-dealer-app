package com.teadealer.repository;

import com.teadealer.model.FertilizerStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FertilizerStockRepository extends JpaRepository<FertilizerStock, Long> {
    List<FertilizerStock> findByYearAndMonth(Integer year, Integer month);

    List<FertilizerStock> findByFertilizerTypeIdAndYearAndMonth(Long fertilizerTypeId, Integer year, Integer month);

    Optional<FertilizerStock> findByFertilizerTypeIdAndYearAndMonthAndBagSizeKg(Long fertilizerTypeId, Integer year, Integer month, BigDecimal bagSizeKg);

    List<FertilizerStock> findByFertilizerTypeIdOrderByYearDescMonthDesc(Long fertilizerTypeId);

    @Query("SELECT COALESCE(SUM(fs.stockAddedKg), 0) FROM FertilizerStock fs WHERE fs.fertilizerType.id = :typeId AND (fs.year < :year OR (fs.year = :year AND fs.month <= :month))")
    BigDecimal getTotalStockUpToMonth(@Param("typeId") Long typeId, @Param("year") Integer year, @Param("month") Integer month);
}
