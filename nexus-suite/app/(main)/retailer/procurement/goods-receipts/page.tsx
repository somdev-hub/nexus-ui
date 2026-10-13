'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    getGoodsReceiptById,
    getGoodsReceipts,
    transitionGoodsReceipt,
    updateGoodsReceipt,
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
import type {
    GoodsReceipt,
    GoodsReceiptPaginatedResponse,
} from '@/types/procurement';
import type { PurchaseOrder } from '@/types/purchase-orders';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TablePagination } from '@/components/ui/table-pagination';

interface PoLineOption {
    id: number;
    lineNumber?: number;
    description?: string;
}

function extractPoLines(po: unknown): PoLineOption[] {
    const record = po as Record<string, unknown>;
    const raw =
        (record.lineItems as unknown[]) ?? (record.items as unknown[]) ?? [];
    if (!Array.isArray(raw)) return [];
    const out: PoLineOption[] = [];
    for (const li of raw) {
        const item = li as Record<string, unknown>;
        const id = Number(item.poLineItemId ?? item.lineItemId ?? item.id);
        if (!Number.isFinite(id)) continue;
        const ln =
            item.lineNumber !== undefined ? Number(item.lineNumber) : undefined;
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
    SENT_TO_SUPPLIER: 'bg-blue-100 text-blue-800',
    RETURNED: 'bg-orange-100 text-orange-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

function today() {
    return new Date().toISOString().slice(0, 10);
}

/** Best-effort server message from an axios-style error. */
function apiErrorMessage(e: unknown, fallback: string): string {
    const data = (e as { response?: { data?: unknown } } | null)?.response
        ?.data;
    const pick = (v: unknown): string | null =>
        typeof v === 'string' && v.trim() ? v : null;
    return (
        (typeof data === 'string'
            ? pick(data)
            : pick(
                  (data as { message?: unknown } | null)?.message ??
                      (data as { error?: unknown } | null)?.error
              )) ??
        (e instanceof Error && e.message ? e.message : null) ??
        fallback
    );
}

const newGrNumber = () =>
    `GR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

const GR_PAGE_SIZE = 10;

export default function GoodsReceiptsPage() {
    const [data, setData] = useState<GoodsReceipt[]>([]);
    const [grPage, setGrPage] = useState(0);
    const [grTotalPages, setGrTotalPages] = useState(1);
    const [grTotalElements, setGrTotalElements] = useState(0);
    const [grLast, setGrLast] = useState(true);
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
    const [poLines, setPoLines] = useState<PoLineOption[]>([]);
    const [poLinesLoading, setPoLinesLoading] = useState(false);
    const [form, setForm] = useState({
        purchaseOrderId: '',
        grNumber: newGrNumber(),
        receivedDate: today(),
        deliveryNoteNumber: '',
        poLineItemId: '',
        quantityReceived: '',
        notes: '',
    });
    const [viewing, setViewing] = useState<GoodsReceipt | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [editing, setEditing] = useState<GoodsReceipt | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        receivedDate: today(),
        deliveryNoteNumber: '',
        carrier: '',
        trackingNumber: '',
        notes: '',
        lines: [] as { poLineItemId?: number; lineNumber?: number; quantityReceived: string }[],
    });
    const [pendingTransition, setPendingTransition] = useState<{
        gr: GoodsReceipt;
        status: string;
    } | null>(null);
    const [transitioning, setTransitioning] = useState(false);

    // Allowed next statuses per current GR status (backend-validated too).
    // RECEIVED → SENT_TO_SUPPLIER shares the receipt with the supplier,
    // who validates it and raises the invoice from it.
    const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
        DRAFT: [
            { value: 'RECEIVED', label: 'Mark Received' },
            { value: 'CANCELLED', label: 'Cancel' },
        ],
        RECEIVED: [
            { value: 'SENT_TO_SUPPLIER', label: 'Send to Supplier' },
            { value: 'RETURNED', label: 'Return' },
            { value: 'CANCELLED', label: 'Cancel' },
        ],
        SENT_TO_SUPPLIER: [
            { value: 'RETURNED', label: 'Return' },
            { value: 'CANCELLED', label: 'Cancel' },
        ],
        RETURNED: [{ value: 'CANCELLED', label: 'Cancel' }],
        CANCELLED: [],
    };

    const applyGrPage = (r: GoodsReceiptPaginatedResponse, pageNo: number) => {
        setData(r.content ?? []);
        setGrPage(pageNo);
        setGrTotalPages(r.totalPages ?? 1);
        setGrTotalElements(r.totalElements ?? 0);
        setGrLast(r.last ?? pageNo >= (r.totalPages ?? 1) - 1);
    };

    const load = async (pageNo: number = grPage) => {
        setIsLoading(true);
        try {
            const r = await getGoodsReceipts({
                pageNo,
                pageOffset: GR_PAGE_SIZE,
            });
            applyGrPage(r, pageNo);
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
                const r = await getGoodsReceipts({
                    pageNo: grPage,
                    pageOffset: GR_PAGE_SIZE,
                });
                if (!a) return;
                applyGrPage(r, grPage);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed');
            } finally {
                if (a) setIsLoading(false);
            }
        })();
        return () => {
            a = false;
        };
    }, [grPage]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const pos = await getPurchaseOrders({
                    pageNo: 0,
                    pageOffset: 100,
                });
                if (!active) return;
                setPurchaseOrders(pos.content ?? []);
            } catch {
                // Non-fatal: dropdown stays empty, manual submit still works.
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    // The supplier is fixed by the selected PO — no separate selection.
    // Prefer the dropdown row, fall back to the fully-loaded PO (the list
    // is paginated, so the selection may not be on the first page).
    const [poSupplierId, setPoSupplierId] = useState<number | null>(null);
    const [poSupplierName, setPoSupplierName] = useState<string | null>(null);
    const selectedPo = purchaseOrders.find(
        (p) => String(p.purchaseOrderId) === form.purchaseOrderId
    );
    const resolvedSupplierId =
        selectedPo?.supplierId !== undefined
            ? Number(selectedPo.supplierId)
            : poSupplierId;
    const resolvedSupplierName =
        selectedPo?.supplierOrgName ??
        selectedPo?.supplierName ??
        poSupplierName;

    useEffect(() => {
        const poId = Number(form.purchaseOrderId);
        if (!Number.isFinite(poId) || poId < 1) {
            setPoLines([]);
            setPoSupplierId(null);
            setPoSupplierName(null);
            return;
        }
        let active = true;
        setPoLinesLoading(true);
        getPurchaseOrderById(poId)
            .then((po) => {
                if (!active) return;
                setPoLines(extractPoLines(po));
                setPoSupplierId(
                    po.supplierId !== undefined ? Number(po.supplierId) : null
                );
                setPoSupplierName(
                    po.supplierOrgName ?? po.supplierName ?? null
                );
            })
            .catch(() => {
                if (active) {
                    setPoLines([]);
                    setPoSupplierId(null);
                    setPoSupplierName(null);
                }
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
            toast.error(
                'Enter a Purchase Order ID or PO number (e.g. PO-634684)'
            );
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
        if (!form.purchaseOrderId) {
            toast.error('Purchase Order is required');
            return;
        }
        if (
            resolvedSupplierId === null ||
            resolvedSupplierId === undefined ||
            !Number.isFinite(resolvedSupplierId)
        ) {
            toast.error('Selected PO has no supplier — cannot create receipt');
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
                // Supplier is fixed by the PO; the backend re-validates the match.
                supplierId: resolvedSupplierId,
                grNumber: form.grNumber.trim() || undefined,
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
                grNumber: newGrNumber(),
                receivedDate: today(),
                deliveryNoteNumber: '',
                poLineItemId: '',
                quantityReceived: '',
                notes: '',
            });
            load();
        } catch (e) {
            const message = apiErrorMessage(e, 'Failed to create');
            if (/GR number already exists/i.test(message)) {
                setForm((f) => ({ ...f, grNumber: newGrNumber() }));
                toast.error(
                    'That GR number is already taken — a fresh number was generated, please retry'
                );
            } else {
                toast.error(message);
            }
        } finally {
            setSaving(false);
        }
    };

    const openView = async (row: GoodsReceipt) => {
        setViewLoading(true);
        try {
            const full = await getGoodsReceiptById(row.goodsReceiptId);
            setViewing(full);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load receipt');
        } finally {
            setViewLoading(false);
        }
    };

    const openEdit = async (row: GoodsReceipt) => {
        setViewLoading(true);
        try {
            const full = await getGoodsReceiptById(row.goodsReceiptId);
            setEditing(full);
            setEditForm({
                receivedDate: full.receivedDate ?? today(),
                deliveryNoteNumber: full.deliveryNoteNumber ?? '',
                carrier: full.carrier ?? '',
                trackingNumber: full.trackingNumber ?? '',
                notes: full.notes ?? '',
                lines: (full.lineItems ?? []).map((li) => ({
                    poLineItemId: li.poLineItemId,
                    lineNumber: li.lineNumber,
                    quantityReceived:
                        li.quantityReceived !== undefined &&
                        li.quantityReceived !== null
                            ? String(li.quantityReceived)
                            : '',
                })),
            });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load receipt');
        } finally {
            setViewLoading(false);
        }
    };

    const saveEdit = async () => {
        if (!editing) return;
        setEditSaving(true);
        try {
            await updateGoodsReceipt(editing.goodsReceiptId, {
                receivedDate: editForm.receivedDate,
                deliveryNoteNumber: editForm.deliveryNoteNumber || undefined,
                carrier: editForm.carrier || undefined,
                trackingNumber: editForm.trackingNumber || undefined,
                notes: editForm.notes || undefined,
                lineItems: editForm.lines.map((li, idx) => ({
                    poLineItemId: li.poLineItemId,
                    lineNumber: li.lineNumber ?? idx + 1,
                    quantityReceived: Number(li.quantityReceived),
                })),
            });
            toast.success('Goods receipt updated');
            setEditing(null);
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : 'Failed to update receipt'
            );
        } finally {
            setEditSaving(false);
        }
    };

    const askTransition = async (row: GoodsReceipt, status: string) => {
        setViewLoading(true);
        try {
            const full = await getGoodsReceiptById(row.goodsReceiptId);
            setPendingTransition({ gr: full, status });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load receipt');
        } finally {
            setViewLoading(false);
        }
    };

    const confirmTransition = async () => {
        if (!pendingTransition) return;
        setTransitioning(true);
        try {
            // DRAFT → RECEIVED requires the line items in the transition body.
            const params =
                pendingTransition.status === 'RECEIVED'
                    ? {
                          lineItems: (pendingTransition.gr.lineItems ?? []).map(
                              (li) => ({
                                  poLineItemId: li.poLineItemId,
                                  lineNumber: li.lineNumber,
                                  quantityReceived: li.quantityReceived,
                              })
                          ),
                      }
                    : {};
            await transitionGoodsReceipt(
                pendingTransition.gr.goodsReceiptId,
                pendingTransition.status,
                params
            );
            toast.success(
                `Goods receipt ${pendingTransition.status.toLowerCase()}`
            );
            setPendingTransition(null);
            setViewing(null);
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : 'Status change failed'
            );
        } finally {
            setTransitioning(false);
        }
    };

    if (isLoading && data.length === 0)
        return (
            <div className="p-6">
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    return (
        <div className="flex flex-1 flex-col p-6 gap-6 min-w-0 max-w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Goods Receipts</h1>
                    <p className="text-muted-foreground">
                        FR-RET-005 · Three-Way Matching
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => load()}>
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
                                    {resolvedSupplierName && (
                                        <p className="text-xs text-muted-foreground">
                                            Supplier: {resolvedSupplierName}{' '}
                                            (from PO)
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>GR Number</Label>
                                        <Input
                                            placeholder="e.g. GR-2026-482913"
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
                        Dispatch notices — what is physically on each truck. The
                        PO stays the commercial order (what was asked for); each
                        ASN below is one dispatch against it. Expand a row for
                        carrier, tracking, quantities and ETA.
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
                                        <TableHead>
                                            On truck / Ordered
                                        </TableHead>
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
                                        const ordered = a.orderedQuantity ?? 0;
                                        const shipped = a.shippedQuantity ?? 0;
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
                                                        {a.backorderedQuantity !==
                                                            undefined &&
                                                        a.backorderedQuantity !==
                                                            null &&
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
                                                                        by this
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
                                        a.asnId ??
                                        a.asnNumber ??
                                        `all-asn-${i}`;
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
                                                    {a.backorderedQuantity !==
                                                        undefined &&
                                                    a.backorderedQuantity !==
                                                        null &&
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
                                                            setExpandedAllAsn(
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
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <span className="text-sm text-muted-foreground">
                            {allAsnsTotalElements} ASN(s)
                        </span>
                        <TablePagination
                            pageIndex={allAsnsPage}
                            pageCount={allAsnsTotalPages}
                            canPreviousPage={allAsnsPage > 0}
                            canNextPage={
                                allAsnsPage < allAsnsTotalPages - 1 &&
                                !allAsnsLoading
                            }
                            onPageChange={(p) => loadAllAsns(p)}
                            onPreviousPage={() =>
                                loadAllAsns(allAsnsPage - 1)
                            }
                            onNextPage={() =>
                                loadAllAsns(allAsnsPage + 1)
                            }
                            showFirstLast={false}
                        />
                        <span className="text-sm text-muted-foreground">
                            Page{' '}
                            {allAsnsTotalPages === 0 ? 0 : allAsnsPage + 1}{' '}
                            of {Math.max(allAsnsTotalPages, 1)}
                        </span>
                    </div>
                </CardContent>
            </Card>
            <div className="rounded-lg border overflow-hidden max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>GR Number</TableHead>
                            <TableHead>PO</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Delivery Note</TableHead>
                            <TableHead>Actions</TableHead>
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
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={viewLoading}
                                            onClick={() => openView(r)}
                                        >
                                            View
                                        </Button>
                                        {r.status === 'DRAFT' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={viewLoading}
                                                onClick={() => openEdit(r)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                        {(NEXT_STATUS[r.status] ?? []).map(
                                            (t) => (
                                                <Button
                                                    key={t.value}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={viewLoading}
                                                    onClick={() =>
                                                        askTransition(
                                                            r,
                                                            t.value
                                                        )
                                                    }
                                                >
                                                    {t.label}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8"
                                >
                                    No goods receipts
                                </TableCell>
                            </TableRow>
                        )}
                        {isLoading && data.length > 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    Loading goods receipts...
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                    {grTotalElements} receipt(s)
                </span>
                <TablePagination
                    pageIndex={grPage}
                    pageCount={grTotalPages}
                    canPreviousPage={grPage > 0}
                    canNextPage={!grLast}
                    onPageChange={setGrPage}
                    onPreviousPage={() =>
                        setGrPage((p) => Math.max(0, p - 1))
                    }
                    onNextPage={() => setGrPage((p) => p + 1)}
                    showFirstLast={false}
                />
                <span className="text-sm text-muted-foreground">
                    Page {grPage + 1} of {Math.max(grTotalPages, 1)}
                </span>
            </div>
            <Dialog
                open={viewing !== null}
                onOpenChange={(v) => !v && setViewing(null)}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Goods Receipt {viewing?.grNumber ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            Full receipt detail with line items.
                        </DialogDescription>
                    </DialogHeader>
                    {viewing && (
                        <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 text-sm">
                            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground">
                                        Status
                                    </p>
                                    <p className="font-medium">
                                        <Badge
                                            className={
                                                STATUS_COLOR[viewing.status]
                                            }
                                        >
                                            {viewing.status}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">PO</p>
                                    <p className="font-medium">
                                        {viewing.poNumber ??
                                            viewing.purchaseOrderId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Received Date
                                    </p>
                                    <p className="font-medium">
                                        {viewing.receivedDate
                                            ? new Date(
                                                  viewing.receivedDate
                                              ).toLocaleDateString()
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Delivery Note
                                    </p>
                                    <p className="font-medium">
                                        {viewing.deliveryNoteNumber ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Carrier
                                    </p>
                                    <p className="font-medium">
                                        {viewing.carrier ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Tracking
                                    </p>
                                    <p className="font-mono text-xs">
                                        {viewing.trackingNumber ?? '—'}
                                    </p>
                                </div>
                            </div>
                            {viewing.notes && (
                                <p className="rounded-md border p-3 text-sm">
                                    <span className="font-medium">
                                        Notes:{' '}
                                    </span>
                                    {viewing.notes}
                                </p>
                            )}
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">
                                    Line Items ({viewing.lineItems?.length ?? 0})
                                </p>
                                {(viewing.lineItems ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No line items.
                                    </p>
                                ) : (
                                    <div className="max-w-full overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>
                                                        Received
                                                    </TableHead>
                                                    <TableHead>
                                                        Accepted
                                                    </TableHead>
                                                    <TableHead>
                                                        Rejected
                                                    </TableHead>
                                                    <TableHead>UoM</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(viewing.lineItems ?? []).map(
                                                    (li, i) => (
                                                        <TableRow
                                                            key={
                                                                li.grLineItemId ??
                                                                `${viewing.goodsReceiptId}-${i}`
                                                            }
                                                        >
                                                            <TableCell>
                                                                {li.lineNumber ??
                                                                    i + 1}
                                                            </TableCell>
                                                            <TableCell>
                                                                {li.quantityReceived ??
                                                                    '—'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {li.quantityAccepted ??
                                                                    '—'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {li.quantityRejected ??
                                                                    '—'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {li.unitOfMeasure ??
                                                                    '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setViewing(null)}
                                >
                                    Close
                                </Button>
                                {(NEXT_STATUS[viewing.status] ?? []).map(
                                    (t) => (
                                        <Button
                                            key={t.value}
                                            disabled={transitioning}
                                            onClick={() =>
                                                setPendingTransition({
                                                    gr: viewing,
                                                    status: t.value,
                                                })
                                            }
                                        >
                                            {t.label}
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog
                open={editing !== null}
                onOpenChange={(v) => !v && setEditing(null)}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Goods Receipt {editing?.grNumber ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            Only draft receipts can be edited.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Received Date</Label>
                                    <DatePicker
                                        date={parseYmd(editForm.receivedDate)}
                                        onDateChange={(d) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                receivedDate: formatYmd(d),
                                            }))
                                        }
                                        placeholder="Pick received date"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Delivery Note Number</Label>
                                    <Input
                                        value={editForm.deliveryNoteNumber}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                deliveryNoteNumber:
                                                    e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Carrier</Label>
                                    <Input
                                        value={editForm.carrier}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                carrier: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tracking Number</Label>
                                    <Input
                                        value={editForm.trackingNumber}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                trackingNumber: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={editForm.notes}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            notes: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Line Quantities (received)</Label>
                                {editForm.lines.map((li, i) => (
                                    <div
                                        key={
                                            li.poLineItemId ??
                                            `line-${i}`
                                        }
                                        className="flex items-center gap-3"
                                    >
                                        <span className="w-16 text-sm text-muted-foreground">
                                            #{li.lineNumber ?? i + 1}
                                        </span>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={li.quantityReceived}
                                            onChange={(e) =>
                                                setEditForm((f) => ({
                                                    ...f,
                                                    lines: f.lines.map(
                                                        (l, j) =>
                                                            j === i
                                                                ? {
                                                                      ...l,
                                                                      quantityReceived:
                                                                          e
                                                                              .target
                                                                              .value,
                                                                  }
                                                                : l
                                                    ),
                                                }))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    disabled={editSaving}
                                    onClick={() => setEditing(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={saveEdit}
                                    disabled={editSaving}
                                >
                                    {editSaving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog
                open={pendingTransition !== null}
                onOpenChange={(v) => !v && setPendingTransition(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change status?</DialogTitle>
                        <DialogDescription>
                            Move goods receipt{' '}
                            {pendingTransition?.gr.grNumber} to{' '}
                            {pendingTransition?.status}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            disabled={transitioning}
                            onClick={() => setPendingTransition(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmTransition}
                            disabled={transitioning}
                        >
                            {transitioning ? 'Saving...' : 'Confirm'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
