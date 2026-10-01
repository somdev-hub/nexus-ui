'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
    createInvoice,
    getInvoices,
} from '@/lib/services/procurement-extended-service';
import type { Invoice } from '@/types/procurement';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600 line-through',
};

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function InvoicesPage() {
    const [data, setData] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        purchaseOrderId: '',
        supplierId: '',
        invoiceNumber: '',
        invoiceDate: today(),
        dueDate: '',
        currency: 'USD',
        poLineItemId: '',
        quantityInvoiced: '',
        unitPrice: '',
        notes: '',
    });

    const load = async () => {
        setIsLoading(true);
        try {
            const r = await getInvoices({ pageNo: 0, pageOffset: 20 });
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
                const r = await getInvoices({ pageNo: 0, pageOffset: 20 });
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

    const handleCreate = async () => {
        if (!form.purchaseOrderId || !form.supplierId || !form.invoiceNumber) {
            toast.error('PO ID, Supplier ID and Invoice Number are required');
            return;
        }
        if (!form.poLineItemId || !form.quantityInvoiced || !form.unitPrice) {
            toast.error(
                'PO Line Item ID, invoiced quantity and unit price are required'
            );
            return;
        }
        setSaving(true);
        try {
            await createInvoice({
                purchaseOrderId: Number(form.purchaseOrderId),
                supplierId: Number(form.supplierId),
                invoiceNumber: form.invoiceNumber,
                invoiceDate: form.invoiceDate,
                dueDate: form.dueDate || undefined,
                currency: form.currency || 'USD',
                notes: form.notes || undefined,
                lineItems: [
                    {
                        poLineItemId: Number(form.poLineItemId),
                        lineNumber: 1,
                        quantityInvoiced: Number(form.quantityInvoiced),
                        unitPrice: Number(form.unitPrice),
                        notes: form.notes || undefined,
                    },
                ],
            });
            toast.success('Invoice created');
            setOpen(false);
            setForm({
                purchaseOrderId: '',
                supplierId: '',
                invoiceNumber: '',
                invoiceDate: today(),
                dueDate: '',
                currency: 'USD',
                poLineItemId: '',
                quantityInvoiced: '',
                unitPrice: '',
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
                    <h1 className="text-2xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground">
                        Supplier invoices · FR-FIN-001 / FR-RET-005
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={load}>
                        Refresh
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>Create Invoice</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Invoice</DialogTitle>
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
                                        <Label>Invoice Number</Label>
                                        <Input
                                            placeholder="e.g. INV-2026-001"
                                            value={form.invoiceNumber}
                                            onChange={set('invoiceNumber')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Currency</Label>
                                        <Input
                                            placeholder="e.g. USD"
                                            value={form.currency}
                                            onChange={set('currency')}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Invoice Date</Label>
                                        <Input
                                            type="date"
                                            value={form.invoiceDate}
                                            onChange={set('invoiceDate')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Due Date</Label>
                                        <Input
                                            type="date"
                                            value={form.dueDate}
                                            onChange={set('dueDate')}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="grid gap-2">
                                        <Label>PO Line Item ID</Label>
                                        <Input
                                            placeholder="e.g. 501"
                                            value={form.poLineItemId}
                                            onChange={set('poLineItemId')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Invoiced Qty</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 100"
                                            value={form.quantityInvoiced}
                                            onChange={set('quantityInvoiced')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Unit Price</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 25.50"
                                            value={form.unitPrice}
                                            onChange={set('unitPrice')}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        placeholder="e.g. Net 30 payment terms"
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
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>PO</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Invoice Date</TableHead>
                            <TableHead>Due</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((i) => (
                            <TableRow key={i.invoiceId}>
                                <TableCell className="font-mono">
                                    {i.invoiceNumber}
                                </TableCell>
                                <TableCell>
                                    {i.poNumber || i.purchaseOrderId}
                                </TableCell>
                                <TableCell>
                                    <Badge className={COLOR[i.status]}>
                                        {i.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {i.currency}{' '}
                                    {Number(i.totalAmount).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    {i.invoiceDate
                                        ? new Date(
                                              i.invoiceDate
                                          ).toLocaleDateString()
                                        : '—'}
                                </TableCell>
                                <TableCell>
                                    {i.dueDate
                                        ? new Date(
                                              i.dueDate
                                          ).toLocaleDateString()
                                        : '—'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8"
                                >
                                    No invoices
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
