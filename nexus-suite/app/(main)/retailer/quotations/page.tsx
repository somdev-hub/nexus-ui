'use client';

import { useEffect, useState } from 'react';
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
} from '@/lib/services/counterparty-docs-service';
import type { SupplierQuotation } from '@/types/supplier';
import { toast } from 'sonner';

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

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await getRetailerQuotations({ page: 0, size: 20 });
            setData(res.content ?? []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

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
                <Button variant="outline" onClick={load}>
                    Refresh
                </Button>
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
                                        {(q as { supplierOrgName?: string })
                                            .supplierOrgName ||
                                            q.buyerOrgName ||
                                            '—'}
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
                                    <TableCell className="text-xs">
                                        {q.validFrom || '—'} →{' '}
                                        {q.validTo || '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Money
                                            amount={q.totalAmount}
                                            currency={q.currency}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {q.status === 'SENT' && (
                                            <Button
                                                size="sm"
                                                disabled={
                                                    acceptingId ===
                                                    q.quotationId
                                                }
                                                onClick={() =>
                                                    handleAccept(q.quotationId)
                                                }
                                            >
                                                {acceptingId === q.quotationId
                                                    ? 'Accepting…'
                                                    : 'Accept'}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No quotations received yet
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
