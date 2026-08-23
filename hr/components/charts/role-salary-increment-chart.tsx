"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
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
  isLoading?: boolean;
}

const roleColors = [
  "#2563eb",
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#6366f1",
  "#84cc16"
];

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoleColor(index: number) {
  if (index < roleColors.length) {
    return roleColors[index];
  }

  const hue = (index * 47) % 360;
  return `hsl(${hue} 80% 55%)`;
}

export function RoleSalaryIncrementChart({
  data,
  roles,
  isLoading
}: RoleSalaryIncrementChartProps) {
  const chartConfig = roles.reduce((config, role, index) => {
    config[role] = {
      label: toTitleCase(role),
      color: getRoleColor(index)
    };

    return config;
  }, {} as ChartConfig);

  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Role-wise Salary Increment</CardTitle>
        <CardDescription>Salary trends by role</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-75">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : data.length === 0 || roles.length === 0 ? (
          <div className="flex items-center justify-center h-75">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-75">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                {roles.map((role, index) => {
                  const color = getRoleColor(index);
                  const gradientId = `role-gradient-${role.replace(/[^a-zA-Z0-9]/g, "-")}`;

                  return (
                    <linearGradient
                      key={role}
                      id={gradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.toString().toUpperCase()}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {roles.map((role, index) => {
                const color = getRoleColor(index);
                const gradientId = `role-gradient-${role.replace(/[^a-zA-Z0-9]/g, "-")}`;

                return (
                  <Area
                    key={role}
                    type="monotone"
                    dataKey={role}
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    fillOpacity={0.35}
                  />
                );
              })}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
