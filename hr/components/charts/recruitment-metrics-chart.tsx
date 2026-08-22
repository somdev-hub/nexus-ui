"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsMetric } from "@/lib/auth-service";

interface RecruitmentMetricsChartProps {
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

const metricConfig = [
	{ key: "openRoles", label: "Open Roles", icon: "📋" },
	{ key: "currentApplications", label: "Current Applications", icon: "📄" },
	{ key: "underReview", label: "Under Review", icon: "🔍" },
	{ key: "offerSent", label: "Offers Sent", icon: "📤" },
	{ key: "offerAcceptance", label: "Offer Acceptance", icon: "✅" },
	{ key: "recruitmentTAT", label: "Recruitment TAT (days)", icon: "⏱️" },
] as const;

function getTrendColor(trend: "INCREMENT" | "DECREMENT" | "STABLE"): string {
	switch (trend) {
		case "INCREMENT":
			return "text-green-600";
		case "DECREMENT":
			return "text-red-600";
		default:
			return "text-gray-600";
	}
}

function getTrendIcon(trend: "INCREMENT" | "DECREMENT" | "STABLE"): string {
	switch (trend) {
		case "INCREMENT":
			return "↑";
		case "DECREMENT":
			return "↓";
		default:
			return "→";
	}
}

export function RecruitmentMetricsChart({ data, isLoading }: RecruitmentMetricsChartProps) {
	if (isLoading || !data) {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Card key={i} className="p-4">
						<CardHeader className="p-0">
							<div className="animate-pulse rounded-md bg-muted h-4 w-1/3" />
						</CardHeader>
						<CardContent className="p-0">
							<div className="animate-pulse rounded-md bg-muted h-8 w-1/2" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="border-b pb-4">
				<h2 className="text-xl font-bold">Recruitment Metrics Overview</h2>
				<p className="text-gray-600 mt-1">Key recruitment performance indicators</p>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{metricConfig.map(({ key, label, icon }) => {
					const metric = data[key as keyof typeof data];
					const trendColor = getTrendColor(metric.trend);
					const trendIcon = getTrendIcon(metric.trend);

					return (
						<Card key={key} className="p-4 hover:shadow-md transition-shadow">
							<CardHeader className="p-0 pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
										{icon} {label}
									</CardTitle>
									<span className={`text-xs font-medium ${trendColor} flex items-center gap-1`}>
										{trendIcon} {metric.trend}
									</span>
								</div>
							</CardHeader>
							<CardContent className="p-0">
								<div className="text-3xl font-bold text-foreground">
									{metric.type === "VALUE_COMPARISON" && metric.value > 1000
										? (metric.value / 1000).toFixed(1) + "k"
										: metric.value.toLocaleString()}
								</div>
								<div className="text-xs text-gray-500 mt-1">
									{metric.description}
								</div>
								<div className="text-xs text-gray-400 mt-1">
									vs {metric.comparisonWith}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}