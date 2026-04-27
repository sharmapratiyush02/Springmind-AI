package com.springmind.ai.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.springmind.ai.model.Ticket;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PdfReportService {

    public byte[] buildProgressReport(String recipientName, List<Ticket> tickets, LocalDateTime timestamp) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            document.add(new Paragraph("SpringMind Ticket Progress Report", titleFont));
            document.add(new Paragraph("Recipient: " + recipientName, normalFont));
            document.add(new Paragraph("Generated at: " + timestamp, normalFont));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(new float[] { 1.4f, 2.4f, 1.3f, 3.2f, 2f });
            table.setWidthPercentage(100);
            addHeader(table, "Ticket ID");
            addHeader(table, "Title");
            addHeader(table, "Status");
            addHeader(table, "Progress updates");
            addHeader(table, "Timestamp");

            if (tickets.isEmpty()) {
                table.addCell("None");
                table.addCell("No active tickets");
                table.addCell("-");
                table.addCell("There are no ticket updates for this reporting window.");
                table.addCell(timestamp.toString());
            } else {
                for (Ticket ticket : tickets) {
                    table.addCell(value(ticket.getTicketNumber()));
                    table.addCell(value(ticket.getTitle()));
                    table.addCell(ticket.getStatus() != null ? ticket.getStatus().name() : "UNKNOWN");
                    table.addCell(progressText(ticket));
                    table.addCell(timestamp.toString());
                }
            }
            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not generate progress PDF", e);
        }
    }

    private void addHeader(PdfPTable table, String value) {
        Phrase phrase = new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10));
        table.addCell(phrase);
    }

    private String progressText(Ticket ticket) {
        StringBuilder progress = new StringBuilder();
        progress.append("Priority: ").append(ticket.getPriority() != null ? ticket.getPriority().name() : "MEDIUM");
        progress.append("; SLA deadline: ").append(ticket.getSlaDeadline() != null ? ticket.getSlaDeadline() : "not set");
        progress.append("; Last updated: ").append(ticket.getUpdatedAt() != null ? ticket.getUpdatedAt() : ticket.getCreatedAt());
        if (ticket.getResolvedAt() != null) {
            progress.append("; Resolved at: ").append(ticket.getResolvedAt());
        }
        return progress.toString();
    }

    private String value(String value) {
        return value != null ? value : "";
    }
}
