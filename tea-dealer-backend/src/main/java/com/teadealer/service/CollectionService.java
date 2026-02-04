package com.teadealer.service;

import com.teadealer.model.Collection;
import com.teadealer.model.TeaGrade;
import com.teadealer.repository.CollectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CollectionService {

    @Autowired
    private CollectionRepository collectionRepository;

    public List<Collection> getCollectionsByDate(LocalDate date) {
        return collectionRepository.findByCollectionDate(date);
    }

    public List<Collection> getCollectionsByDateRange(LocalDate startDate, LocalDate endDate) {
        return collectionRepository.findByCollectionDateBetween(startDate, endDate);
    }

    public List<Collection> getCollectionsByCustomer(Long customerId) {
        return collectionRepository.findByCustomerId(customerId);
    }

    public Optional<Collection> getCollectionByCustomerAndDate(Long customerId, LocalDate date) {
        return collectionRepository.findByCustomerIdAndCollectionDate(customerId, date);
    }

    public Optional<Collection> getCollectionByCustomerDateAndGrade(Long customerId, LocalDate date, TeaGrade grade) {
        return collectionRepository.findByCustomerIdAndCollectionDateAndGrade(customerId, date, grade);
    }

    public Collection saveCollection(Collection collection) {
        return collectionRepository.save(collection);
    }

    public void deleteCollection(Long id) {
        collectionRepository.deleteById(id);
    }

    // Book number-based methods
    public List<Collection> getCollectionsByBookNumber(String bookNumber) {
        return collectionRepository.findByBookNumber(bookNumber);
    }

    public Optional<Collection> getCollectionByBookNumberAndDate(String bookNumber, LocalDate date) {
        return collectionRepository.findByBookNumberAndCollectionDate(bookNumber, date);
    }

    public Optional<Collection> getCollectionByBookNumberDateAndGrade(String bookNumber, LocalDate date, TeaGrade grade) {
        return collectionRepository.findByBookNumberAndCollectionDateAndGrade(bookNumber, date, grade);
    }

    public List<Collection> getCollectionsByBookNumberAndDateRange(String bookNumber, LocalDate startDate, LocalDate endDate) {
        return collectionRepository.findByBookNumberAndCollectionDateBetween(bookNumber, startDate, endDate);
    }
}