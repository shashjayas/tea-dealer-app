package com.teadealer.service;

import com.teadealer.model.MonthlyRate;
import com.teadealer.repository.MonthlyRateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MonthlyRateService {

    @Autowired
    private MonthlyRateRepository monthlyRateRepository;

    public List<MonthlyRate> getRatesByYear(Integer year) {
        return monthlyRateRepository.findByYearOrderByMonthAsc(year);
    }

    public Optional<MonthlyRate> getRateByYearAndMonth(Integer year, Integer month) {
        return monthlyRateRepository.findByYearAndMonth(year, month);
    }

    public MonthlyRate saveRate(MonthlyRate rate) {
        return monthlyRateRepository.save(rate);
    }

    public void deleteRate(Long id) {
        monthlyRateRepository.deleteById(id);
    }

    public Optional<MonthlyRate> getRateById(Long id) {
        return monthlyRateRepository.findById(id);
    }
}
