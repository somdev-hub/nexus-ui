"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import * as React from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig
} from "@/components/ui/chart";

export const description = "A simple area chart";

interface WeeklyEmployeeStrengthData {
	Mon: number;
	Tue: number;
	Wed: number;
	Thu: number;
	Fri: number;
	Sat: number;
	Sun: number;
}

interface WeeklyEmployeeStrengthChartProps {
	data: WeeklyEmployeeStrengthData;
}

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)"
	}
} satisfies ChartConfig;

const chartMargin = {
	left: 14,
	right: 14,
	top: 10
};

const formatTickLabel = (value: string) => value.slice(0, 3);

const WeeklyEmployeeStrengthChartContent = ({ data }: WeeklyEmployeeStrengthChartProps) => {
	// Convert object to array for recharts
	const employeeStrengthData = [
		{ day: "Mon", strength: data.Mon },
		{ day: "Tue", strength: data.Tue },
		{ day: "Wed", strength: data.Wed },
		{ day: "Thu", strength: data.Thu },
		{ day: "Fri", strength: data.Fri },
		{ day: "Sat", strength: data.Sat },
		{ day: "Sun", strength: data.Sun }
	];

	return (
		<Card className="p-4 w-full">
			<CardHeader className="p-0">
				<CardTitle>Weekly Employee Strength</CardTitle>
				<CardDescription>
					Showing employee strength for the last week
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ChartContainer config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={employeeStrengthData}
						margin={chartMargin}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={formatTickLabel}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Area
							dataKey="strength"
							type="natural"
							fill="var(--color-desktop)"
							fillOpacity={0.4}
							stroke="var(--color-desktop)"
							isAnimationActive={false}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="p-0">
				<div className="flex w-full items-start gap-2 text-sm">
					<div className="grid gap-2">
						<div className="flex items-center gap-2 leading-none font-medium">
							Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
						</div>
						<div className="text-muted-foreground flex items-center gap-2 leading-none">
							January - June 2024
						</div>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
};

export const WeeklyEmployeeStrengthChart = React.memo(
	WeeklyEmployeeStrengthChartContent
);
