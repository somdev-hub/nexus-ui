"use client";

import * as React from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
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
import { PerformanceResponse } from "@/types/nexus-buddy-dashboard";

const latencyConfig = {
    P50: { label: "P50 (Median)", color: "hsl(var(--chart-1))" },
    P90: { label: "P90", color: "hsl(var(--chart-2))" },
    P95: { label: "P95", color: "hsl(var(--chart-3))" },
    P99: { label: "P99", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const errorRateConfig = {
    errorRate: { label: "Error Rate %", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const toolPerfConfig = {
    successRate: { label: "Success Rate %", color: "hsl(var(--chart-1))" },
    avgLatency: { label: "Avg Latency (ms)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

interface PerformanceChartsProps {
    data: PerformanceResponse | null;
}

export function PerformanceCharts({ data }: PerformanceChartsProps) {
    if (!data) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Latency Percentiles</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Error Rate Trend</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Tool Performance</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Latency percentiles bar chart data
    const latencyData = Object.entries(data.latencyPercentiles).map(([percentile, value]) => ({
        percentile,
        value: Math.round(value * 100) / 100,
    }));

    // Error rate trend line chart data
    const errorRateData = data.errorRateTrend.map((point, index) => ({
        ...point,
        index,
        shortTime: new Date(point.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    }));

    // Tool performance data
    const toolPerfData = data.toolSuccessRates.slice(0, 10).map((tool, index) => ({
        ...tool,
        index,
        shortName: tool.toolName.length > 20 ? tool.toolName.substring(0, 17) + "..." : tool.toolName,
    }));

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Latency Percentiles - Bar Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Latency Percentiles</CardTitle>
                    <CardDescription>Response time distribution (ms)</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={latencyConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={latencyData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="percentile"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    width={80}
                                />
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value: any, name?: string | number) => [typeof value === "number" ? value.toFixed(2) : String(value ?? "0"), String(name ?? "")]}
                                        />
                                    }
                                />
                                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                <Bar
                                    dataKey="value"
                                    name="Latency (ms)"
                                    fill="hsl(var(--primary))"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={32}
                                >
                                    {latencyData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Availability & Error Rate */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Availability & Error Rate</CardTitle>
                    <CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-green-500" />
                                Availability: {data.availabilityPercentage.toFixed(2)}%
                            </span>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={errorRateConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={errorRateData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="shortTime"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => value}
                                />
                                <YAxis
                                    type="number"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                                    domain={[0, "auto"]}
                                />
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(value) => value}
                                            formatter={(value: any, name?: string | number) => [typeof value === "number" ? value.toFixed(2) : String(value ?? "0"), String(name ?? "")]}
                                        />
                                    }
                                />
                                <Line
                                    type="natural"
                                    dataKey="value"
                                    name="Error Rate %"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Tool Performance - Grouped Bar Chart */}
            <Card className="@container/card lg:col-span-2">
                <CardHeader>
                    <CardTitle>Tool Performance (Top 10 by Volume)</CardTitle>
                    <CardDescription>Success rate and average latency per tool</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={toolPerfConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={toolPerfData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
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
                                                if (name === "Avg Latency (ms)") return [typeof value === "number" ? value.toFixed(2) : String(value ?? "0"), String(name ?? "")];
                                                return [typeof value === "number" ? value.toFixed(1) : String(value ?? "0"), String(name ?? "")];
                                            }}
                                        />
                                    }
                                />
                                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                <Bar
                                    dataKey="successRate"
                                    name="Success Rate %"
                                    fill="hsl(var(--chart-1))"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={20}
                                />
                                <Bar
                                    dataKey="avgLatencyMs"
                                    name="Avg Latency (ms)"
                                    fill="hsl(var(--chart-2))"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}