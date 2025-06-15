
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { chartConfig } from "./chartConfig";

interface ObjectivesProgressChartProps {
  data: any[];
}

export const ObjectivesProgressChart = ({ data }: ObjectivesProgressChartProps) => {
  const objectivesChartData = data.slice(0, 10).map(obj => ({
    name: obj.title?.substring(0, 20) + '...' || 'Untitled',
    completion: obj.completion || 0,
    weightage: obj.weightage || 0
  }));

  return (
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
  );
};
