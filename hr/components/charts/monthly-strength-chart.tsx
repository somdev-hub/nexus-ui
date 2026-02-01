"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
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

interface MonthlyStrengthData {
  month: string;
  strength: number;
}

interface MonthlyStrengthChartProps {
  data: MonthlyStrengthData[];
}

const chartConfig = {
  strength: {
    label: "Employee Strength",
    color: "#3b82f6"
  }
} satisfies ChartConfig;

export function MonthlyStrengthChart({ data }: MonthlyStrengthChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Monthly Strength</CardTitle>
        <CardDescription>Employee count by month</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            {/* <YAxis /> */}
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar
              dataKey="strength"
              fill={chartConfig.strength.color}
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
