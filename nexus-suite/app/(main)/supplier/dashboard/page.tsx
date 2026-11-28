'use client';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/hooks/use-toast';
import { setQuickCreateIntent } from '@/lib/quick-create';
import { getSupplierDashboard } from '@/lib/services/supplier-analytics-service';
import {
    getCapacities,
    getCapacitySummary,
} from '@/lib/services/supplier-capacity-service';
import { getSupplierCatalogs } from '@/lib/services/supplier-catalog-service';
import {
    getQuotationSummary,
    getQuotations,
} from '@/lib/services/supplier-commercial-service';
import {
    getConsignments,
    getVmis,
} from '@/lib/services/supplier-inventory-service';
import {
    getOrderSummary,
    getSupplierOrders,
} from '@/lib/services/supplier-orders-service';
import type { PaginatedResponse } from '@/types/paginated-response';
import type {
    CapacitySummary,
    OrderSummary,
    ProductionCapacity,
    QuotationSummary,
    SupplierCatalog,
    SupplierDashboard,
    SupplierOrder,
    SupplierQuotation,
} from '@/types/supplier';
import {
    IconDatabase,
    IconFileWord,
    IconPackage,
    IconShoppingCart,
} from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis } from 'recharts';

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
};

interface OrderRow {
    id: number;
    number: string;
    buyer: string;
    status: string;
    amount: string;
    date: string;
}

interface QuotationRow {
    id: number;
    number: string;
    buyer: string;
    status: string;
    amount: string;
    date: string;
}

