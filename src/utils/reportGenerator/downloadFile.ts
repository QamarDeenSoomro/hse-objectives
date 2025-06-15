
import jsPDF from "jspdf";

export const downloadFile = (content: string | jsPDF, filename: string, type: 'csv' | 'pdf') => {
  if (type === 'pdf' && content instanceof jsPDF) {
    try {
      content.save(filename);
      return;
    } catch (err) {
      console.error("[downloadFile] PDF save failed:", err);
      throw err;
    }
  }
  if (type === 'csv' && typeof content === 'string') {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
};
