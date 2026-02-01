"use client";

import {
  AreaChart,
  Area,
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

interface LeavePredictionData {
  month: string;
  predicted: number;
}

interface LeavePredictionChartProps {
  data: LeavePredictionData[];
}

const chartConfig = {
  predicted: {
    label: "Predicted Leaves",
    color: "#10b981"
  }
} satisfies ChartConfig;

export function LeavePredictionChart({ data }: LeavePredictionChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Yearly Leave Prediction</CardTitle>
        <CardDescription>Predicted employee leave pattern</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.predicted.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.predicted.color}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            {/* <YAxis /> */}
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke={chartConfig.predicted.color}
              fillOpacity={1}
              fill="url(#colorPredicted)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
