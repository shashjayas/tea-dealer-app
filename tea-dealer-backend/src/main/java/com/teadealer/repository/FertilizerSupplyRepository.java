package com.teadealer.repository;

import com.teadealer.model.FertilizerSupply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FertilizerSupplyRepository extends JpaRepository<FertilizerSupply, Long> {
    List<FertilizerSupply> findByCustomerIdOrderBySupplyDateDesc(Long customerId);

    List<FertilizerSupply> findByFertilizerTypeIdOrderBySupplyDateDesc(Long fertilizerTypeId);

    List<FertilizerSupply> findBySupplyDateBetweenOrderBySupplyDateDesc(LocalDate startDate, LocalDate endDate);

    @Query("SELECT fs FROM FertilizerSupply fs WHERE YEAR(fs.supplyDate) = :year AND MONTH(fs.supplyDate) = :month ORDER BY fs.supplyDate DESC, fs.customer.bookNumber ASC")
    List<FertilizerSupply> findByYearAndMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(fs.quantityKg), 0) FROM FertilizerSupply fs WHERE fs.fertilizerType.id = :typeId AND (YEAR(fs.supplyDate) < :year OR (YEAR(fs.supplyDate) = :year AND MONTH(fs.supplyDate) <= :month))")
    BigDecimal getTotalSuppliedUpToMonth(@Param("typeId") Long typeId, @Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(fs.quantityKg), 0) FROM FertilizerSupply fs WHERE fs.customer.id = :customerId AND fs.fertilizerType.id = :typeId")
    BigDecimal getTotalSuppliedToCustomer(@Param("customerId") Long customerId, @Param("typeId") Long typeId);
}
