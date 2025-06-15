
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { COLORS } from "./chartConfig";

interface TeamEfficiencyChartProps {
  data: any[];
}

export const TeamEfficiencyChart = ({ data }: TeamEfficiencyChartProps) => {
  const teamPerformanceData = data.map(member => ({
    name: member.teamMember?.substring(0, 15) || 'Unknown',
    completed: member.completedObjectives || 0,
    pending: member.pendingObjectives || 0,
    efficiency: member.efficiency || 0
  }));

  return (
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
        <ChartContainer config={{}} className="h-[300px]">
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
  );
};
