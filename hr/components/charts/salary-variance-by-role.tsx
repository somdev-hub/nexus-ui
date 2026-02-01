"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";

interface SalaryVarianceData {
  name: string;
  base: number;
  bonus: number;
}

interface SalaryVarianceByRoleProps {
  data: SalaryVarianceData[];
}

const chartConfig = {
  base: {
    label: "Base",
    color: "var(--chart-3)"
  },
  bonus: {
    label: "Bonus",
    color: "var(--chart-4)"
  }
} satisfies ChartConfig;

export function SalaryVarianceByRole({ data }: SalaryVarianceByRoleProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Salary Variance by Role</CardTitle>
        <CardDescription>
          Base salary and bonus breakdown by position
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-75">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            {/* <YAxis /> */}
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent payload={{}} />} />
            <Bar
              dataKey="base"
              stackId="a"
              fill="var(--color-base)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="bonus"
              stackId="a"
              fill="var(--color-bonus)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
