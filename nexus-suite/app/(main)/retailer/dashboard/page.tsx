'use client';

import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { SectionCards } from '@/components/section-cards';
import type { ColumnDef } from '@tanstack/react-table';
import { useTables } from '@/hooks/use-tables';
import { MaterialDistributionPie } from '@/components/material-distribution-pie';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPartnerships } from '@/lib/services/partnerships-service';
import { getPurchaseOrders } from '@/lib/services/purchase-orders-service';
import {
    getGoodsReceipts,
    getInvoices,
} from '@/lib/services/procurement-extended-service';
import { getRetailerCoreShipments } from '@/lib/services/shipment-service';
import {
    getRetailerConsignments,
    getRetailerVmis,
} from '@/lib/services/stock-service';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
};

type DashboardData = {
    partnerships: Awaited<ReturnType<typeof getPartnerships>>;
    purchaseOrders: Awaited<ReturnType<typeof getPurchaseOrders>> | null;
    goodsReceipts: Awaited<ReturnType<typeof getGoodsReceipts>> | null;
    invoices: Awaited<ReturnType<typeof getInvoices>> | null;
    shipments: Awaited<ReturnType<typeof getRetailerCoreShipments>> | null;
    consignments: Awaited<ReturnType<typeof getRetailerConsignments>>;
    vmis: Awaited<ReturnType<typeof getRetailerVmis>>;
};

interface RecentActivityRow {
    id: number;
    type: string;
    reference: string;
    status: string;
    party: string;
    date: string;
    amount: string;
}

