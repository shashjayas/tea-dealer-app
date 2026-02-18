package com.teadealer.repository;

import com.teadealer.model.TeaPacketSupply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeaPacketSupplyRepository extends JpaRepository<TeaPacketSupply, Long> {
    List<TeaPacketSupply> findByCustomerIdOrderBySupplyDateDesc(Long customerId);

    @Query("SELECT ts FROM TeaPacketSupply ts WHERE YEAR(ts.supplyDate) = :year AND MONTH(ts.supplyDate) = :month ORDER BY ts.supplyDate DESC, ts.customer.bookNumber ASC")
    List<TeaPacketSupply> findByYearAndMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(ts.packetsCount), 0) FROM TeaPacketSupply ts WHERE (YEAR(ts.supplyDate) < :year OR (YEAR(ts.supplyDate) = :year AND MONTH(ts.supplyDate) <= :month))")
    Integer getTotalSuppliedUpToMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(ts.packetsCount), 0) FROM TeaPacketSupply ts WHERE ts.customer.id = :customerId AND YEAR(ts.supplyDate) = :year AND MONTH(ts.supplyDate) = :month")
    Integer getTotalSuppliedToCustomerInMonth(@Param("customerId") Long customerId, @Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(ts.packetsCount), 0) FROM TeaPacketSupply ts WHERE ts.teaPacketType.id = :typeId AND ts.packetWeightGrams = :packetWeightGrams AND (YEAR(ts.supplyDate) < :year OR (YEAR(ts.supplyDate) = :year AND MONTH(ts.supplyDate) <= :month))")
    Integer getTotalSuppliedByTypeAndWeightUpToMonth(@Param("typeId") Long typeId, @Param("packetWeightGrams") java.math.BigDecimal packetWeightGrams, @Param("year") Integer year, @Param("month") Integer month);
}
