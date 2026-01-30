"use client";

import { CalendarIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

import { type DateRange } from "react-day-picker";
import { useState } from "react";
import { Calendar } from "./ui/calendar";

export const description = "A stacked bar chart with a legend";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

export function ChartBarStacked() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 11, 1),
    to: new Date(2025, 11, 30)
  });

  const getDateRangeForOption = (option: string): DateRange => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);

    switch (option) {
      case "Today":
        return { from: today, to: today };
      case "Yesterday":
        return { from: yesterday, to: yesterday };
      case "This Week":
        return { from: weekStart, to: today };
      case "Last 7 days":
        return { from: sevenDaysAgo, to: today };
      case "Last 30 days":
        return { from: thirtyDaysAgo, to: today };
      case "This month":
        return { from: monthStart, to: monthEnd };
      case "Last month":
        return { from: lastMonthStart, to: lastMonthEnd };
      case "This year":
        return { from: yearStart, to: yearEnd };
      default:
        return { from: today, to: today };
    }
  };

  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from || !range?.to) return "Select date range";

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  };

  const handleDateRangeSelect = (option: string) => {
    setDateRange(getDateRangeForOption(option));
  };

  return (
    <Card className="flex-1 p-4">
      <CardHeader className="p-0">
        <div className="flex justify-between items-center">
          <div className="">
            <CardTitle>Monthly storage data</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </div>
          <div className="">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 size-4" />
                  <p>{formatDateRange(dateRange)}</p>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2">
                <div className="flex">
                  <div className="flex flex-col text-muted-foreground text-sm">
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("Today")}
                    >
                      <p>Today</p>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("Yesterday")}
                    >
                      <p>Yesterday</p>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("This Week")}
                    >
                      <p>This Week</p>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("Last 7 days")}
                    >
                      <p>Last 7 days</p>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("Last 30 days")}
                    >
                      <p>Last 30 days</p>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("This month")}
                    >
                      <p>This month</p>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("Last month")}
                    >
                      <p>Last month</p>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleDateRangeSelect("This year")}
                    >
                      <p>This year</p>
                    </Button>
                  </div>
                  <hr />
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    className=""
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="desktop"
              stackId="a"
              fill="var(--color-desktop)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="mobile"
              stackId="a"
              fill="var(--color-mobile)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
