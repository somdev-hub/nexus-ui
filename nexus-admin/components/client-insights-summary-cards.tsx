"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon } from "lucide-react";

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        label: string;
    };
    iconColor?: string;
    bgColor?: string;
}

export function SummaryCard({ title, value, icon, trend, iconColor = "text-primary", bgColor = "bg-primary/10" }: SummaryCardProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={`${iconColor} ${bgColor} p-2 rounded-lg`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <div className="flex items-center gap-1 mt-2 text-xs">
                        <span className={trend.value >= 0 ? "text-green-600" : "text-red-600"}>
                            {trend.value >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                            {Math.abs(trend.value)}%
                        </span>
                        <span className="text-muted-foreground">{trend.label}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ClientInsightsSummaryCards({ summary }: {
    summary: {
        totalHits: number;
        successPercentage: number;
        failurePercentage: number;
        averageResponseTime: number;
    }
}) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
                title="Total Hits"
                value={summary.totalHits.toLocaleString()}
                icon={<CheckCircleIcon className="h-4 w-4" />}
                iconColor="text-green-600"
                bgColor="bg-green-100"
            />
            <SummaryCard
                title="Success Rate"
                value={`${summary.successPercentage.toFixed(2)}%`}
                icon={<CheckCircleIcon className="h-4 w-4" />}
                iconColor="text-green-600"
                bgColor="bg-green-100"
                trend={{ value: 2.5, label: "vs last period" }}
            />
            <SummaryCard
                title="Failure Rate"
                value={`${summary.failurePercentage.toFixed(2)}%`}
                icon={<AlertCircleIcon className="h-4 w-4" />}
                iconColor="text-red-600"
                bgColor="bg-red-100"
                trend={{ value: -1.2, label: "vs last period" }}
            />
            <SummaryCard
                title="Avg Response Time"
                value={`${summary.averageResponseTime.toFixed(0)}ms`}
                icon={<ClockIcon className="h-4 w-4" />}
                iconColor="text-blue-600"
                bgColor="bg-blue-100"
                trend={{ value: -5.3, label: "vs last period" }}
            />
        </div>
    );
}