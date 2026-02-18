package com.teadealer.service;

import com.teadealer.model.Customer;
import com.teadealer.model.TeaPacketStock;
import com.teadealer.model.TeaPacketSupply;
import com.teadealer.model.TeaPacketType;
import com.teadealer.repository.TeaPacketStockRepository;
import com.teadealer.repository.TeaPacketSupplyRepository;
import com.teadealer.repository.TeaPacketTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TeaPacketService {

    @Autowired
    private TeaPacketStockRepository stockRepository;

    @Autowired
    private TeaPacketSupplyRepository supplyRepository;

    @Autowired
    private TeaPacketTypeRepository typeRepository;

    @Autowired
    private CustomerService customerService;

    // ============ Tea Packet Type Methods ============

    public List<TeaPacketType> getAllTeaPacketTypes() {
        return typeRepository.findAll();
    }

    public List<TeaPacketType> getActiveTeaPacketTypes() {
        return typeRepository.findByActiveTrueOrderByNameAsc();
    }

    public Optional<TeaPacketType> getTeaPacketTypeById(Long id) {
        return typeRepository.findById(id);
    }

    public TeaPacketType createTeaPacketType(TeaPacketType type) {
        return typeRepository.save(type);
    }

    @Transactional
    public TeaPacketType updateTeaPacketType(Long id, TeaPacketType updatedType) {
        TeaPacketType type = typeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tea packet type not found"));
        type.setName(updatedType.getName());
        type.setPacketWeights(updatedType.getPacketWeights());
        type.setUnit(updatedType.getUnit());
        type.setActive(updatedType.getActive());
        return typeRepository.save(type);
    }

    public void deleteTeaPacketType(Long id) {
        typeRepository.deleteById(id);
    }

    // ============ Stock Methods ============

    public Map<String, Object> getStockSummary(Integer year, Integer month) {
        Integer totalStock = stockRepository.getTotalStockUpToMonth(year, month);
        Integer totalSupplied = supplyRepository.getTotalSuppliedUpToMonth(year, month);
        List<TeaPacketStock> stockList = stockRepository.findByYearAndMonth(year, month);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPackets", totalStock != null ? totalStock : 0);
        summary.put("availablePackets", (totalStock != null ? totalStock : 0) - (totalSupplied != null ? totalSupplied : 0));
        summary.put("stockList", stockList);
        return summary;
    }

    @Transactional
    public TeaPacketStock addStock(Long typeId, Integer year, Integer month, BigDecimal packetWeightGrams, Integer packetsCount, String notes) {
        TeaPacketType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Tea packet type not found"));

        // Find existing stock for this type, weight, and period
        Optional<TeaPacketStock> existingStock = stockRepository.findByYearAndMonthAndTeaPacketTypeIdAndPacketWeightGrams(
                year, month, typeId, packetWeightGrams);

        TeaPacketStock stock;
        if (existingStock.isPresent()) {
            stock = existingStock.get();
            stock.setPacketsAdded(stock.getPacketsAdded() + packetsCount);
            if (notes != null && !notes.isEmpty()) {
                stock.setNotes(stock.getNotes() != null ? stock.getNotes() + "; " + notes : notes);
            }
        } else {
            stock = new TeaPacketStock();
            stock.setTeaPacketType(type);
            stock.setYear(year);
            stock.setMonth(month);
            stock.setPacketWeightGrams(packetWeightGrams);
            stock.setPacketsAdded(packetsCount);
            stock.setNotes(notes);
        }

        return stockRepository.save(stock);
    }

    public Integer getAvailableStock(Integer year, Integer month) {
        Integer totalStock = stockRepository.getTotalStockUpToMonth(year, month);
        Integer totalSupplied = supplyRepository.getTotalSuppliedUpToMonth(year, month);
        return (totalStock != null ? totalStock : 0) - (totalSupplied != null ? totalSupplied : 0);
    }

    public void deleteStock(Long id) {
        stockRepository.deleteById(id);
    }

    public Integer getAvailablePacketsByTypeAndWeight(Long typeId, BigDecimal packetWeightGrams, Integer year, Integer month) {
        Integer totalPackets = stockRepository.getTotalPacketsByTypeAndWeightUpToMonth(typeId, packetWeightGrams, year, month);
        Integer suppliedPackets = supplyRepository.getTotalSuppliedByTypeAndWeightUpToMonth(typeId, packetWeightGrams, year, month);
        return (totalPackets != null ? totalPackets : 0) - (suppliedPackets != null ? suppliedPackets : 0);
    }

    // ============ Supply Methods ============

    public List<TeaPacketSupply> getSuppliesByPeriod(Integer year, Integer month) {
        return supplyRepository.findByYearAndMonth(year, month);
    }

    public List<TeaPacketSupply> getSuppliesByCustomer(Long customerId) {
        return supplyRepository.findByCustomerIdOrderBySupplyDateDesc(customerId);
    }

    @Transactional
    public TeaPacketSupply recordSupply(Long customerId, LocalDate supplyDate, Integer packetsCount, String notes) {
        return recordSupply(customerId, null, supplyDate, packetsCount, null, notes);
    }

    @Transactional
    public TeaPacketSupply recordSupply(Long customerId, Long typeId, LocalDate supplyDate,
                                         Integer packetsCount, BigDecimal packetWeightGrams, String notes) {
        Customer customer = customerService.getCustomerById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        TeaPacketSupply supply = new TeaPacketSupply();
        supply.setCustomer(customer);
        supply.setSupplyDate(supplyDate);
        supply.setPacketsCount(packetsCount);
        supply.setNotes(notes);

        if (typeId != null) {
            TeaPacketType type = typeRepository.findById(typeId)
                    .orElseThrow(() -> new RuntimeException("Tea packet type not found"));
            supply.setTeaPacketType(type);
        }

        if (packetWeightGrams != null) {
            supply.setPacketWeightGrams(packetWeightGrams);
            supply.setTotalWeightGrams(packetWeightGrams.multiply(BigDecimal.valueOf(packetsCount)));
        }

        return supplyRepository.save(supply);
    }

    public void deleteSupply(Long id) {
        supplyRepository.deleteById(id);
    }

    public Integer getTotalSuppliedToCustomerInMonth(Long customerId, Integer year, Integer month) {
        Integer total = supplyRepository.getTotalSuppliedToCustomerInMonth(customerId, year, month);
        return total != null ? total : 0;
    }
}
