"use client";

import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { LeaveTypeDistributionResponse } from "@/types";

interface LeaveTypeRadarChartProps {
  data: LeaveTypeDistributionResponse | null;
  isLoading?: boolean;
  onMonthYearChange?: (monthYear: string) => void;
}

const chartConfig = {
  employees: {
    label: "Number of Employees",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

const leaveTypeLabels: Record<string, string> = {
  SICK_LEAVE: "Sick Leave",
  BEREAVEMENT_LEAVE: "Bereavement Leave",
  EARNED_LEAVE: "Earned Leave",
  MATERNITY_LEAVE: "Maternity Leave",
  PATERNITY_LEAVE: "Paternity Leave",
  UNPAID_LEAVE: "Unpaid Leave",
  COMPENSATORY_OFF: "Compensatory Off"
};

function getLastMonthsWithFuture(
  count: number
): Array<{ label: string; value: string }> {
  const months: Array<{ label: string; value: string }> = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Add future months of current year first
  for (let i = currentMonth + 1; i < 12; i++) {
    const date = new Date(currentYear, i, 1);
    const monthName = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const value = `${monthName.toUpperCase()} ${year}`;

    months.push({
      label: `${monthName} ${year}`,
      value: value
    });
  }

  // Add past months (12 months before current date)
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

function transformApiData(
  apiData: LeaveTypeDistributionResponse | null
): Array<{ leaveType: string; employees: number }> {
  if (!apiData) {
    // Return all leave types with 0 employees when no data
    return Object.entries(leaveTypeLabels).map(([, label]) => ({
      leaveType: label,
      employees: 0
    }));
  }

  // Return all leave types, including those with 0 employees
  return Object.entries(leaveTypeLabels).map(([key, label]) => ({
    leaveType: label,
    employees: apiData[key] || 0
  }));
}

export function LeaveTypeRadarChart({
  data,
  isLoading,
  onMonthYearChange
}: LeaveTypeRadarChartProps) {
  const monthOptions = getLastMonthsWithFuture(12);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() =>
    monthOptions.length > 0 ? monthOptions[0].value : ""
  );

  const handleMonthYearChange = (value: string) => {
    setSelectedMonthYear(value);
    onMonthYearChange?.(value);
  };

  const chartData = transformApiData(data);

  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <CardTitle>Leave Type Distribution</CardTitle>
            <CardDescription>Employees by leave type</CardDescription>
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
      <CardContent className="p-0 mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-75">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-75">
            <RadarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="leaveType" />
              <PolarRadiusAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                name="Employees"
                dataKey="employees"
                stroke={chartConfig.employees.color}
                fill={chartConfig.employees.color}
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
