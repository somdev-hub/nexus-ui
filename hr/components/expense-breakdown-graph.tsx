"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";

export const description = "A radar chart";

const expenseBreakdownData = [
  { category: "Base Salary", value: 85, fullMark: 100 },
  { category: "Bonuses", value: 45, fullMark: 100 },
  { category: "Travel", value: 30, fullMark: 100 },
  { category: "Equipment", value: 25, fullMark: 100 },
  { category: "Benefits", value: 60, fullMark: 100 },
  { category: "Overtime", value: 35, fullMark: 100 }
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

export function ExpenseBreakdownChart() {
  return (
    <Card className="p-4 w-1/3">
      <CardHeader className="items-center p-0">
        <CardTitle>Radar Chart</CardTitle>
        <CardDescription>
          Showing expense breakdown for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] w-full"
        >
          <RadarChart data={expenseBreakdownData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" />
            <PolarGrid />
            <Radar
              dataKey="value"
              fill="var(--color-desktop)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          January - June 2024
        </div>
      </CardFooter>
    </Card>
  );
}