export default function SupplierDashboard() {
    const { toast } = useToast();
    const router = useRouter();
    const [dashboard, setDashboard] = useState<SupplierDashboard | null>(null);
    const [catalog, setCatalog] =
        useState<PaginatedResponse<SupplierCatalog> | null>(null);
    const [orders, setOrders] = useState<OrderSummary | null>(null);
    const [quotations, setQuotations] = useState<QuotationSummary | null>(null);
    const [capacity, setCapacity] = useState<CapacitySummary | null>(null);
    const [capacityList, setCapacityList] = useState<ProductionCapacity[]>([]);
    const [capacityDateRange, setCapacityDateRange] = useState<string>('all');
    const [recentOrders, setRecentOrders] = useState<SupplierOrder[]>([]);
    const [recentQuotations, setRecentQuotations] = useState<
        SupplierQuotation[]
    >([]);
    const [consignmentCount, setConsignmentCount] = useState(0);
    const [vmiCount, setVmiCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const [d, c, o, q, cap, capList, ro, rq, cons, vmi] =
                    await Promise.all([
                        getSupplierDashboard().catch(() => null),
                        getSupplierCatalogs({ page: 0, size: 5 }).catch(
                            () => null
                        ),
                        getOrderSummary().catch(() => null),
                        getQuotationSummary().catch(() => null),
                        getCapacitySummary().catch(() => null),
                        getCapacities().catch(() => null),
                        getSupplierOrders({ page: 0, size: 10 }).catch(
                            () => null
                        ),
                        getQuotations({ page: 0, size: 10 }).catch(() => null),
                        getConsignments({ page: 0, size: 100 }).catch(
                            () => null
                        ),
                        getVmis({ page: 0, size: 100 }).catch(() => null),
                    ]);
                if (!active) return;
                setDashboard(d);
                setCatalog(c);
                setOrders(o);
                setQuotations(q);
                setCapacity(cap);
                setCapacityList(capList?.content ?? []);
                setRecentOrders(ro?.content ?? []);
                setRecentQuotations(rq?.content ?? []);
                setConsignmentCount(cons?.content?.length ?? 0);
                setVmiCount(vmi?.content?.length ?? 0);
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
    }, [toast]);

    const orderRows: OrderRow[] = recentOrders.map((o, i) => ({
        id: i + 1,
        number:
            o.poNumber || o.purchaseOrderNumber || `PO-${o.purchaseOrderId}`,
        status: o.status || '—',
        buyer: o.buyerOrgName || o.buyerOrg?.name || 'Buyer',
        date: formatDate(o.orderDate || o.createdAt),
        amount: Number(o.totalAmount ?? 0).toLocaleString(),
    }));
    const orderColumns: ColumnDef<OrderRow>[] = [
        { accessorKey: 'number', header: 'PO Number' },
        { accessorKey: 'buyer', header: 'Buyer' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'date', header: 'Date' },
    ];
    const orderTable = useTables<OrderRow>({
        data: orderRows,
        columns: orderColumns,
        pageSize: 5,
        getRowId: (row) => `order-${row.id}`,
    });

    const quotationRows: QuotationRow[] = recentQuotations.map((q, i) => ({
        id: i + 1,
        number: q.quotationNumber || `Q-${q.quotationId}`,
        status: q.status || '—',
        buyer: q.buyerOrgName || 'Buyer',
        date: formatDate(q.createdAt),
        amount: Number(q.totalAmount ?? 0).toLocaleString(),
    }));
    const quotationColumns: ColumnDef<QuotationRow>[] = [
        { accessorKey: 'number', header: 'Quotation Number' },
        { accessorKey: 'buyer', header: 'Buyer' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'date', header: 'Date' },
    ];
    const quotationTable = useTables<QuotationRow>({
        data: quotationRows,
        columns: quotationColumns,
        pageSize: 5,
        getRowId: (row) => `quote-${row.id}`,
    });

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border bg-card p-4 space-y-3"
                        >
                            <Skeleton key={i} className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    const stats = [
        {
            title: 'Catalog Products',
            value:
                dashboard?.totalCatalogProducts ?? catalog?.totalElements ?? 0,
            desc: `${dashboard?.publishedCatalog ?? 0} published`,
            icon: IconPackage,
            href: '/supplier/catalog',
        },
        {
            title: 'Pending Orders',
            value: dashboard?.pendingAcknowledgement ?? orders?.pendingAck ?? 0,
            desc: `${dashboard?.totalOrders ?? 0} total orders`,
            icon: IconShoppingCart,
            href: '/supplier/orders',
        },
        {
            title: 'Quotations',
            value: dashboard?.totalQuotations ?? quotations?.total ?? 0,
            desc: `${quotations?.sent ?? 0} sent`,
            icon: IconFileWord,
            href: '/supplier/quotations',
        },
        {
            title: 'Capacity',
            value: dashboard?.totalCapacity
                ? `${Math.round(dashboard.totalCapacity)}`
                : '-',
            desc: `${dashboard?.remainingCapacity ? Math.round(dashboard.remainingCapacity) + ' remaining' : ''}`,
            icon: IconDatabase,
            href: '/supplier/capacity',
        },
    ];

    const now = new Date();
    const filteredCapacityList = capacityList.filter((c) => {
        if (capacityDateRange === 'all') return true;
        const d = c.periodStart ? new Date(c.periodStart) : null;
        if (!d || Number.isNaN(d.getTime())) return true;
        const days =
            capacityDateRange === '7'
                ? 7
                : capacityDateRange === '30'
                  ? 30
                  : 90;
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - days);
        return d >= cutoff;
    });

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Supplier Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage catalog, orders, capacity and customers
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setQuickCreateIntent('supplier:catalog');
                            router.push('/supplier/catalog');
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Catalog
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => {
                            setQuickCreateIntent('supplier:quotation');
                            router.push('/supplier/quotations');
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Orders
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
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Order Status</CardTitle>
                        <CardDescription>
                            Current order pipeline
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChartContainer
                            config={
                                {
                                    value: {
                                        label: 'Orders',
                                        color: 'var(--chart-1)',
                                    },
                                } satisfies ChartConfig
                            }
                            className="h-64 w-full"
                        >
                            <BarChart
                                data={[
                                    {
                                        status: 'Pending',
                                        value: orders?.pendingAck ?? 0,
                                        fill: 'var(--chart-1)',
                                    },
                                    {
                                        status: 'Acknowledged',
                                        value: orders?.acknowledged ?? 0,
                                        fill: 'var(--chart-2)',
                                    },
                                    {
                                        status: 'Partial',
                                        value: orders?.partiallyReceived ?? 0,
                                        fill: 'var(--chart-3)',
                                    },
                                    {
                                        status: 'Received',
                                        value: orders?.received ?? 0,
                                        fill: 'var(--chart-4)',
                                    },
                                ]}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="status"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <Bar dataKey="value" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Capacity Utilization</CardTitle>
                        <CardDescription>
                            Allocated vs remaining
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChartContainer
                            config={
                                {
                                    used: {
                                        label: 'Used',
                                        color: 'var(--chart-1)',
                                    },
                                    remaining: {
                                        label: 'Remaining',
                                        color: 'var(--chart-2)',
                                    },
                                } satisfies ChartConfig
                            }
                            className="h-64 w-full"
                        >
                            <PieChart>
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <Pie
                                    data={[
                                        {
                                            name: 'Used',
                                            value: capacity
                                                ? capacity.totalAvailable -
                                                  capacity.totalRemaining
                                                : 0,
                                            fill: 'var(--chart-1)',
                                        },
                                        {
                                            name: 'Remaining',
                                            value:
                                                capacity?.totalRemaining ?? 0,
                                            fill: 'var(--chart-2)',
                                        },
                                    ]}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={50}
                                    outerRadius={70}
                                />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2">
                    <CardHeader className="p-0 flex flex-row items-center justify-between">
                        <div className="space-y-2">
                            <CardTitle>Capacity Across Dates</CardTitle>
                            <CardDescription>
                                Available vs allocated
                            </CardDescription>
                        </div>
                        <Select
                            value={capacityDateRange}
                            onValueChange={setCapacityDateRange}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Date range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChartContainer
                            config={
                                {
                                    available: {
                                        label: 'Available',
                                        color: 'var(--chart-1)',
                                    },
                                    allocated: {
                                        label: 'Allocated',
                                        color: 'var(--chart-2)',
                                    },
                                } satisfies ChartConfig
                            }
                            className="h-64 w-full"
                        >
                            <BarChart
                                data={filteredCapacityList.map((c) => ({
                                    period: formatDate(c.periodStart),
                                    available: c.availableCapacity ?? 0,
                                    allocated: c.allocatedCapacity ?? 0,
                                }))}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="period"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <Bar
                                    dataKey="available"
                                    fill="var(--chart-1)"
                                    radius={4}
                                />
                                <Bar
                                    dataKey="allocated"
                                    fill="var(--chart-2)"
                                    radius={4}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="px-0">
                <Tabs defaultValue="orders" className="w-full">
                    <TabsList>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="quotations">Quotations</TabsTrigger>
                    </TabsList>
                    <TabsContent value="orders">
                        <CentralizedDataTable
                            table={orderTable}
                            emptyMessage="No orders"
                        />
                    </TabsContent>
                    <TabsContent value="quotations">
                        <CentralizedDataTable
                            table={quotationTable}
                            emptyMessage="No quotations"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
