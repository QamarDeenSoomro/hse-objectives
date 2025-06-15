
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { chartConfig } from "./chartConfig";

interface UsersOverallStatusChartProps {
  data: any[];
}

export const UsersOverallStatusChart = ({ data }: UsersOverallStatusChartProps) => {
  const userStatusData = data
    .filter(member => member.teamMember && member.teamMember !== 'Admin')
    .map(member => ({
      name: member.teamMember?.substring(0, 20) || 'Unknown',
      percentage: member.efficiency || 0,
      status: member.efficiency >= 80 ? 'Excellent' : 
              member.efficiency >= 60 ? 'Good' : 
              member.efficiency >= 40 ? 'Average' : 'Needs Improvement'
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-indigo-600" />
          Users Overall Status
        </CardTitle>
        <CardDescription>
          Overall completion percentage by user (horizontal bars)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart data={userStatusData} layout="horizontal">
            <XAxis type="number" domain={[0, 100]} />
            <YAxis 
              dataKey="name" 
              type="category"
              tick={{ fontSize: 12 }}
              width={120}
            />
            <ChartTooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 shadow-lg rounded border">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-gray-600">
                        Completion: {data.percentage}%
                      </p>
                      <p className="text-sm font-medium" style={{
                        color: data.percentage >= 80 ? '#10B981' : 
                              data.percentage >= 60 ? '#F59E0B' : 
                              data.percentage >= 40 ? '#EF4444' : '#7C2D12'
                      }}>
                        Status: {data.status}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="percentage" 
              fill="#8B5CF6" 
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
