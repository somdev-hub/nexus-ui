"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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

export const description = "A bar chart";

interface WeeklyWorkingHoursData {
	Mon: number;
	Tue: number;
	Wed: number;
	Thu: number;
	Fri: number;
	Sat: number;
	Sun: number;
}

interface WeeklyWorkingHoursChartProps {
	data: WeeklyWorkingHoursData;
}

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)"
	}
} satisfies ChartConfig;

const formatTickLabel = (value: string) => value.slice(0, 3);

const WeeklyWorkingHoursChartContent = ({ data }: WeeklyWorkingHoursChartProps) => {
	// Convert object to array for recharts
	const workingHoursData = [
		{ day: "Mon", hours: data.Mon },
		{ day: "Tue", hours: data.Tue },
		{ day: "Wed", hours: data.Wed },
		{ day: "Thu", hours: data.Thu },
		{ day: "Fri", hours: data.Fri },
		{ day: "Sat", hours: data.Sat },
		{ day: "Sun", hours: data.Sun }
	];

	return (
		<Card className="p-4 w-full">
			<CardHeader className="p-0">
				<CardTitle>Weekly Working Hours</CardTitle>
				<CardDescription>Monday - Sunday 2024</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={workingHoursData}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="day"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={formatTickLabel}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar
							dataKey="hours"
							fill="var(--color-desktop)"
							radius={8}
							isAnimationActive={false}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="flex gap-2 leading-none font-medium">
					Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
				</div>
				<div className="text-muted-foreground leading-none">
					Showing total visitors for the last 6 months
				</div>
			</CardFooter>
		</Card>
	);
};

export const WeeklyWorkingHoursChart = React.memo(
	WeeklyWorkingHoursChartContent
);
