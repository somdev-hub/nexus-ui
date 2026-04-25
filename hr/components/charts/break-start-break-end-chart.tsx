"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { BreakStartEndResponse } from "@/types";

export const description = "An area chart with a legend";

interface BreakStartBreakEndChartProps {
  data: BreakStartEndResponse | null;
  isLoading?: boolean;
  onMonthYearChange?: (monthYear: string) => void;
}

const chartConfig = {
  breakStart: {
    label: "Break Start",
    color: "var(--chart-1)"
  },
  breakEnd: {
    label: "Break End",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

const dayLabels: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday"
};

function getLastMonths(count: number): Array<{ label: string; value: string }> {
  const months: Array<{ label: string; value: string }> = [];
  const currentDate = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);

    const monthName = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const value = `${monthName.toUpperCase()} ${year}`;

    months.push({
      label: `${monthName} ${year}`,
      value: value
    });
  }

  return months;
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function transformApiData(
  apiData: BreakStartEndResponse
): Array<{ day: string; breakStart: number; breakEnd: number }> {
  return Object.entries(apiData)
    .filter(([key]) => key in dayLabels)
    .map(([key, value]) => ({
      day: dayLabels[key as keyof typeof dayLabels],
      breakStart: timeToMinutes(value.breakStart),
      breakEnd: timeToMinutes(value.breakEnd)
    }));
}

export function BreakStartBreakEndChart({
  data,
  isLoading,
  onMonthYearChange
}: BreakStartBreakEndChartProps) {
  const monthOptions = getLastMonths(12);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() =>
    monthOptions.length > 0 ? monthOptions[0].value : ""
  );

  const handleMonthYearChange = (value: string) => {
    setSelectedMonthYear(value);
    onMonthYearChange?.(value);
  };

  const chartData = data ? transformApiData(data) : [];

  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <CardTitle>Employee break start/end</CardTitle>
            <CardDescription>Daily break times</CardDescription>
          </div>
          <Select
            value={selectedMonthYear}
            onValueChange={handleMonthYearChange}
          >
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-75">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-75">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="breakStart"
                type="natural"
                fill="var(--color-breakStart)"
                fillOpacity={0.4}
                stroke="var(--color-breakStart)"
                stackId="a"
              />
              <Area
                dataKey="breakEnd"
                type="natural"
                fill="var(--color-breakEnd)"
                fillOpacity={0.4}
                stroke="var(--color-breakEnd)"
                stackId="a"
              />
              <ChartLegend
                content={<ChartLegendContent payload={undefined} />}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
