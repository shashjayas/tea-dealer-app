package com.teadealer.repository;

import com.teadealer.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByCustomerIdAndYearAndMonth(Long customerId, Integer year, Integer month);

    Optional<Invoice> findByBookNumberAndYearAndMonth(String bookNumber, Integer year, Integer month);

    List<Invoice> findByYearAndMonth(Integer year, Integer month);

    List<Invoice> findByCustomerId(Long customerId);

    List<Invoice> findByBookNumber(String bookNumber);

    List<Invoice> findByYear(Integer year);

    List<Invoice> findByStatus(Invoice.InvoiceStatus status);

    List<Invoice> findByYearAndMonthAndStatus(Integer year, Integer month, Invoice.InvoiceStatus status);

    boolean existsByCustomerIdAndYearAndMonth(Long customerId, Integer year, Integer month);

    long countByYearAndMonth(Integer year, Integer month);
}
