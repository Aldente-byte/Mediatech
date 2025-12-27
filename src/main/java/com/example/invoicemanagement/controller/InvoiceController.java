package com.example.invoicemanagement.controller;

import com.example.invoicemanagement.model.Invoice;
import com.example.invoicemanagement.model.User;
import com.example.invoicemanagement.repository.UserRepository;
import com.example.invoicemanagement.service.InvoiceService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final com.example.invoicemanagement.service.PdfService pdfService;
    private final UserRepository userRepository;

    public InvoiceController(InvoiceService invoiceService,
            com.example.invoicemanagement.service.PdfService pdfService,
            UserRepository userRepository) {
        this.invoiceService = invoiceService;
        this.pdfService = pdfService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Invoice> getAllInvoices() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            
            // If user is not admin, return only their invoices
            if (user != null && !"ROLE_ADMIN".equals(user.getRole()) && user.getClient() != null) {
                return invoiceService.getInvoicesByClientId(user.getClient().getId());
            }
        }
        // Admin or no auth - return all invoices
        return invoiceService.getAllInvoices();
    }

    @GetMapping("/my-invoices")
    public ResponseEntity<List<Invoice>> getMyInvoices() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getClient() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(invoiceService.getInvoicesByClientId(user.getClient().getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        java.util.Optional<Invoice> invoiceOpt = invoiceService.getInvoiceById(id);
        if (invoiceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Invoice invoice = invoiceOpt.get();
        
        // Security check: users can only view their own invoices (unless admin)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            
            if (user != null && !"ROLE_ADMIN".equals(user.getRole())) {
                if (user.getClient() == null || !user.getClient().getId().equals(invoice.getClient().getId())) {
                    return ResponseEntity.status(403).build();
                }
            }
        }

        return ResponseEntity.ok(invoice);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id) {
        java.util.Optional<Invoice> invoiceOpt = invoiceService.getInvoiceById(id);
        if (invoiceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Invoice invoice = invoiceOpt.get();
        
        // Security check: users can only download their own invoices (unless admin)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            
            if (user != null && !"ROLE_ADMIN".equals(user.getRole())) {
                if (user.getClient() == null || !user.getClient().getId().equals(invoice.getClient().getId())) {
                    return ResponseEntity.status(403).build();
                }
            }
        }

        try {
            byte[] pdfBytes = pdfService.generateInvoicePdf(invoice);
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=invoice_" + id + ".pdf")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public Invoice createInvoice(@RequestBody com.example.invoicemanagement.dto.InvoiceRequest invoiceRequest) {
        return invoiceService.createInvoiceComplex(invoiceRequest);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id,
            @RequestBody com.example.invoicemanagement.dto.InvoiceRequest invoiceDetails) {
        Invoice updatedInvoice = invoiceService.updateInvoice(id, invoiceDetails);
        if (updatedInvoice != null) {
            return ResponseEntity.ok(updatedInvoice);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}
