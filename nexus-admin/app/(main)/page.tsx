"use client";

import { Loader2, RefreshCw } from "lucide-react";
import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

import { ClientHealthGrid } from "@/components/client-health-grid";
import { ConfigInsightsCharts } from "@/components/config-insights-charts";
import { PerformanceCharts } from "@/components/performance-charts";
import { RequestTrendsChart } from "@/components/request-trends-chart";
import { SectionCards } from "@/components/section-cards";
import { TimeRange, TimeRangeSelector, getDateRangeFromTimeRange } from "@/components/time-range-selector";
import { ToolUsageCharts } from "@/components/tool-usage-charts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DashboardData, fetchDashboardData } from "@/lib/nexus-buddy-dashboard";

interface DashboardSectionProps {
    data: DashboardData | null;
    timeRange: TimeRange;
    isLoading: boolean;
    onTimeRangeChange: (range: TimeRange) => void;
    onClientClick: (client: any) => void;
}

function DashboardContent({ data, timeRange, isLoading, onTimeRangeChange, onClientClick }: DashboardSectionProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-muted-foreground">No data available</p>
                    <p className="text-sm text-muted-foreground">Select a time range to load dashboard data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Section 1: Executive Summary */}
            <section aria-labelledby="executive-summary-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="executive-summary-heading" className="text-2xl font-semibold tracking-tight">
                        Executive Summary
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Showing: {timeRange === "24h" ? "Last 24 hours" : timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "Custom range"}</span>
                    </div>
                </div>
                <SectionCards
                    revenue={data.executiveSummary.requestsLast24h}
                    customers={data.executiveSummary.activeClients}
                    accounts={data.executiveSummary.totalTools}
                    growth={data.executiveSummary.successRateLast24h}
                />
            </section>

            <Separator />

            {/* Section 2: Client Health Matrix */}
            <section aria-labelledby="client-health-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="client-health-heading" className="text-2xl font-semibold tracking-tight">
                        Client Health Matrix
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {data.clientHealth.length} clients monitored
                    </p>
                </div>
                <ClientHealthGrid clients={data.clientHealth} onClientClick={onClientClick} />
            </section>

            <Separator />

            {/* Section 3: Request Volume Trends */}
            <section aria-labelledby="request-trends-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="request-trends-heading" className="text-2xl font-semibold tracking-tight">
                        Request Volume Trends
                    </h2>
                </div>
                <RequestTrendsChart
                    data={data.requestTrends}
                    timeRange={timeRange}
                    onTimeRangeChange={onTimeRangeChange}
                />
            </section>

            <Separator />

            {/* Section 4: Tool Usage Analytics */}
            <section aria-labelledby="tool-usage-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="tool-usage-heading" className="text-2xl font-semibold tracking-tight">
                        Tool Usage Analytics
                    </h2>
                </div>
                <ToolUsageCharts data={data.toolUsage} />
            </section>

            <Separator />

            {/* Section 5: Performance & Reliability */}
            <section aria-labelledby="performance-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="performance-heading" className="text-2xl font-semibold tracking-tight">
                        Performance & Reliability
                    </h2>
                </div>
                <PerformanceCharts data={data.performance} />
            </section>

            <Separator />

            {/* Section 6: Configuration Insights */}
            <section aria-labelledby="config-insights-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="config-insights-heading" className="text-2xl font-semibold tracking-tight">
                        Configuration Insights
                    </h2>
                </div>
                <ConfigInsightsCharts data={data.configInsights} />
            </section>
        </div>
    );
}

export default function Page() {
    const router = useRouter();
    const [timeRange, setTimeRange] = React.useState<TimeRange>("7d");
    const [customRange, setCustomRange] = React.useState<{ from: Date; to: Date } | null>(null);
    const [data, setData] = React.useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleClientClick = (client: any) => {
        router.push(`/client-insights/${client.clientConfigId}`);
    };

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dateRange = customRange || getDateRangeFromTimeRange(timeRange);
            const result = await fetchDashboardData(dateRange.from, dateRange.to);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load dashboard data");
            console.error("Dashboard load error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, customRange]);

    // Load data on mount and when time range changes
    React.useEffect(() => {
        const loadDataFunc = async () => {
            await loadData();
        };
        loadDataFunc();
    }, [loadData]);

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header with Time Range Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">NexusAdmin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Analytics and insights for NexusBuddy API Gateway performance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <TimeRangeSelector
                        value={timeRange}
                        onChange={setTimeRange}
                        customRange={customRange}
                        onCustomRangeChange={setCustomRange}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadData}
                        disabled={isLoading}
                        aria-label="Refresh dashboard data"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            {/* Dashboard Content */}
            <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <DashboardContent data={data} timeRange={timeRange} isLoading={isLoading} onTimeRangeChange={setTimeRange} onClientClick={handleClientClick} />
            </Suspense>
        </div>
    );
}
