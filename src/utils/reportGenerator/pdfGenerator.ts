
import jsPDF from 'jspdf';
// Ensure jsPDF is imported before autotable!
import 'jspdf-autotable';
import type { ReportData } from "./index";

export const generatePDF = (reportData: ReportData): jsPDF => {
  const { type, dateFrom, dateTo, data } = reportData;
  const doc = new jsPDF();

  // Defensive: check autoTable attached
  if (typeof (doc as any).autoTable !== 'function') {
    throw new Error("jsPDF autoTable plugin is not attached! PDF export cannot continue.");
  }

  try {
    doc.setFontSize(20);
    doc.text('HSE Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Report Type: ${type.replace(/-/g, ' ').toUpperCase()}`, 20, 35);
    if (dateFrom && dateTo) {
      doc.text(`Period: ${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`, 20, 45);
    }
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);

    if (data && data.length > 0) {
      const tableData = data.map(row => Object.values(row).map(value => {
        if (value instanceof Date) return value.toLocaleDateString();
        return String(value);
      }));
      const tableHeaders = Object.keys(data[0]).map(header =>
        header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      );
      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 70,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }
    return doc;
  } catch (err) {
    console.error("[generatePDF] PDF generation failed:", err);
    throw err;
  }
};
