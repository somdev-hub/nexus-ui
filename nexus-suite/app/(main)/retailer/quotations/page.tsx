'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

    const load = useCallback(async (statusFilter: string = status) => {
        setIsLoading(true);
        try {
            const res = await getRetailerQuotations({
                page: 0,
                size: 20,
                status: statusFilter || undefined,
            });
            setData(res.content ?? []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    }, [status]);

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Validity</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">
                                    Total
                                </TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((q) => (
                                <TableRow key={q.quotationId}>
                                    <TableCell className="font-mono">
                                        {q.quotationNumber}
                                    </TableCell>
                                    <TableCell>
                                        {q.supplierOrgName ||
                                            (q.supplierOrgId !== undefined
                                                ? `Org #${q.supplierOrgId}`
                                                : '—')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                STATUS_COLOR[q.status] ??
                                                'bg-gray-100 text-gray-800'
                                            }
                                        >
                                            {q.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">
                                        {q.validFrom
                                            ? new Date(
                                                  q.validFrom
                                              ).toLocaleDateString()
                                            : '—'}{' '}
                                        →{' '}
                                        {q.validTo
                                            ? new Date(
                                                  q.validTo
                                              ).toLocaleDateString()
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">
                                        {q.createdAt ? (
                                            <>
                                                <div>
                                                    {new Date(
                                                        q.createdAt
                                                    ).toLocaleDateString()}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {new Date(
                                                        q.createdAt
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Money
                                            amount={q.totalAmount}
                                            currency={q.currency}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                            >
                                                <Link
                                                    href={`/retailer/quotations/${q.quotationId}`}
                                                >
                                                    View
                                                </Link>
                                            </Button>
                                            {q.status === 'SENT' && (
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        acceptingId ===
                                                        q.quotationId
                                                    }
                                                    onClick={() =>
                                                        handleAccept(
                                                            q.quotationId
                                                        )
                                                    }
                                                >
                                                    {acceptingId ===
                                                    q.quotationId
                                                        ? 'Accepting…'
                                                        : 'Accept'}
                                                </Button>
                                            )}
                                            {q.status === 'SENT' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={
                                                        rejectingId ===
                                                        q.quotationId
                                                    }
                                                    onClick={() =>
                                                        handleReject(
                                                            q.quotationId
                                                        )
                                                    }
                                                >
                                                    {rejectingId ===
                                                    q.quotationId
                                                        ? 'Rejecting…'
                                                        : 'Reject'}
                                                </Button>
                                            )}
                                            {q.status === 'ACCEPTED' && (
                                                <Button size="sm" asChild>
                                                    <Link
                                                        href={`/retailer/purchase-orders/add?fromQuotation=${q.quotationId}`}
                                                    >
                                                        Convert to PO
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No {status} quotations received yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
