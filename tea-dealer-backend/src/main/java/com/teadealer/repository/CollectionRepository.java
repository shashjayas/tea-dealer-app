package com.teadealer.repository;

import com.teadealer.model.Collection;
import com.teadealer.model.TeaGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByCollectionDate(LocalDate date);
    List<Collection> findByCollectionDateBetween(LocalDate startDate, LocalDate endDate);
    List<Collection> findByCustomerId(Long customerId);
    Optional<Collection> findByCustomerIdAndCollectionDate(Long customerId, LocalDate date);
    Optional<Collection> findByCustomerIdAndCollectionDateAndGrade(Long customerId, LocalDate date, TeaGrade grade);
    List<Collection> findByCustomerIdAndCollectionDateBetween(Long customerId, LocalDate startDate, LocalDate endDate);
}