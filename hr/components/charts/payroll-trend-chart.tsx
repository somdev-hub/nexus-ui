"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";

interface PayrollTrendData {
  month: string;
  payroll: number;
  overtime: number;
}

interface PayrollTrendChartProps {
  data: PayrollTrendData[];
}

const chartConfig = {
  payroll: {
    label: "Payroll",
    color: "var(--chart-1)"
  },
  overtime: {
    label: "Overtime",
    color: "var(--chart-4)"
  }
} satisfies ChartConfig;

export function PayrollTrendChart({ data }: PayrollTrendChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>6-Month Payroll Trend</CardTitle>
        <CardDescription>Payroll spend and overtime costs</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <AreaChart data={data}>
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
            <ChartLegend />
            <Area
              type="monotone"
              dataKey="payroll"
              stroke="var(--color-payroll)"
              fill="var(--color-payroll)"
              fillOpacity={0.3}
              name="Payroll"
            />
            <Area
              type="monotone"
              dataKey="overtime"
              stroke="var(--color-overtime)"
              fill="var(--color-overtime)"
              fillOpacity={0.3}
              name="Overtime"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
