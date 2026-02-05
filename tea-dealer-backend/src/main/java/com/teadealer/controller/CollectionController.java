package com.teadealer.controller;

import com.teadealer.model.Collection;
import com.teadealer.model.Customer;
import com.teadealer.model.TeaGrade;
import com.teadealer.service.CollectionService;
import com.teadealer.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private CustomerService customerService;
    
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Collection>> getCollectionsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(collectionService.getCollectionsByDate(date));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Collection>> getCollectionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(collectionService.getCollectionsByDateRange(startDate, endDate));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Collection>> getCollectionsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(collectionService.getCollectionsByCustomer(customerId));
    }

    @GetMapping("/book-number/{bookNumber}")
    public ResponseEntity<List<Collection>> getCollectionsByBookNumber(@PathVariable String bookNumber) {
        return ResponseEntity.ok(collectionService.getCollectionsByBookNumber(bookNumber));
    }

    @GetMapping("/book-number/{bookNumber}/date-range")
    public ResponseEntity<List<Collection>> getCollectionsByBookNumberAndDateRange(
            @PathVariable String bookNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(collectionService.getCollectionsByBookNumberAndDateRange(bookNumber, startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<?> saveCollection(@RequestBody Map<String, Object> collectionData) {
        try {
            Long customerId = Long.valueOf(collectionData.get("customerId").toString());
            LocalDate date = LocalDate.parse(collectionData.get("collectionDate").toString());
            Double weightKg = Double.valueOf(collectionData.get("weightKg").toString());
            Double ratePerKg = collectionData.get("ratePerKg") != null ?
                Double.valueOf(collectionData.get("ratePerKg").toString()) : 180.0;

            // Parse grade, default to GRADE_2 if not provided
            TeaGrade grade = TeaGrade.GRADE_2;
            if (collectionData.get("grade") != null) {
                try {
                    grade = TeaGrade.valueOf(collectionData.get("grade").toString());
                } catch (IllegalArgumentException e) {
                    // If invalid grade is provided, use default GRADE_2
                    grade = TeaGrade.GRADE_2;
                }
            }

            Customer customer = customerService.getCustomerById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

            String bookNumber = customer.getBookNumber();

            // Look for existing collection with same book number, date, and grade
            Collection collection = collectionService.getCollectionByBookNumberDateAndGrade(bookNumber, date, grade)
                .orElse(new Collection());

            collection.setCustomer(customer);
            collection.setBookNumber(bookNumber);
            collection.setCollectionDate(date);
            collection.setGrade(grade);
            collection.setWeightKg(java.math.BigDecimal.valueOf(weightKg));
            collection.setRatePerKg(java.math.BigDecimal.valueOf(ratePerKg));

            if (collectionData.get("notes") != null) {
                collection.setNotes(collectionData.get("notes").toString());
            }

            Collection saved = collectionService.saveCollection(collection);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }
}