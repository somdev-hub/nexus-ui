"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
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

interface YearlyStrengthData {
  month: string;
  strength: number;
}

interface YearlyStrengthChartProps {
  data: YearlyStrengthData[];
}

const chartConfig = {
  strength: {
    label: "Employee Strength",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

export function YearlyStrengthChart({ data }: YearlyStrengthChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Yearly Strength Trend</CardTitle>
        <CardDescription>Employee strength throughout the year</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <LineChart
            data={data}
            margin={{ top: 25, right: 30, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            {/* <YAxis /> */}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="strength"
              stroke={chartConfig.strength.color}
              strokeWidth={2}
              dot={{
                fill: "var(--color-strength)"
              }}
              activeDot={{
                r: 6
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
