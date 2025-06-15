
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { chartConfig } from "./chartConfig";

interface DailyWorkTrendsChartProps {
  data: any[];
}

export const DailyWorkTrendsChart = ({ data }: DailyWorkTrendsChartProps) => {
  const dailyWorkTrendData = data
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
    .slice(-14);

  return (
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
  );
};
