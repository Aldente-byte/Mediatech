package com.example.invoicemanagement.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class InvoiceRequest {
    private Long clientId;
    private LocalDate issueDate;
    private String status;
    private List<InvoiceLineRequest> lines;
}
