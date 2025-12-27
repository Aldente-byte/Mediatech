package com.example.invoicemanagement.service;

import com.example.invoicemanagement.dto.InvoiceLineRequest;
import com.example.invoicemanagement.dto.InvoiceRequest;
import com.example.invoicemanagement.model.Client;
import com.example.invoicemanagement.model.Invoice;
import com.example.invoicemanagement.model.InvoiceLine;
import com.example.invoicemanagement.model.Product;
import com.example.invoicemanagement.repository.ClientRepository;
import com.example.invoicemanagement.repository.InvoiceRepository;
import com.example.invoicemanagement.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final ProductRepository productRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
            ClientRepository clientRepository,
            ProductRepository productRepository) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.productRepository = productRepository;
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public List<Invoice> getInvoicesByClientId(Long clientId) {
        return invoiceRepository.findByClientId(clientId);
    }

    public Optional<Invoice> getInvoiceById(Long id) {
        return invoiceRepository.findById(id);
    }

    @Transactional
    public Invoice createInvoiceComplex(InvoiceRequest request) {
        Invoice invoice = new Invoice();
        invoice.setIssueDate(request.getIssueDate() != null ? request.getIssueDate() : java.time.LocalDate.now());
        invoice.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
        invoice.setClient(client);

        BigDecimal totalAmount = BigDecimal.ZERO;
        if (request.getLines() != null) {
            for (InvoiceLineRequest lineReq : request.getLines()) {
                Product product = productRepository.findById(lineReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

                if (product.getStock() < lineReq.getQuantity()) {
                    throw new RuntimeException("Stock insuffisant pour le produit: " + product.getName());
                }
                product.setStock(product.getStock() - lineReq.getQuantity());
                productRepository.save(product);

                InvoiceLine line = new InvoiceLine();
                line.setProduct(product);
                line.setQuantity(lineReq.getQuantity());
                invoice.addLine(line);

                BigDecimal lineAmount = product.getPrice().multiply(new BigDecimal(lineReq.getQuantity()));
                totalAmount = totalAmount.add(lineAmount);
            }
        }
        invoice.setAmount(totalAmount);

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateInvoice(Long id, InvoiceRequest request) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    if (request.getClientId() != null) {
                        Client client = clientRepository.findById(request.getClientId())
                                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
                        invoice.setClient(client);
                    }

                    if (request.getIssueDate() != null)
                        invoice.setIssueDate(request.getIssueDate());
                    if (request.getStatus() != null)
                        invoice.setStatus(request.getStatus());

                    // Pour simplifier, on ne gère pas la mise à jour fine des lignes ici pour
                    // l'instant
                    // On pourrait ajouter une logique pour vider/remplacer si nécessaire

                    return invoiceRepository.save(invoice);
                })
                .orElse(null);
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 5000) // Every 5 seconds (Faster for demo)
    public void processPendingInvoices() {
        List<Invoice> allInvoices = invoiceRepository.findAll();

        for (Invoice invoice : allInvoices) {
            boolean changed = false;

            // Heal: Fix missing data from old version
            if (invoice.getIssueDate() == null) {
                invoice.setIssueDate(java.time.LocalDate.now());
                changed = true;
            }
            if (invoice.getStatus() == null) {
                invoice.setStatus("PENDING");
                changed = true;
            }

            // Auto-Pay Logic for PENDING invoices
            if ("PENDING".equals(invoice.getStatus())) {
                // 80% chance to pay each cycle
                if (Math.random() > 0.2) {
                    invoice.setStatus("PAID");
                    changed = true;
                    System.out.println("Auto-Paid Invoice #" + invoice.getId());
                }
            }

            if (changed) {
                invoiceRepository.save(invoice);
            }
        }
    }

    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
}
