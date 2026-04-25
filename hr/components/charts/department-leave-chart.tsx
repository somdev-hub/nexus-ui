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

interface DepartmentLeaveData {
  department: string;
  leaves: number;
}

interface DepartmentLeaveChartProps {
  data: Record<string, number> | null;
  isLoading?: boolean;
  selectedMonthYear: string;
  onMonthYearChange?: (monthYear: string) => void;
}

const chartConfig = {
  leaves: {
    label: "Number of Leaves",
    color: "#f59e0b"
  }
} satisfies ChartConfig;

function getMonthYearOptions(count: number) {
  const options: Array<{ label: string; value: string }> = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  for (let i = currentMonth + 1; i < 12; i++) {
    const date = new Date(currentYear, i, 1);
    const monthName = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const value = `${monthName.toUpperCase()} ${year}`;

    options.push({ label: `${monthName} ${year}`, value });
  }

  for (let i = 0; i < count; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);

    const monthName = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const value = `${monthName.toUpperCase()} ${year}`;

    options.push({ label: `${monthName} ${year}`, value });
  }

  return options;
}

function transformApiData(
  data: Record<string, number> | null
): DepartmentLeaveData[] {
  if (!data) {
    return [];
  }

  return Object.entries(data).map(([department, leaves]) => ({
    department,
    leaves
  }));
}

export function DepartmentLeaveChart({
  data,
  isLoading,
  selectedMonthYear,
  onMonthYearChange
}: DepartmentLeaveChartProps) {
  const monthOptions = getMonthYearOptions(12);
  const chartData = transformApiData(data);

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
          <Select value={selectedMonthYear} onValueChange={onMonthYearChange}>
            <SelectTrigger
              className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
              aria-label="Select month"
            >
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {monthOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-[300px]">
            <BarChart
              data={chartData}
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
              <Bar
                dataKey="leaves"
                fill={chartConfig.leaves.color}
                radius={8}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
