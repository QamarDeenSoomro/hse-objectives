import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Clock, TrendingUp } from "lucide-react";

interface PlannedVsActualChartProps {
  actualProgress: number;
  plannedProgress: number;
  title: string;
}

export const PlannedVsActualChart = ({ actualProgress, plannedProgress, title }: PlannedVsActualChartProps) => {
  const maxValue = Math.max(actualProgress, plannedProgress, 100);
  const actualHeight = (actualProgress / maxValue) * 100;
  const plannedHeight = (plannedProgress / maxValue) * 100;
  
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Progress Comparison
        </CardTitle>
        <CardDescription className="text-sm">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bar Chart */}
        <div className="flex items-end justify-center gap-8 h-32">
          {/* Actual Progress Bar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-12 h-24 bg-gray-100 rounded-t-md overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 ease-out rounded-t-md"
                style={{ height: `${actualHeight}%` }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-blue-600">{actualProgress}%</div>
              <div className="text-xs text-gray-500">Actual</div>
            </div>
          </div>
          
          {/* Planned Progress Bar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-12 h-24 bg-gray-100 rounded-t-md overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-500 ease-out rounded-t-md"
                style={{ height: `${plannedHeight}%` }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-green-600">{plannedProgress}%</div>
              <div className="text-xs text-gray-500">Planned</div>
            </div>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="text-center">
          {actualProgress > plannedProgress ? (
            <div className="flex items-center justify-center gap-1 text-green-600 text-sm">
              <TrendingUp className="h-3 w-3" />
              <span>Ahead by {actualProgress - plannedProgress}%</span>
            </div>
          ) : actualProgress < plannedProgress ? (
            <div className="flex items-center justify-center gap-1 text-red-600 text-sm">
              <Clock className="h-3 w-3" />
              <span>Behind by {plannedProgress - actualProgress}%</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-blue-600 text-sm">
              <span>On track</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};