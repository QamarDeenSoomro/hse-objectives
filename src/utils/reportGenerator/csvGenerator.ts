
import type { ReportData } from "./index";

export const generateCSV = (reportData: ReportData): string => {
  const { data } = reportData;
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
