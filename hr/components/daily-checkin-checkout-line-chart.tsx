"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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

export const description = "A multiple line chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];

const checkInOutData = [
  { time: "08:00", checkIn: 45, checkOut: 5 },
  { time: "08:30", checkIn: 120, checkOut: 8 },
  { time: "09:00", checkIn: 65, checkOut: 12 },
  { time: "09:30", checkIn: 15, checkOut: 18 },
  { time: "10:00", checkIn: 5, checkOut: 35 },
  { time: "17:00", checkIn: 8, checkOut: 45 },
  { time: "17:30", checkIn: 5, checkOut: 85 },
  { time: "18:00", checkIn: 2, checkOut: 55 }
];

const dayWiseCheckInOutData = [
  { day: "Mon", checkIn: 930, checkOut: 1800 },
  { day: "Tue", checkIn: 900, checkOut: 1730 },
  { day: "Wed", checkIn: 845, checkOut: 1815 },
  { day: "Thu", checkIn: 915, checkOut: 1745 },
  { day: "Fri", checkIn: 900, checkOut: 1800 },
  { day: "Sat", checkIn: 1000, checkOut: 1600 },
  { day: "Sun", checkIn: 1030, checkOut: 1530 }
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

export function DailyCheckinCheckoutChart() {
  return (
    <Card className="p-4 w-full">
      <CardHeader className="p-0">
        <CardTitle>Line Chart - Multiple</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer={true}
            data={dayWiseCheckInOutData}
            margin={{
              left: 14,
              right: 14,
              top: 10
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
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="checkOut"
              type="monotone"
              stroke="var(--color-mobile)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="p-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Showing total visitors for the last 6 months
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
