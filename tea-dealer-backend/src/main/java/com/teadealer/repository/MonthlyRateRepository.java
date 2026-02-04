package com.teadealer.repository;

import com.teadealer.model.MonthlyRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyRateRepository extends JpaRepository<MonthlyRate, Long> {
    List<MonthlyRate> findByYear(Integer year);
    Optional<MonthlyRate> findByYearAndMonth(Integer year, Integer month);
    List<MonthlyRate> findByYearOrderByMonthAsc(Integer year);
}
