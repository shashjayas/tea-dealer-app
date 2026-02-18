package com.teadealer.repository;

import com.teadealer.model.TeaPacketStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeaPacketStockRepository extends JpaRepository<TeaPacketStock, Long> {
    Optional<TeaPacketStock> findByYearAndMonthAndTeaPacketTypeIdAndPacketWeightGrams(
            Integer year, Integer month, Long teaPacketTypeId, BigDecimal packetWeightGrams);

    List<TeaPacketStock> findByYearAndMonth(Integer year, Integer month);

    @Query("SELECT COALESCE(SUM(ts.packetsAdded), 0) FROM TeaPacketStock ts WHERE (ts.year < :year OR (ts.year = :year AND ts.month <= :month))")
    Integer getTotalStockUpToMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(ts.packetsAdded), 0) FROM TeaPacketStock ts WHERE ts.teaPacketType.id = :typeId AND (ts.year < :year OR (ts.year = :year AND ts.month <= :month))")
    Integer getTotalStockByTypeUpToMonth(@Param("typeId") Long typeId, @Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(ts.packetsAdded), 0) FROM TeaPacketStock ts WHERE ts.teaPacketType.id = :typeId AND ts.packetWeightGrams = :packetWeightGrams AND (ts.year < :year OR (ts.year = :year AND ts.month <= :month))")
    Integer getTotalPacketsByTypeAndWeightUpToMonth(@Param("typeId") Long typeId, @Param("packetWeightGrams") java.math.BigDecimal packetWeightGrams, @Param("year") Integer year, @Param("month") Integer month);
}
