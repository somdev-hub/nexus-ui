'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Money } from '@/components/money';
import {
    getDriverCommissionItems,
    getDriverCommissionRows,
    payDriverCommission,
    payDriverCommissions,
} from '@/lib/services/logistics-ops-service';
import type {
    DriverCommissionItem,
    DriverCommissionRow,
} from '@/types/logistics-ops';
import type { PaginatedResponse } from '@/types/paginated-response';
import {
    IconChevronDown,
    IconChevronRight,
    IconCircleCheck,
    IconRefresh,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

const ROW_SIZE = 20;
const ITEM_SIZE = 10;

function fmtDateTime(v?: string | null): string {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

export function DriverCommissions() {
    const { toast } = useToast();
    const [rows, setRows] =
        useState<PaginatedResponse<DriverCommissionRow> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const [searchLive, setSearchLive] = useState('');
    const [busy, setBusy] = useState<string>('');

    // Expansion + subtable state (keyed by driverId)
    const [expanded, setExpanded] = useState<number | null>(null);
    const [items, setItems] = useState<Record<
        number,
        PaginatedResponse<DriverCommissionItem>
    > | null>(null);
    const [subPage, setSubPage] = useState<Record<number, number>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getDriverCommissionRows({
                page,
                size: ROW_SIZE,
                status: status === 'ALL' ? undefined : status,
                search: search || undefined,
            });
            setRows(res);
        } catch {
            toast({
                title: 'Failed to load driver commissions',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [page, status, search, toast]);

    // Debounced search input
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchLive), 300);
        return () => clearTimeout(t);
    }, [searchLive]);

    useEffect(() => {
        load();
    }, [load]);

    const loadItems = useCallback(
        async (driverId: number, itemPage: number) => {
            try {
                const res = await getDriverCommissionItems(driverId, {
                    page: itemPage,
                    size: ITEM_SIZE,
                });
                setItems((prev) => ({ ...(prev || {}), [driverId]: res }));
            } catch {
                toast({
                    title: 'Failed to load driver trips',
                    variant: 'destructive',
                });
            }
        },
        [toast]
    );

    function toggleRow(driverId: number) {
        if (expanded === driverId) {
            setExpanded(null);
            return;
        }
        setExpanded(driverId);
        setSubPage((prev) => ({ ...prev, [driverId]: 0 }));
        loadItems(driverId, 0);
    }

    async function payAll(driverId: number) {
        setBusy(`all-${driverId}`);
        try {
            const res = await payDriverCommissions(driverId);
            toast({
                title: `Paid ${res.paidCount} commission(s)`,
            });
            await load();
            await loadItems(driverId, subPage[driverId] ?? 0);
        } catch (e) {
            toast({
                title: e instanceof Error ? e.message : 'Payment failed',
                variant: 'destructive',
            });
        } finally {
            setBusy('');
        }
    }

    async function payOne(driverId: number, commissionId: number) {
        setBusy(`one-${commissionId}`);
        try {
            await payDriverCommission(driverId, commissionId);
            toast({ title: 'Commission paid' });
            await load();
            await loadItems(driverId, subPage[driverId] ?? 0);
        } catch (e) {
            toast({
                title: e instanceof Error ? e.message : 'Payment failed',
                variant: 'destructive',
            });
        } finally {
            setBusy('');
        }
    }

    const pageCount = rows?.totalPages ?? 0;

    return (
        <Card className="p-4 gap-2">
            <CardHeader className="p-0">
                <CardTitle className="flex flex-wrap items-center gap-2">
                    <Input
                        placeholder="Search name/code"
                        value={searchLive}
                        onChange={(e) => setSearchLive(e.target.value)}
                        className="max-w-sm"
                    />
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All drivers</SelectItem>
                            <SelectItem value="AVAILABLE">Available</SelectItem>
                            <SelectItem value="ASSIGNED">Assigned</SelectItem>
                            <SelectItem value="ON_LEAVE">On leave</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => load()}
                        title="Refresh"
                    >
                        <IconRefresh className="h-4 w-4" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <TableSkeleton rows={6} />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>Driver</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last active</TableHead>
                                <TableHead>Last assignment</TableHead>
                                <TableHead>Total payable</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows?.content?.map((d) => {
                                const isOpen = expanded === d.driverId;
                                const sub = items?.[d.driverId];
                                const subLoading = isOpen && !sub;
                                const total = sub?.totalElements ?? 0;
                                const subPageIndex = subPage[d.driverId] ?? 0;
                                return (
                                    <DriverRow
                                        key={d.driverId}
                                        row={d}
                                        open={isOpen}
                                        onToggle={() => toggleRow(d.driverId)}
                                        payAllPending={
                                            <LoadingButton
                                                loading={
                                                    busy === `all-${d.driverId}`
                                                }
                                                size="sm"
                                                disabled={
                                                    (d.pendingCount ?? 0) === 0
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    payAll(d.driverId);
                                                }}
                                            >
                                                Pay all
                                            </LoadingButton>
                                        }
                                        subtable={
                                            isOpen ? (
                                                <TableCell
                                                    colSpan={7}
                                                    className="bg-muted/30 p-0"
                                                >
                                                    <div className="p-3">
                                                        {subLoading ? (
                                                            <TableSkeleton
                                                                rows={3}
                                                            />
                                                        ) : !sub?.content
                                                              ?.length ? (
                                                            <div className="text-center text-sm text-muted-foreground py-4">
                                                                No commissions
                                                                yet — payable
                                                                commissions
                                                                appear once
                                                                trips are
                                                                delivered.
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-md border bg-background">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>
                                                                                Shipment
                                                                            </TableHead>
                                                                            <TableHead>
                                                                                Lane
                                                                            </TableHead>
                                                                            <TableHead>
                                                                                Delivered
                                                                            </TableHead>
                                                                            <TableHead>
                                                                                Amount
                                                                            </TableHead>
                                                                            <TableHead>
                                                                                Status
                                                                            </TableHead>
                                                                            <TableHead>
                                                                                Payment
                                                                            </TableHead>
                                                                            <TableHead></TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {sub.content.map(
                                                                            (
                                                                                c
                                                                            ) => (
                                                                                <TableRow
                                                                                    key={
                                                                                        c.commissionId
                                                                                    }
                                                                                >
                                                                                    <TableCell className="text-xs font-medium">
                                                                                        {c.shipmentNumber ??
                                                                                            '—'}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-xs">
                                                                                        {c.lane ??
                                                                                            '—'}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Badge
                                                                                            variant="secondary"
                                                                                            className="text-xs"
                                                                                        >
                                                                                            {c.shipmentStatus ??
                                                                                                '—'}
                                                                                        </Badge>
                                                                                    </TableCell>
                                                                                    <TableCell className="text-xs font-medium">
                                                                                        <Money
                                                                                            amount={
                                                                                                c.amount
                                                                                            }
                                                                                            currency={
                                                                                                c.currency
                                                                                            }
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        {c.status ===
                                                                                        'PAID' ? (
                                                                                            <Badge
                                                                                                variant="secondary"
                                                                                                className="gap-1"
                                                                                            >
                                                                                                <IconCircleCheck className="h-3 w-3" />
                                                                                                Paid
                                                                                            </Badge>
                                                                                        ) : (
                                                                                            <Badge
                                                                                                variant="default"
                                                                                                className="bg-amber-600"
                                                                                            >
                                                                                                Pending
                                                                                            </Badge>
                                                                                        )}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-xs">
                                                                                        {c.status ===
                                                                                        'PAID'
                                                                                            ? `${fmtDateTime(c.paidAt)} • ${c.paymentRef ?? '—'}`
                                                                                            : '—'}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        {c.status ===
                                                                                            'PENDING' && (
                                                                                            <LoadingButton
                                                                                                loading={
                                                                                                    busy ===
                                                                                                    `one-${c.commissionId}`
                                                                                                }
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    payOne(
                                                                                                        d.driverId,
                                                                                                        c.commissionId
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                Pay
                                                                                            </LoadingButton>
                                                                                        )}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            )
                                                                        )}
                                                                    </TableBody>
                                                                </Table>
                                                                <div className="relative flex flex-wrap items-center justify-center gap-3 py-2">
                                                                    <span className="absolute left-2 text-xs text-muted-foreground">
                                                                        {total}{' '}
                                                                        commission(s)
                                                                    </span>
                                                                    <TablePagination
                                                                        pageIndex={
                                                                            subPageIndex
                                                                        }
                                                                        pageCount={Math.max(
                                                                            sub.totalPages ??
                                                                                0,
                                                                            1
                                                                        )}
                                                                        canPreviousPage={
                                                                            subPageIndex >
                                                                            0
                                                                        }
                                                                        canNextPage={
                                                                            subPageIndex +
                                                                                1 <
                                                                            (sub.totalPages ??
                                                                                0)
                                                                        }
                                                                        onPageChange={(
                                                                            p
                                                                        ) => {
                                                                            setSubPage(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [d.driverId]:
                                                                                        p,
                                                                                })
                                                                            );
                                                                            loadItems(
                                                                                d.driverId,
                                                                                p
                                                                            );
                                                                        }}
                                                                        onPreviousPage={() => {
                                                                            setSubPage(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [d.driverId]:
                                                                                        Math.max(
                                                                                            0,
                                                                                            subPageIndex -
                                                                                                1
                                                                                        ),
                                                                                })
                                                                            );
                                                                            loadItems(
                                                                                d.driverId,
                                                                                Math.max(
                                                                                    0,
                                                                                    subPageIndex -
                                                                                        1
                                                                                )
                                                                            );
                                                                        }}
                                                                        onNextPage={() => {
                                                                            const next =
                                                                                subPageIndex +
                                                                                1;
                                                                            setSubPage(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [d.driverId]:
                                                                                        next,
                                                                                })
                                                                            );
                                                                            loadItems(
                                                                                d.driverId,
                                                                                next
                                                                            );
                                                                        }}
                                                                        showFirstLast={
                                                                            false
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            ) : null
                                        }
                                    />
                                );
                            })}
                            {!rows?.content?.length && !loading && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-sm text-muted-foreground"
                                    >
                                        No drivers
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            {!loading && (rows?.totalElements ?? 0) > 0 && (
                <div className="relative flex flex-wrap items-center justify-center gap-4 py-2">
                    <span className="absolute left-0 text-sm text-muted-foreground">
                        {rows?.totalElements} driver(s)
                    </span>
                    <TablePagination
                        pageIndex={page}
                        pageCount={Math.max(pageCount, 1)}
                        canPreviousPage={page > 0}
                        canNextPage={page + 1 < pageCount}
                        onPageChange={setPage}
                        onPreviousPage={() => setPage(Math.max(0, page - 1))}
                        onNextPage={() => setPage(page + 1)}
                        showFirstLast={false}
                    />
                </div>
            )}
        </Card>
    );
}

