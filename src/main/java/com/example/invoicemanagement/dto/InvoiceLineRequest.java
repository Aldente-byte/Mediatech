package com.example.invoicemanagement.dto;

import lombok.Data;

@Data
public class InvoiceLineRequest {
    private Long productId;
    private Integer quantity;
}
