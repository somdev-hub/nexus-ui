'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { formatYmd, parseYmd } from '@/lib/date-utils';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    createGoodsReceipt,
    getGoodsReceipts,
} from '@/lib/services/procurement-extended-service';
import {
    getRetailerAsnByPo,
    type AsnDocument,
} from '@/lib/services/counterparty-docs-service';
import type { GoodsReceipt } from '@/types/procurement';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    RECEIVED: 'bg-green-100 text-green-800',
    RETURNED: 'bg-orange-100 text-orange-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function GoodsReceiptsPage() {
    const [data, setData] = useState<GoodsReceipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [asnPoId, setAsnPoId] = useState('');
    const [asns, setAsns] = useState<AsnDocument[] | null>(null);
    const [asnLoading, setAsnLoading] = useState(false);
    const [form, setForm] = useState({
        purchaseOrderId: '',
        supplierId: '',
        grNumber: '',
        receivedDate: today(),
        deliveryNoteNumber: '',
        poLineItemId: '',
        quantityReceived: '',
        notes: '',
    });

    const load = async () => {
        setIsLoading(true);
        try {
            const r = await getGoodsReceipts({ pageNo: 0, pageOffset: 20 });
            setData(r.content);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let a = true;
        (async () => {
            try {
                const r = await getGoodsReceipts({ pageNo: 0, pageOffset: 20 });
                if (!a) return;
                setData(r.content);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed');
            } finally {
                if (a) setIsLoading(false);
            }
        })();
        return () => {
            a = false;
        };
    }, []);

    const set =
        (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [k]: e.target.value }));

    const lookupAsn = async () => {
        if (!asnPoId) {
            toast.error('Enter Purchase Order ID');
            return;
        }
        setAsnLoading(true);
        try {
            const result = await getRetailerAsnByPo(Number(asnPoId));
            setAsns(result);
            if (result.length === 0) toast.info('No ASN found for this PO');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'ASN lookup failed');
        } finally {
            setAsnLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.purchaseOrderId || !form.supplierId || !form.grNumber) {
            toast.error('PO ID, Supplier ID and GR Number are required');
            return;
        }
        if (!form.poLineItemId || !form.quantityReceived) {
            toast.error('PO Line Item ID and received quantity are required');
            return;
        }
        setSaving(true);
        try {
            await createGoodsReceipt({
                purchaseOrderId: Number(form.purchaseOrderId),
                supplierId: Number(form.supplierId),
                grNumber: form.grNumber,
                receivedDate: form.receivedDate,
                deliveryNoteNumber: form.deliveryNoteNumber || undefined,
                notes: form.notes || undefined,
                lineItems: [
                    {
                        poLineItemId: Number(form.poLineItemId),
                        lineNumber: 1,
                        quantityReceived: Number(form.quantityReceived),
                        notes: form.notes || undefined,
                    },
                ],
            });
            toast.success('Goods receipt created');
            setOpen(false);
            setForm({
                purchaseOrderId: '',
                supplierId: '',
                grNumber: '',
                receivedDate: today(),
                deliveryNoteNumber: '',
                poLineItemId: '',
                quantityReceived: '',
                notes: '',
            });
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to create');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading)
        return (
            <div className="p-6">
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Goods Receipts</h1>
                    <p className="text-muted-foreground">
                        FR-RET-005 · Three-Way Matching
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={load}>
                        Refresh
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>Create Receipt</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Goods Receipt</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Purchase Order ID</Label>
                                        <Input
                                            placeholder="e.g. 101"
                                            value={form.purchaseOrderId}
                                            onChange={set('purchaseOrderId')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Supplier ID</Label>
                                        <Input
                                            placeholder="e.g. 12"
                                            value={form.supplierId}
                                            onChange={set('supplierId')}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>GR Number</Label>
                                        <Input
                                            placeholder="e.g. GR-2026-001"
                                            value={form.grNumber}
                                            onChange={set('grNumber')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Received Date</Label>
                                        <DatePicker
                                            date={parseYmd(form.receivedDate)}
                                            onDateChange={(d) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    receivedDate: formatYmd(d),
                                                }))
                                            }
                                            placeholder="Pick received date"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Delivery Note Number</Label>
                                    <Input
                                        placeholder="e.g. DN-8841"
                                        value={form.deliveryNoteNumber}
                                        onChange={set('deliveryNoteNumber')}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>PO Line Item ID</Label>
                                        <Input
                                            placeholder="e.g. 501"
                                            value={form.poLineItemId}
                                            onChange={set('poLineItemId')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Received Qty</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 100"
                                            value={form.quantityReceived}
                                            onChange={set('quantityReceived')}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        placeholder="e.g. Received in good condition"
                                        value={form.notes}
                                        onChange={set('notes')}
                                    />
                                </div>
                                <Button
                                    onClick={handleCreate}
                                    disabled={saving}
                                >
                                    {saving ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Advance Shipping Notices (ASN) by PO</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Purchase Order ID"
                            value={asnPoId}
                            onChange={(e) => setAsnPoId(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button onClick={lookupAsn} disabled={asnLoading}>
                            {asnLoading ? 'Looking up...' : 'Look up ASN'}
                        </Button>
                    </div>
                    {asns !== null && (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>ASN Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Shipment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asns.map((a, i) => (
                                        <TableRow
                                            key={
                                                a.asnId ??
                                                a.asnNumber ??
                                                `asn-${i}`
                                            }
                                        >
                                            <TableCell className="font-mono">
                                                {String(
                                                    a.asnNumber ??
                                                        a.asnId ??
                                                        '—'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>
                                                    {String(a.status ?? '—')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {String(
                                                    a.shipmentNumber ??
                                                        a.shipmentId ??
                                                        '—'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {asns.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="text-center py-6 text-muted-foreground"
                                            >
                                                No ASN for this purchase order
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>GR Number</TableHead>
                            <TableHead>PO</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Delivery Note</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((r) => (
                            <TableRow key={r.goodsReceiptId}>
                                <TableCell className="font-mono">
                                    {r.grNumber}
                                </TableCell>
                                <TableCell>
                                    {r.poNumber || r.purchaseOrderId}
                                </TableCell>
                                <TableCell>
                                    <Badge className={STATUS_COLOR[r.status]}>
                                        {r.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {r.receivedDate
                                        ? new Date(
                                              r.receivedDate
                                          ).toLocaleDateString()
                                        : '—'}
                                </TableCell>
                                <TableCell>
                                    {r.deliveryNoteNumber || '—'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8"
                                >
                                    No goods receipts
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
