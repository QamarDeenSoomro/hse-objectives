
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Activity, TrendingUp } from "lucide-react";

interface DashboardMetricsProps {
  data: {
    objectives: any[];
    progress: any[];
    teamPerformance: any[];
    dailyWork: any[];
    activities: any[];
  };
}

export const DashboardMetrics = ({ data }: DashboardMetricsProps) => {
  const totalObjectives = data.objectives.length;
  const totalProgress = data.progress.reduce((sum, item) => sum + (item.completion || 0), 0);
  const avgCompletion = totalProgress > 0 && data.progress.length > 0 
    ? Math.round(totalProgress / data.progress.length) 
    : 0;
  const totalTeamMembers = data.teamPerformance.length;
  const totalDailyEntries = data.dailyWork.length;

  const metrics = [
    {
      title: "Total Objectives",
      value: totalObjectives,
      description: "Active objectives in period",
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Average Completion",
      value: `${avgCompletion}%`,
      description: "Progress completion rate",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Team Members",
      value: totalTeamMembers,
      description: "Active team members",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Daily Entries",
      value: totalDailyEntries,
      description: "Work log entries",
      icon: Activity,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-5 w-5 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
