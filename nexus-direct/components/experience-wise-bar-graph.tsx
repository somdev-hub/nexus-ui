"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "A bar chart with a custom label"

const chartData = [
    { experienceLevel: "Junior Roles", experience: "0-2 years", count: 50 },
    { experienceLevel: "Mid-Level Roles", experience: "3-5 years", count: 30 },
    { experienceLevel: "Senior Roles", experience: "6+ years", count: 20 },
    { experienceLevel: "Executive Roles", experience: "10+ years", count: 10 },
]

const chartConfig = {
    // desktop: {
    //     label: "Desktop",
    //     color: "var(--chart-2)",
    // },
    // mobile: {
    //     label: "Mobile",
    //     color: "var(--chart-2)",
    // },
    // label: {
    //     color: "var(--background)",
    // },
    experienceLevel: {
        label: "Experience Level",
        color: "var(--chart-2)",
    },
    count: {
        label: "Count",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export function ExperienceWiseBarGraph() {
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
