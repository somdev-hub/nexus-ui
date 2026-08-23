"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, GlobeIcon, WifiIcon } from "lucide-react";
import { ClientHealthResponse } from "@/types/nexus-buddy-dashboard";

interface ClientHealthCardProps {
    client: ClientHealthResponse;
    onClick?: () => void;
}

export function ClientHealthCard({ client, onClick }: ClientHealthCardProps) {
    const getErrorRateColor = (rate: number) => {
        if (rate === 0) return "text-green-600 bg-green-50 border-green-200";
        if (rate < 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        if (rate < 20) return "text-orange-600 bg-orange-50 border-orange-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const getErrorRateLabel = (rate: number) => {
        if (rate === 0) return "Healthy";
        if (rate < 5) return "Warning";
        if (rate < 20) return "Degraded";
        return "Critical";
    };

    const formatTimestamp = (timestamp: string | null) => {
        if (!timestamp) return "Never";
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return "Invalid date";
        }
    };

    return (
        <Card
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">{client.clientName}</CardTitle>
                        <CardDescription className="text-xs">
                            {client.connectionUrl}
                        </CardDescription>
                    </div>
                    <Badge
                        variant={client.isActive ? "default" : "secondary"}
                        className="shrink-0"
                    >
                        {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <WifiIcon className="size-4" />
                        <span>Tools: <span className="font-medium text-foreground">{client.toolCount}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircleIcon className="size-4 text-green-600" />
                        <span>Active: <span className="font-medium text-foreground">{client.activeToolCount}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <GlobeIcon className="size-4" />
                        <span>Requests (24h): <span className="font-medium text-foreground">{client.requestsLast24h.toLocaleString()}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircleIcon className="size-4 text-red-600" />
                        <span>Errors: <span className="font-medium text-foreground">{client.errorsLast24h.toLocaleString()}</span></span>
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Error Rate (24h)</span>
                        <Badge
                            variant="outline"
                            className={getErrorRateColor(client.errorRateLast24h)}
                        >
                            {client.errorRateLast24h.toFixed(2)}%
                        </Badge>
                    </div>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                            style={{ width: `${Math.min(client.errorRateLast24h * 5, 100)}%` }}
                        />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Status: <span className="font-medium">{getErrorRateLabel(client.errorRateLast24h)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        <span>Last request: {formatTimestamp(client.lastRequestTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {client.healthCheckStatus !== null && (
                            <>
                                <WifiIcon className={`size-3 ${client.healthCheckStatus ? "text-green-600" : "text-red-600"}`} />
                                <span>{client.healthCheckStatus ? "Health check OK" : "Health check failed"}</span>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-0">
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    View details →
                </span>
            </CardFooter>
        </Card>
    );
}