'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getLogisticsDashboard } from '@/lib/services/logistics-ops-service';
import type { LogisticsDashboard } from '@/types/logistics-ops';
import { useToast } from '@/hooks/use-toast';
import { IconChartBar, IconTruck, IconDatabase } from '@tabler/icons-react';

export default function LogisticsAnalyticsPage() {
    const { toast } = useToast();
    const [dashboard, setDashboard] = useState<LogisticsDashboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const d = await getLogisticsDashboard().catch(() => null);
                if (!active) return;
                setDashboard(d);
            } catch (e: unknown) {
                toast({
                    title: e instanceof Error ? e.message : String(e),
                    variant: 'destructive',
                });
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    const laneEntries = Object.entries(dashboard?.revenuePerLane ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const customerEntries = Object.entries(dashboard?.revenuePerCustomer ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const utilization =
        dashboard?.equipmentUtilization != null
            ? `${(dashboard.equipmentUtilization * 100).toFixed(1)}%`
            : '-';

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Analytics</h1>
                <p className="text-sm text-muted-foreground">
                    Revenue per lane and customer, equipment utilization
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 gap-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <IconChartBar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            $
                            {dashboard?.totalRevenue != null
                                ? Number(dashboard.totalRevenue).toFixed(2)
                                : '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.deliveredShipments ?? 0} of{' '}
                            {dashboard?.totalShipments ?? 0} shipments delivered
                        </p>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
                        <CardTitle className="text-sm font-medium">
                            Equipment Utilization
                        </CardTitle>
                        <IconDatabase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">{utilization}</div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.totalAssets ?? 0} assets •{' '}
                            {dashboard?.availableAssets ?? 0} available
                        </p>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
                        <CardTitle className="text-sm font-medium">
                            Delivery Rate
                        </CardTitle>
                        <IconTruck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            {dashboard?.totalShipments
                                ? `${(((dashboard.deliveredShipments ?? 0) / dashboard.totalShipments) * 100).toFixed(1)}%`
                                : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            delivered shipments
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Revenue per Lane</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-2">
                            {laneEntries.map(([lane, revenue]) => (
                                <div
                                    key={lane}
                                    className="flex items-center justify-between border-b py-2 last:border-0"
                                >
                                    <div className="text-sm font-medium">
                                        {lane}
                                    </div>
                                    <Badge variant="outline">
                                        ${Number(revenue).toFixed(2)}
                                    </Badge>
                                </div>
                            ))}
                            {!laneEntries.length && (
                                <div className="text-sm text-muted-foreground">
                                    No lane revenue yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Revenue per Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-2">
                            {customerEntries.map(([customer, revenue]) => (
                                <div
                                    key={customer}
                                    className="flex items-center justify-between border-b py-2 last:border-0"
                                >
                                    <div className="text-sm font-medium">
                                        Org #{customer}
                                    </div>
                                    <Badge variant="outline">
                                        ${Number(revenue).toFixed(2)}
                                    </Badge>
                                </div>
                            ))}
                            {!customerEntries.length && (
                                <div className="text-sm text-muted-foreground">
                                    No customer revenue yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
