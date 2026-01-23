package com.teadealer.repository;

import com.teadealer.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByBookNumber(String bookNumber);
    List<Customer> findByRoute(String route);
    List<Customer> findByGrowerNameEnglishContainingIgnoreCase(String name);
}