"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
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

interface PayrollPredictionData {
  month: string;
  predicted: number;
  actual?: number;
}

interface PayrollPredictionChartProps {
  data: PayrollPredictionData[];
}

const chartConfig = {
  predicted: {
    label: "Predicted Cost",
    color: "#8b5cf6"
  },
  actual: {
    label: "Actual Cost",
    color: "#d946ef"
  }
} satisfies ChartConfig;

export function PayrollPredictionChart({ data }: PayrollPredictionChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Payroll Cost Prediction</CardTitle>
        <CardDescription>Predicted vs actual payroll costs</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke={chartConfig.predicted.color}
              strokeWidth={2}
              dot={{ fill: chartConfig.predicted.color }}
            />
            {data[0]?.actual && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke={chartConfig.actual.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.actual.color }}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
