'use client';
import { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getCustomerOrders,
    getCustomerSummary,
} from '@/lib/services/supplier-commercial-service';
import type { SupplierOrder, CustomerSummary } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { useTables } from '@/hooks/use-tables';
import type { ColumnDef } from '@tanstack/react-table';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
    const { toast } = useToast();
    const [orders, setOrders] =
        useState<PaginatedResponse<SupplierOrder> | null>(null);
    const [summary, setSummary] = useState<CustomerSummary | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const [o, s] = await Promise.all([
                    getCustomerOrders(undefined, { page: 0, size: 100 }),
                    getCustomerSummary().catch(() => null),
                ]);
                setOrders(o);
                setSummary(s);
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
    const rows = orders?.content ?? [];
    const columns: ColumnDef<SupplierOrder>[] = [
        {
            accessorKey: 'poNumber',
            header: 'PO',
            cell: ({ row }) => (
                <div className="font-medium">{row.original.poNumber}</div>
            ),
        },
        {
            id: 'buyer',
            accessorFn: (row) =>
                row.buyerOrg?.name ||
                (row.buyerOrgId !== undefined ? String(row.buyerOrgId) : '-'),
            header: 'Buyer',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <Badge>{row.original.status}</Badge>,
        },
        {
            id: 'totalAmount',
            accessorFn: (row) => row.totalAmount ?? 0,
            header: () => <div className="w-full text-right">Total</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    {row.original.totalAmount
                        ? `$${row.original.totalAmount}`
                        : '-'}
                </div>
            ),
        },
    ];
    const table = useTables<SupplierOrder>({
        data: rows,
        columns,
        getRowId: (row, index) =>
            row.purchaseOrderId
                ? String(row.purchaseOrderId)
                : row.poNumber || `row-${index}`,
    });
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <h1 className="text-2xl font-semibold">
                Customer Portal (Orders / Invoices / Shipments / Returns)
            </h1>
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            {summary?.totalOrders ?? orders?.totalElements ?? 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            {summary?.totalOrderValue
                                ? `$${Math.round(summary.totalOrderValue)}`
                                : '-'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm">Open Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            {summary?.openOrders ?? 0}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Retailer Orders</CardTitle>
                    <CardDescription>
                        Supplier view of retailer-facing orders
                    </CardDescription>
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
                            emptyMessage="No customer orders"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
