
import { useState } from "react";
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

export const ReportsPage = () => {
  const { isAdmin } = useAuth();
  const [reportType, setReportType] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedUser, setSelectedUser] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: "objectives-summary", label: "Objectives Summary" },
    { value: "progress-report", label: "Progress Report" },
    { value: "team-performance", label: "Team Performance" },
    { value: "daily-work-summary", label: "Daily Work Summary" },
    { value: "activity-timeline", label: "Activity Timeline" },
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      // Here you would implement actual report generation logic
      console.log("Generating report:", {
        type: reportType,
        dateFrom,
        dateTo,
        user: selectedUser
      });
    }, 2000);
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
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-users">All Users</SelectItem>
                      <SelectItem value="user1">John Doe</SelectItem>
                      <SelectItem value="user2">Jane Smith</SelectItem>
                      {/* In real implementation, this would be populated from user data */}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
