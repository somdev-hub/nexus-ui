'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { DatePicker } from '@/components/ui/date-picker';
import type { FinanceTxn } from '@/types/finances';
import { Money } from '@/components/finances/money';
import { Download, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface TxnFilter {
    kind?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
    page: number;
}

/** yyyy-MM-dd ⇆ Date helpers for the filter date pickers. */
function toDateStr(d?: Date): string | undefined {
    if (!d) return undefined;
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

function parseDateStr(s?: string): Date | undefined {
    if (!s) return undefined;
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
}

const KIND_LABEL: Record<string, string> = {
    INVOICE_PAYABLE: 'Invoice payable',
    INVOICE_RECEIVABLE: 'Invoice receivable',
    ORDER: 'Order',
    FREIGHT: 'Freight invoice',
    CARRIER_PAYABLE: 'Carrier payable',
    LOGISTICS_BASE_TRIP: 'Trip',
    LOGISTICS_LATE_FEE: 'Late fee',
    LOGISTICS_CYCLE_PENALTY: 'Cycle penalty',
    SETTLEMENT_BASE_TRIP: 'Trip',
    SETTLEMENT_LATE_FEE: 'Late fee',
    SETTLEMENT_CYCLE_PENALTY: 'Cycle penalty',
};

const STATUS_TONE: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    OPEN: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600 line-through',
    DISPUTED: 'bg-purple-100 text-purple-800',
    SENT_TO_PMS: 'bg-indigo-100 text-indigo-800',
};

function fmtDate(v?: string | null): string {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
}

export function TransactionsTable({
    rows,
    total,
    page,
    pageCount,
    loading,
    kindOptions,
    statusOptions,
    filter,
    onFilterChange,
    onPage,
    onExport,
    action,
}: {
    rows: FinanceTxn[];
    total: number;
    page: number;
    pageCount: number;
    loading: boolean;
    kindOptions: { value: string; label: string }[];
    statusOptions: string[];
    filter: TxnFilter;
    onFilterChange: (f: TxnFilter) => void;
    onPage: (p: number) => void;
    onExport?: () => void;
    action?: (row: FinanceTxn) => React.ReactNode;
}) {
    const [search, setSearch] = useState(filter.search ?? '');

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filter.search ?? '')) {
                onFilterChange({ ...filter, search, page: 0 });
            }
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-8"
                        placeholder="Search number, party…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={filter.kind ?? 'ALL'}
                    onValueChange={(v) =>
                        onFilterChange({
                            ...filter,
                            kind: v === 'ALL' ? undefined : v,
                            page: 0,
                        })
                    }
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All types</SelectItem>
                        {kindOptions.map((k) => (
                            <SelectItem key={k.value} value={k.value}>
                                {k.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filter.status ?? 'ALL'}
                    onValueChange={(v) =>
                        onFilterChange({
                            ...filter,
                            status: v === 'ALL' ? undefined : v,
                            page: 0,
                        })
                    }
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                    <DatePicker
                        date={parseDateStr(filter.from)}
                        placeholder="From date"
                        onDateChange={(d) =>
                            onFilterChange({
                                ...filter,
                                from: toDateStr(d),
                                page: 0,
                            })
                        }
                    />
                    {filter.from && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Clear from date"
                            onClick={() =>
                                onFilterChange({ ...filter, from: undefined, page: 0 })
                            }
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <DatePicker
                        date={parseDateStr(filter.to)}
                        placeholder="To date"
                        onDateChange={(d) =>
                            onFilterChange({
                                ...filter,
                                to: toDateStr(d),
                                page: 0,
                            })
                        }
                    />
                    {filter.to && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Clear to date"
                            onClick={() =>
                                onFilterChange({ ...filter, to: undefined, page: 0 })
                            }
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
                {onExport && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={onExport}
                    >
                        <Download className="mr-1 h-3.5 w-3.5" /> CSV
                    </Button>
                )}
            </div>

            <Card className="p-4 gap-2">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4">
                            <Skeleton className="h-[300px] w-full" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Number</TableHead>
                                        <TableHead>Party</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Due</TableHead>
                                        {action && <TableHead>Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r) => (
                                        <TableRow
                                            key={`${r.kind}-${r.id}`}
                                        >
                                            <TableCell className="text-xs text-muted-foreground">
                                                {KIND_LABEL[r.kind] ?? r.kind}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {r.number ?? `#${r.id}`}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {r.party ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        STATUS_TONE[r.status] ??
                                                        'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {r.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                <Money
                                                    amount={r.amount}
                                                    currency={r.currency}
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {fmtDate(r.date)}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {fmtDate(r.dueDate)}
                                            </TableCell>
                                            {action && (
                                                <TableCell>{action(r)}</TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {rows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={action ? 8 : 7}
                                                className="py-8 text-center text-sm text-muted-foreground"
                                            >
                                                No transactions match these
                                                filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                    {total} transaction(s)
                </span>
                <TablePagination
                    pageIndex={page}
                    pageCount={Math.max(pageCount, 1)}
                    canPreviousPage={page > 0}
                    canNextPage={page + 1 < pageCount}
                    onPageChange={onPage}
                    onPreviousPage={() => onPage(Math.max(0, page - 1))}
                    onNextPage={() => onPage(page + 1)}
                    showFirstLast={false}
                />
            </div>
        </div>
    );
}
