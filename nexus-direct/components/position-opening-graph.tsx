"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { PositionPieGraphEntry } from "@/types"

export const description = "A donut chart with text"

const FALLBACK_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
]

const DEFAULT_CHART_DATA: PositionPieGraphEntry[] = [
    { position: "Software Engineer", openings: 275 },
    { position: "Frontend Developer", openings: 200 },
    { position: "Data Scientist", openings: 287 },
    { position: "Product Manager", openings: 173 },
    { position: "UX Designer", openings: 190 },
]

interface PositionOpeningGraphProps {
    data?: PositionPieGraphEntry[] | null
    isLoading?: boolean
}

export function PositionOpeningGraph({ data, isLoading }: PositionOpeningGraphProps) {
    const chartData = React.useMemo(() => {
        const source = data && data.length > 0 ? data : DEFAULT_CHART_DATA
        return source.map((entry, index) => ({
            ...entry,
            fill: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        }))
    }, [data])

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            openings: { label: "Openings" },
        }
        chartData.forEach((entry, index) => {
            const key = `position-${index}`
            config[key] = {
                label: entry.position,
                color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
            }
        })
        return config
    }, [chartData])

    const totalOpenings = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.openings, 0)
    }, [chartData])

    if (isLoading) {
        return (
            <Card className="flex flex-col p-4 gap-2 w-1/3">
                <CardHeader className="items-center p-0">
                    <CardTitle>Current Position Openings</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex items-center justify-center min-h-[250px]">
                    <div className="animate-pulse rounded-full bg-muted h-40 w-40" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col p-4 gap-2 w-1/3">
            <CardHeader className="items-center p-0">
                <CardTitle>Current Position Openings</CardTitle>
                <CardDescription>Position-wise distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-62.5"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="openings"
                            nameKey="position"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalOpenings.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    Openings
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                    Across {chartData.length} positions <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    Showing total openings by position
                </div>
            </CardFooter>
        </Card>
    )
}
