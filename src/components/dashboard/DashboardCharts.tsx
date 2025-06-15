
import { ObjectivesProgressChart } from "./charts/ObjectivesProgressChart";
import { UsersOverallStatusChart } from "./charts/UsersOverallStatusChart";
import { ProgressTimelineChart } from "./charts/ProgressTimelineChart";
import { TeamEfficiencyChart } from "./charts/TeamEfficiencyChart";
import { DailyWorkTrendsChart } from "./charts/DailyWorkTrendsChart";

interface DashboardChartsProps {
  data: {
    objectives: any[];
    progress: any[];
    teamPerformance: any[];
    dailyWork: any[];
    activities: any[];
  };
}

export const DashboardCharts = ({ data }: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ObjectivesProgressChart data={data.objectives} />
      <UsersOverallStatusChart data={data.teamPerformance} />
      <ProgressTimelineChart data={data.progress} />
      <TeamEfficiencyChart data={data.teamPerformance} />
      <DailyWorkTrendsChart data={data.dailyWork} />
    </div>
  );
};
