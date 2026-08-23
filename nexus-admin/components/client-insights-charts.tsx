"use client";

import * as React from "react";
import {
    AreaChart,
    Area,
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
import { ResponseTimeDataPoint, HourlyHitsDataPoint, FailureGraphDataPoint } from "@/types/client-insights";

const responseTimeConfig = {
    avgResponseTime: { label: "Avg Response Time (ms)", color: "hsl(var(--chart-1))" },
    minResponseTime: { label: "Min Response Time (ms)", color: "hsl(var(--chart-2))" },
    maxResponseTime: { label: "Max Response Time (ms)", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const hourlyHitsConfig = {
    totalHits: { label: "Total Hits", color: "hsl(var(--chart-1))" },
    successHits: { label: "Success Hits", color: "hsl(var(--chart-2))" },
    failureHits: { label: "Failure Hits", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const failureGraphConfig = {
    failureCount: { label: "Failure Count", color: "hsl(var(--destructive))" },
    failureRate: { label: "Failure Rate %", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

interface InsightsChartsProps {
    responseTimeData: ResponseTimeDataPoint[];
    hourlyHitsData: HourlyHitsDataPoint[];
    failureGraphData: FailureGraphDataPoint[];
}

export function ClientInsightsCharts({ responseTimeData, hourlyHitsData, failureGraphData }: InsightsChartsProps) {
    if (responseTimeData.length === 0 && hourlyHitsData.length === 0 && failureGraphData.length === 0) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Response Time</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Hourly Hits</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Failure Graph</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Format response time data for charts
    const formattedResponseTimeData = responseTimeData.map((point, index) => ({
        ...point,
        index,
        shortTime: new Date(point.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    }));

    // Format hourly hits data
    const formattedHourlyHitsData = hourlyHitsData.map((point, index) => ({
        ...point,
        index,
        shortHour: point.hour.length > 5 ? point.hour.substring(0, 5) : point.hour,
    }));

    // Format failure graph data
    const formattedFailureGraphData = failureGraphData.map((point, index) => ({
        ...point,
        index,
        shortTime: new Date(point.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    }));

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Response Time Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Response Time</CardTitle>
                    <CardDescription>Average, min, and max response times over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={responseTimeConfig}
                        className="h-[300px] w-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formattedResponseTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortTime" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip
                                    content={<ChartTooltipContent nameKey="shortTime" />}
                                    formatter={(value: any) => [`${Number(value ?? 0).toFixed(2)}ms`, ""]}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="avgResponseTime"
                                    stroke="hsl(var(--chart-1))"
                                    fillOpacity={1}
                                    fill="url(#colorAvg)"
                                    name="Avg Response Time"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="minResponseTime"
                                    stroke="hsl(var(--chart-2))"
                                    fillOpacity={1}
                                    fill="url(#colorMin)"
                                    name="Min Response Time"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="maxResponseTime"
                                    stroke="hsl(var(--chart-3))"
                                    fillOpacity={1}
                                    fill="url(#colorMax)"
                                    name="Max Response Time"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <ChartTooltip />
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Hourly Hits Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Hourly Hits</CardTitle>
                    <CardDescription>Total, success, and failure hits per hour</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={hourlyHitsConfig}
                        className="h-[300px] w-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={formattedHourlyHitsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortHour" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip
                                    content={<ChartTooltipContent nameKey="shortHour" />}
                                    formatter={(value: any) => [Number(value ?? 0).toLocaleString(), ""]}
                                />
                                <Legend />
                                <Bar dataKey="totalHits" fill="hsl(var(--chart-1))" name="Total Hits" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="successHits" fill="hsl(var(--chart-2))" name="Success Hits" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failureHits" fill="hsl(var(--destructive))" name="Failure Hits" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <ChartTooltip />
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Failure Graph Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Failure Graph</CardTitle>
                    <CardDescription>Failure count and rate over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={failureGraphConfig}
                        className="h-[300px] w-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formattedFailureGraphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortTime" tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 10 }} orientation="left" />
                                <YAxis yAxisId="right" tick={{ fontSize: 10 }} orientation="right" />
                                <Tooltip
                                    content={<ChartTooltipContent nameKey="shortTime" />}
                                    formatter={(value: any, name: string | number | undefined) => {
                                        const nameStr = name?.toString() ?? "";
                                        if (nameStr === "failureRate") return [`${Number(value ?? 0).toFixed(2)}%`, nameStr];
                                        return [Number(value ?? 0).toLocaleString(), nameStr];
                                    }}
                                />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="failureCount"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Failure Count"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="failureRate"
                                    stroke="hsl(var(--chart-2))"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Failure Rate %"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        <ChartTooltip />
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}