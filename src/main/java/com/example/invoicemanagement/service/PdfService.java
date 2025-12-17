package com.example.invoicemanagement.service;

import com.example.invoicemanagement.model.Invoice;
import com.example.invoicemanagement.model.InvoiceLine;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfService {

    public byte[] generateInvoicePdf(Invoice invoice) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

            // Header
            Paragraph header = new Paragraph("INVOICE", headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);
            document.add(Chunk.NEWLINE);

            // Invoice Info
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);

            PdfPCell clientCell = new PdfPCell(new Phrase("Client:\n" + invoice.getClient().getName(), regularFont));
            clientCell.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(clientCell);

            PdfPCell invoiceDataCell = new PdfPCell(new Phrase(
                    "Invoice #: " + invoice.getId() + "\n" +
                            "Date: " + (invoice.getIssueDate() != null ? invoice.getIssueDate() : "N/A") + "\n" +
                            "Status: " + invoice.getStatus(),
                    regularFont));
            invoiceDataCell.setBorder(Rectangle.NO_BORDER);
            invoiceDataCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            infoTable.addCell(invoiceDataCell);

            document.add(infoTable);
            document.add(Chunk.NEWLINE);

            // Items Table
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 4, 2, 2, 2 });

            // Table Header
            table.addCell(createHeaderCell("Product", boldFont));
            table.addCell(createHeaderCell("Price", boldFont));
            table.addCell(createHeaderCell("Qty", boldFont));
            table.addCell(createHeaderCell("Total", boldFont));

            // Table Rows
            NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.US);
            if (invoice.getLines() != null) {
                for (InvoiceLine line : invoice.getLines()) {
                    table.addCell(new Phrase(line.getProduct().getName(), regularFont));
                    table.addCell(new Phrase(currency.format(line.getProduct().getPrice()), regularFont));
                    table.addCell(new Phrase(String.valueOf(line.getQuantity()), regularFont));
                    table.addCell(new Phrase(currency.format(
                            line.getProduct().getPrice().multiply(java.math.BigDecimal.valueOf(line.getQuantity()))),
                            regularFont));
                }
            }

            document.add(table);
            document.add(Chunk.NEWLINE);

            // Total
            Paragraph total = new Paragraph("Total Amount: " + currency.format(invoice.getAmount()), boldFont);
            total.setAlignment(Element.ALIGN_RIGHT);
            document.add(total);

            document.close();
            return out.toByteArray();
        }
    }

    private PdfPCell createHeaderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
        cell.setPadding(5);
        return cell;
    }
}
