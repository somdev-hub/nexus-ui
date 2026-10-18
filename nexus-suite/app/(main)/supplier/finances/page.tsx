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
import { LogisticsPaymentsTable } from '@/components/finances/logistics-payments-table';
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
import { createSuiteIntent, listSuiteIntents } from '@/lib/services/payments-service';
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
import { getDisplayCurrency } from '@/lib/currency';
import type { SuiteIntent } from '@/types/payments';
import {
    AlertTriangle,
    ArrowUpCircle,
    CheckCircle2,
    ChevronDown,
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
    // Settlement payment history (checkout intents, LOGISTICS_SETTLEMENT kind).
    const [settlePayments, setSettlePayments] = useState<SuiteIntent[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    useEffect(() => {
        let active = true;
        setPaymentsLoading(true);
        listSuiteIntents({ page: 0, size: 100 })
            .then((r) => {
                if (!active) return;
                const all = (r.content ?? []).filter(
                    (it) => it.intentKind === 'LOGISTICS_SETTLEMENT'
                );
                setSettlePayments(all);
            })
            .catch(() => null)
            .finally(() => active && setPaymentsLoading(false));
        return () => {
            active = false;
        };
    }, []);

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
    }, currency?: string) => {
        setQuoting(true);
        try {
            const intent = await createSuiteIntent({
                amount: Number(quote.grandTotal),
                // The quote is denominated in the trips' lane currency;
                // fall back to the org display currency, never a hardcoded one.
                currency:
                    currency ??
                    tripCurrency ??
                    getDisplayCurrency(),
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
            await payQuote(quote, tripCurrency);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Quote failed');
        } finally {
            setQuoting(false);
        }
    };

    const quoteStatement = async (cycleId: string, currency?: string) => {
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
            await payQuote(quote, currency);
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
    // Currency of the selected trips' amounts (lanes price in their own currency).
    const tripCurrency = trips.find((t) => selected.has(t.shipmentId))
        ?.currency;

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
                        value: fmt(summary?.logisticsOpen, summary?.logisticsCurrency),
                        sub: `Overdue ${fmt(summary?.logisticsOverdue, summary?.logisticsCurrency)} — open Logistics tab`,
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
                        <div className="lg:col-span-3 h-full">
                            <TrendChart
                                title="Sales trend"
                                description="Invoiced amounts by period"
                                data={trend}
                                period={period}
                                onPeriodChange={setPeriod}
                                loading={loading}
                            />
                        </div>
                        <div className="lg:col-span-2 h-full">
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
                                            : `Pay ${selected.size} trip(s) · ${fmt(selectedTotal, tripCurrency)}`}
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
                                        <TripRow
                                            key={t.lineId}
                                            trip={t}
                                            fmt={fmt}
                                            checked={selected.has(
                                                t.shipmentId
                                            )}
                                            onToggle={(v) =>
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
                                                            {fmt(s.baseTotal, s.currency)}{' '}
                                                            · paid{' '}
                                                            {fmt(s.basePaid ?? 0, s.currency)}{' '}
                                                            · penalty{' '}
                                                            {fmt(
                                                                s.penaltyTotal ??
                                                                    0,
                                                                s.currency
                                                            )}{' '}
                                                            · live late fees{' '}
                                                            {fmt(
                                                                s.lateFeesAccrued ??
                                                                    0,
                                                                s.currency
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
                                                                        s.cycleId,
                                                                        s.currency
                                                                    )
                                                                }
                                                            >
                                                                Pay {fmt(due, s.currency)}
                                                            </Button>
                                                        )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}
                            <LogisticsPaymentsTable
                                payments={
                                    partnershipId
                                        ? settlePayments.filter(
                                              (it) =>
                                                  String(
                                                      it.partnershipId ?? ''
                                                  ) ===
                                                  String(partnershipId)
                                          )
                                        : settlePayments
                                }
                                loading={paymentsLoading}
                            />
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ── open-trip dropdown row ────────────────────────────────
type MoneyFmt = (
    amount: number | string | null | undefined,
    currency?: string | null
) => string;

/**
 * One open trip: checkbox + summary, and clicking the row opens the
 * itemized price breakdown (what the logistics lane charges: unit price ×
 * billed cargo, fuel surcharge, driver fees, misc, partnership discount).
 */
function TripRow({
    trip,
    fmt,
    checked,
    onToggle,
}: {
    trip: OpenTrip;
    fmt: MoneyFmt;
    checked: boolean;
    onToggle: (v: boolean) => void;
}) {
    const [open, setOpen] = useState(false);
    const p = trip.pricing;
    const breakdown: { label: string; value: string; strong?: boolean }[] = [];
    if (p?.source === 'CAPACITY') {
        breakdown.push({
            label: `Base price${p.billedQuantity != null ? ` · ${p.billedQuantity} ${p.capacityUnit ?? 'KG'} × ${fmt(p.unitPrice, p.currency ?? trip.currency)}` : ''}`,
            value: fmt(p.basePrice, p.currency ?? trip.currency),
        });
        if (p.fuelSurcharge != null && p.fuelSurcharge > 0)
            breakdown.push({
                label: 'Fuel surcharge',
                value: fmt(p.fuelSurcharge, p.currency ?? trip.currency),
            });
        if (p.driverFees != null && p.driverFees > 0)
            breakdown.push({
                label: 'Driver fees',
                value: fmt(p.driverFees, p.currency ?? trip.currency),
            });
        if (p.miscPrice != null && p.miscPrice > 0)
            breakdown.push({
                label: 'Misc charges',
                value: fmt(p.miscPrice, p.currency ?? trip.currency),
            });
        if (p.discountRate != null && p.discountRate > 0)
            breakdown.push({
                label: `Partnership discount · ${p.discountRate}%`,
                value: `− ${fmt(p.discount, p.currency ?? trip.currency)}`,
            });
        breakdown.push({
            label: 'Total charged',
            value: fmt(p.total, p.currency ?? trip.currency),
            strong: true,
        });
    }

    return (
        <div className="rounded-lg border hover:border-muted-foreground/30">
            <div
                className="flex cursor-pointer items-center gap-3 p-3"
                onClick={() => setOpen((o) => !o)}
            >
                <span
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                >
                    <Checkbox checked={checked} onCheckedChange={onToggle} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                        {trip.shipmentNumber ?? `Trip ${trip.shipmentId}`}{' '}
                        <span className="text-muted-foreground">
                            · {trip.lane ?? ''}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Delivered{' '}
                        {trip.deliveredAt
                            ? new Date(trip.deliveredAt).toLocaleDateString()
                            : '—'}{' '}
                        · base{' '}
                        {fmt(trip.outstandingBase, trip.currency)} · late fee{' '}
                        {fmt(trip.lateFeeAccrued ?? 0, trip.currency)}
                    </p>
                </div>
                <Badge
                    variant={
                        trip.status === 'PARTIAL' ? 'secondary' : 'outline'
                    }
                >
                    {trip.status}
                </Badge>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </div>
            {open && (
                <div className="border-t px-3 py-2">
                    {p?.source === 'CAPACITY' && (
                        <p className="mb-1 text-xs text-muted-foreground">
                            Priced from logistics capacity{' '}
                            {p.lane ?? ''}
                            {p.transportMode ? ` · ${p.transportMode}` : ''}
                            {p.equipmentType ? ` · ${p.equipmentType}` : ''}
                        </p>
                    )}
                    {p?.source === 'SHIPMENT' && (
                        <p className="mb-1 text-xs text-muted-foreground">
                            Priced from the shipment&apos;s recorded freight cost.
                        </p>
                    )}
                    {p?.source === 'UNPRICED' && (
                        <p className="text-xs text-muted-foreground">
                            No route-capacity price matched this lane yet.
                        </p>
                    )}
                    {!p && (
                        <p className="text-xs text-muted-foreground">
                            No pricing breakdown available.
                        </p>
                    )}
                    {breakdown.length > 0 && (
                        <div className="grid gap-0.5">
                            {breakdown.map((row, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between text-xs ${
                                        row.strong
                                            ? 'border-t pt-1 font-medium'
                                            : 'py-0.5 text-muted-foreground'
                                    }`}
                                >
                                    <span>{row.label}</span>
                                    <span className="font-mono">
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
