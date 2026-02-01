"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
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
import { AlertCircle } from "lucide-react";

interface FraudDetectionData {
  issue: string;
  count: number;
  severity: "low" | "medium" | "high";
}

interface FraudDetectionChartProps {
  data: FraudDetectionData[];
}

const severityColors: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444"
};

const chartConfig = {
  count: {
    label: "Number of Issues",
    color: "#ef4444"
  }
} satisfies ChartConfig;

export function FraudDetectionChart({ data }: FraudDetectionChartProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Fraud Detection
        </CardTitle>
        <CardDescription>
          Duplicate payments, abnormal spikes, and irregularities
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
           <XAxis
              dataKey="issue"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar
              dataKey="count"
              fill={chartConfig.count.color}
              radius={8}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={severityColors[entry.severity] || severityColors.low}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
