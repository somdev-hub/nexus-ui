"use client";

import {
  BarChart,
  Bar,
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

interface PayrollData {
  month: string;
  amount: number;
}

interface YearlyPayrollChartProps {
  data: PayrollData[];
}

const chartConfig = {
  amount: {
    label: "Payroll Amount",
    color: "#6366f1"
  }
} satisfies ChartConfig;

export function YearlyPayrollChart({ data }: YearlyPayrollChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Yearly Payroll Data</CardTitle>
        <CardDescription>Monthly payroll expenditure</CardDescription>
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
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar
              dataKey="amount"
              fill={chartConfig.amount.color}
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
