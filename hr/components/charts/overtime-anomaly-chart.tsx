"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";

interface OvertimeAnomalyData {
  week: string;
  actual: number;
  normal: number;
  anomaly: boolean;
}

interface OvertimeAnomalyChartProps {
  data: OvertimeAnomalyData[];
}

const chartConfig = {
  actual: {
    label: "Actual Overtime",
    color: "#f59e0b"
  },
  normal: {
    label: "Normal Range",
    color: "#10b981"
  }
} satisfies ChartConfig;

export function OvertimeAnomalyChart({ data }: OvertimeAnomalyChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Overtime Anomaly Detection</CardTitle>
        <CardDescription>Identify unusual overtime patterns</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={chartConfig.actual.color}
              strokeWidth={2}
              dot={{ fill: chartConfig.actual.color }}
            />
            <Line
              type="monotone"
              dataKey="normal"
              stroke={chartConfig.normal.color}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
