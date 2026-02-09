package com.teadealer.service;

import com.teadealer.model.Customer;
import com.teadealer.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Optional<Customer> getCustomerByBookNumber(String bookNumber) {
        return customerRepository.findByBookNumber(bookNumber);
    }

    public List<Customer> getCustomersByRoute(String route) {
        return customerRepository.findByRoute(route);
    }

    public List<Customer> searchCustomers(String name) {
        return customerRepository.findByGrowerNameEnglishContainingIgnoreCase(name);
    }

    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer customerDetails) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        customer.setBookNumber(customerDetails.getBookNumber());
        customer.setGrowerNameSinhala(customerDetails.getGrowerNameSinhala());
        customer.setGrowerNameEnglish(customerDetails.getGrowerNameEnglish());
        customer.setAddress(customerDetails.getAddress());
        customer.setNic(customerDetails.getNic());
        customer.setLandName(customerDetails.getLandName());
        customer.setContactNumber(customerDetails.getContactNumber());
        customer.setRoute(customerDetails.getRoute());
        customer.setTransportExempt(customerDetails.getTransportExempt() != null ? customerDetails.getTransportExempt() : false);

        return customerRepository.save(customer);
    }

    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }
}