import { jsPDF } from "jspdf";

export interface PdfExportOptions {
  title: string;
  category?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  lastVerifiedDate?: string;
  summary?: string;
  prerequisites?: string[];
  content: string;
  slug: string;
}

export function generateAndDownloadPdf(options: PdfExportOptions): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      cursorY = margin + 12; // Leave room for running header
    }
  };

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, cursorY, contentWidth, 38, "F");

  // Brand Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55); // hub-gold
  doc.text("CODEVANTA ADVANTA HUB • ENGINEERING GUIDE", margin + 6, cursorY + 8);

  // Category & Difficulty Pill
  const metaText = [
    options.category ? options.category.toUpperCase().replace("-", " ") : "DEVELOPER GUIDE",
    options.difficulty ? `${options.difficulty.toUpperCase()} LEVEL` : "VERIFIED",
    options.estimatedMinutes ? `${options.estimatedMinutes} MIN READ` : null,
  ].filter(Boolean).join("  •  ");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(metaText, margin + 6, cursorY + 15);

  // Guide Title inside Banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(options.title, contentWidth - 12);
  doc.text(titleLines.slice(0, 2), margin + 6, cursorY + 23);

  cursorY += 44;

  // Summary Box if present
  if (options.summary) {
    checkPageBreak(25);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const summaryLines = doc.splitTextToSize(options.summary, contentWidth - 12);
    const boxHeight = summaryLines.length * 5 + 10;
    doc.roundedRect(margin, cursorY, contentWidth, boxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Executive Summary:", margin + 5, cursorY + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(summaryLines, margin + 5, cursorY + 12);
    cursorY += boxHeight + 6;
  }

  // Prerequisites if present
  if (options.prerequisites && options.prerequisites.length > 0) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Prerequisites & Dependencies:", margin, cursorY);
    cursorY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    for (const prereq of options.prerequisites) {
      checkPageBreak(5);
      doc.text(`• ${prereq}`, margin + 4, cursorY);
      cursorY += 4.5;
    }
    cursorY += 4;
  }

  // Parse and Render Markdown Body Content
  const rawLines = options.content.split("\n");
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Toggle Code Blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // Render accumulated code block
        inCodeBlock = false;
        if (codeBuffer.length > 0) {
          doc.setFont("courier", "normal");
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);

          const codeBlockHeight = codeBuffer.length * 4.2 + 6;
          checkPageBreak(Math.min(codeBlockHeight, 35));

          doc.setFillColor(241, 245, 249); // slate-100
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.roundedRect(margin, cursorY - 1, contentWidth, codeBlockHeight, 1.5, 1.5, "FD");

          for (const codeLine of codeBuffer) {
            checkPageBreak(5);
            doc.text(codeLine, margin + 4, cursorY + 3);
            cursorY += 4.2;
          }
          cursorY += 5;
          codeBuffer = [];
        }
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Empty Lines
    if (!line.trim()) {
      cursorY += 3;
      continue;
    }

    // H1 / H2 Headings
    if (line.startsWith("# ") || line.startsWith("## ")) {
      const headingText = line.replace(/^#{1,2}\s+/, "").replace(/\*\*/g, "").trim();
      checkPageBreak(16);
      cursorY += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(headingText, margin, cursorY);

      // Gold accent underline
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(margin, cursorY + 1.5, margin + 35, cursorY + 1.5);

      cursorY += 7;
      continue;
    }

    // H3 Headings
    if (line.startsWith("### ")) {
      const subHeading = line.replace(/^###\s+/, "").replace(/\*\*/g, "").trim();
      checkPageBreak(12);
      cursorY += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);
      doc.text(subHeading, margin, cursorY);
      cursorY += 6;
      continue;
    }

    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const bulletText = line.trim().replace(/^[-*]\s+/, "").replace(/\*\*/g, "");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitBullets = doc.splitTextToSize(bulletText, contentWidth - 8);
      checkPageBreak(splitBullets.length * 4.5 + 2);
      doc.text("•", margin + 2, cursorY);
      doc.text(splitBullets, margin + 6, cursorY);
      cursorY += splitBullets.length * 4.5 + 1;
      continue;
    }

    // Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const numPrefix = `${numMatch[1]}.`;
      const numText = numMatch[2].replace(/\*\*/g, "");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitNum = doc.splitTextToSize(numText, contentWidth - 8);
      checkPageBreak(splitNum.length * 4.5 + 2);
      doc.setFont("helvetica", "bold");
      doc.text(numPrefix, margin + 2, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(splitNum, margin + 7, cursorY);
      cursorY += splitNum.length * 4.5 + 1;
      continue;
    }

    // Standard Paragraph
    const cleanParagraph = line.replace(/\*\*/g, "").trim();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const paraLines = doc.splitTextToSize(cleanParagraph, contentWidth);
    checkPageBreak(paraLines.length * 4.5 + 2);
    doc.text(paraLines, margin, cursorY);
    cursorY += paraLines.length * 4.5 + 2;
  }

  // Flush remaining code block if file ended inside code
  if (inCodeBlock && codeBuffer.length > 0) {
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    for (const codeLine of codeBuffer) {
      checkPageBreak(5);
      doc.text(codeLine, margin + 4, cursorY + 3);
      cursorY += 4.2;
    }
  }

  // Running Headers & Footers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Running Header (pages > 1)
    if (p > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "CodeVanta Advanta Hub • Developer Publication",
        margin,
        margin - 4
      );
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, margin - 2, pageWidth - margin, margin - 2);
    }

    // Running Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "https://www.codevanta.online • Clean Developer Curation",
      margin,
      pageHeight - margin + 6
    );

    const pageStr = `Page ${p} of ${totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - margin - pageStrWidth, pageHeight - margin + 6);
  }

  // Trigger Immediate Browser File Download
  const filename = `${options.slug || "codevanta-guide"}-guide.pdf`;
  doc.save(filename);
}

