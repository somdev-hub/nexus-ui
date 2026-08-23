"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CheckInCheckOutResponse } from "@/types";

export const description = "A multiple line chart";

interface CheckInCheckOutChartProps {
  data: CheckInCheckOutResponse | null;
  isLoading?: boolean;
  onMonthYearChange?: (monthYear: string) => void;
}

const chartConfig = {
  checkIn: {
    label: "Check In",
    color: "var(--chart-1)"
  },
  checkout: {
    label: "Check Out",
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
  apiData: CheckInCheckOutResponse
): Array<{ day: string; checkIn: number; checkout: number }> {
  return Object.entries(apiData)
    .filter(([key]) => key in dayLabels)
    .map(([key, value]) => ({
      day: dayLabels[key as keyof typeof dayLabels],
      checkIn: timeToMinutes(value.checkIn),
      checkout: timeToMinutes(value.checkout)
    }));
}

export function CheckInCheckOutChart({
  data,
  isLoading,
  onMonthYearChange
}: CheckInCheckOutChartProps) {
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
            <CardTitle>Employees check-in/check-out</CardTitle>
            <CardDescription>
              Daily check-in and check-out times
            </CardDescription>
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
            <LineChart
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
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="checkIn"
                type="monotone"
                stroke="var(--color-checkIn)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="checkout"
                type="monotone"
                stroke="var(--color-checkout)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
