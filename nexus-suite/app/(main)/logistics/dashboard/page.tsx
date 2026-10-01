'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getLogisticsDashboard } from '@/lib/services/logistics-ops-service';
import type { LogisticsDashboard } from '@/types/logistics-ops';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    IconTruck,
    IconPackage,
    IconChartBar,
    IconDatabase,
    IconFileWord,
} from '@tabler/icons-react';

export default function LogisticsDashboardPage() {
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
                    title:
                        e instanceof Error
                            ? e.message
                            : String(e) || 'Failed to load dashboard',
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
                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Shipments',
            value: dashboard?.totalShipments ?? 0,
            desc: `${dashboard?.deliveredShipments ?? 0} delivered`,
            icon: IconTruck,
            href: '/logistics/shipments',
        },
        {
            title: 'Total Revenue',
            value: dashboard?.totalRevenue
                ? `$${Number(dashboard.totalRevenue).toFixed(2)}`
                : '$0.00',
            desc: 'from completed shipments',
            icon: IconChartBar,
            href: '/logistics/analytics',
        },
        {
            title: 'Fleet Assets',
            value: dashboard?.totalAssets ?? 0,
            desc: `${dashboard?.availableAssets ?? 0} available`,
            icon: IconDatabase,
            href: '/logistics/fleet',
        },
        {
            title: 'Open Payables',
            value: dashboard?.openPayables ?? 0,
            desc: 'pending carrier settlement',
            icon: IconFileWord,
            href: '/logistics/financials',
        },
    ];

    const utilization =
        dashboard?.equipmentUtilization != null
            ? `${(dashboard.equipmentUtilization * 100).toFixed(1)}%`
            : '-';

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Logistics Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Load board, fleet, execution and settlement at a glance
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/logistics/load-board">
                            <Plus className="mr-2 h-4 w-4" />
                            Quote
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/logistics/shipments">
                            <Plus className="mr-2 h-4 w-4" />
                            Shipments
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                    <Card className="p-4 gap-2" key={s.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
                            <CardTitle className="text-sm font-medium">
                                {s.title}
                            </CardTitle>
                            <s.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold">{s.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {s.desc}
                            </p>
                            <Button
                                asChild
                                variant="link"
                                className="px-0 text-xs"
                            >
                                <Link href={s.href}>View details</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Execution</CardTitle>
                        <CardDescription>
                            Delivery progress and fleet utilization
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-0">
                        <div className="flex justify-between">
                            <span className="text-sm">Delivered</span>
                            <Badge>
                                {dashboard?.deliveredShipments ?? 0} /{' '}
                                {dashboard?.totalShipments ?? 0}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">
                                Equipment Utilization
                            </span>
                            <Badge variant="outline">{utilization}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Available Assets</span>
                            <span className="text-sm font-medium">
                                {dashboard?.availableAssets ?? 0}
                            </span>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                        >
                            <Link href="/logistics/shipments">
                                Go to Shipments
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Settlement</CardTitle>
                        <CardDescription>
                            Revenue and carrier payables
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-0">
                        <div className="flex justify-between">
                            <span className="text-sm">Total Revenue</span>
                            <span className="text-sm font-medium">
                                $
                                {dashboard?.totalRevenue != null
                                    ? Number(dashboard.totalRevenue).toFixed(2)
                                    : '0.00'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Open Payables</span>
                            <Badge variant="secondary">
                                {dashboard?.openPayables ?? 0}
                            </Badge>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                        >
                            <Link href="/logistics/financials">
                                Go to Financials
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-2">
                        <IconPackage className="h-4 w-4 text-muted-foreground" />
                        Quick Navigation
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/logistics/load-board">Load Board</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/logistics/fleet">Fleet</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/logistics/routing">Routing</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/logistics/financials">Financials</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/logistics/freight-invoices">
                                Freight Invoices
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/logistics/analytics">Analytics</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
