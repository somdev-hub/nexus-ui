"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { AnalyticsMetric } from "@/lib/auth-service";

interface RecruitmentTrendChartProps {
	data: {
		currentApplications: AnalyticsMetric;
		offerAcceptance: AnalyticsMetric;
		offerSent: AnalyticsMetric;
		openRoles: AnalyticsMetric;
		recruitmentTAT: AnalyticsMetric;
		underReview: AnalyticsMetric;
	};
	isLoading?: boolean;
}

const trendMetrics = [
	{ key: "openRoles", label: "Open Roles", color: "var(--chart-1)" },
	{ key: "currentApplications", label: "Applications", color: "var(--chart-2)" },
	{ key: "underReview", label: "Under Review", color: "var(--chart-3)" },
	{ key: "offerSent", label: "Offers Sent", color: "var(--chart-4)" },
	{ key: "offerAcceptance", label: "Offer Acceptance", color: "var(--chart-5)" },
] as const;

const chartConfig = {
	openRoles: { label: "Open Roles", color: "var(--chart-1)" },
	currentApplications: { label: "Applications", color: "var(--chart-2)" },
	underReview: { label: "Under Review", color: "var(--chart-3)" },
	offerSent: { label: "Offers Sent", color: "var(--chart-4)" },
	offerAcceptance: { label: "Offer Acceptance", color: "var(--chart-5)" },
} satisfies ChartConfig;

// Generate mock trend data based on current values and trends
function generateTrendData(currentData: string, baseValue: number, trend: "INCREMENT" | "DECREMENT" | "STABLE") {
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	const currentMonth = new Date().getMonth();

	return months.map((month, index) => {
		let value = baseValue;
		if (index <= currentMonth) {
			// Historical data - simulate trend
			const monthsDiff = currentMonth - index;
			const trendFactor = trend === "INCREMENT" ? 1.05 : trend === "DECREMENT" ? 0.95 : 1;
			value = Math.round(baseValue * Math.pow(trendFactor, monthsDiff));
		}
		return { month, [currentData]: Math.max(0, value) };
	});
}

export function RecruitmentTrendChart({ data, isLoading }: RecruitmentTrendChartProps) {
	if (isLoading || !data) {
		return (
			<Card className="p-4">
				<CardHeader className="p-0">
					<CardTitle>Recruitment Trends</CardTitle>
					<CardDescription>12-month trend of key recruitment metrics</CardDescription>
				</CardHeader>
				<CardContent className="p-0 mt-4">
					<div className="h-[300px] flex items-center justify-center">
						<div className="animate-pulse rounded-full bg-muted h-20 w-20" />
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = trendMetrics.map((metric) => {
		const metricData = data[metric.key as keyof typeof data];
		return generateTrendData(metric.key, metricData.value, metricData.trend);
	}).reduce((acc, curr) => {
		return acc.map((item, index) => ({ ...item, ...curr[index] }));
	}, Array(12).fill({}).map((_, i) => ({ month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i] })));

	return (
		<Card className="p-4">
			<CardHeader className="p-0">
				<CardTitle>Recruitment Trends</CardTitle>
				<CardDescription>12-month trend of key recruitment metrics</CardDescription>
			</CardHeader>
			<CardContent className="p-0 mt-4">
				<ChartContainer config={chartConfig} className="w-full h-[300px]">
					<LineChart
						data={chartData}
						margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip content={<ChartTooltipContent />} />
						<Legend />
						{trendMetrics.map((metric) => (
							<Line
								key={metric.key}
								type="monotone"
								dataKey={metric.key}
								stroke={metric.color}
								strokeWidth={2}
								dot={{ fill: metric.color, r: 4 }}
								activeDot={{ r: 6, strokeWidth: 2 }}
							/>
						))}
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}