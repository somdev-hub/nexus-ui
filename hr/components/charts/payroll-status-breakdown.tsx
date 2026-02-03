"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
  PieSectorDataItem
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

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface PayrollStatusBreakdownProps {
  data: StatusData[];
}

const chartConfig = {
  processed: {
    label: "Processed",
    color: "var(--chart-1)"
  },
  pending: {
    label: "Pending",
    color: "var(--chart-2)"
  },
  onHold: {
    label: "On Hold",
    color: "var(--chart-3)"
  }
} satisfies ChartConfig;

export function PayrollStatusBreakdown({ data }: PayrollStatusBreakdownProps) {
  return (
    <Card className="p-4 ">
      <CardHeader className="p-0">
        <CardTitle>Payroll Status Breakdown</CardTitle>
        <CardDescription>Current period status distribution</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer
          config={chartConfig}
        className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-62.5 pb-0"
        
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              //   activeIndex={0}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
