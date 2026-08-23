"use client";

import * as React from "react";
import {
    PieChart,
    Pie,
    Cell,
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
import { ConfigInsightsResponse } from "@/types/nexus-buddy-dashboard";

const pieConfig = {
    value: { label: "Count", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const barConfig = {
    count: { label: "Count", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

interface ConfigInsightsChartsProps {
    data: ConfigInsightsResponse | null;
}

export function ConfigInsightsCharts({ data }: ConfigInsightsChartsProps) {
    if (!data) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Required vs Optional Parameters</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Data Type Distribution</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Parameter Type Distribution</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card">
                    <CardHeader>
                        <CardTitle>Tools per Client</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
                <Card className="@container/card lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Configuration Gaps</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <div className="text-muted-foreground">No data available</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Prepare pie chart data for required vs optional
    const requiredOptionalData = Object.entries(data.requiredVsOptionalParams).map(([type, count], index) => ({
        type,
        count,
        fill: type === "Required" ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))",
    }));

    // Prepare pie chart data for data type distribution
    const dataTypeData = Object.entries(data.dataTypeDistribution).map(([type, count], index) => ({
        type,
        count,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));

    // Prepare pie chart data for param type distribution
    const paramTypeData = Object.entries(data.paramTypeDistribution).map(([type, count], index) => ({
        type,
        count,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));

    // Prepare bar chart data for tools per client
    const toolsPerClientData = Object.entries(data.toolsPerClient)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([client, count], index) => ({
            client: client.length > 20 ? client.substring(0, 17) + "..." : client,
            count,
            index,
        }));

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Required vs Optional Parameters - Pie Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Required vs Optional Parameters</CardTitle>
                    <CardDescription>Parameter requirement distribution</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={pieConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={requiredOptionalData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="type"
                                    label={({ name, value, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                                    labelLine={false}
                                >
                                    {requiredOptionalData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            nameKey="type"
                                            labelKey="type"
                                            formatter={(value: any, name?: string | number) => [typeof value === "number" ? value.toLocaleString() : String(value ?? "0"), String(name ?? "")]}
                                        />
                                    }
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Data Type Distribution - Pie Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Data Type Distribution</CardTitle>
                    <CardDescription>Parameter data types breakdown</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={pieConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataTypeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="type"
                                    label={({ name, value, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                                    labelLine={false}
                                >
                                    {dataTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            nameKey="type"
                                            labelKey="type"
                                            formatter={(value: any, name?: string | number) => [typeof value === "number" ? value.toLocaleString() : String(value ?? "0"), String(name ?? "")]}
                                        />
                                    }
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Parameter Type Distribution - Pie Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Parameter Type Distribution</CardTitle>
                    <CardDescription>Parameter location types (query, path, header, body)</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={pieConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paramTypeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="type"
                                    label={({ name, value, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                                    labelLine={false}
                                >
                                    {paramTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            nameKey="type"
                                            labelKey="type"
                                            formatter={(value: any, name?: string | number) => [typeof value === "number" ? value.toLocaleString() : String(value ?? "0"), String(name ?? "")]}
                                        />
                                    }
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Tools per Client - Bar Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Tools per Client (Top 10)</CardTitle>
                    <CardDescription>Number of tools configured per client</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer config={barConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={toolsPerClientData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="client"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    width={140}
                                />
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value: any, name?: string | number) => [typeof value === "number" ? value.toLocaleString() : String(value ?? "0"), String(name ?? "")]}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="count"
                                    name="Tools"
                                    fill="hsl(var(--primary))"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Configuration Gaps - List View */}
            <Card className="@container/card lg:col-span-2">
                <CardHeader>
                    <CardTitle>Configuration Gaps</CardTitle>
                    <CardDescription>Clients without tools and tools without parameters</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-3">
                                Clients Without Tools ({data.clientsWithoutTools.length})
                            </h4>
                            {data.clientsWithoutTools.length === 0 ? (
                                <p className="text-sm text-green-600">All clients have at least one tool configured ✓</p>
                            ) : (
                                <ul className="space-y-1 text-sm">
                                    {data.clientsWithoutTools.slice(0, 10).map((client) => (
                                        <li key={client} className="flex items-center gap-2 text-red-600">
                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                            {client}
                                        </li>
                                    ))}
                                    {data.clientsWithoutTools.length > 10 && (
                                        <li className="text-muted-foreground text-sm">
                                            +{data.clientsWithoutTools.length - 10} more...
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-3">
                                Tools Without Parameters ({data.toolsWithoutParams.length})
                            </h4>
                            {data.toolsWithoutParams.length === 0 ? (
                                <p className="text-sm text-green-600">All tools have at least one parameter configured ✓</p>
                            ) : (
                                <ul className="space-y-1 text-sm">
                                    {data.toolsWithoutParams.slice(0, 10).map((tool) => (
                                        <li key={tool} className="flex items-center gap-2 text-orange-600">
                                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                                            {tool}
                                        </li>
                                    ))}
                                    {data.toolsWithoutParams.length > 10 && (
                                        <li className="text-muted-foreground text-sm">
                                            +{data.toolsWithoutParams.length - 10} more...
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}