"use client"


import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "A simple area chart"

const chartData = [
    { month: "January", desktop: 186 },
    { month: "February", desktop: 305 },
    { month: "March", desktop: 237 },
    { month: "April", desktop: 73 },
    { month: "May", desktop: 209 },
    { month: "June", desktop: 214 },
]

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function EventTriggerAreaChart({ data }: { data: Record<string, number> }) {
    /**
     * data is expected to be in the format:
     * {
     *  "Jun" : 100,
     *  "Jul" : 200,
     * }
     */
    return (
        <Card className="p-4 gap-4">
            <CardHeader className="p-0">
                <CardTitle>
                    Event Hits Over Time
                </CardTitle>
                <CardDescription>
                    Showing total hits for the last 6 months
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={Object.entries(data).map(([name, value]) => ({ month: name, desktop: value }))}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="desktop"
                            type="natural"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>

        </Card>
    )
}
