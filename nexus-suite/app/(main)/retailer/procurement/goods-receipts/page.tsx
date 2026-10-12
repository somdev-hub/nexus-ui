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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    getPurchaseOrderById,
    getPurchaseOrders,
} from '@/lib/services/purchase-orders-service';
import {
    getRetailerAsnByPo,
    getRetailerAsnByPoNumber,
    getRetailerAsns,
    type AsnDocument,
} from '@/lib/services/counterparty-docs-service';
import { getSuppliers } from '@/lib/services/suppliers-service';
import type { GoodsReceipt } from '@/types/procurement';
import type { PurchaseOrder } from '@/types/purchase-orders';
import type { Supplier } from '@/types/suppliers';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PoLineOption {
    id: number;
    lineNumber?: number;
    description?: string;
}

function extractPoLines(po: unknown): PoLineOption[] {
    const record = po as Record<string, unknown>;
    const raw =
        (record.lineItems as unknown[]) ??
        (record.items as unknown[]) ??
        [];
    if (!Array.isArray(raw)) return [];
    const out: PoLineOption[] = [];
    for (const li of raw) {
        const item = li as Record<string, unknown>;
        const id = Number(item.poLineItemId ?? item.lineItemId ?? item.id);
        if (!Number.isFinite(id)) continue;
        const ln =
            item.lineNumber !== undefined
                ? Number(item.lineNumber)
                : undefined;
        out.push({
            id,
            lineNumber: Number.isFinite(ln as number)
                ? (ln as number)
                : undefined,
            description:
                typeof item.description === 'string'
                    ? item.description
                    : undefined,
        });
    }
    return out;
}

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
    const [expandedAsn, setExpandedAsn] = useState<string | null>(null);
    const [asnLoading, setAsnLoading] = useState(false);
    const [allAsns, setAllAsns] = useState<AsnDocument[]>([]);
    const [allAsnsPage, setAllAsnsPage] = useState(0);
    const [allAsnsTotalPages, setAllAsnsTotalPages] = useState(1);
    const [allAsnsTotalElements, setAllAsnsTotalElements] = useState(0);
    const [allAsnsLoading, setAllAsnsLoading] = useState(false);
    const [expandedAllAsn, setExpandedAllAsn] = useState<string | null>(null);
    const ASN_PAGE_SIZE = 10;
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [poLines, setPoLines] = useState<PoLineOption[]>([]);
    const [poLinesLoading, setPoLinesLoading] = useState(false);
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

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [pos, sups] = await Promise.all([
                    getPurchaseOrders({ pageNo: 0, pageOffset: 100 }),
                    getSuppliers({ pageNo: 0, pageOffset: 100 }),
                ]);
                if (!active) return;
                setPurchaseOrders(pos.content ?? []);
                setSuppliers(sups.content ?? []);
            } catch {
                // Non-fatal: dropdowns stay empty, manual submit still works.
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const poId = Number(form.purchaseOrderId);
        if (!Number.isFinite(poId) || poId < 1) {
            setPoLines([]);
            return;
        }
        let active = true;
        setPoLinesLoading(true);
        getPurchaseOrderById(poId)
            .then((po) => {
                if (!active) return;
                setPoLines(extractPoLines(po));
            })
            .catch(() => {
                if (active) setPoLines([]);
            })
            .finally(() => {
                if (active) setPoLinesLoading(false);
            });
        return () => {
            active = false;
        };
    }, [form.purchaseOrderId]);

    const set =
        (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [k]: e.target.value }));

    const lookupAsn = async () => {
        const query = asnPoId.trim();
        if (!query) {
            toast.error('Enter a Purchase Order ID or PO number (e.g. PO-634684)');
            return;
        }
        setAsnLoading(true);
        try {
            // Numeric input = internal PO id, anything else = PO number.
            const result = /^\d+$/.test(query)
                ? await getRetailerAsnByPo(Number(query))
                : await getRetailerAsnByPoNumber(query);
            setAsns(result);
            if (result.length === 0) toast.info('No ASN found for this PO');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'ASN lookup failed');
        } finally {
            setAsnLoading(false);
        }
    };

    const loadAllAsns = async (page: number) => {
        setAllAsnsLoading(true);
        try {
            const res = await getRetailerAsns({ page, size: ASN_PAGE_SIZE });
            setAllAsns(res.content ?? []);
            setAllAsnsPage(res.page ?? page);
            setAllAsnsTotalPages(res.totalPages ?? 1);
            setAllAsnsTotalElements(res.totalElements ?? 0);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load ASNs');
        } finally {
            setAllAsnsLoading(false);
        }
    };

    useEffect(() => {
        loadAllAsns(0);
    }, []);

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
                                        <Label>Purchase Order</Label>
                                        <Select
                                            value={form.purchaseOrderId}
                                            onValueChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    purchaseOrderId: v,
                                                    poLineItemId: '',
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select purchase order" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {purchaseOrders.map((po) => (
                                                    <SelectItem
                                                        key={po.purchaseOrderId}
                                                        value={String(
                                                            po.purchaseOrderId
                                                        )}
                                                    >
                                                        {po.purchaseOrderNumber ??
                                                            `#${po.purchaseOrderId}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Supplier</Label>
                                        <Select
                                            value={form.supplierId}
                                            onValueChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    supplierId: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((s) => (
                                                    <SelectItem
                                                        key={s.supplierId}
                                                        value={String(
                                                            s.supplierId
                                                        )}
                                                    >
                                                        {s.businessName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Label>PO Line Item</Label>
                                        <Select
                                            value={form.poLineItemId}
                                            onValueChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    poLineItemId: v,
                                                }))
                                            }
                                            disabled={
                                                !form.purchaseOrderId ||
                                                poLinesLoading
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={
                                                        !form.purchaseOrderId
                                                            ? 'Select a PO first'
                                                            : poLinesLoading
                                                              ? 'Loading lines…'
                                                              : 'Select line item'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {poLines.map((li) => (
                                                    <SelectItem
                                                        key={li.id}
                                                        value={String(li.id)}
                                                    >
                                                        {li.lineNumber !==
                                                        undefined
                                                            ? `#${li.lineNumber} `
                                                            : ''}
                                                        {li.description ??
                                                            `Line ${li.id}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                    <p className="text-sm text-muted-foreground">
                        Dispatch notices — what is physically on each truck.
                        The PO stays the commercial order (what was asked
                        for); each ASN below is one dispatch against it.
                        Expand a row for carrier, tracking, quantities and
                        ETA.
                    </p>
                    <div className="flex gap-4">
                        <Input
                            placeholder="PO ID or PO number (e.g. PO-634684)"
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
                                        <TableHead>On truck / Ordered</TableHead>
                                        <TableHead>ETA</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asns.map((a, i) => {
                                        const key =
                                            a.asnId ??
                                            a.asnNumber ??
                                            `asn-${i}`;
                                        const expanded =
                                            expandedAsn === String(key);
                                        const ordered =
                                            a.orderedQuantity ?? 0;
                                        const shipped =
                                            a.shippedQuantity ?? 0;
                                        const pct =
                                            ordered > 0
                                                ? Math.min(
                                                      100,
                                                      Math.round(
                                                          (shipped / ordered) *
                                                              100
                                                      )
                                                  )
                                                : 0;
                                        return (
                                            <Fragment key={String(key)}>
                                                <TableRow>
                                                    <TableCell className="font-mono">
                                                        {String(
                                                            a.asnNumber ??
                                                                a.asnId ??
                                                                '—'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge>
                                                            {String(
                                                                a.status ?? '—'
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {String(
                                                            a.shipmentNumber ??
                                                                a.shipmentId ??
                                                                '—'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap">
                                                        {shipped} / {ordered}
                                                        {a.backorderedQuantity !== undefined &&
                                                        a.backorderedQuantity !== null &&
                                                        a.backorderedQuantity >
                                                            0 ? (
                                                            <span className="text-muted-foreground">
                                                                {' '}
                                                                (
                                                                {
                                                                    a.backorderedQuantity
                                                                }{' '}
                                                                backordered)
                                                            </span>
                                                        ) : null}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-xs">
                                                        {a.estimatedArrival
                                                            ? new Date(
                                                                  a.estimatedArrival
                                                              ).toLocaleString()
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setExpandedAsn(
                                                                    expanded
                                                                        ? null
                                                                        : String(
                                                                              key
                                                                          )
                                                                )
                                                            }
                                                        >
                                                            {expanded
                                                                ? 'Hide'
                                                                : 'Details'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {expanded && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            className="whitespace-normal"
                                                        >
                                                            <div className="grid gap-3 rounded-md bg-muted/40 p-3 text-sm md:grid-cols-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-muted-foreground">
                                                                        Carrier
                                                                    </p>
                                                                    <p className="font-medium break-words">
                                                                        {a.carrierName ??
                                                                            '—'}
                                                                    </p>
                                                                    <p className="font-mono text-xs text-muted-foreground break-all">
                                                                        {a.trackingNumber ??
                                                                            ''}
                                                                    </p>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-muted-foreground">
                                                                        Route
                                                                    </p>
                                                                    <p className="font-medium break-words whitespace-normal leading-snug">
                                                                        <span className="block">
                                                                            {a.pickupLocation ??
                                                                                '—'}
                                                                        </span>
                                                                        <span
                                                                            aria-hidden="true"
                                                                            className="my-0.5 block text-muted-foreground"
                                                                        >
                                                                            ↓
                                                                        </span>
                                                                        <span className="block">
                                                                            {a.deliveryLocation ??
                                                                                '—'}
                                                                        </span>
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Shipment
                                                                        status:{' '}
                                                                        {a.shipmentStatus ??
                                                                            '—'}
                                                                    </p>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-muted-foreground">
                                                                        Load
                                                                    </p>
                                                                    <p className="font-medium">
                                                                        {a.totalPackages ??
                                                                            '—'}{' '}
                                                                        pkgs ·{' '}
                                                                        {a.totalWeight ??
                                                                            '—'}{' '}
                                                                        kg ·{' '}
                                                                        {a.totalVolume ??
                                                                            '—'}{' '}
                                                                        m³
                                                                    </p>
                                                                    {a.logisticsOrgName && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            via{' '}
                                                                            {
                                                                                a.logisticsOrgName
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                                                    <span>
                                                                        PO
                                                                        coverage
                                                                        by
                                                                        this
                                                                        dispatch
                                                                    </span>
                                                                    <span>
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className="h-full rounded-full bg-primary"
                                                                        style={{
                                                                            width: `${pct}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {a.notes && (
                                                                <p className="mt-2 text-xs text-muted-foreground break-words whitespace-normal">
                                                                    {a.notes}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                    {asns.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
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
            <Card className="p-4 gap-2">
                <CardHeader className="p-0 flex flex-row items-center justify-between">
                    <CardTitle>
                        All Advance Shipping Notices ({allAsnsTotalElements})
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadAllAsns(allAsnsPage)}
                        disabled={allAsnsLoading}
                    >
                        {allAsnsLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Every dispatch visible to your organisation, newest
                        first. Use the lookup above to narrow to a single PO.
                    </p>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead>ASN Number</TableHead>
                                    <TableHead>PO</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Shipment</TableHead>
                                    <TableHead>On truck / Ordered</TableHead>
                                    <TableHead>ETA</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allAsns.map((a, i) => {
                                    const key =
                                        a.asnId ?? a.asnNumber ?? `all-asn-${i}`;
                                    const expanded =
                                        expandedAllAsn === String(key);
                                    const ordered = a.orderedQuantity ?? 0;
                                    const shipped = a.shippedQuantity ?? 0;
                                    return (
                                        <Fragment key={String(key)}>
                                            <TableRow>
                                                <TableCell className="font-mono">
                                                    {String(
                                                        a.asnNumber ??
                                                            a.asnId ??
                                                            '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {String(
                                                        a.poNumber ??
                                                            a.purchaseOrderId ??
                                                            '—'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge>
                                                        {String(a.status ?? '—')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {String(
                                                        a.shipmentNumber ??
                                                            a.shipmentId ??
                                                            '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {shipped} / {ordered}
                                                    {a.backorderedQuantity !== undefined &&
                                                    a.backorderedQuantity !== null &&
                                                    a.backorderedQuantity > 0 ? (
                                                        <span className="text-muted-foreground">
                                                            {' '}
                                                            (
                                                            {
                                                                a.backorderedQuantity
                                                            }{' '}
                                                            backordered)
                                                        </span>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {a.estimatedArrival
                                                        ? new Date(
                                                              a.estimatedArrival
                                                          ).toLocaleString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setExpandedAllAsn(
                                                                expanded
                                                                    ? null
                                                                    : String(key)
                                                            )
                                                        }
                                                    >
                                                        {expanded
                                                            ? 'Hide'
                                                            : 'Details'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {expanded && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={7}
                                                        className="whitespace-normal"
                                                    >
                                                        <div className="grid gap-3 rounded-md bg-muted/40 p-3 text-sm md:grid-cols-3">
                                                            <div>
                                                                <p className="text-muted-foreground">
                                                                    Carrier
                                                                </p>
                                                                <p className="font-medium">
                                                                    {a.carrierName ??
                                                                        '—'}
                                                                </p>
                                                                <p className="font-mono text-xs text-muted-foreground">
                                                                    {a.trackingNumber ??
                                                                        ''}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">
                                                                    Route
                                                                </p>
                                                                <p className="font-medium">
                                                                    {a.pickupLocation ??
                                                                        '—'}{' '}
                                                                    →{' '}
                                                                    {a.deliveryLocation ??
                                                                        '—'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Shipment
                                                                    status:{' '}
                                                                    {a.shipmentStatus ??
                                                                        '—'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">
                                                                    Load
                                                                </p>
                                                                <p className="font-medium">
                                                                    {a.totalPackages ??
                                                                        '—'}{' '}
                                                                    pkgs ·{' '}
                                                                    {a.totalWeight ??
                                                                        '—'}{' '}
                                                                    kg ·{' '}
                                                                    {a.totalVolume ??
                                                                        '—'}{' '}
                                                                    m³
                                                                </p>
                                                                {a.logisticsOrgName && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        via{' '}
                                                                        {
                                                                            a.logisticsOrgName
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {a.notes && (
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                {a.notes}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    );
                                })}
                                {allAsns.length === 0 && !allAsnsLoading && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-6 text-muted-foreground"
                                        >
                                            No advance shipping notices yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {allAsnsLoading && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-6 text-muted-foreground"
                                        >
                                            Loading ASNs...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Page {allAsnsTotalPages === 0 ? 0 : allAsnsPage + 1} of{' '}
                            {Math.max(allAsnsTotalPages, 1)} ·{' '}
                            {allAsnsTotalElements} total
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={allAsnsPage <= 0 || allAsnsLoading}
                                onClick={() => loadAllAsns(allAsnsPage - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                    allAsnsPage >= allAsnsTotalPages - 1 ||
                                    allAsnsLoading
                                }
                                onClick={() => loadAllAsns(allAsnsPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
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
