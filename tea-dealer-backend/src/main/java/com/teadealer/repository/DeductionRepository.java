package com.teadealer.repository;

import com.teadealer.model.Deduction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeductionRepository extends JpaRepository<Deduction, Long> {
    Optional<Deduction> findByCustomerIdAndYearAndMonth(Long customerId, Integer year, Integer month);
    Optional<Deduction> findByBookNumberAndYearAndMonth(String bookNumber, Integer year, Integer month);
    List<Deduction> findByCustomerId(Long customerId);
    List<Deduction> findByBookNumber(String bookNumber);
    List<Deduction> findByYearAndMonth(Integer year, Integer month);
    List<Deduction> findByYear(Integer year);
}
