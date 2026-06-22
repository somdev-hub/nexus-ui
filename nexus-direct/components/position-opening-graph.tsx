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

export const description = "A donut chart with text"

const chartData = [
    { position: "Software Engineer", openings: 275, fill: "var(--color-chrome)" },
    { position: "Frontend Developer", openings: 200, fill: "var(--color-safari)" },
    { position: "Data Scientist", openings: 287, fill: "var(--color-firefox)" },
    { position: "Product Manager", openings: 173, fill: "var(--color-edge)" },
    { position: "UX Designer", openings: 190, fill: "var(--color-other)" },
]

const chartConfig = {
    openings: {
        label: "Openings",
    },
    chrome: {
        label: "Software Engineer",
        color: "var(--chart-1)",
    },
    safari: {
        label: "Frontend Developer",
        color: "var(--chart-2)",
    },
    firefox: {
        label: "Data Scientist",
        color: "var(--chart-3)",
    },
    edge: {
        label: "Product Manager",
        color: "var(--chart-4)",
    },
    other: {
        label: "UX Designer",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

export function PositionOpeningGraph() {
    const totalOpenings = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.openings, 0)
    }, [])

    return (
        <Card className="flex flex-col p-4 gap-2 w-1/3">
            <CardHeader className="items-center p-0">
                <CardTitle>Current Position Openings</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
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
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    Showing total openings for the last 6 months
                </div>
            </CardFooter>
        </Card>
    )
}
