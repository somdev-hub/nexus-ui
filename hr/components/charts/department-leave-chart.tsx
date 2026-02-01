"use client";

import {
  BarChart,
  Bar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { useState } from "react";

interface DepartmentLeaveData {
  department: string;
  leaves: number;
}

interface DepartmentLeaveChartProps {
  monthlyData: DepartmentLeaveData[];
  yearlyData: DepartmentLeaveData[];
}

const chartConfig = {
  leaves: {
    label: "Number of Leaves",
    color: "#f59e0b"
  }
} satisfies ChartConfig;

export function DepartmentLeaveChart({
  monthlyData,
  yearlyData
}: DepartmentLeaveChartProps) {
  const [chartRecords, setChartRecords] = useState<"Monthly" | "Yearly">(
    "Monthly"
  );

  const currentData = chartRecords === "Monthly" ? monthlyData : yearlyData;

  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Department vs Leave</CardTitle>
            <CardDescription>
              Leave distribution across departments
            </CardDescription>
          </div>
          <Select
            value={chartRecords}
            onValueChange={(value) =>
              setChartRecords(value as "Monthly" | "Yearly")
            }
          >
            <SelectTrigger
              className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              <SelectItem value="Monthly" className="rounded-lg">
                Monthly
              </SelectItem>
              <SelectItem value="Yearly" className="rounded-lg">
                Yearly
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <BarChart
            data={currentData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" dataKey="leaves" hide />
            <YAxis
              dataKey="department"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="leaves" fill={chartConfig.leaves.color} radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
