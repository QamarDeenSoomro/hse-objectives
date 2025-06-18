import { generateCSV } from "./csvGenerator";
import { generatePDF } from "./pdfGenerator";
import { downloadFile } from "./downloadFile";
import { generateObjectiveSummaryData } from "./objectiveSummary";
import { generateProgressReportData } from "./progressReport";
import { generateTeamPerformanceData } from "./teamPerformance";
import { generateDailyWorkSummaryData } from "./dailyWorkSummary";
import { generateActivityTimelineData } from "./activityTimeline";
import { generateActionItemsReportData } from "./actionItemsReport";

export interface ReportData {
  type: string;
  dateFrom?: Date;
  dateTo?: Date;
  user?: string;
  data: any[];
}

export {
  generateCSV,
  generatePDF,
  downloadFile,
  generateObjectiveSummaryData,
  generateProgressReportData,
  generateTeamPerformanceData,
  generateDailyWorkSummaryData,
  generateActivityTimelineData,
  generateActionItemsReportData,
};