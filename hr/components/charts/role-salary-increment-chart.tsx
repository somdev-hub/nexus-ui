"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

interface RoleSalaryData {
  month: string;
  [key: string]: string | number;
}

interface RoleSalaryIncrementChartProps {
  data: RoleSalaryData[];
  roles: string[];
}

const chartConfig = {
  seniorDeveloper: {
    label: "Senior Developer",
    color: "#3b82f6"
  },
  developer: {
    label: "Developer",
    color: "#60a5fa"
  },
  manager: {
    label: "Manager",
    color: "#1e40af"
  }
} satisfies ChartConfig;

export function RoleSalaryIncrementChart({
  data,
  roles
}: RoleSalaryIncrementChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Role-wise Salary Increment</CardTitle>
        <CardDescription>Salary trends by role</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorSenior" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDeveloper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="seniorDeveloper"
              stackId="1"
              stroke="#3b82f6"
              fill="url(#colorSenior)"
            />
            <Area
              type="monotone"
              dataKey="developer"
              stackId="1"
              stroke="#60a5fa"
              fill="url(#colorDeveloper)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
