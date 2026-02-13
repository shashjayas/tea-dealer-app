package com.teadealer.controller;

import com.teadealer.model.Invoice;
import com.teadealer.service.InvoicePdfService;
import com.teadealer.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private InvoicePdfService invoicePdfService;

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}/period/{year}/{month}")
    public ResponseEntity<Invoice> getInvoiceByCustomerAndPeriod(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        return invoiceService.getInvoiceByCustomerAndPeriod(customerId, year, month)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/period/{year}/{month}")
    public ResponseEntity<List<Invoice>> getInvoicesByPeriod(
            @PathVariable Integer year,
            @PathVariable Integer month) {
        return ResponseEntity.ok(invoiceService.getInvoicesByPeriod(year, month));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Invoice>> getInvoicesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByCustomer(customerId));
    }

    @GetMapping("/count/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getInvoiceCountByPeriod(
            @PathVariable Integer year,
            @PathVariable Integer month) {
        Map<String, Object> result = new HashMap<>();
        result.put("count", invoiceService.getInvoiceCountByPeriod(year, month));
        result.put("year", year);
        result.put("month", month);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/exists/{customerId}/{year}/{month}")
    public ResponseEntity<Map<String, Object>> checkInvoiceExists(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        Map<String, Object> result = new HashMap<>();
        result.put("exists", invoiceService.isInvoiceGenerated(customerId, year, month));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/generate/{customerId}/{year}/{month}")
    public ResponseEntity<?> generateInvoice(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        try {
            Invoice invoice = invoiceService.generateInvoice(customerId, year, month);
            return ResponseEntity.ok(invoice);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate-all/{year}/{month}")
    public ResponseEntity<?> generateAllInvoices(
            @PathVariable Integer year,
            @PathVariable Integer month) {
        try {
            List<Invoice> invoices = invoiceService.generateAllInvoicesForPeriod(year, month);
            Map<String, Object> result = new HashMap<>();
            result.put("generated", invoices.size());
            result.put("invoices", invoices);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/regenerate/{customerId}/{year}/{month}")
    public ResponseEntity<?> regenerateInvoice(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        try {
            Invoice invoice = invoiceService.regenerateInvoice(customerId, year, month);
            return ResponseEntity.ok(invoice);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateInvoiceStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusData) {
        try {
            String statusStr = statusData.get("status");
            Invoice.InvoiceStatus status = Invoice.InvoiceStatus.valueOf(statusStr);
            Invoice invoice = invoiceService.updateInvoiceStatus(id, status);
            return ResponseEntity.ok(invoice);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadInvoicePdf(@PathVariable Long id) {
        try {
            Invoice invoice = invoiceService.getInvoiceById(id)
                    .orElseThrow(() -> new RuntimeException("Invoice not found"));

            byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice);

            String filename = String.format("invoice_%s_%d_%02d.pdf",
                    invoice.getBookNumber(), invoice.getYear(), invoice.getMonth());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}/period/{year}/{month}/pdf")
    public ResponseEntity<?> downloadInvoicePdfByCustomerAndPeriod(
            @PathVariable Long customerId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        try {
            Invoice invoice = invoiceService.getInvoiceByCustomerAndPeriod(customerId, year, month)
                    .orElseThrow(() -> new RuntimeException("Invoice not found for this period"));

            byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice);

            String filename = String.format("invoice_%s_%d_%02d.pdf",
                    invoice.getBookNumber(), year, month);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}
