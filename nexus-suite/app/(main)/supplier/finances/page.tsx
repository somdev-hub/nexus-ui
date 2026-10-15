'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    AgingBars,
    SplitBar,
    TrendChart,
} from '@/components/finances/finance-charts';
import {
    TransactionsTable,
    type TxnFilter,
} from '@/components/finances/transactions-table';
import {
    billingIdempotencyKey,
    createBillingQuote,
    getOpenTrips,
    getStatements,
} from '@/lib/services/billing-service';
import {
    getSupplierFinanceSummary,
    getSupplierTransactions,
    type FinancePeriod,
} from '@/lib/services/finances-service';
import { createSuiteIntent } from '@/lib/services/payments-service';
import {
    getSupplierLogisticsPartnerships,
    type SupplierLogisticsPartnership,
} from '@/lib/services/supplier-logistics-service';
import type {
    BillingStatement,
    FinanceTxnPage,
    OpenTrip,
    SupplierFinanceSummary,
} from '@/types/finances';
import {
    AlertTriangle,
    ArrowUpCircle,
    CheckCircle2,
    Landmark,
    Truck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function SupplierFinancesPage() {
    const router = useRouter();
    const fmt = useMoneyFormatter();
    const [period, setPeriod] = useState<FinancePeriod>('30d');
    const [summary, setSummary] = useState<SupplierFinanceSummary | null>(null);
    const [txns, setTxns] = useState<FinanceTxnPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [txnLoading, setTxnLoading] = useState(false);
    const [filter, setFilter] = useState<TxnFilter>({ page: 0 });

    // logistics settlement state
    const [partnerships, setPartnerships] = useState<
        SupplierLogisticsPartnership[]
    >([]);
    const [partnershipId, setPartnershipId] = useState<string>('');
    const [termType, setTermType] = useState<string>('');
    const [trips, setTrips] = useState<OpenTrip[]>([]);
    const [statements, setStatements] = useState<BillingStatement[]>([]);
    const [billingLoading, setBillingLoading] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [quoting, setQuoting] = useState(false);

    const loadSummary = useCallback(async () => {
        try {
            setSummary(await getSupplierFinanceSummary(period));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Summary failed');
        }
    }, [period]);

    const loadTxns = useCallback(async () => {
        setTxnLoading(true);
        try {
            setTxns(
                await getSupplierTransactions({
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
        Promise.all([
            loadSummary(),
            getSupplierLogisticsPartnerships()
                .then((r) => {
                    const list = (r.content ?? []).filter(
                        (p) =>
                            String(p.status ?? '').toUpperCase() === 'ACTIVE'
                    );
                    setPartnerships(list);
                    if (list.length > 0 && !partnershipId) {
                        setPartnershipId(String(list[0].partnershipId));
                    }
                })
                .catch(() => null),
        ]).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadSummary]);

    useEffect(() => {
        loadTxns();
    }, [loadTxns]);

    const loadBilling = useCallback(async () => {
        if (!partnershipId) return;
        setBillingLoading(true);
        try {
            const [t, s] = await Promise.all([
                getOpenTrips(Number(partnershipId), 'supplier'),
                getStatements(Number(partnershipId), 'supplier').catch(
                    () => null
                ),
            ]);
            setTrips(t.trips ?? []);
            setTermType(String(t.termType ?? ''));
            setStatements(s?.statements ?? []);
            setSelected(new Set());
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Billing failed');
        } finally {
            setBillingLoading(false);
        }
    }, [partnershipId]);

    useEffect(() => {
        loadBilling();
    }, [loadBilling]);

    const payQuote = async (quote: {
        quoteRef: string;
        grandTotal: number;
    }) => {
        setQuoting(true);
        try {
            const intent = await createSuiteIntent({
                amount: Number(quote.grandTotal),
                currency: 'INR',
                description: `Logistics settlement ${quote.quoteRef}`,
                payerRole: 'SUPPLIER',
                quoteRef: quote.quoteRef,
                partnershipId: Number(partnershipId),
            });
            router.push(`/checkout?ref=${encodeURIComponent(intent.ref)}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Checkout failed');
        } finally {
            setQuoting(false);
        }
    };

    const quoteSelectedTrips = async () => {
        const ids = [...selected];
        if (ids.length === 0) {
            toast.error('Select at least one trip');
            return;
        }
        setQuoting(true);
        try {
            const quote = await createBillingQuote({
                partnershipId: Number(partnershipId),
                kind: 'TRIP_BATCH',
                shipmentIds: ids,
                idempotencyKey: billingIdempotencyKey(
                    partnershipId,
                    `trips-${ids.sort().join('-')}`
                ),
            });
            await payQuote(quote);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Quote failed');
        } finally {
            setQuoting(false);
        }
    };

    const quoteStatement = async (cycleId: string) => {
        setQuoting(true);
        try {
            const quote = await createBillingQuote({
                partnershipId: Number(partnershipId),
                kind: 'STATEMENT',
                cycleId,
                idempotencyKey: billingIdempotencyKey(
                    partnershipId,
                    `stmt-${cycleId}`
                ),
            });
            await payQuote(quote);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Quote failed');
        } finally {
            setQuoting(false);
        }
    };

    const selectedTotal = trips
        .filter((t) => selected.has(t.shipmentId))
        .reduce(
            (s, t) =>
                s +
                Number(t.outstandingBase ?? 0) +
                Number(t.lateFeeAccrued ?? 0),
            0
        );

    const trend = useConvertedPoints(summary?.trend ?? []);
    const buyers = useConvertedPoints(summary?.topBuyers ?? []);
    const aging = useConvertedPoints(summary?.aging ?? []);

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
        a.download = 'supplier-transactions.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Finances</h1>
                <p className="text-muted-foreground">
                    Sales & receivables · logistics settlement
                </p>
            </div>

            <FinanceKpis
                items={[
                    {
                        title: 'Total sales',
                        value: fmt(summary?.totalSales),
                        sub: `${summary?.openOrderCount ?? 0} open orders`,
                        icon: ArrowUpCircle,
                    },
                    {
                        title: 'Received',
                        value: fmt(summary?.received),
                        sub: 'Collected from buyers',
                        icon: CheckCircle2,
                        tone: 'good',
                    },
                    {
                        title: 'Outstanding',
                        value: fmt(summary?.outstanding),
                        sub: 'Approved, awaiting payment — click to filter',
                        icon: AlertTriangle,
                        tone: 'warn',
                        onClick: () =>
                            setFilter((f) => ({
                                ...f,
                                status: 'APPROVED',
                                page: 0,
                            })),
                    },
                    {
                        title: 'Logistics due',
                        value: fmt(summary?.logisticsOpen),
                        sub: `Overdue ${fmt(summary?.logisticsOverdue)} — open Logistics tab`,
                        icon: Truck,
                        tone:
                            Number(summary?.logisticsOverdue ?? 0) > 0
                                ? 'bad'
                                : 'default',
                    },
                ]}
            />

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ledger">Sales ledger</TabsTrigger>
                    <TabsTrigger value="logistics">
                        <Landmark className="mr-1.5 h-3.5 w-3.5" />
                        Logistics settlement
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="grid gap-6 pt-4">
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <TrendChart
                                title="Sales trend"
                                description="Invoiced amounts per month"
                                data={trend}
                                period={period}
                                onPeriodChange={setPeriod}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <AgingBars
                                title="Receivables aging"
                                description="Approved invoices by days overdue"
                                data={aging}
                            />
                        </div>
                    </div>
                    <SplitBar
                        title="Sales by buyer"
                        description="Click a bar to filter the ledger"
                        data={buyers}
                        onSelect={(name) =>
                            setFilter((f) => ({
                                ...f,
                                search: name,
                                page: 0,
                            }))
                        }
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
                            { value: 'ORDER', label: 'Orders' },
                            { value: 'INVOICE', label: 'Invoices' },
                            { value: 'LOGISTICS', label: 'Logistics lines' },
                        ]}
                        statusOptions={[
                            'DRAFT',
                            'PENDING_APPROVAL',
                            'APPROVED',
                            'ACKNOWLEDGED',
                            'RECEIVED',
                            'INVOICED',
                            'REJECTED',
                            'PAID',
                            'CANCELLED',
                            'OPEN',
                            'PARTIAL',
                        ]}
                        filter={filter}
                        onFilterChange={setFilter}
                        onPage={(p) => setFilter((f) => ({ ...f, page: p }))}
                        onExport={exportCsv}
                    />
                </TabsContent>

                <TabsContent value="logistics" className="grid gap-4 pt-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="grid gap-1.5">
                            <Label>Partnership</Label>
                            <Select
                                value={partnershipId}
                                onValueChange={setPartnershipId}
                            >
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Select partnership" />
                                </SelectTrigger>
                                <SelectContent>
                                    {partnerships.map((p) => (
                                        <SelectItem
                                            key={p.partnershipId}
                                            value={String(p.partnershipId)}
                                        >
                                            #{p.partnershipId} ·{' '}
                                            {p.partnershipTermType ?? ''} ·{' '}
                                            {p.secondaryOrgName ??
                                                p.primaryOrgName ??
                                                ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {termType && (
                            <Badge variant="secondary">
                                {termType === 'LONG_TERM'
                                    ? 'Long-term · cycle billing'
                                    : 'Short-term · trip-wise'}
                            </Badge>
                        )}
                    </div>

                    {billingLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <>
                            <Card className="p-4 gap-2">
                                <CardHeader className="flex flex-row items-center justify-between p-0">
                                    <CardTitle className="text-base">
                                        Open trips
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            select several to pay together ·
                                            1%/day late fee after delivery
                                        </span>
                                    </CardTitle>
                                    <Button
                                        size="sm"
                                        disabled={
                                            selected.size === 0 || quoting
                                        }
                                        onClick={quoteSelectedTrips}
                                    >
                                        {quoting
                                            ? 'Quoting…'
                                            : `Pay ${selected.size} trip(s) · ${fmt(selectedTotal)}`}
                                    </Button>
                                </CardHeader>
                                <CardContent className="grid gap-2 p-0">
                                    {trips.length === 0 && (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            No delivered-unpaid trips on this
                                            partnership.
                                        </p>
                                    )}
                                    {trips.map((t) => (
                                        <label
                                            key={t.lineId}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:border-muted-foreground/30"
                                        >
                                            <Checkbox
                                                checked={selected.has(
                                                    t.shipmentId
                                                )}
                                                onCheckedChange={(v) =>
                                                    setSelected((prev) => {
                                                        const next = new Set(
                                                            prev
                                                        );
                                                        if (v)
                                                            next.add(
                                                                t.shipmentId
                                                            );
                                                        else
                                                            next.delete(
                                                                t.shipmentId
                                                            );
                                                        return next;
                                                    })
                                                }
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium">
                                                    {t.shipmentNumber ??
                                                        `Trip ${t.shipmentId}`}{' '}
                                                    <span className="text-muted-foreground">
                                                        · {t.lane ?? ''}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Delivered{' '}
                                                    {t.deliveredAt
                                                        ? new Date(
                                                              t.deliveredAt
                                                          ).toLocaleDateString()
                                                        : '—'}{' '}
                                                    · base{' '}
                                                    {fmt(t.outstandingBase)}{' '}
                                                    · late fee{' '}
                                                    {fmt(t.lateFeeAccrued ?? 0)}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    t.status === 'PARTIAL'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {t.status}
                                            </Badge>
                                        </label>
                                    ))}
                                </CardContent>
                            </Card>

                            {statements.length > 0 && (
                                <Card className="p-4 gap-2">
                                    <CardHeader className="p-0">
                                        <CardTitle className="text-base">
                                            Cycle statements
                                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                                missed statements add 2% of
                                                the missed total to the next
                                                one
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 p-0">
                                        {statements.map((s) => {
                                            const due =
                                                Number(s.baseTotal ?? 0) -
                                                Number(s.basePaid ?? 0) +
                                                (Number(s.penaltyTotal ?? 0) -
                                                    Number(s.penaltyPaid ?? 0));
                                            return (
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
                                                            Base{' '}
                                                            {fmt(s.baseTotal)}{' '}
                                                            · paid{' '}
                                                            {fmt(s.basePaid ?? 0)}{' '}
                                                            · penalty{' '}
                                                            {fmt(
                                                                s.penaltyTotal ??
                                                                    0
                                                            )}{' '}
                                                            · live late fees{' '}
                                                            {fmt(
                                                                s.lateFeesAccrued ??
                                                                    0
                                                            )}
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
                                                    {s.status !== 'PAID' &&
                                                        due > 0 && (
                                                            <Button
                                                                size="sm"
                                                                disabled={quoting}
                                                                onClick={() =>
                                                                    quoteStatement(
                                                                        s.cycleId
                                                                    )
                                                                }
                                                            >
                                                                Pay {fmt(due)}
                                                            </Button>
                                                        )}
                                                </div>
                                            );
                                        })}
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
