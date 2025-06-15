
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ReportData {
  type: string;
  dateFrom?: Date;
  dateTo?: Date;
  user?: string;
  data: any[];
}

// Mock data generator for demonstration
const generateMockData = (reportType: string, dateFrom?: Date, dateTo?: Date) => {
  const mockData = [];
  const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateTo || new Date();
  
  switch (reportType) {
    case 'objectives-summary':
      for (let i = 0; i < 10; i++) {
        mockData.push({
          id: `OBJ-${String(i + 1).padStart(3, '0')}`,
          title: `HSE Objective ${i + 1}`,
          status: ['Completed', 'In Progress', 'Pending'][Math.floor(Math.random() * 3)],
          progress: Math.floor(Math.random() * 100),
          dueDate: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())),
          assignee: ['John Doe', 'Jane Smith', 'Mike Johnson'][Math.floor(Math.random() * 3)]
        });
      }
      break;
    case 'progress-report':
      for (let i = 0; i < 15; i++) {
        mockData.push({
          date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())),
          activity: `Safety Training Session ${i + 1}`,
          completion: Math.floor(Math.random() * 100),
          notes: `Progress notes for activity ${i + 1}`
        });
      }
      break;
    case 'team-performance':
      for (let i = 0; i < 8; i++) {
        mockData.push({
          teamMember: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown', 'Lisa Davis', 'Mark Taylor', 'Emily Clark'][i],
          completedObjectives: Math.floor(Math.random() * 10) + 1,
          pendingObjectives: Math.floor(Math.random() * 5),
          efficiency: Math.floor(Math.random() * 40) + 60,
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }
      break;
    default:
      mockData.push({ message: 'No data available for this report type' });
  }
  
  return mockData;
};

export const generateCSV = (reportData: ReportData): string => {
  const { type, data } = reportData;
  
  if (!data || data.length === 0) {
    return 'No data available';
  }
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => {
      if (value instanceof Date) {
        return `"${value.toLocaleDateString()}"`;
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export const generatePDF = (reportData: ReportData): jsPDF => {
  const { type, dateFrom, dateTo, data } = reportData;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('HSE Report', 20, 20);
  
  // Add report details
  doc.setFontSize(12);
  doc.text(`Report Type: ${type.replace(/-/g, ' ').toUpperCase()}`, 20, 35);
  
  if (dateFrom && dateTo) {
    doc.text(`Period: ${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`, 20, 45);
  }
  
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
  
  // Add table data
  if (data && data.length > 0) {
    const tableData = data.map(row => Object.values(row).map(value => {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
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
};

export const downloadFile = (content: string | jsPDF, filename: string, type: 'csv' | 'pdf') => {
  if (type === 'pdf' && content instanceof jsPDF) {
    content.save(filename);
    return;
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

export const generateReportData = async (
  reportType: string, 
  dateFrom?: Date, 
  dateTo?: Date, 
  selectedUser?: string
): Promise<ReportData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const data = generateMockData(reportType, dateFrom, dateTo);
  
  return {
    type: reportType,
    dateFrom,
    dateTo,
    user: selectedUser,
    data
  };
};
