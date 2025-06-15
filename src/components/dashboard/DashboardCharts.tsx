
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer 
} from "recharts";

interface DashboardChartsProps {
  data: {
    objectives: any[];
    progress: any[];
    teamPerformance: any[];
    dailyWork: any[];
    activities: any[];
  };
}

const chartConfig = {
  completion: {
    label: "Completion",
    color: "hsl(var(--chart-1))",
  },
  count: {
    label: "Count",
    color: "hsl(var(--chart-2))",
  },
  efficiency: {
    label: "Efficiency",
    color: "hsl(var(--chart-3))",
  },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const DashboardCharts = ({ data }: DashboardChartsProps) => {
  // Process data for charts
  const objectivesChartData = data.objectives.slice(0, 10).map(obj => ({
    name: obj.title?.substring(0, 20) + '...' || 'Untitled',
    completion: obj.completion || 0,
    weightage: obj.weightage || 0
  }));

  const progressTimelineData = data.progress
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30) // Last 30 entries
    .map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      completion: item.completion || 0
    }));

  const teamPerformanceData = data.teamPerformance.map(member => ({
    name: member.teamMember?.substring(0, 15) || 'Unknown',
    completed: member.completedObjectives || 0,
    pending: member.pendingObjectives || 0,
    efficiency: member.efficiency || 0
  }));

  const dailyWorkTrendData = data.dailyWork
    .reduce((acc: any[], item) => {
      const date = new Date(item.date).toLocaleDateString();
      const existing = acc.find(a => a.date === date);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 days

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Objectives Progress Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-600" />
            Objectives Progress
          </CardTitle>
          <CardDescription>
            Completion percentage by objective
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={objectivesChartData}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completion" fill="#0088FE" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Progress Timeline Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-green-600" />
            Progress Timeline
          </CardTitle>
          <CardDescription>
            Completion trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={progressTimelineData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="completion" 
                stroke="#00C49F" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Team Performance Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Team Efficiency
          </CardTitle>
          <CardDescription>
            Team member efficiency distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={teamPerformanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, efficiency }) => `${name}: ${efficiency}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="efficiency"
              >
                {teamPerformanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Daily Work Trends Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AreaChart className="h-5 w-5 text-orange-600" />
            Daily Work Trends
          </CardTitle>
          <CardDescription>
            Daily work log entries over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <AreaChart data={dailyWorkTrendData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#FF8042" 
                fill="#FF8042"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
