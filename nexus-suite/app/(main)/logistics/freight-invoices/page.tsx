'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    getLogisticsFreightByShipment,
    getLogisticsFreightInvoices,
} from '@/lib/services/counterparty-docs-service';
import type { FreightInvoice } from '@/types/freight-invoice';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    SENT_TO_PMS: 'bg-purple-100 text-purple-800',
    PAID: 'bg-green-100 text-green-800',
    DISPUTED: 'bg-orange-100 text-orange-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

export default function LogisticsFreightInvoicesPage() {
    const [data, setData] = useState<FreightInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shipmentId, setShipmentId] = useState('');
    const [lookup, setLookup] = useState<FreightInvoice[] | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await getLogisticsFreightInvoices({
                page: 0,
                size: 20,
            });
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

    const handleLookup = async () => {
        if (!shipmentId) {
            toast.error('Enter Shipment ID');
            return;
        }
        setLookupLoading(true);
        try {
            const result = await getLogisticsFreightByShipment(
                Number(shipmentId)
            );
            setLookup(result);
            if (result.length === 0)
                toast.info('No freight invoices for this shipment');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Lookup failed');
        } finally {
            setLookupLoading(false);
        }
    };

    const rows = lookup ?? data;

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
                    <h1 className="text-2xl font-bold">Freight Invoices</h1>
                    <p className="text-muted-foreground">
                        Carrier freight invoices issued against shipments
                    </p>
                </div>
                <Button variant="outline" onClick={load}>
                    Refresh
                </Button>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Look up by Shipment</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex gap-4">
                    <Input
                        placeholder="Shipment ID"
                        value={shipmentId}
                        onChange={(e) => setShipmentId(e.target.value)}
                        className="max-w-xs"
                    />
                    <Button onClick={handleLookup} disabled={lookupLoading}>
                        {lookupLoading ? 'Looking up...' : 'Look up'}
                    </Button>
                    {lookup !== null && (
                        <Button
                            variant="outline"
                            onClick={() => setLookup(null)}
                        >
                            Clear
                        </Button>
                    )}
                </CardContent>
            </Card>
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Shipment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((inv) => (
                            <TableRow key={inv.freightInvoiceId}>
                                <TableCell className="font-mono">
                                    {inv.invoiceNumber}
                                </TableCell>
                                <TableCell>
                                    {inv.shipmentNumber || inv.shipmentId}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={
                                            STATUS_COLOR[inv.status] ??
                                            'bg-gray-100 text-gray-800'
                                        }
                                    >
                                        {inv.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {inv.currency}{' '}
                                    {Number(inv.totalAmount).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No freight invoices
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