function DriverRow({
    row,
    open,
    onToggle,
    payAllPending,
    subtable,
}: {
    row: DriverCommissionRow;
    open: boolean;
    onToggle: () => void;
    payAllPending: React.ReactNode;
    subtable: React.ReactNode;
}) {
    return (
        <>
            <TableRow
                className="cursor-pointer"
                onClick={onToggle}
                title="Show trip commissions"
            >
                <TableCell>
                    {open ? (
                        <IconChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </TableCell>
                <TableCell>
                    <div className="font-medium">{row.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.driverCode}
                        {row.iamUserId ? ' • IAM linked' : ' • No login'}
                    </div>
                </TableCell>
                <TableCell>
                    <Badge
                        variant={
                            row.status === 'AVAILABLE' ? 'default' : 'secondary'
                        }
                    >
                        {row.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-xs">
                    {fmtDateTime(row.lastActiveAt)}
                </TableCell>
                <TableCell className="text-xs">
                    {row.lastAssignment ? (
                        <div>
                            <div className="font-medium">
                                {row.lastAssignment.shipmentNumber}
                            </div>
                            <div className="text-muted-foreground">
                                {row.lastAssignment.lane ?? '—'} •{' '}
                                {row.lastAssignment.status}
                            </div>
                        </div>
                    ) : (
                        '—'
                    )}
                </TableCell>
                <TableCell className="text-xs font-medium">
                    {row.payable?.length ? (
                        <div className="flex flex-col">
                            {row.payable.map((p) => (
                                <span key={p.currency}>
                                    <Money
                                        amount={p.amount}
                                        currency={p.currency}
                                    />
                                </span>
                            ))}
                        </div>
                    ) : (
                        '—'
                    )}
                    {!!row.pendingCount && (
                        <div className="text-muted-foreground">
                            {row.pendingCount} pending
                        </div>
                    )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    {payAllPending}
                </TableCell>
            </TableRow>
            {open && subtable && <TableRow>{subtable}</TableRow>}
        </>
    );
}
