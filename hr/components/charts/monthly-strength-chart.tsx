"use client";

import { BarChart, Bar, XAxis, CartesianGrid, Legend } from "recharts";
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
import type { MonthlyStrengthResponse } from "@/types";

interface MonthlyStrengthChartProps {
  data: MonthlyStrengthResponse | null;
  isLoading?: boolean;
}

const chartConfig = {
  strength: {
    label: "Present Employees",
    color: "#82ca9d"
  }
} satisfies ChartConfig;

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
];

const monthAbbrMap: Record<string, string> = {
  january: "Jan",
  february: "Feb",
  march: "Mar",
  april: "Apr",
  may: "May",
  june: "Jun",
  july: "Jul",
  august: "Aug",
  september: "Sep",
  october: "Oct",
  november: "Nov",
  december: "Dec"
};

function transformApiData(apiData: MonthlyStrengthResponse) {
  return monthNames.map((month) => ({
    month: monthAbbrMap[month],
    totalEmployees: apiData.totalEmployees,
    strength: apiData.monthWiseStrength[month]
  }));
}

export function MonthlyStrengthChart({
  data,
  isLoading
}: MonthlyStrengthChartProps) {
  const chartData = data ? transformApiData(data) : [];
  const totalEmployees = data?.totalEmployees || 0;

  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Monthly Strength</CardTitle>
        <CardDescription>
          Present employees by month • Total: {totalEmployees}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-75">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-75">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-75">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="strength"
                fill={chartConfig.strength.color}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
