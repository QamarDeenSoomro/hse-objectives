
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileText, BarChart3, Users, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  generateObjectiveSummaryData,
  generateProgressReportData,
  generateTeamPerformanceData,
  generateDailyWorkSummaryData,
  generateActivityTimelineData,
  ReportData,
  generatePDF,
  generateCSV,
  downloadFile
} from "@/utils/reportGenerator";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardTables } from "@/components/dashboard/DashboardTables";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";

const ReportsDashboard = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    objectives: any[];
    progress: any[];
    teamPerformance: any[];
    dailyWork: any[];
    activities: any[];
  }>({
    objectives: [],
    progress: [],
    teamPerformance: [],
    dailyWork: [],
    activities: []
  });

  // Get parameters from URL
  const dateFromStr = searchParams.get('dateFrom');
  const dateToStr = searchParams.get('dateTo');
  const selectedUser = searchParams.get('user') || '';
  
  const dateFrom = dateFromStr ? new Date(dateFromStr) : undefined;
  const dateTo = dateToStr ? new Date(dateToStr) : undefined;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [objectives, progress, teamPerformance, dailyWork, activities] = await Promise.all([
        generateObjectiveSummaryData(dateFrom, dateTo, selectedUser),
        generateProgressReportData(dateFrom, dateTo, selectedUser),
        generateTeamPerformanceData(dateFrom, dateTo, selectedUser),
        generateDailyWorkSummaryData(dateFrom, dateTo, selectedUser),
        generateActivityTimelineData(dateFrom, dateTo, selectedUser)
      ]);

      setDashboardData({
        objectives,
        progress,
        teamPerformance,
        dailyWork,
        activities
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDashboard = (format: 'pdf' | 'csv') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `dashboard-report-${timestamp}.${format}`;
      
      // Combine all data for export
      const combinedData = [
        ...dashboardData.objectives,
        ...dashboardData.progress,
        ...dashboardData.teamPerformance,
        ...dashboardData.dailyWork,
        ...dashboardData.activities
      ];

      const reportData: ReportData = {
        type: 'dashboard-report',
        dateFrom,
        dateTo,
        user: selectedUser,
        data: combinedData
      };

      if (format === 'csv') {
        const csvContent = generateCSV(reportData);
        downloadFile(csvContent, filename, 'csv');
      } else {
        const pdfDoc = generatePDF(reportData);
        downloadFile(pdfDoc, filename, 'pdf');
      }

      toast({
        title: "Success",
        description: `Dashboard exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to export dashboard: ${error?.message || error}`,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {dateFrom && dateTo && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(dateFrom, "MMM dd, yyyy")} - {format(dateTo, "MMM dd, yyyy")}</span>
                  </div>
                )}
                {selectedUser && selectedUser !== 'all-users' && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Filtered by user</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => handleExportDashboard('csv')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                onClick={() => handleExportDashboard('pdf')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
              <Button 
                onClick={() => window.print()}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metrics Overview */}
        <DashboardMetrics data={dashboardData} />

        {/* Charts Section */}
        <DashboardCharts data={dashboardData} />

        {/* Tables Section */}
        <DashboardTables data={dashboardData} />
      </div>
    </div>
  );
};

export default ReportsDashboard;
