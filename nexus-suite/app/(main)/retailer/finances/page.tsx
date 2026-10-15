'use client';

import {
    FinanceKpis,
} from '@/components/finances/finance-kpis';
import {
    AgingBars,
    SplitBar,
    StatusDonut,
    TrendChart,
} from '@/components/finances/finance-charts';
import {
    useConvertedPoints,
    useMoneyFormatter,
} from '@/components/finances/money';
import {
    TransactionsTable,
    type TxnFilter,
} from '@/components/finances/transactions-table';
import {
    getRetailerFinanceSummary,
    getRetailerTransactions,
    type FinancePeriod,
} from '@/lib/services/finances-service';
import type {
    FinanceTxnPage,
    RetailerFinanceSummary,
} from '@/types/finances';
import {
    AlertTriangle,
    ArrowDownCircle,
    CheckCircle2,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function RetailerFinancesPage() {
    const fmt = useMoneyFormatter();
    const [period, setPeriod] = useState<FinancePeriod>('30d');
    const [summary, setSummary] = useState<RetailerFinanceSummary | null>(null);
    const [txns, setTxns] = useState<FinanceTxnPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [txnLoading, setTxnLoading] = useState(false);
    const [filter, setFilter] = useState<TxnFilter>({ page: 0 });

    const loadSummary = useCallback(async () => {
        try {
            setSummary(await getRetailerFinanceSummary(period));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Summary failed');
        }
    }, [period]);

    const loadTxns = useCallback(async () => {
        setTxnLoading(true);
        try {
            setTxns(
                await getRetailerTransactions({
                    kind: filter.kind,
                    status:
                        filter.status === 'OVERDUE'
                            ? undefined
                            : filter.status,
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
        a.download = 'retailer-transactions.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const trend = useConvertedPoints(summary?.trend ?? []);
    const suppliers = useConvertedPoints(summary?.topSuppliers ?? []);
    const aging = useConvertedPoints(summary?.aging ?? []);
    const funnel = useConvertedPoints([
        { name: 'Ordered', amount: summary?.funnel.ordered ?? 0 },
        { name: 'Received', amount: summary?.funnel.received ?? 0 },
        { name: 'Invoiced', amount: summary?.funnel.invoiced ?? 0 },
        { name: 'Paid', amount: summary?.funnel.paid ?? 0 },
    ]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Finances</h1>
                <p className="text-muted-foreground">
                    Goods spend · payables aging · invoice ledger
                </p>
            </div>

            <FinanceKpis
                items={[
                    {
                        title: 'Total spend',
                        value: fmt(summary?.totalSpend),
                        sub: `${summary?.openPoCount ?? 0} open POs`,
                        icon: Wallet,
                    },
                    {
                        title: 'Paid',
                        value: fmt(summary?.paid),
                        sub: 'Invoices settled',
                        icon: CheckCircle2,
                        tone: 'good',
                    },
                    {
                        title: 'Outstanding',
                        value: fmt(summary?.outstanding),
                        sub: 'Approved, awaiting payment — click to filter',
                        icon: ArrowDownCircle,
                        tone: 'warn',
                        onClick: () =>
                            setFilter((f) => ({
                                ...f,
                                status: 'APPROVED',
                                page: 0,
                            })),
                    },
                    {
                        title: 'Overdue',
                        value: fmt(summary?.overdue),
                        sub: 'Past due date',
                        icon: AlertTriangle,
                        tone: 'bad',
                    },
                ]}
            />

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <TrendChart
                        title="Spend trend"
                        description="Invoiced amounts per month"
                        data={trend}
                        period={period}
                        onPeriodChange={setPeriod}
                    />
                </div>
                <div className="lg:col-span-2">
                    <AgingBars
                        title="Payables aging"
                        description="Approved invoices by days overdue"
                        data={aging}
                    />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <SplitBar
                    title="Spend by supplier"
                    description="Click a bar to filter the ledger"
                    data={suppliers}
                    onSelect={(name) =>
                        setFilter((f) => ({ ...f, search: name, page: 0 }))
                    }
                />
                <StatusDonut
                    title="Order → cash funnel"
                    description="Ordered vs received vs invoiced vs paid"
                    data={funnel}
                />
            </div>

            <TransactionsTable
                rows={txns?.content ?? []}
                total={txns?.totalElements ?? 0}
                page={filter.page}
                pageCount={txns?.totalPages ?? 1}
                loading={loading || txnLoading}
                kindOptions={[
                    { value: 'INVOICE', label: 'Invoices' },
                    { value: 'FREIGHT', label: 'Freight' },
                ]}
                statusOptions={[
                    'DRAFT',
                    'PENDING_APPROVAL',
                    'APPROVED',
                    'REJECTED',
                    'PAID',
                    'CANCELLED',
                    'SENT_TO_PMS',
                    'DISPUTED',
                ]}
                filter={filter}
                onFilterChange={setFilter}
                onPage={(p) => setFilter((f) => ({ ...f, page: p }))}
                onExport={exportCsv}
            />
        </div>
    );
}
