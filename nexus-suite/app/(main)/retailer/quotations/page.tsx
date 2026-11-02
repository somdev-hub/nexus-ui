'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconEye,
    IconFileText,
    IconX,
} from '@tabler/icons-react';
import {
    acceptRetailerQuotation,
    getRetailerQuotations,
    rejectRetailerQuotation,
} from '@/lib/services/counterparty-docs-service';
import type { SupplierQuotation } from '@/types/supplier';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';
import type { ColumnDef } from '@tanstack/react-table';

const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-amber-100 text-amber-800',
    CONVERTED: 'bg-purple-100 text-purple-800',
};

export default function RetailerQuotationsPage() {
    const [data, setData] = useState<SupplierQuotation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [status, setStatus] = useState<string>('SENT');

    const load = useCallback(
        async (statusFilter: string = status) => {
            setIsLoading(true);
            try {
                const res = await getRetailerQuotations({
                    page: 0,
                    // Sufficient for the centralized table (client-side paging).
                    size: 100,
                    status: statusFilter || undefined,
                });
                setData(res.content ?? []);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to load');
            } finally {
                setIsLoading(false);
            }
        },
        [status]
    );

    useEffect(() => {
        load(status);
    }, [load, status]);

    const handleAccept = async (id: number) => {
        setAcceptingId(id);
        try {
            await acceptRetailerQuotation(id);
            toast.success('Quotation accepted');
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Accept failed');
        } finally {
            setAcceptingId(null);
        }
    };

    const handleReject = async (id: number) => {
        setRejectingId(id);
        try {
            await rejectRetailerQuotation(id);
            toast.success('Quotation rejected');
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Reject failed');
        } finally {
            setRejectingId(null);
        }
    };

    const columns: ColumnDef<SupplierQuotation>[] = [
        {
            accessorKey: 'quotationNumber',
            header: 'Number',
            cell: ({ row }) => (
                <div className="font-mono">{row.original.quotationNumber}</div>
            ),
            enableHiding: false,
        },
        {
            id: 'supplier',
            header: 'Supplier',
            cell: ({ row }) =>
                row.original.supplierOrgName ||
                (row.original.supplierOrgId !== undefined
                    ? `Org #${row.original.supplierOrgId}`
                    : '—'),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    className={
                        STATUS_COLOR[row.original.status] ??
                        'bg-gray-100 text-gray-800'
                    }
                >
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: 'validity',
            header: 'Validity',
            cell: ({ row }) => (
                <div className="text-xs whitespace-nowrap">
                    {row.original.validFrom
                        ? new Date(
                              row.original.validFrom
                          ).toLocaleDateString()
                        : '—'}{' '}
                    →{' '}
                    {row.original.validTo
                        ? new Date(row.original.validTo).toLocaleDateString()
                        : '—'}
                </div>
            ),
        },
        {
            id: 'created',
            header: 'Created',
            cell: ({ row }) => (
                <div className="text-xs whitespace-nowrap">
                    {row.original.createdAt ? (
                        <>
                            <div>
                                {new Date(
                                    row.original.createdAt
                                ).toLocaleDateString()}
                            </div>
                            <div className="text-muted-foreground">
                                {new Date(
                                    row.original.createdAt
                                ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </>
                    ) : (
                        '—'
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'totalAmount',
            header: () => <div className="w-full text-right">Total</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Money
                        amount={row.original.totalAmount}
                        currency={row.original.currency}
                    />
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const q = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                                size="icon"
                            >
                                <IconDotsVertical />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                                <Link href={`/retailer/quotations/${q.quotationId}`}>
                                    <IconEye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </DropdownMenuItem>
                            {q.status === 'SENT' && (
                                <>
                                    <DropdownMenuItem
                                        disabled={
                                            acceptingId === q.quotationId
                                        }
                                        onSelect={() =>
                                            handleAccept(q.quotationId)
                                        }
                                    >
                                        <IconCircleCheckFilled className="mr-2 h-4 w-4" />
                                        {acceptingId === q.quotationId
                                            ? 'Accepting…'
                                            : 'Accept'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        disabled={
                                            rejectingId === q.quotationId
                                        }
                                        onSelect={() =>
                                            handleReject(q.quotationId)
                                        }
                                    >
                                        <IconX className="mr-2 h-4 w-4" />
                                        {rejectingId === q.quotationId
                                            ? 'Rejecting…'
                                            : 'Reject'}
                                    </DropdownMenuItem>
                                </>
                            )}
                            {q.status === 'ACCEPTED' && (
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={`/retailer/purchase-orders/add?fromQuotation=${q.quotationId}`}
                                    >
                                        <IconFileText className="mr-2 h-4 w-4" />
                                        Convert to PO
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useTables<SupplierQuotation>({
        data,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        getRowId: (row) => row.quotationId.toString(),
    });

    if (isLoading) {
        return (
            <div className="p-6 space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Supplier Quotations</h1>
                    <p className="text-muted-foreground">
                        Review SENT quotations and accept the ones you want to
                        convert to orders
                    </p>
                </div>
                <Button variant="outline" onClick={() => load(status)}>
                    Refresh
                </Button>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Quotations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CentralizedDataTable
                        table={table}
                        emptyMessage={`No ${status} quotations received yet`}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
