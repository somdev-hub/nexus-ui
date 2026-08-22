"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { AnalyticsMetric } from "@/lib/auth-service";

interface RecruitmentFunnelChartProps {
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

const funnelStages = [
	{ key: "openRoles", label: "Open Roles", color: "var(--chart-1)" },
	{ key: "currentApplications", label: "Applications", color: "var(--chart-2)" },
	{ key: "underReview", label: "Under Review", color: "var(--chart-3)" },
	{ key: "offerSent", label: "Offers Sent", color: "var(--chart-4)" },
	{ key: "offerAcceptance", label: "Offers Accepted", color: "var(--chart-5)" },
] as const;

const chartConfig = {
	count: { label: "Count", color: "var(--chart-1)" },
	stage: { label: "Stage", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RecruitmentFunnelChart({ data, isLoading }: RecruitmentFunnelChartProps) {
	if (isLoading || !data) {
		return (
			<Card className="p-4">
				<CardHeader className="p-0">
					<CardTitle>Recruitment Funnel</CardTitle>
					<CardDescription>Candidate pipeline from open roles to accepted offers</CardDescription>
				</CardHeader>
				<CardContent className="p-0 mt-4">
					<div className="h-[300px] flex items-center justify-center">
						<div className="animate-pulse rounded-full bg-muted h-20 w-20" />
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = funnelStages.map((stage, index) => ({
		stage: stage.label,
		count: data[stage.key as keyof typeof data].value,
		fill: stage.color,
		key: `stage-${index}`,
	}));

	return (
		<Card className="p-4">
			<CardHeader className="p-0">
				<CardTitle>Recruitment Funnel</CardTitle>
				<CardDescription>Candidate pipeline from open roles to accepted offers</CardDescription>
			</CardHeader>
			<CardContent className="p-0 mt-4">
				<ChartContainer config={chartConfig} className="h-[300px]">
					<BarChart
						accessibilityLayer
						data={chartData}
						layout="vertical"
						margin={{ right: 16 }}
					>
						<CartesianGrid horizontal={false} />
						<YAxis
							dataKey="stage"
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							hide
						/>
						<XAxis dataKey="count" type="number" hide />
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Bar dataKey="count" radius={10}>
							{chartData.map((entry, index) => (
								<LabelList
									key={`label-${index}`}
									dataKey="stage"
									position="insideLeft"
									offset={8}
									className="fill-background"
									fontSize={12}
								/>
							))}
							{chartData.map((entry, index) => (
								<LabelList
									key={`count-${index}`}
									dataKey="count"
									position="right"
									offset={8}
									className="fill-foreground"
									fontSize={12}
								/>
							))}
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}