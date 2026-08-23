"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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

export const description = "A multiple line chart";

interface WeeklyCheckInCheckOutData {
	Mon: { checkIn: string; checkout: string };
	Tue: { checkIn: string; checkout: string };
	Wed: { checkIn: string; checkout: string };
	Thu: { checkIn: string; checkout: string };
	Fri: { checkIn: string; checkout: string };
	Sat: { checkIn: string; checkout: string };
	Sun: { checkIn: string; checkout: string };
}

interface DailyCheckinCheckoutChartProps {
	data: WeeklyCheckInCheckOutData;
}

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)"
	},
	mobile: {
		label: "Mobile",
		color: "var(--chart-2)"
	}
} satisfies ChartConfig;

const chartMargin = {
	left: 14,
	right: 14,
	top: 10
};

const formatTickLabel = (value: string) => value.slice(0, 3);

// Helper to convert time string "HH:MM" to minutes for charting
const timeToMinutes = (timeStr: string): number => {
	const [hours, minutes] = timeStr.split(":").map(Number);
	return hours * 60 + minutes;
};

const DailyCheckinCheckoutChartContent = ({ data }: DailyCheckinCheckoutChartProps) => {
	// Convert object to array for recharts
	const dayWiseCheckInOutData = [
		{ day: "Mon", checkIn: timeToMinutes(data.Mon.checkIn), checkOut: timeToMinutes(data.Mon.checkout) },
		{ day: "Tue", checkIn: timeToMinutes(data.Tue.checkIn), checkOut: timeToMinutes(data.Tue.checkout) },
		{ day: "Wed", checkIn: timeToMinutes(data.Wed.checkIn), checkOut: timeToMinutes(data.Wed.checkout) },
		{ day: "Thu", checkIn: timeToMinutes(data.Thu.checkIn), checkOut: timeToMinutes(data.Thu.checkout) },
		{ day: "Fri", checkIn: timeToMinutes(data.Fri.checkIn), checkOut: timeToMinutes(data.Fri.checkout) },
		{ day: "Sat", checkIn: timeToMinutes(data.Sat.checkIn), checkOut: timeToMinutes(data.Sat.checkout) },
		{ day: "Sun", checkIn: timeToMinutes(data.Sun.checkIn), checkOut: timeToMinutes(data.Sun.checkout) }
	];

	return (
		<Card className="p-4 w-full">
			<CardHeader className="p-0">
				<CardTitle>Daily Check-in / Check-out</CardTitle>
				<CardDescription>Last 7 days average times</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ChartContainer config={chartConfig}>
					<LineChart
						accessibilityLayer={true}
						data={dayWiseCheckInOutData}
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
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Line
							dataKey="checkIn"
							type="monotone"
							stroke="var(--color-desktop)"
							strokeWidth={2}
							dot={false}
							isAnimationActive={false}
						/>
						<Line
							dataKey="checkOut"
							type="monotone"
							stroke="var(--color-mobile)"
							strokeWidth={2}
							dot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="p-4">
				<div className="flex w-full items-start gap-2 text-sm">
					<div className="grid gap-2">
						<div className="flex items-center gap-2 leading-none font-medium">
							Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
						</div>
						<div className="text-muted-foreground flex items-center gap-2 leading-none">
							Showing total visitors for the last 6 months
						</div>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
};

export const DailyCheckinCheckoutChart = React.memo(
	DailyCheckinCheckoutChartContent
);
