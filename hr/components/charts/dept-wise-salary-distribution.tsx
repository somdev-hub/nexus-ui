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

interface DeptDistributionData {
  name: string;
  base: number;
  bonus: number;
}

interface DeptWiseSalaryDistributionProps {
  data: DeptDistributionData[];
}

const chartConfig = {
  base: {
    label: "Base",
    color: "var(--chart-1)"
  },
  bonus: {
    label: "Bonus",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

export function DeptWiseSalaryDistribution({
  data
}: DeptWiseSalaryDistributionProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Department-wise Salary Distribution</CardTitle>
        <CardDescription>
          Base salary and bonus breakdown by department
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
            <ChartLegend content={<ChartLegendContent payload={{}} />}/>
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
