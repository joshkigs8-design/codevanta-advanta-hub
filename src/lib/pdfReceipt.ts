import { jsPDF } from "jspdf";

export interface ReceiptPdfData {
  reference: string;
  planName: string;
  planSlug: string;
  amountKes: number;
  customerName?: string;
  customerEmail?: string;
  phoneNumber?: string;
  date?: string;
}

export function downloadReceiptPdf(data: ReceiptPdfData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 175], // Clean compact thermal receipt slip dimensions
  });

  const pageWidth = 105;

  // Header gold accent line
  doc.setFillColor(217, 176, 54); // CodeVanta Gold
  doc.rect(0, 0, pageWidth, 4, "F");

  // CodeVanta Ventures Brand Header
  doc.setFont("courier", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text("CODEVANTA ADVANTA HUB", pageWidth / 2, 13, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text("CodeVanta Ventures • Nairobi, Kenya", pageWidth / 2, 18, { align: "center" });
  doc.text("www.codevanta.online • support@codevanta.online", pageWidth / 2, 22, { align: "center" });

  // Dashed separator line
  doc.setDrawColor(209, 213, 219);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(8, 26, pageWidth - 8, 26);

  // Title
  doc.setFont("courier", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text("OFFICIAL PAYMENT RECEIPT", pageWidth / 2, 32, { align: "center" });

  // Metadata block
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);

  const formattedDate =
    data.date ||
    new Date().toLocaleString("en-GB", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const startY = 38;
  const lineSpacing = 4.5;

  doc.text(`Receipt Ref: ${data.reference}`, 8, startY);
  doc.text(`Date/Time:   ${formattedDate} EAT`, 8, startY + lineSpacing);
  doc.text(`Provider:    Safaricom M-Pesa / Paystack`, 8, startY + lineSpacing * 2);
  doc.text(`Customer:    ${data.customerName || "Member"}`, 8, startY + lineSpacing * 3);
  doc.text(`Email:       ${data.customerEmail || "N/A"}`, 8, startY + lineSpacing * 4);
  if (data.phoneNumber) {
    doc.text(`M-Pesa Tel:  ${data.phoneNumber}`, 8, startY + lineSpacing * 5);
  }

  // Separator
  const tableY = startY + lineSpacing * 6 + 1;
  doc.line(8, tableY, pageWidth - 8, tableY);

  // Line Items
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.text("DESCRIPTION", 8, tableY + 5);
  doc.text("AMOUNT", pageWidth - 8, tableY + 5, { align: "right" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.text(`${data.planName} (Lifetime Access)`, 8, tableY + 11);
  doc.text(`KES ${data.amountKes.toFixed(2)}`, pageWidth - 8, tableY + 11, { align: "right" });

  doc.text("VAT / Processing Fee (0%)", 8, tableY + 16);
  doc.text("KES 0.00", pageWidth - 8, tableY + 16, { align: "right" });

  // Separator
  const totalY = tableY + 21;
  doc.line(8, totalY, pageWidth - 8, totalY);

  // Total
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL PAID:", 8, totalY + 6);
  doc.text(`KES ${data.amountKes.toFixed(2)}`, pageWidth - 8, totalY + 6, { align: "right" });

  // Verified Stamp Box
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(16, 185, 129); // Emerald green
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(8, totalY + 11, pageWidth - 16, 12, 1.5, 1.5, "FD");

  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text("✓ STATUS: PAID & VERIFIED", pageWidth / 2, totalY + 16, { align: "center" });
  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(75, 85, 99);
  doc.text("Lifetime Entitlements & Member Access Active", pageWidth / 2, totalY + 20, { align: "center" });

  // Footer notes
  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(156, 163, 175);
  doc.text("One-time lifetime investment. Zero recurring monthly fees.", pageWidth / 2, totalY + 27, { align: "center" });
  doc.text("Thank you for choosing CodeVanta Advanta Hub!", pageWidth / 2, totalY + 31, { align: "center" });

  // Bottom gold bar
  doc.setFillColor(217, 176, 54);
  doc.rect(0, 171, pageWidth, 4, "F");

  doc.save(`CodeVanta-Receipt-${data.reference.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
}