export default function Page() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        const loadDashboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch in parallel - same as HR pattern (useEffect + Promise.all in client)
                // This avoids ERR_INVALID_URL that happens when using apiClient (baseURL: "/api/proxy")
                // inside a Server Component. On server, axios needs absolute URL; on client,
                // relative URL works because browser resolves it against window.location.origin
                // and withCredentials forwards HttpOnly cookies to /api/proxy.
                const [
                    partnerships,
                    purchaseOrders,
                    goodsReceipts,
                    invoices,
                    shipments,
                    consignments,
                    vmis,
                ] = await Promise.all([
                    getPartnerships({ pageNo: 0, pageOffset: 5 }),
                    // Fetch purchase orders for the dashboard total PO card
                    getPurchaseOrders({ pageNo: 0, pageOffset: 5 }).catch(
                        () => null
                    ),
                    getGoodsReceipts({ pageNo: 0, pageOffset: 5 }).catch(
                        () => null
                    ),
                    getInvoices({ pageNo: 0, pageOffset: 5 }).catch(() => null),
                    getRetailerCoreShipments(0, 5).catch(() => null),
                    getRetailerConsignments().catch(() => []),
                    getRetailerVmis().catch(() => []),
                ]);

                if (!isActive) return;
                setData({
                    partnerships,
                    purchaseOrders,
                    goodsReceipts,
                    invoices,
                    shipments,
                    consignments,
                    vmis,
                });
            } catch (err: unknown) {
                if (!isActive) return;
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load dashboard data';
                setError(message);
                toast.error(message);
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        loadDashboard();
        return () => {
            isActive = false;
        };
    }, []);

    // Purchase orders
    const poRows = ((data?.purchaseOrders?.content ?? []) as any[]).map(
        (po: any, index: number) => ({
            id: index + 1,
            reference: po.purchaseOrderNumber,
            status: po.status,
            party: po.supplierName || po.supplierOrgName || 'Supplier',
            date: formatDate(po.orderDate || po.createdAt),
            amount: Number(po.totalAmount ?? 0).toLocaleString(),
        })
    );
    const poColumns: ColumnDef<any>[] = [
        { accessorKey: 'reference', header: 'PO Number' },
        { accessorKey: 'party', header: 'Supplier' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'date', header: 'Date' },
    ];
    const poTable = useTables<any>({
        data: poRows,
        columns: poColumns,
        pageSize: 5,
        getRowId: (row) => `po-${row.id}`,
    });

    // Goods receipts
    const grRows = ((data?.goodsReceipts?.content ?? []) as any[]).map(
        (gr: any, index: number) => ({
            id: index + 1,
            reference: gr.grNumber || String(gr.goodsReceiptId ?? ''),
            status: gr.status || '—',
            party: gr.supplierName || 'Warehouse',
            date: formatDate(gr.receivedDate || gr.createdAt),
        })
    );
    const grColumns: ColumnDef<any>[] = [
        { accessorKey: 'reference', header: 'GR Number' },
        { accessorKey: 'party', header: 'Supplier/Warehouse' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'date', header: 'Received Date' },
    ];
    const grTable = useTables<any>({
        data: grRows,
        columns: grColumns,
        pageSize: 5,
        getRowId: (row) => `gr-${row.id}`,
    });

    // Invoices
    const invoiceRows = ((data?.invoices?.content ?? []) as any[]).map(
        (inv: any, index: number) => ({
            id: index + 1,
            reference: inv.invoiceNumber || String(inv.invoiceId ?? ''),
            status: inv.status || '—',
            party: inv.supplierName || 'Supplier',
            date: formatDate(inv.invoiceDate || inv.createdAt),
            amount: Number(inv.totalAmount ?? 0).toLocaleString(),
        })
    );
    const invoiceColumns: ColumnDef<any>[] = [
        { accessorKey: 'reference', header: 'Invoice Number' },
        { accessorKey: 'party', header: 'Supplier' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'date', header: 'Date' },
    ];
    const invoiceTable = useTables<any>({
        data: invoiceRows,
        columns: invoiceColumns,
        pageSize: 5,
        getRowId: (row) => `inv-${row.id}`,
    });

    // Shipments
    const shipmentRows = ((data?.shipments?.content ?? []) as any[]).map(
        (sh: any, index: number) => ({
            id: index + 1,
            reference: sh.shipmentNumber || String(sh.shipmentId ?? ''),
            status: sh.status || '—',
            party: sh.carrierName || sh.supplierName || 'Logistics',
            date: formatDate(sh.createdAt),
        })
    );
    const shipmentColumns: ColumnDef<any>[] = [
        { accessorKey: 'reference', header: 'Shipment Number' },
        { accessorKey: 'party', header: 'Carrier/Supplier' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'date', header: 'Date' },
    ];
    const shipmentTable = useTables<any>({
        data: shipmentRows,
        columns: shipmentColumns,
        pageSize: 5,
        getRowId: (row) => `sh-${row.id}`,
    });

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border bg-card p-4 space-y-3"
                                >
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 lg:grid-cols-10">
                            <div className="lg:col-span-7 rounded-xl border bg-card p-4 space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-[250px] w-full" />
                            </div>
                            <div className="lg:col-span-3 rounded-xl border bg-card p-4 space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-[250px] w-full rounded-full mx-auto" />
                            </div>
                        </div>
                        <div className="mx-4 lg:mx-6 rounded-xl border bg-card p-4 space-y-3">
                            <Skeleton className="h-5 w-40" />
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">
                    {error || 'No data available'}
                </p>
            </div>
        );
    }

    const {
        partnerships,
        purchaseOrders,
        goodsReceipts,
        invoices,
        shipments,
        consignments,
        vmis,
    } = data;

    const poReceivedQuantity = (purchaseOrders?.content ?? []).reduce(
        (sum, po) => {
            return (
                sum +
                (po.lineItems ?? []).reduce((s, li) => {
                    return s + (li.quantityReceived ?? li.quantityOrdered ?? 0);
                }, 0)
            );
        },
        0
    );

    const consignmentQuantity = (consignments ?? []).reduce((sum, c) => {
        return sum + (c.quantityOnHand ?? c.quantityAvailable ?? 0);
    }, 0);

    const vmiQuantity = (vmis ?? []).reduce((sum, v) => {
        return sum + (v.reorderQuantity ?? 0);
    }, 0);

    const materialDistribution = [
        {
            name: 'PO',
            value: poReceivedQuantity || (purchaseOrders?.content?.length ?? 0),
        },
        {
            name: 'Consignment',
            value: consignmentQuantity || (consignments?.length ?? 0),
        },
        { name: 'VMI', value: vmiQuantity || (vmis?.length ?? 0) },
    ];

    // table data is prepared above as recentPoRows

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards
                            totalPurchaseOrders={
                                purchaseOrders?.totalElements ?? 0
                            }
                            totalPartnerships={partnerships.totalElements}
                            totalVmi={vmis.length}
                            totalConsignment={consignments.length}
                        />
                        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 lg:grid-cols-10">
                            <div className="lg:col-span-7">
                                <ChartAreaInteractive />
                            </div>
                            <div className="lg:col-span-3">
                                <MaterialDistributionPie
                                    data={materialDistribution}
                                />
                            </div>
                        </div>
                        <div className="px-4 lg:px-6">
                            <Tabs defaultValue="po" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="po">
                                        Purchase Orders
                                    </TabsTrigger>
                                    <TabsTrigger value="gr">
                                        Goods Receipts
                                    </TabsTrigger>
                                    <TabsTrigger value="inv">
                                        Invoices
                                    </TabsTrigger>
                                    <TabsTrigger value="ship">
                                        Shipments
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="po">
                                    <CentralizedDataTable
                                        table={poTable}
                                        emptyMessage="No purchase orders"
                                    />
                                </TabsContent>
                                <TabsContent value="gr">
                                    <CentralizedDataTable
                                        table={grTable}
                                        emptyMessage="No goods receipts"
                                    />
                                </TabsContent>
                                <TabsContent value="inv">
                                    <CentralizedDataTable
                                        table={invoiceTable}
                                        emptyMessage="No invoices"
                                    />
                                </TabsContent>
                                <TabsContent value="ship">
                                    <CentralizedDataTable
                                        table={shipmentTable}
                                        emptyMessage="No shipments"
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
