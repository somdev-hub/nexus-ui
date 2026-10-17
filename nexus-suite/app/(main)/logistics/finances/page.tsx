'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FinanceKpis,
} from '@/components/finances/finance-kpis';
import {
    useConvertedPoints,
    useMoneyFormatter,
} from '@/components/finances/money';
import {
    SplitBar,
    TrendChart,
} from '@/components/finances/finance-charts';
import {
    TransactionsTable,
    type TxnFilter,
} from '@/components/finances/transactions-table';
import {
    getStatements,
    getOpenTrips,
} from '@/lib/services/billing-service';
import {
    getLogisticsFinanceSummary,
    getLogisticsTransactions,
    type FinancePeriod,
} from '@/lib/services/finances-service';
import type {
    BillingStatement,
    FinanceTxnPage,
    LogisticsFinanceSummary,
    OpenTrip,
} from '@/types/finances';
import {
    AlertTriangle,
    Banknote,
    Landmark,
    Route,
    Truck,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function LogisticsFinancesPage() {
    const fmt = useMoneyFormatter();
    const [period, setPeriod] = useState<FinancePeriod>('30d');
    const [summary, setSummary] = useState<LogisticsFinanceSummary | null>(null);
    const [txns, setTxns] = useState<FinanceTxnPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [txnLoading, setTxnLoading] = useState(false);
    const [filter, setFilter] = useState<TxnFilter>({ page: 0 });

    // settlement visibility (read-only here; supplier pays from its side)
    const [partnershipId, setPartnershipId] = useState('');
    const [trips, setTrips] = useState<OpenTrip[]>([]);
    const [statements, setStatements] = useState<BillingStatement[]>([]);
    const [billingLoading, setBillingLoading] = useState(false);
    const [knownPartnerships, setKnownPartnerships] = useState<number[]>([]);

    const loadSummary = useCallback(async () => {
        try {
            setSummary(await getLogisticsFinanceSummary(period));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Summary failed');
        }
    }, [period]);

    const loadTxns = useCallback(async () => {
        setTxnLoading(true);
        try {
            setTxns(
                await getLogisticsTransactions({
                    kind: filter.kind,
                    status: filter.status,
                    search: filter.search,
                    from: filter.from,
                    to: filter.to,
                    page: filter.page,
                    size: PAGE_SIZE,
                })
            );
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Transactions failed');
        } finally {
            setTxnLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        loadSummary().finally(() => setLoading(false));
    }, [loadSummary]);

    useEffect(() => {
        loadTxns();
    }, [loadTxns]);

    // Collect partnership ids seen in settlement rows for the lookup box.
    useEffect(() => {
        const ids = new Set<number>(knownPartnerships);
        for (const r of txns?.content ?? []) {
            if (r.partnershipId) ids.add(r.partnershipId);
        }
        if (ids.size !== knownPartnerships.length) {
            setKnownPartnerships([...ids]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [txns]);

    const loadBilling = useCallback(async () => {
        if (!partnershipId) return;
        setBillingLoading(true);
        try {
            const [t, s] = await Promise.all([
                getOpenTrips(Number(partnershipId), 'logistics'),
                getStatements(Number(partnershipId), 'logistics').catch(
                    () => null
                ),
            ]);
            setTrips(t.trips ?? []);
            setStatements(s?.statements ?? []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Billing failed');
        } finally {
            setBillingLoading(false);
        }
    }, [partnershipId]);

    useEffect(() => {
        loadBilling();
    }, [loadBilling]);

    const src = summary?.currency ?? 'USD';
    const lanes = useConvertedPoints(
        Object.entries(summary?.revenuePerLane ?? {}).map(([name, amount]) => ({
            name,
            amount: Number(amount),
        })),
        src
    );
    const customers = useConvertedPoints(
        Object.entries(summary?.revenuePerCustomer ?? {}).map(([name, amount]) => ({
            name,
            amount: Number(amount),
        })),
        src
    );
    const trend = useConvertedPoints(summary?.trend ?? [], src);

    const exportCsv = () => {
        const rows = txns?.content ?? [];
        const csv = [
            'kind,number,party,amount,currency,status,date,dueDate',
            ...rows.map((r) =>
                [
                    r.kind,
                    r.number ?? r.id,
                    r.party ?? '',
                    r.amount,
                    r.currency ?? '',
                    r.status,
                    r.date ?? '',
                    r.dueDate ?? '',
                ].join(',')
            ),
        ].join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'logistics-transactions.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Finances</h1>
                <p className="text-muted-foreground">
                    Freight revenue · carrier payables · settlement receivables
                </p>
            </div>

            <FinanceKpis
                items={[
                    {
                        title: 'Freight revenue',
                        value: fmt(summary?.totalRevenue, summary?.currency),
                        sub: `${summary?.deliveredShipments ?? 0} delivered trips`,
                        icon: Banknote,
                    },
                    {
                        title: 'Receivable open',
                        value: fmt(summary?.receivableOpen, summary?.currency),
                        sub: 'Unpaid trip + penalty lines',
                        icon: Wallet,
                        tone: 'warn',
                    },
                    {
                        title: 'Receivable overdue',
                        value: fmt(summary?.receivableOverdue, summary?.currency),
                        sub: `Penalties levied ${fmt(summary?.penaltiesLevied, summary?.currency)}`,
                        icon: AlertTriangle,
                        tone: 'bad',
                    },
                    {
                        title: 'Open payables',
                        value: String(summary?.openPayables ?? 0),
                        sub: `${summary?.disputes ?? 0} disputed`,
                        icon: Truck,
                        tone:
                            Number(summary?.disputes ?? 0) > 0
                                ? 'warn'
                                : 'default',
                    },
                ]}
            />

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ledger">Ledger</TabsTrigger>
                    <TabsTrigger value="settlements">
                        <Landmark className="mr-1.5 h-3.5 w-3.5" />
                        Settlements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="grid gap-6 pt-4">
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <TrendChart
                                title="Revenue trend"
                                description="Delivered freight per month"
                                data={trend}
                                period={period}
                                onPeriodChange={setPeriod}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <SplitBar
                                title="Revenue by customer"
                                data={customers.slice(0, 8)}
                            />
                        </div>
                    </div>
                    <SplitBar
                        title="Revenue by lane"
                        description="Pickup → delivery"
                        data={lanes.slice(0, 8)}
                    />
                </TabsContent>

                <TabsContent value="ledger" className="pt-4">
                    <TransactionsTable
                        rows={txns?.content ?? []}
                        total={txns?.totalElements ?? 0}
                        page={filter.page}
                        pageCount={txns?.totalPages ?? 1}
                        loading={loading || txnLoading}
                        kindOptions={[
                            { value: 'FREIGHT', label: 'Freight invoices' },
                            { value: 'PAYABLE', label: 'Carrier payables' },
                            { value: 'STATEMENT', label: 'Settlement lines' },
                        ]}
                        statusOptions={[
                            'DRAFT',
                            'PENDING_APPROVAL',
                            'APPROVED',
                            'SENT_TO_PMS',
                            'PAID',
                            'DISPUTED',
                            'CANCELLED',
                            'PENDING',
                            'OPEN',
                            'PARTIAL',
                        ]}
                        filter={filter}
                        onFilterChange={setFilter}
                        onPage={(p) => setFilter((f) => ({ ...f, page: p }))}
                        onExport={exportCsv}
                    />
                </TabsContent>

                <TabsContent value="settlements" className="grid gap-4 pt-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="grid gap-1.5">
                            <Label>Partnership</Label>
                            <Select
                                value={partnershipId}
                                onValueChange={setPartnershipId}
                            >
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Select partnership (see ledger rows)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {knownPartnerships.map((id) => (
                                        <SelectItem key={id} value={String(id)}>
                                            Partnership #{id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="pb-2 text-xs text-muted-foreground">
                            Read-only here — the supplier initiates payment
                            from its side.
                        </p>
                    </div>

                    {billingLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : !partnershipId ? (
                        <Card className="p-4 gap-2">
                            <CardContent className="p-0 text-center text-sm text-muted-foreground">
                                Pick a partnership to inspect open trips and
                                cycle statements.
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card className="p-4 gap-2">
                                <CardHeader className="p-0">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Route className="h-4 w-4" />
                                        Open trips ({trips.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2 p-0">
                                    {trips.length === 0 && (
                                        <p className="py-4 text-center text-sm text-muted-foreground">
                                            Nothing outstanding.
                                        </p>
                                    )}
                                    {trips.map((t) => (
                                        <div
                                            key={t.lineId}
                                            className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium">
                                                    {t.shipmentNumber ??
                                                        `Trip ${t.shipmentId}`}{' '}
                                                    <span className="text-muted-foreground">
                                                        · {t.lane ?? ''}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Base {fmt(t.outstandingBase, t.currency)}{' '}
                                                    · accrued fee{' '}
                                                    {fmt(t.lateFeeAccrued ?? 0, t.currency)}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {t.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {statements.length > 0 && (
                                <Card className="p-4 gap-2">
                                    <CardHeader className="p-0">
                                        <CardTitle className="text-base">
                                            Cycle statements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 p-0">
                                        {statements.map((s) => (
                                            <div
                                                key={s.cycleId}
                                                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">
                                                        {s.cycleId}{' '}
                                                        <span className="text-muted-foreground">
                                                            · {s.frequency}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Base {fmt(s.baseTotal, s.currency)}{' '}
                                                        · paid{' '}
                                                        {fmt(s.basePaid ?? 0, s.currency)}{' '}
                                                        · penalty{' '}
                                                        {fmt(s.penaltyTotal ?? 0, s.currency)}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        s.status === 'PAID'
                                                            ? 'default'
                                                            : s.status ===
                                                                'CLOSED'
                                                              ? 'destructive'
                                                              : 'secondary'
                                                    }
                                                >
                                                    {s.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
