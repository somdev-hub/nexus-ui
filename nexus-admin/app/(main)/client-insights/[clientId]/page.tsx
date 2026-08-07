"use client";

import { ClientInsightsCharts } from "@/components/client-insights-charts";
import { LogsTable } from "@/components/client-insights-logs-table";
import { ClientInsightsSummaryCards } from "@/components/client-insights-summary-cards";
import { ToolsTable } from "@/components/client-insights-tools-table";
import { TimeRange, TimeRangeSelector, getDateRangeFromTimeRange } from "@/components/time-range-selector";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    getClientInsights,
    getClientLogs,
    getClientToolInsights
} from "@/lib/auth-service";
import { ClientInsightsFilters, ClientInsightsResponse, LogEntry, ToolInsightsData } from "@/types/client-insights";
import { ArrowLeft, BarChart2, Loader2, RefreshCw } from "lucide-react";
import { useParams } from "next/dist/client/components/navigation";
import * as React from "react";
import { Suspense } from "react";

export default function ClientInsightsContent() {
    const { clientId } = useParams<{ clientId: string }>();
    const [timeRange, setTimeRange] = React.useState<TimeRange>("7d");
    const [customRange, setCustomRange] = React.useState<{ from: Date; to: Date } | null>(null);
    const [insightsData, setInsightsData] = React.useState<ClientInsightsResponse | null>(null);
    const [toolsData, setToolsData] = React.useState<{ data: ToolInsightsData[]; total: number; page: number; pageSize: number; totalPages: number } | null>(null);
    const [logsData, setLogsData] = React.useState<{ data: LogEntry[]; total: number; page: number; pageSize: number; totalPages: number } | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingTools, setIsLoadingTools] = React.useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState<"overview" | "tools" | "logs">("overview");

    // Tools pagination state (1-based for UI)
    const [toolsPage, setToolsPage] = React.useState(1);
    const [toolsPageSize, setToolsPageSize] = React.useState(10);

    // Logs pagination and filters state (1-based for UI)
    const [logsPage, setLogsPage] = React.useState(1);
    const [logsPageSize, setLogsPageSize] = React.useState(20);
    const [logsFilters, setLogsFilters] = React.useState<ClientInsightsFilters>({
        page: 0, // 0-based for API
        pageSize: 20,
    });

    const loadInsightsData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dateRange = customRange || getDateRangeFromTimeRange(timeRange);
            const result = await getClientInsights(parseInt(clientId), {
                range: timeRange,
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
            });
            setInsightsData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load insights data");
            console.error("Insights load error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [clientId, timeRange, customRange]);

    const loadToolsData = React.useCallback(async () => {
        setIsLoadingTools(true);
        try {
            const dateRange = customRange || getDateRangeFromTimeRange(timeRange);
            const result = await getClientToolInsights(parseInt(clientId), {
                range: timeRange,
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
                page: toolsPage - 1, // Convert 1-based UI to 0-based API
                pageSize: toolsPageSize,
            });
            setToolsData(result);
        } catch (err) {
            console.error("Tools data load error:", err);
        } finally {
            setIsLoadingTools(false);
        }
    }, [clientId, timeRange, customRange, toolsPage, toolsPageSize]);

    const loadLogsData = React.useCallback(async () => {
        setIsLoadingLogs(true);
        try {
            const dateRange = customRange || getDateRangeFromTimeRange(timeRange);
            const filters = {
                ...logsFilters,
                page: logsPage - 1, // Convert 1-based UI to 0-based API
                pageSize: logsPageSize,
                fromDate: dateRange.from.toISOString(),
                toDate: dateRange.to.toISOString(),
            };
            const result = await getClientLogs(parseInt(clientId), filters);
            setLogsData(result);
        } catch (err) {
            console.error("Logs data load error:", err);
        } finally {
            setIsLoadingLogs(false);
        }
    }, [clientId, timeRange, customRange, logsPage, logsPageSize, logsFilters]);

    // Load data on mount and when time range changes
    React.useEffect(() => {
        const loadDataFunc = async () => {
            await loadInsightsData();
        }
        loadDataFunc();
    }, [loadInsightsData]);

    React.useEffect(() => {
        const loadDataFunc = async () => {
            await loadToolsData();
        }
        if (activeTab === "tools") {
            loadDataFunc();
        }
    }, [activeTab, loadToolsData, timeRange, customRange]);

    React.useEffect(() => {
        const loadDataFunc = async () => {
            await loadLogsData();
        }
        if (activeTab === "logs") {
            loadDataFunc();
        }
    }, [activeTab, loadLogsData, timeRange, customRange]);

    // Extract unique values for filter dropdowns
    const availableTools = React.useMemo(() => {
        if (!toolsData?.data) return [];
        return [...new Set(toolsData.data.map(t => t.toolName))].sort();
    }, [toolsData]);

    const availableStatusCodes = React.useMemo(() => {
        if (!logsData?.data) return [];
        return [...new Set(logsData.data.map(l => l.statusCode))].sort((a, b) => a - b);
    }, [logsData]);

    const availableHttpMethods = React.useMemo(() => {
        if (!logsData?.data) return [];
        return [...new Set(logsData.data.map(l => l.httpMethod))].sort();
    }, [logsData]);

    const handleLogsFiltersChange = (newFilters: ClientInsightsFilters) => {
        setLogsFilters(newFilters);
        setLogsPage(1); // Reset to first page when filters change
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Client Insights</h1>
                        <p className="text-muted-foreground mt-1">
                            Analytics and insights for client performance
                        </p>
                    </div>
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
                        onClick={activeTab === "overview" ? loadInsightsData : activeTab === "tools" ? loadToolsData : loadLogsData}
                        disabled={activeTab === "overview" ? isLoading : activeTab === "tools" ? isLoadingTools : isLoadingLogs}
                        aria-label="Refresh data"
                    >
                        <RefreshCw className={`h-4 w-4 ${(activeTab === "overview" && isLoading) || (activeTab === "tools" && isLoadingTools) || (activeTab === "logs" && isLoadingLogs) ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setActiveTab("overview")}
                >
                    <BarChart2 className="h-4 w-4 inline mr-1" />
                    Overview
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "tools"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setActiveTab("tools")}
                >
                    Tools
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "logs"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setActiveTab("logs")}
                >
                    Logs
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }>
                    <OverviewTab data={insightsData} isLoading={isLoading} />
                </Suspense>
            )}

            {activeTab === "tools" && (
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }>
                    <ToolsTab
                        data={toolsData}
                        isLoading={isLoadingTools}
                        onPageChange={setToolsPage}
                        onPageSizeChange={setToolsPageSize}
                    />
                </Suspense>
            )}

            {activeTab === "logs" && (
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }>
                    <LogsTab
                        data={logsData}
                        isLoading={isLoadingLogs}
                        filters={logsFilters}
                        onFiltersChange={handleLogsFiltersChange}
                        onPageChange={setLogsPage}
                        onPageSizeChange={setLogsPageSize}
                        availableTools={availableTools}
                        availableStatusCodes={availableStatusCodes}
                        availableHttpMethods={availableHttpMethods}
                    />
                </Suspense>
            )}
        </div>
    );
}

function OverviewTab({ data, isLoading }: { data: ClientInsightsResponse | null; isLoading: boolean }) {
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
                    <p className="text-sm text-muted-foreground">Select a time range to load insights data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Cards */}
            <section aria-labelledby="summary-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="summary-heading" className="text-2xl font-semibold tracking-tight">
                        Summary
                    </h2>
                </div>
                <ClientInsightsSummaryCards summary={data.summary} />
            </section>

            <Separator />

            {/* Charts */}
            <section aria-labelledby="charts-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="charts-heading" className="text-2xl font-semibold tracking-tight">
                        Insights Graphs
                    </h2>
                </div>
                <ClientInsightsCharts
                    responseTimeData={data.responseTimeData}
                    hourlyHitsData={data.hourlyHitsData}
                    failureGraphData={data.failureGraphData}
                />
            </section>
        </div>
    );
}

function ToolsTab({
    data,
    isLoading,
    onPageChange,
    onPageSizeChange,
}: {
    data: { data: ToolInsightsData[]; total: number; page: number; pageSize: number; totalPages: number } | null;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}) {
    return (
        <div className="flex flex-col gap-6">
            <section aria-labelledby="tools-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="tools-heading" className="text-2xl font-semibold tracking-tight">
                        Tools Insights
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {data ? `${data.total} tools found` : "Loading..."}
                    </p>
                </div>
                <ToolsTable
                    data={data?.data || []}
                    pagination={{
                        page: data?.page || 1,
                        pageSize: data?.pageSize || 10,
                        total: data?.total || 0,
                        totalPages: data?.totalPages || 0,
                    }}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    isLoading={isLoading}
                />
            </section>
        </div>
    );
}

function LogsTab({
    data,
    isLoading,
    filters,
    onFiltersChange,
    onPageChange,
    onPageSizeChange,
    availableTools,
    availableStatusCodes,
    availableHttpMethods,
}: {
    data: { data: LogEntry[]; total: number; page: number; pageSize: number; totalPages: number } | null;
    isLoading: boolean;
    filters: ClientInsightsFilters;
    onFiltersChange: (filters: ClientInsightsFilters) => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    availableTools: string[];
    availableStatusCodes: number[];
    availableHttpMethods: string[];
}) {
    return (
        <div className="flex flex-col gap-6">
            <section aria-labelledby="logs-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="logs-heading" className="text-2xl font-semibold tracking-tight">
                        Request Logs
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {data ? `${data.total} log entries found` : "Loading..."}
                    </p>
                </div>
                <LogsTable
                    data={data?.data || []}
                    pagination={{
                        page: data?.page || 1,
                        pageSize: data?.pageSize || 20,
                        total: data?.total || 0,
                        totalPages: data?.totalPages || 0,
                    }}
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    isLoading={isLoading}
                    availableTools={availableTools}
                    availableStatusCodes={availableStatusCodes}
                    availableHttpMethods={availableHttpMethods}
                />
            </section>
        </div>
    );
}