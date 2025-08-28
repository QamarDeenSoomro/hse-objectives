import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, BarChart3, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ReportData,
  generateCSV,
  generatePDF,
  downloadFile,
  generateObjectiveSummaryData,
  generateProgressReportData,
  generateTeamPerformanceData,
  generateDailyWorkSummaryData,
  generateActivityTimelineData
} from "@/utils/reportGenerator";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export const ReportsPage = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedUser, setSelectedUser] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const reportTypes = [
    { value: "objectives-summary", label: "Objectives Summary" },
    { value: "progress-report", label: "Progress Report" },
    { value: "team-performance", label: "Team Performance" },
    { value: "daily-work-summary", label: "Daily Work Summary" },
    { value: "activity-timeline", label: "Activity Timeline" },
  ];

  // Fetch users when component mounts and user is admin
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
        const usersQuery = query(collection(db, "profiles"), orderBy("full_name", "asc"));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Please select a report type",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      let data = [];
      switch (reportType) {
        case "objectives-summary":
          data = await generateObjectiveSummaryData(dateFrom, dateTo, selectedUser);
          break;
        case "progress-report":
          data = await generateProgressReportData(dateFrom, dateTo, selectedUser);
          break;
        case "team-performance":
          data = await generateTeamPerformanceData(dateFrom, dateTo, selectedUser);
          break;
        case "daily-work-summary":
          data = await generateDailyWorkSummaryData(dateFrom, dateTo, selectedUser);
          break;
        case "activity-timeline":
          data = await generateActivityTimelineData(dateFrom, dateTo, selectedUser);
          break;
        default:
          data = [];
      }
      const reportData: ReportData = {
        type: reportType,
        dateFrom,
        dateTo,
        user: selectedUser,
        data,
      };
      setGeneratedReport(reportData);
      toast({
        title: "Success",
        description: "Report generated successfully! You can now download it in your preferred format.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (format: 'csv' | 'pdf') => {
    if (!generatedReport) {
      toast({
        title: "Error",
        description: "Please generate a report first",
        variant: "destructive"
      });
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${generatedReport.type}-${timestamp}.${format}`;

    try {
      if (format === 'csv') {
        const csvContent = generateCSV(generatedReport);
        downloadFile(csvContent, filename, 'csv');
      } else if (format === 'pdf') {
        console.log("[Download PDF] generating PDF", generatedReport);
        const pdfDoc = generatePDF(generatedReport);
        console.log("[Download PDF] got jsPDF instance", pdfDoc);
        downloadFile(pdfDoc, filename, 'pdf');
        console.log("[Download PDF] downloadFile called for PDF");
      }

      toast({
        title: "Success",
        description: `Report downloaded as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: `Failed to download ${format.toUpperCase()} report: ${error?.message || error}`,
        variant: "destructive"
      });
    }
  };

  const handleViewDashboard = () => {
    const params = new URLSearchParams();
    
    if (dateFrom) {
      params.append('dateFrom', dateFrom.toISOString());
    }
    if (dateTo) {
      params.append('dateTo', dateTo.toISOString());
    }
    if (selectedUser && selectedUser !== 'all-users') {
      params.append('user', selectedUser);
    }
    
    const url = `/reports-dashboard?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Reports Generator
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Generate comprehensive reports for HSE objectives and activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Export Options Available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Report Configuration
              </CardTitle>
              <CardDescription>
                Configure the parameters for your report generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* User Filter (Admin only) */}
              {isAdmin() && (
                <div className="space-y-2">
                  <Label htmlFor="user-filter">Filter by User (Optional)</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingUsers ? "Loading users..." : "All users"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-users">All Users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* View Dashboard Button */}
              <Button
                onClick={handleViewDashboard}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Dashboard (New Tab)
              </Button>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={!reportType || isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              {/* Download Options */}
              {generatedReport && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Download Options</Label>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleDownload('csv')}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                    <Button 
                      onClick={() => handleDownload('pdf')}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Reports</CardTitle>
              <CardDescription>
                Generate commonly used reports instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setReportType("objectives-summary");
                  setDateFrom(new Date(new Date().setDate(new Date().getDate() - 30)));
                  setDateTo(new Date());
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Last 30 Days Summary
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setReportType("progress-report");
                  setDateFrom(new Date(new Date().setDate(new Date().getDate() - 7)));
                  setDateTo(new Date());
                }}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Weekly Progress
              </Button>
              
              {isAdmin() && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setReportType("team-performance");
                    setDateFrom(new Date(new Date().setMonth(new Date().getMonth() - 1)));
                    setDateTo(new Date());
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Monthly Team Report
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Export Formats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Export Formats</CardTitle>
              <CardDescription>
                Available export options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>PDF Report</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Excel Spreadsheet</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CSV Data</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
