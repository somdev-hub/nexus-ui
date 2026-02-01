"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
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

interface LeaveTypeData {
  leaveType: string;
  employees: number;
}

interface LeaveTypeRadarChartProps {
  data: LeaveTypeData[];
}

const chartConfig = {
  employees: {
    label: "Number of Employees",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

export function LeaveTypeRadarChart({ data }: LeaveTypeRadarChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Leave Type Distribution</CardTitle>
        <CardDescription>Employees by leave type</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <RadarChart
            data={data}
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
      </CardContent>
    </Card>
  );
}
