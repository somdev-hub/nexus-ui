"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { ExperienceWiseOpeningEntry } from "@/types"

export const description = "A bar chart with a custom label"

const DEFAULT_CHART_DATA: ExperienceWiseOpeningEntry[] = [
    { experienceLevel: "Junior Roles", experience: "0-2 years", count: 50 },
    { experienceLevel: "Mid-Level Roles", experience: "3-5 years", count: 30 },
    { experienceLevel: "Senior Roles", experience: "6+ years", count: 20 },
    { experienceLevel: "Executive Roles", experience: "10+ years", count: 10 },
]

const chartConfig = {
    experienceLevel: {
        label: "Experience Level",
        color: "var(--chart-2)",
    },
    count: {
        label: "Count",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

interface ExperienceWiseBarGraphProps {
    data?: ExperienceWiseOpeningEntry[] | null
    isLoading?: boolean
}

export function ExperienceWiseBarGraph({ data, isLoading }: ExperienceWiseBarGraphProps) {
    const chartData = data && data.length > 0 ? data : DEFAULT_CHART_DATA

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="space-y-3 w-full px-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse rounded-md bg-muted h-8 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-full">
            <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{
                    right: 16,
                }}
            >
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="experienceLevel"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="count" fill="var(--chart-2)" radius={10}>
                    <LabelList
                        dataKey="experienceLevel"
                        position="insideLeft"
                        offset={8}
                        className="fill-background"
                        fontSize={12}
                    />
                    <LabelList
                        dataKey="count"
                        position="right"
                        offset={8}
                        className="fill-foreground"
                        fontSize={12}
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
    )
}
