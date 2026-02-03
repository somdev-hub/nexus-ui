"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
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

interface ComponentData {
  component: string;
  amount: number;
  color: string;
}

interface SalaryComponentsBreakdownProps {
  data: ComponentData[];
}

const chartConfig = {
  amount: {
    label: "Amount",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

export function SalaryComponentsBreakdown({
  data
}: SalaryComponentsBreakdownProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Salary Components Breakdown</CardTitle>
        <CardDescription>
          Total amount for base salary, bonuses, and deductions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-62.5 -ml-20">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="component"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <XAxis dataKey="amount" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="amount"
              //   layout="vertical"
              fill="var(--color-amount)"
              radius={4}
            >
              {/* <LabelList
                dataKey="component"
                position="insideLeft"
                offset={8}
                className="fill-(--color-label)"
                fontSize={12}
              /> */}
              <LabelList
                dataKey="amount"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
