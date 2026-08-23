"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
    Card,
    CardAction,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { RequestTrendsResponse } from "@/types/nexus-buddy-dashboard";
import { TimeRange } from "@/components/time-range-selector";

interface RequestTrendsChartProps {
    data: RequestTrendsResponse | null;
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
}

const chartConfig = {
    total: {
        label: "Total Requests",
        color: "hsl(var(--primary))",
    },
    success: {
        label: "Successful (2xx)",
        color: "hsl(var(--chart-1))",
    },
    clientError: {
        label: "Client Errors (4xx)",
        color: "hsl(var(--chart-2))",
    },
    serverError: {
        label: "Server Errors (5xx)",
        color: "hsl(var(--chart-3))",
    },
} satisfies ChartConfig;

export function RequestTrendsChart({ data, timeRange, onTimeRangeChange }: RequestTrendsChartProps) {
    const isMobile = useIsMobile();

    React.useEffect(() => {
        if (isMobile) {
            setTimeout(() => onTimeRangeChange("7d"), 0);
        }
    }, [isMobile, onTimeRangeChange]);

    if (!data) {
        return (
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Request Volume Trends</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[250px]">
                    <div className="text-muted-foreground">No data available</div>
                </CardContent>
            </Card>
        );
    }

    // Combine all data points into a single array for the chart
    const allTimestamps = new Set<string>();
    [...data.totalRequests, ...data.successfulRequests, ...data.clientErrors, ...data.serverErrors].forEach(d => {
        allTimestamps.add(d.timestamp);
    });

    const sortedTimestamps = Array.from(allTimestamps).sort();

    const chartData = sortedTimestamps.map(timestamp => {
        const total = data.totalRequests.find(d => d.timestamp === timestamp)?.value ?? 0;
        const success = data.successfulRequests.find(d => d.timestamp === timestamp)?.value ?? 0;
        const clientErr = data.clientErrors.find(d => d.timestamp === timestamp)?.value ?? 0;
        const serverErr = data.serverErrors.find(d => d.timestamp === timestamp)?.value ?? 0;

        return {
            timestamp,
            total,
            success,
            clientError: clientErr,
            serverError: serverErr,
        };
    });

    const filteredData = chartData.filter((item) => {
        const date = new Date(item.timestamp);
        const referenceDate = sortedTimestamps.length > 0 ? new Date(sortedTimestamps[sortedTimestamps.length - 1]) : new Date();
        let daysToSubtract = 90;
        if (timeRange === "24h") daysToSubtract = 1;
        else if (timeRange === "7d") daysToSubtract = 7;
        else if (timeRange === "30d") daysToSubtract = 30;
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        return date >= startDate;
    });

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>Request Volume Trends</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Request volume breakdown by status code
                    </span>
                    <span className="@[540px]/card:hidden">By status code</span>
                </CardDescription>
                <CardAction>
                    <ToggleGroup
                        multiple={false}
                        value={timeRange && timeRange !== "custom" ? [timeRange] : []}
                        onValueChange={(value) => {
                            if (value[0] && value[0] !== "custom") {
                                onTimeRangeChange(value[0] as TimeRange);
                            }
                        }}
                        variant="outline"
                        className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
                    >
                        <ToggleGroupItem value="24h">Last 24h</ToggleGroupItem>
                        <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
                        <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
                    </ToggleGroup>
                    <Select
                        value={timeRange}
                        onValueChange={(value) => {
                            if (value !== null && value !== "custom") {
                                onTimeRangeChange(value as TimeRange);
                            }
                        }}
                    >
                        <SelectTrigger
                            className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                            size="sm"
                            aria-label="Select time range"
                        >
                            <SelectValue placeholder="Last 24h" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="24h" className="rounded-lg">Last 24h</SelectItem>
                            <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
                            <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                        </SelectContent>
                    </Select>
                </CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={filteredData}>
                        <defs>
                            <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="fillSuccess" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="fillClientError" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="fillServerError" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });
                            }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey="total"
                            type="natural"
                            fill="url(#fillTotal)"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            stackId="a"
                        />
                        <Area
                            dataKey="success"
                            type="natural"
                            fill="url(#fillSuccess)"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            stackId="a"
                        />
                        <Area
                            dataKey="clientError"
                            type="natural"
                            fill="url(#fillClientError)"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            stackId="a"
                        />
                        <Area
                            dataKey="serverError"
                            type="natural"
                            fill="url(#fillServerError)"
                            stroke="hsl(var(--chart-3))"
                            strokeWidth={2}
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}