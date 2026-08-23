"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    trend?: {
        value: number;
        label?: string;
    };
    icon?: React.ReactNode;
    variant?: "default" | "success" | "warning" | "error";
}

export function MetricCard({
    title,
    value,
    description,
    trend,
    icon,
    variant = "default",
}: MetricCardProps) {
    const getTrendIcon = (value: number) => {
        if (value > 0) return <TrendingUpIcon className="size-4 text-green-600" />;
        if (value < 0) return <TrendingDownIcon className="size-4 text-red-600" />;
        return <MinusIcon className="size-4 text-gray-500" />;
    };

    const getTrendColor = (value: number) => {
        if (value > 0) return "text-green-600";
        if (value < 0) return "text-red-600";
        return "text-gray-500";
    };

    const trendValue = trend?.value ?? 0;
    const trendLabel = trend?.label ?? (trendValue > 0 ? "vs last period" : trendValue < 0 ? "vs last period" : "no change");

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {typeof value === "number" ? value.toLocaleString() : value}
                </CardTitle>
                {trend !== undefined && (
                    <CardAction>
                        <Badge variant="outline" className={getTrendColor(trendValue)}>
                            {getTrendIcon(trendValue)}
                            {trendValue > 0 ? "+" : ""}{trendValue.toFixed(1)}%
                        </Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                {description && (
                    <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
                        {description}
                    </div>
                )}
                {trend !== undefined && (
                    <div className={getTrendColor(trendValue)}>{trendLabel}</div>
                )}
            </CardFooter>
        </Card>
    );
}