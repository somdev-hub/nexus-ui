'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ColumnDef } from '@tanstack/react-table';
import { useTables } from '@/hooks/use-tables';
import {
    getAllAccountHealth,
    getHealthSummary,
    getCustomerOrders,
} from '@/lib/services/supplier-commercial-service';
import type {
    AccountHealth,
    AccountHealthSummary,
    SupplierOrder,
} from '@/types/supplier';
import { useToast } from '@/hooks/use-toast';

export default function AccountHealthPage() {
    const { toast } = useToast();
    const [data, setData] = useState<AccountHealth[] | null>(null);
    const [summary, setSummary] = useState<AccountHealthSummary | null>(null);
    const [buyerNames, setBuyerNames] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const [d, s, o] = await Promise.all([
                    getAllAccountHealth().catch(() => [] as AccountHealth[]),
                    getHealthSummary().catch(() => null),
                    getCustomerOrders(undefined, { page: 0, size: 100 }).catch(
                        () => null
                    ),
                ]);
                setData(Array.isArray(d) ? d : []);
                setSummary(s);
                const names: Record<number, string> = {};
                o?.content?.forEach((order: SupplierOrder) => {
                    const id = order.buyerOrgId ?? order.buyerOrg?.accountId;
                    const name = order.buyerOrg?.name;
                    if (id !== undefined && name && !names[id])
                        names[id] = name;
                });
                setBuyerNames(names);
            } catch (e: unknown) {
                toast({
                    title: e instanceof Error ? e.message : 'Failed to load',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        })();
    }, [toast]);
    const list = data ?? [];
    const columns: ColumnDef<AccountHealth>[] = [
        {
            id: 'buyer',
            accessorFn: (row) =>
                buyerNames[row.buyerOrgId] ?? String(row.buyerOrgId ?? ''),
            header: 'Buyer',
            cell: ({ row }) =>
                buyerNames[row.original.buyerOrgId] ?? (
                    <>
                        {row.original.buyerOrgId || row.index + 1}
                        <div className="text-xs text-muted-foreground">
                            ID {row.original.buyerOrgId}
                        </div>
                    </>
                ),
        },
        {
            accessorKey: 'totalOrders',
            header: () => <div className="w-full text-right">Orders</div>,
            cell: ({ row }) => (
                <div className="font-mono text-right">
                    {row.original.totalOrders}
                </div>
            ),
        },
        {
            accessorKey: 'totalOrderValue',
            header: () => <div className="w-full text-right">Value</div>,
            cell: ({ row }) => (
                <div className="font-mono text-right">
                    {row.original.totalOrderValue
                        ? `$${Math.round(row.original.totalOrderValue)}`
                        : '-'}
                </div>
            ),
        },
        {
            accessorKey: 'paymentBehaviorScore',
            header: 'Payment Score',
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.paymentBehaviorScore > 80
                            ? 'default'
                            : row.original.paymentBehaviorScore > 50
                              ? 'secondary'
                              : 'destructive'
                    }
                >
                    {row.original.paymentBehaviorScore
                        ? Math.round(row.original.paymentBehaviorScore) + '%'
                        : '-'}
                </Badge>
            ),
        },
        {
            accessorKey: 'creditUtilization',
            header: 'Credit',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.creditUtilization || '-'}
                </Badge>
            ),
        },
    ];
    const table = useTables<AccountHealth>({
        data: list,
        columns,
        getRowId: (row, index) => String(row.buyerOrgId ?? index),
    });
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <h1 className="text-2xl font-semibold">
                Account Health (Payment Behavior / Order Patterns / Credit)
            </h1>
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm">
                            Total Customers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            {summary?.totalCustomers ?? list.length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm">
                            Avg Payment Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            {summary?.avgPaymentScore
                                ? Math.round(summary.avgPaymentScore) + '%'
                                : '-'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm">
                            Authorized View
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-xs text-muted-foreground">
                            Only data supplier is authorized to access is
                            displayed (FR-SUP-032)
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Retailer Accounts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <CentralizedDataTable
                            table={table}
                            emptyMessage="No account health data"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
