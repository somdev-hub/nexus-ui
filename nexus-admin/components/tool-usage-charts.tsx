"use client";

import * as React from "react";
import {
    Cell,
    PieChart,
    Pie,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { ToolUsageResponse } from "@/types/nexus-buddy-dashboard";

const methodColors = {
    GET: "hsl(var(--chart-1))",
    POST: "hsl(var(--chart-2))",
    PUT: "hsl(var(--chart-3))",
    PATCH: "hsl(var(--chart-4))",
    DELETE: "hsl(var(--chart-5))",
};

const methodConfig = {
    GET: { label: "GET", color: "hsl(var(--chart-1))" },
    POST: { label: "POST", color: "hsl(var(--chart-2))" },
    PUT: { label: "PUT", color: "hsl(var(--chart-3))" },
    PATCH: { label: "PATCH", color: "hsl(var(--chart-4))" },
    DELETE: { label: "DELETE", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const toolConfig = {
    requests: { label: "Requests", color: "hsl(var(--primary))" },
    successRate: { label: "Success Rate %", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

interface ToolUsageChartsProps {
    data: ToolUsageResponse | null;
}

export function ToolUsageCharts({ data }: ToolUsageChartsProps) {
    if (!data) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>HTTP Method Distribution</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Top 10 Tools by Volume</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Prepare pie chart data
    const pieData = Object.entries(data.httpMethodDistribution).map(([method, count]) => ({
        method,
        count,
        fill: methodColors[method as keyof typeof methodColors] || "hsl(var(--muted))",
    }));

    // Prepare bar chart data
    const barData = data.topToolsByVolume.map((tool, index) => ({
        ...tool,
        index,
        shortName: tool.toolName.length > 20 ? tool.toolName.substring(0, 17) + "..." : tool.toolName,
    }));

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* HTTP Method Distribution - Donut Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>HTTP Method Distribution</CardTitle>
                    <CardDescription>Request breakdown by HTTP method</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={methodConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="method"
                                    label={({ name, value, percent }) => (
                                        `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                                    )}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            nameKey="method"
                                            labelKey="method"
                                            formatter={(value: any, name?: string | number) => [typeof value === "number" ? value.toLocaleString() : String(value ?? "0"), String(name ?? "")]}
                                        />
                                    }
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => value}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Top 10 Tools by Volume - Horizontal Bar Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Top 10 Tools by Request Volume</CardTitle>
                    <CardDescription>Most used tools with success rates</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={toolConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="shortName"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    width={140}
                                />
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value: any, name?: string | number) => {
                                                if (name === "successRate") return [`${typeof value === "number" ? value.toFixed(1) : String(value ?? "0")}%`, "Success Rate"];
                                                return [typeof value === "number" ? value.toLocaleString() : String(value ?? "0"), String(name ?? "")];
                                            }}
                                        />
                                    }
                                />
                                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                <Bar
                                    dataKey="requestCount"
                                    name="Requests"
                                    fill="hsl(var(--primary))"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={32}
                                />
                                <Bar
                                    dataKey="successRate"
                                    name="Success Rate %"
                                    fill="hsl(var(--chart-1))"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}