package com.teadealer.service;

import com.teadealer.model.Deduction;
import com.teadealer.repository.DeductionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DeductionService {

    @Autowired
    private DeductionRepository deductionRepository;

    public Optional<Deduction> getDeductionByCustomerAndPeriod(Long customerId, Integer year, Integer month) {
        return deductionRepository.findByCustomerIdAndYearAndMonth(customerId, year, month);
    }

    public Optional<Deduction> getDeductionByBookNumberAndPeriod(String bookNumber, Integer year, Integer month) {
        return deductionRepository.findByBookNumberAndYearAndMonth(bookNumber, year, month);
    }

    public List<Deduction> getDeductionsByCustomer(Long customerId) {
        return deductionRepository.findByCustomerId(customerId);
    }

    public List<Deduction> getDeductionsByBookNumber(String bookNumber) {
        return deductionRepository.findByBookNumber(bookNumber);
    }

    public List<Deduction> getDeductionsByPeriod(Integer year, Integer month) {
        return deductionRepository.findByYearAndMonth(year, month);
    }

    public List<Deduction> getDeductionsByYear(Integer year) {
        return deductionRepository.findByYear(year);
    }

    public Deduction saveDeduction(Deduction deduction) {
        return deductionRepository.save(deduction);
    }

    public void deleteDeduction(Long id) {
        deductionRepository.deleteById(id);
    }
}
