package com.teadealer.service;

import com.teadealer.model.Customer;
import com.teadealer.model.FertilizerType;
import com.teadealer.model.FertilizerStock;
import com.teadealer.model.FertilizerSupply;
import com.teadealer.repository.FertilizerTypeRepository;
import com.teadealer.repository.FertilizerStockRepository;
import com.teadealer.repository.FertilizerSupplyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class FertilizerService {

    @Autowired
    private FertilizerTypeRepository typeRepository;

    @Autowired
    private FertilizerStockRepository stockRepository;

    @Autowired
    private FertilizerSupplyRepository supplyRepository;

    @Autowired
    private CustomerService customerService;

    // ============ Fertilizer Type Methods ============

    public List<FertilizerType> getAllFertilizerTypes() {
        return typeRepository.findAll();
    }

    public List<FertilizerType> getActiveFertilizerTypes() {
        return typeRepository.findByActiveTrueOrderByNameAsc();
    }

    public Optional<FertilizerType> getFertilizerTypeById(Long id) {
        return typeRepository.findById(id);
    }

    public FertilizerType createFertilizerType(FertilizerType type) {
        return typeRepository.save(type);
    }

    public FertilizerType updateFertilizerType(Long id, FertilizerType typeDetails) {
        FertilizerType type = typeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fertilizer type not found"));
        type.setName(typeDetails.getName());
        type.setBagSizes(typeDetails.getBagSizes());
        type.setUnit(typeDetails.getUnit());
        type.setActive(typeDetails.getActive());
        return typeRepository.save(type);
    }

    public void deleteFertilizerType(Long id) {
        typeRepository.deleteById(id);
    }

    // ============ Fertilizer Stock Methods ============

    public List<FertilizerStock> getStockByPeriod(Integer year, Integer month) {
        return stockRepository.findByYearAndMonth(year, month);
    }

    public List<FertilizerStock> getStockByTypeAndPeriod(Long typeId, Integer year, Integer month) {
        return stockRepository.findByFertilizerTypeIdAndYearAndMonth(typeId, year, month);
    }

    @Transactional
    public FertilizerStock addStock(Long typeId, Integer year, Integer month, BigDecimal bagSizeKg, Integer bagsCount, String notes) {
        FertilizerType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Fertilizer type not found"));

        // Find existing stock for this type, period, AND bag size
        Optional<FertilizerStock> existingStock = stockRepository.findByFertilizerTypeIdAndYearAndMonthAndBagSizeKg(typeId, year, month, bagSizeKg);

        FertilizerStock stock;
        if (existingStock.isPresent()) {
            stock = existingStock.get();
            // Add to existing stock for this bag size
            BigDecimal additionalKg = bagSizeKg.multiply(BigDecimal.valueOf(bagsCount));
            stock.setStockAddedKg(stock.getStockAddedKg().add(additionalKg));
            stock.setBagsAdded(stock.getBagsAdded() + bagsCount);
            if (notes != null && !notes.isEmpty()) {
                stock.setNotes(stock.getNotes() != null ? stock.getNotes() + "; " + notes : notes);
            }
        } else {
            stock = new FertilizerStock();
            stock.setFertilizerType(type);
            stock.setYear(year);
            stock.setMonth(month);
            stock.setStockAddedKg(bagSizeKg.multiply(BigDecimal.valueOf(bagsCount)));
            stock.setBagsAdded(bagsCount);
            stock.setBagSizeKg(bagSizeKg);
            stock.setNotes(notes);
        }

        return stockRepository.save(stock);
    }

    public BigDecimal getAvailableStock(Long typeId, Integer year, Integer month) {
        BigDecimal totalStock = stockRepository.getTotalStockUpToMonth(typeId, year, month);
        BigDecimal totalSupplied = supplyRepository.getTotalSuppliedUpToMonth(typeId, year, month);
        return totalStock.subtract(totalSupplied);
    }

    // ============ Fertilizer Supply Methods ============

    public List<FertilizerSupply> getSuppliesByPeriod(Integer year, Integer month) {
        return supplyRepository.findByYearAndMonth(year, month);
    }

    public List<FertilizerSupply> getSuppliesByCustomer(Long customerId) {
        return supplyRepository.findByCustomerIdOrderBySupplyDateDesc(customerId);
    }

    public List<FertilizerSupply> getSuppliesByType(Long typeId) {
        return supplyRepository.findByFertilizerTypeIdOrderBySupplyDateDesc(typeId);
    }

    @Transactional
    public FertilizerSupply recordSupply(Long customerId, Long typeId, LocalDate supplyDate,
                                         BigDecimal bagSizeKg, Integer bagsCount, String notes) {
        Customer customer = customerService.getCustomerById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        FertilizerType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Fertilizer type not found"));

        FertilizerSupply supply = new FertilizerSupply();
        supply.setCustomer(customer);
        supply.setFertilizerType(type);
        supply.setSupplyDate(supplyDate);
        supply.setQuantityKg(bagSizeKg.multiply(BigDecimal.valueOf(bagsCount)));
        supply.setBagsCount(bagsCount);
        supply.setBagSizeKg(bagSizeKg);
        supply.setNotes(notes);

        return supplyRepository.save(supply);
    }

    public void deleteSupply(Long id) {
        supplyRepository.deleteById(id);
    }

    public BigDecimal getTotalSuppliedToCustomer(Long customerId, Long typeId) {
        return supplyRepository.getTotalSuppliedToCustomer(customerId, typeId);
    }
}
