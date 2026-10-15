'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CURRENCIES } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { formatYmd, parseYmd } from '@/lib/date-utils';
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
import { TablePagination } from '@/components/ui/table-pagination';
import type { PaginatedResponse } from '@/types/paginated-response';
import type { SupplierOrder } from '@/types/supplier';
import type { GoodsReceipt } from '@/types/procurement';
import { getSupplierOrders } from '@/lib/services/supplier-orders-service';
import {
    createSupplierInvoice,
    getSupplierGoodsReceipts,
    getSupplierInvoice,
    getSupplierInvoices,
    parseChargesBreakdown,
    transitionSupplierInvoice,
    updateSupplierInvoice,
    type OtherCharge,
    type SupplierInvoice,
} from '@/lib/services/supplier-invoices-service';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────
// Supplier-raised invoicing: the supplier validates the shared
// goods receipt, builds the invoice (lines + tax + charges) and
// submits it. The retailer only reviews, approves/rejects and pays.
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// Fixed tax: 18% of the base (lines) amount, non-editable.
const TAX_RATE = 0.18;

const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600 line-through',
};

const newInvNumber = () =>
    `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

function today() {
    return new Date().toISOString().slice(0, 10);
}

function fmtDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function fmtMoney(amount?: number | null, currency?: string): string {
    if (amount === undefined || amount === null) return '—';
    return `${currency ?? ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim();
}

interface PendingLine {
    poLineItemId?: number;
    lineNumber?: number;
    description?: string;
    orderedQty?: number;
    receivedQty?: number;
    quantity: string;
    unitPrice: string;
}

export default function SupplierInvoicesPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<SupplierInvoice> | null>(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [grData, setGrData] =
        useState<PaginatedResponse<GoodsReceipt> | null>(null);
    const [grPage, setGrPage] = useState(0);
    const [grLoading, setGrLoading] = useState(true);
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [viewingGr, setViewingGr] = useState<GoodsReceipt | null>(null);
    const [viewing, setViewing] = useState<SupplierInvoice | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<SupplierInvoice | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState<{
        invoice: SupplierInvoice;
        status: string;
        label: string;
    } | null>(null);
    const [confirmBusy, setConfirmBusy] = useState(false);

    // Create/edit form
    const [poId, setPoId] = useState('');
    const [grs, setGrs] = useState<GoodsReceipt[]>([]);
    const [grsLoading, setGrsLoading] = useState(false);
    const [invNo, setInvNo] = useState(newInvNumber());
    const [invoiceDate, setInvoiceDate] = useState(today());
    const [dueDate, setDueDate] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [charges, setCharges] = useState<OtherCharge[]>([]);
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<PendingLine[]>([]);

    const load = useCallback(
        async (pageNo: number = page) => {
            setLoading(true);
            try {
                const res = await getSupplierInvoices({
                    page: pageNo,
                    size: PAGE_SIZE,
                });
                setData(res);
            } catch (e: unknown) {
                toast({
                    title: e instanceof Error ? e.message : String(e),
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        },
        [toast, page]
    );

    useEffect(() => {
        load();
    }, [load]);

    const loadGrs = useCallback(
        async (pageNo: number = grPage) => {
            setGrLoading(true);
            try {
                const res = await getSupplierGoodsReceipts({
                    page: pageNo,
                    size: PAGE_SIZE,
                });
                setGrData(res);
            } catch (e: unknown) {
                toast({
                    title: e instanceof Error ? e.message : String(e),
                    variant: 'destructive',
                });
            } finally {
                setGrLoading(false);
            }
        },
        [toast, grPage]
    );

    useEffect(() => {
        loadGrs();
    }, [loadGrs]);

    const poNumberOf = (purchaseOrderId?: number): string => {
        if (purchaseOrderId === undefined) return '—';
        const order = orders.find((o) => o.purchaseOrderId === purchaseOrderId);
        return order?.poNumber ?? `#${purchaseOrderId}`;
    };

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await getSupplierOrders({
                    page: 0,
                    size: 100,
                });
                if (active) setOrders(res.content ?? []);
            } catch {
                // order dropdown stays empty
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    // When the PO changes: pull its shared GRs for validation display and
    // seed invoice lines (received qty when known, else ordered qty).
    useEffect(() => {
        const id = Number(poId);
        if (!Number.isFinite(id) || id < 1) {
            setGrs([]);
            if (!editing) setLines([]);
            return;
        }
        const order = orders.find((o) => o.purchaseOrderId === id);
        let active = true;
        setGrsLoading(true);
        getSupplierGoodsReceipts({ page: 0, size: 100 })
            .then((res) => {
                if (!active) return;
                const mine = (res.content ?? []).filter(
                    (g) => g.purchaseOrderId === id
                );
                setGrs(mine);
                if (!editing) {
                    const receivedByLine = new Map<number, number>();
                    for (const g of mine) {
                        for (const li of g.lineItems ?? []) {
                            if (li.poLineItemId !== undefined) {
                                receivedByLine.set(
                                    li.poLineItemId,
                                    Number(li.quantityReceived ?? 0) || 0
                                );
                            }
                        }
                    }
                    setLines(
                        (order?.lineItems ?? []).map((li, idx) => {
                            const lineId = li.lineItemId;
                            const received = lineId
                                ? receivedByLine.get(Number(lineId))
                                : undefined;
                            const qty =
                                received !== undefined
                                    ? received
                                    : (li.quantityOrdered ?? 0);
                            return {
                                poLineItemId:
                                    lineId !== undefined
                                        ? Number(lineId)
                                        : undefined,
                                lineNumber: li.lineNumber ?? idx + 1,
                                description: li.description,
                                orderedQty: li.quantityOrdered,
                                receivedQty: received,
                                quantity: String(qty ?? ''),
                                unitPrice:
                                    li.unitPrice !== undefined
                                        ? String(li.unitPrice)
                                        : '',
                            };
                        })
                    );
                    if (order?.currency) setCurrency(order.currency);
                }
            })
            .catch(() => {
                if (active) {
                    setGrs([]);
                    if (!editing) setLines([]);
                }
            })
            .finally(() => {
                if (active) setGrsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [poId, orders, editing]);

    const lineTotal = (l: PendingLine): number => {
        const q = Number(l.quantity);
        const p = Number(l.unitPrice);
        if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
        return Math.round(q * p * 100) / 100;
    };
    const linesTotal = lines.reduce((s, l) => s + lineTotal(l), 0);
    const computedTax = Math.round(linesTotal * TAX_RATE * 100) / 100;
    const chargesTotal =
        Math.round(
            charges.reduce((s, c) => s + (Number(c.amount) || 0), 0) * 100
        ) / 100;
    const grandTotal =
        Math.round((linesTotal + computedTax + chargesTotal) * 100) / 100;

    const resetForm = () => {
        setPoId('');
        setGrs([]);
        setInvNo(newInvNumber());
        setInvoiceDate(today());
        setDueDate('');
        setCurrency('USD');
        setPaymentTerms('');
        setCharges([]);
        setNotes('');
        setLines([]);
        setEditing(null);
    };

    const openCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    // Jump from a shared GR straight into invoicing for its PO — the
    // form's PO effect pulls the GR lines and seeds quantities.
    const createFromGr = (g: GoodsReceipt) => {
        resetForm();
        setPoId(String(g.purchaseOrderId));
        setDialogOpen(true);
    };

    const openEdit = async (inv: SupplierInvoice) => {
        try {
            const full = await getSupplierInvoice(inv.invoiceId);
            setEditing(full);
            setPoId(String(full.purchaseOrderId));
            setInvNo(
                full.supplierInvoiceNumber ??
                    full.invoiceNumber ??
                    newInvNumber()
            );
            setInvoiceDate(full.invoiceDate ?? today());
            setDueDate(full.dueDate ?? '');
            setCurrency(full.currency ?? 'USD');
            setPaymentTerms('');
            const breakdown = parseChargesBreakdown(
                full.otherChargesBreakdown
            );
            setCharges(
                breakdown.length > 0
                    ? breakdown
                    : full.otherCharges !== undefined &&
                        full.otherCharges !== null &&
                        Number(full.otherCharges) !== 0
                      ? [
                            {
                                amount: String(full.otherCharges),
                                description: '',
                            },
                        ]
                      : []
            );
            setNotes(full.notes ?? '');
            setLines(
                (full.lineItems ?? []).map((li, idx) => ({
                    poLineItemId: li.poLineItemId,
                    lineNumber: li.lineNumber ?? idx + 1,
                    quantity: String(li.quantityInvoiced ?? ''),
                    unitPrice: String(li.unitPrice ?? ''),
                }))
            );
            setDialogOpen(true);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const openView = async (inv: SupplierInvoice) => {
        try {
            setViewing(await getSupplierInvoice(inv.invoiceId));
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const buildPayload = () => {
        const keptCharges = charges
            .map((c) => ({
                amount: Number(c.amount),
                description: c.description.trim(),
            }))
            .filter((c) => Number.isFinite(c.amount) && c.amount > 0);
        // One invoice number: the supplier's number, auto-generated and
        // editable. It doubles as the internal reference server-side.
        const invNumber = invNo.trim();
        return {
            purchaseOrderId: Number(poId),
            invoiceNumber: invNumber || undefined,
            supplierInvoiceNumber: invNumber,
            invoiceDate,
            dueDate: dueDate || undefined,
            currency: currency.trim() || 'USD',
            paymentTerms: paymentTerms.trim() || undefined,
            taxAmount: computedTax,
            otherCharges: chargesTotal > 0 ? chargesTotal : undefined,
            otherChargesBreakdown:
                keptCharges.length > 0
                    ? JSON.stringify(keptCharges)
                    : undefined,
            notes: notes.trim() || undefined,
            lineItems: lines.map((l, idx) => ({
                poLineItemId: l.poLineItemId,
                lineNumber: l.lineNumber ?? idx + 1,
                quantityInvoiced: Number(l.quantity),
                unitPrice: Number(l.unitPrice),
            })),
        };
    };

    const validateForm = (): boolean => {
        if (!poId) {
            toast({ title: 'Select a purchase order', variant: 'destructive' });
            return false;
        }
        if (!invNo.trim()) {
            toast({
                title: 'Invoice number is required',
                variant: 'destructive',
            });
            return false;
        }
        if (lines.length === 0) {
            toast({ title: 'Add at least one line', variant: 'destructive' });
            return false;
        }
        for (const l of lines) {
            const q = Number(l.quantity);
            const p = Number(l.unitPrice);
            if (!l.poLineItemId || !Number.isFinite(q) || q <= 0) {
                toast({
                    title: 'Each line needs a valid invoiced quantity',
                    variant: 'destructive',
                });
                return false;
            }
            if (!Number.isFinite(p) || p < 0) {
                toast({
                    title: 'Each line needs a valid unit price',
                    variant: 'destructive',
                });
                return false;
            }
        }
        return true;
    };

    const saveDraft = async (submitAfter: boolean) => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            const created = editing
                ? await updateSupplierInvoice(editing.invoiceId, buildPayload())
                : await createSupplierInvoice(buildPayload());
            let finalInv = created;
            if (submitAfter) {
                finalInv = await transitionSupplierInvoice(
                    created.invoiceId,
                    'PENDING_APPROVAL',
                    { lineItems: created.lineItems ?? [] }
                );
                toast({
                    title: `Invoice ${finalInv.invoiceNumber} submitted for approval`,
                    variant: 'success',
                });
            } else {
                toast({
                    title: `Invoice ${created.invoiceNumber} saved as draft`,
                    variant: 'success',
                });
            }
            setDialogOpen(false);
            resetForm();
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const runTransition = async () => {
        if (!confirm) return;
        setConfirmBusy(true);
        try {
            const params =
                confirm.status === 'PENDING_APPROVAL'
                    ? {
                          lineItems: (confirm.invoice.lineItems ?? []).map(
                              (li) => ({
                                  poLineItemId: li.poLineItemId,
                                  lineNumber: li.lineNumber,
                                  quantityInvoiced: li.quantityInvoiced,
                              })
                          ),
                      }
                    : {};
            await transitionSupplierInvoice(
                confirm.invoice.invoiceId,
                confirm.status,
                params
            );
            toast({ title: `${confirm.label} done`, variant: 'success' });
            setConfirm(null);
            setViewing(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setConfirmBusy(false);
        }
    };

    const invoices = data?.content ?? [];

    return (
        <div className="p-4 lg:p-6 space-y-4 min-w-0 max-w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold">Invoices</h1>
                    <p className="text-sm text-muted-foreground">
                        Validate the shared goods receipt, raise your invoice
                        with charges and taxes, and submit it — the retailer
                        reviews and pays.
                    </p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <Button variant="outline" onClick={() => load()}>
                        Refresh
                    </Button>
                    <Button onClick={openCreate}>Create Invoice</Button>
                </div>
            </div>

            <Card className="p-4 gap-2 min-w-0">
                <CardHeader className="flex flex-row items-center justify-between p-0">
                    <CardTitle>
                        Received Goods Receipts (
                        {grData?.totalElements ?? 0})
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadGrs()}
                    >
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent className="p-0 min-w-0">
                    <p className="pb-2 text-sm text-muted-foreground">
                        Receipts the retailer shared for validation — check
                        the received quantities before invoicing.
                    </p>
                    {grLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="max-w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
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
                                    {(grData?.content ?? []).map((g) => (
                                        <TableRow key={g.goodsReceiptId}>
                                            <TableCell className="font-mono">
                                                {g.grNumber}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {poNumberOf(g.purchaseOrderId)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{g.status ?? '—'}</Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-xs">
                                                {fmtDate(g.receivedDate)}
                                            </TableCell>
                                            <TableCell>
                                                {g.deliveryNoteNumber ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setViewingGr(g)
                                                        }
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            createFromGr(g)
                                                        }
                                                    >
                                                        Create Invoice
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(grData?.content ?? []).length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No shared receipts yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {!grLoading && (
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
                            <span className="text-sm text-muted-foreground">
                                {grData?.totalElements ?? 0} receipt(s)
                            </span>
                            <TablePagination
                                pageIndex={grPage}
                                pageCount={grData?.totalPages ?? 0}
                                canPreviousPage={grPage > 0}
                                canNextPage={
                                    grData ? !grData.last : false
                                }
                                onPageChange={setGrPage}
                                onPreviousPage={() =>
                                    setGrPage((p) => Math.max(0, p - 1))
                                }
                                onNextPage={() => setGrPage((p) => p + 1)}
                                showFirstLast={false}
                            />
                            <span className="text-sm text-muted-foreground">
                                Page {grPage + 1} of {grData?.totalPages ?? 1}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="p-4 gap-2 min-w-0">
                <CardHeader className="p-0">
                    <CardTitle>
                        My Invoices ({data?.totalElements ?? 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 min-w-0">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="max-w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>PO</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead>Invoice Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((inv) => (
                                        <TableRow key={inv.invoiceId}>
                                        <TableCell className="font-mono">
                                            {inv.supplierInvoiceNumber ??
                                                inv.invoiceNumber}
                                        </TableCell>
                                            <TableCell>
                                                {inv.poNumber ??
                                                    inv.purchaseOrderId}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        STATUS_COLOR[
                                                            inv.status
                                                        ] ??
                                                        'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {fmtMoney(
                                                    inv.totalAmount,
                                                    inv.currency
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {fmtDate(inv.invoiceDate)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openView(inv)
                                                        }
                                                    >
                                                        View
                                                    </Button>
                                                    {inv.status ===
                                                        'DRAFT' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        inv
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setConfirm(
                                                                        {
                                                                            invoice:
                                                                                inv,
                                                                            status: 'PENDING_APPROVAL',
                                                                            label: 'Submit',
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                Submit
                                                            </Button>
                                                        </>
                                                    )}
                                                    {(inv.status === 'DRAFT' ||
                                                        inv.status ===
                                                            'PENDING_APPROVAL') && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setConfirm({
                                                                    invoice:
                                                                        inv,
                                                                    status: 'CANCELLED',
                                                                    label: 'Cancel',
                                                                })
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {invoices.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No invoices yet — create one
                                                from a shared goods receipt.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {!loading && (
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
                            <span className="text-sm text-muted-foreground">
                                {data?.totalElements ?? 0} invoice(s)
                            </span>
                            <TablePagination
                                pageIndex={page}
                                pageCount={data?.totalPages ?? 0}
                                canPreviousPage={page > 0}
                                canNextPage={data ? !data.last : false}
                                onPageChange={setPage}
                                onPreviousPage={() =>
                                    setPage((p) => Math.max(0, p - 1))
                                }
                                onNextPage={() => setPage((p) => p + 1)}
                                showFirstLast={false}
                            />
                            <span className="text-sm text-muted-foreground">
                                Page {page + 1} of {data?.totalPages ?? 1}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={dialogOpen}
                onOpenChange={(v) => {
                    if (!v) {
                        setDialogOpen(false);
                        resetForm();
                    }
                }}
            >
                <DialogContent className="md:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? `Edit Invoice ${editing.supplierInvoiceNumber ?? editing.invoiceNumber}`
                                : 'Create Invoice'}
                        </DialogTitle>
                        <DialogDescription>
                            Check the shared goods receipt quantities, then add
                            your charges and taxes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                        <div className="grid gap-2">
                            <Label>Purchase Order</Label>
                            <Select
                                value={poId}
                                onValueChange={(v) => setPoId(v)}
                                disabled={editing !== null}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select purchase order" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orders.map((o) => (
                                        <SelectItem
                                            key={o.purchaseOrderId}
                                            value={String(o.purchaseOrderId)}
                                        >
                                            {o.poNumber} · {o.status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {poId && (
                            <div className="grid gap-2 rounded-md border p-3 text-sm">
                                <p className="font-medium">
                                    Shared goods receipt (validation reference)
                                </p>
                                {grsLoading ? (
                                    <p className="text-muted-foreground">
                                        Loading receipts...
                                    </p>
                                ) : grs.length === 0 ? (
                                    <p className="text-muted-foreground">
                                        No shared receipt for this PO yet — the
                                        retailer sends it after receiving.
                                    </p>
                                ) : (
                                    grs.map((g) => (
                                        <div
                                            key={g.goodsReceiptId}
                                            className="grid gap-1 rounded-md bg-muted/40 p-2"
                                        >
                                            <p className="font-mono text-xs">
                                                {g.grNumber} · {g.status} ·{' '}
                                                {fmtDate(g.receivedDate)}
                                            </p>
                                            {(g.lineItems ?? []).map(
                                                (li, i) => (
                                                    <p
                                                        key={
                                                            li.grLineItemId ??
                                                            `${g.goodsReceiptId}-${i}`
                                                        }
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        Line{' '}
                                                        {li.lineNumber ??
                                                            i + 1}
                                                        : received{' '}
                                                        {li.quantityReceived ??
                                                            '—'}
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Invoice number *</Label>
                                <Input
                                    placeholder="e.g. INV-2026-482913"
                                    value={invNo}
                                    onChange={(e) => setInvNo(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Currency</Label>
                                <Select
                                    value={currency}
                                    onValueChange={setCurrency}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem
                                                key={c.code}
                                                value={c.code}
                                            >
                                                {c.code} · {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Invoice date</Label>
                                <DatePicker
                                    date={parseYmd(invoiceDate)}
                                    onDateChange={(d) =>
                                        setInvoiceDate(formatYmd(d))
                                    }
                                    placeholder="Pick date"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Due date</Label>
                                <DatePicker
                                    date={parseYmd(dueDate)}
                                    onDateChange={(d) =>
                                        setDueDate(formatYmd(d))
                                    }
                                    placeholder="Pick date"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Lines</Label>
                            {lines.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Select a PO to load its lines.
                                </p>
                            )}
                            {lines.map((l, i) => (
                                <div
                                    key={l.poLineItemId ?? `line-${i}`}
                                    className="grid grid-cols-[1fr_90px_90px_90px] items-end gap-2 rounded-md border p-2"
                                >
                                    <div className="min-w-0 text-xs">
                                        <p className="font-medium">
                                            #{l.lineNumber ?? i + 1}{' '}
                                            {l.description ?? ''}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Ordered {l.orderedQty ?? '—'}
                                            {l.receivedQty !== undefined &&
                                                ` · received ${l.receivedQty}`}
                                        </p>
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Qty</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={l.quantity}
                                            onChange={(e) =>
                                                setLines((arr) =>
                                                    arr.map((x, j) =>
                                                        j === i
                                                            ? {
                                                                  ...x,
                                                                  quantity:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Price</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={l.unitPrice}
                                            onChange={(e) =>
                                                setLines((arr) =>
                                                    arr.map((x, j) =>
                                                        j === i
                                                            ? {
                                                                  ...x,
                                                                  unitPrice:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="text-right font-mono text-xs">
                                        {fmtMoney(lineTotal(l), currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-2 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    Other charges
                                </p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setCharges((arr) => [
                                            ...arr,
                                            { amount: '', description: '' },
                                        ])
                                    }
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Add charge
                                </Button>
                            </div>
                            {charges.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No extra charges — add freight, handling,
                                    etc. as needed.
                                </p>
                            )}
                            {charges.map((c, i) => (
                                <div
                                    key={`charge-${i}`}
                                    className="grid grid-cols-[110px_1fr_auto] items-end gap-2"
                                >
                                    <div className="grid gap-1">
                                        <Label className="text-xs">
                                            Amount
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="0"
                                            value={c.amount}
                                            onChange={(e) =>
                                                setCharges((arr) =>
                                                    arr.map((x, j) =>
                                                        j === i
                                                            ? {
                                                                  ...x,
                                                                  amount: e
                                                                      .target
                                                                      .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">
                                            Description
                                        </Label>
                                        <Input
                                            placeholder="e.g. Freight"
                                            value={c.description}
                                            onChange={(e) =>
                                                setCharges((arr) =>
                                                    arr.map((x, j) =>
                                                        j === i
                                                            ? {
                                                                  ...x,
                                                                  description:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        aria-label="Remove charge"
                                        onClick={() =>
                                            setCharges((arr) =>
                                                arr.filter((_, j) => j !== i)
                                            )
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="grid gap-2">
                                <Label>Base amount</Label>
                                <p className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
                                    {linesTotal.toLocaleString()} {currency}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Tax (18% fixed)</Label>
                                <p className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
                                    {computedTax.toLocaleString()} {currency}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Total</Label>
                                <p className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
                                    {grandTotal.toLocaleString()} {currency}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Payment terms</Label>
                                <Input
                                    placeholder="e.g. Net 30"
                                    value={paymentTerms}
                                    onChange={(e) =>
                                        setPaymentTerms(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                disabled={saving}
                                onClick={() => saveDraft(false)}
                            >
                                {saving ? 'Saving…' : 'Save Draft'}
                            </Button>
                            {(!editing ||
                                editing.status === 'DRAFT') && (
                                <Button
                                    disabled={saving}
                                    onClick={() => saveDraft(true)}
                                >
                                    {saving
                                        ? 'Submitting…'
                                        : 'Save & Submit for Approval'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={viewing !== null}
                onOpenChange={(v) => !v && setViewing(null)}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Invoice{' '}
                            {viewing?.supplierInvoiceNumber ??
                                viewing?.invoiceNumber ??
                                ''}
                        </DialogTitle>
                        <DialogDescription>
                            {viewing?.status ?? ''}
                            {viewing?.poNumber
                                ? ` · ${viewing.poNumber}`
                                : ''}
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
                                                STATUS_COLOR[viewing.status] ??
                                                'bg-gray-100 text-gray-800'
                                            }
                                        >
                                            {viewing.status}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Invoice date
                                    </p>
                                    <p className="font-medium">
                                        {fmtDate(viewing.invoiceDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Due date
                                    </p>
                                    <p className="font-medium">
                                        {fmtDate(viewing.dueDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Tax</p>
                                    <p className="font-medium">
                                        {fmtMoney(
                                            viewing.taxAmount,
                                            viewing.currency
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Other charges
                                    </p>
                                    <p className="font-medium break-words whitespace-normal">
                                        {fmtMoney(
                                            viewing.otherCharges,
                                            viewing.currency
                                        )}
                                        {parseChargesBreakdown(
                                            viewing.otherChargesBreakdown
                                        ).map((c, i) => (
                                            <span
                                                key={i}
                                                className="block text-xs text-muted-foreground"
                                            >
                                                {fmtMoney(
                                                    Number(c.amount) || 0,
                                                    viewing.currency
                                                )}{' '}
                                                —{' '}
                                                {c.description || 'Charge'}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Total
                                    </p>
                                    <p className="font-mono font-semibold">
                                        {fmtMoney(
                                            viewing.totalAmount,
                                            viewing.currency
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Payment terms
                                    </p>
                                    <p className="font-medium">
                                        {viewing.paymentTerms ?? '—'}
                                    </p>
                                </div>
                            </div>
                            {viewing.rejectionReason && (
                                <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                                    <span className="font-medium">
                                        Rejection reason:{' '}
                                    </span>
                                    {viewing.rejectionReason}
                                </p>
                            )}
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
                                    Lines ({viewing.lineItems?.length ?? 0})
                                </p>
                                <div className="max-w-full overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead className="text-right">
                                                    Qty
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Price
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Total
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(viewing.lineItems ?? []).map(
                                                (li, i) => (
                                                    <TableRow
                                                        key={
                                                            li.invoiceLineItemId ??
                                                            `${viewing.invoiceId}-${i}`
                                                        }
                                                    >
                                                        <TableCell>
                                                            {li.lineNumber ??
                                                                i + 1}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityInvoiced ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {fmtMoney(
                                                                li.unitPrice,
                                                                viewing.currency
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {fmtMoney(
                                                                li.lineTotal,
                                                                viewing.currency
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setViewing(null)}
                                >
                                    Close
                                </Button>
                                {viewing.status === 'DRAFT' && (
                                    <Button
                                        onClick={() =>
                                            setConfirm({
                                                invoice: viewing,
                                                status: 'PENDING_APPROVAL',
                                                label: 'Submit',
                                            })
                                        }
                                    >
                                        Submit for Approval
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={confirm !== null}
                onOpenChange={(v) => !v && setConfirm(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirm?.label} invoice?</DialogTitle>
                        <DialogDescription>
                            {confirm?.label}{' '}
                            {confirm?.invoice.supplierInvoiceNumber ??
                                confirm?.invoice.invoiceNumber}
                            {confirm?.status === 'PENDING_APPROVAL'
                                ? ' — it goes to the retailer for approval.'
                                : ' — this cannot be undone.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            disabled={confirmBusy}
                            onClick={() => setConfirm(null)}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={runTransition}
                            disabled={confirmBusy}
                        >
                            {confirmBusy ? 'Working…' : 'Confirm'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={viewingGr !== null}
                onOpenChange={(v) => !v && setViewingGr(null)}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Goods Receipt {viewingGr?.grNumber ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            {viewingGr
                                ? `${poNumberOf(viewingGr.purchaseOrderId)} · ${viewingGr.status ?? ''}`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {viewingGr && (
                        <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 text-sm">
                            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground">
                                        Received date
                                    </p>
                                    <p className="font-medium">
                                        {fmtDate(viewingGr.receivedDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Delivery note
                                    </p>
                                    <p className="font-medium">
                                        {viewingGr.deliveryNoteNumber ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Carrier
                                    </p>
                                    <p className="font-medium">
                                        {viewingGr.carrier ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Tracking
                                    </p>
                                    <p className="font-mono text-xs">
                                        {viewingGr.trackingNumber ?? '—'}
                                    </p>
                                </div>
                            </div>
                            {viewingGr.notes && (
                                <p className="rounded-md border p-3 text-sm">
                                    <span className="font-medium">
                                        Notes:{' '}
                                    </span>
                                    {viewingGr.notes}
                                </p>
                            )}
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">
                                    Lines (
                                    {viewingGr.lineItems?.length ?? 0})
                                </p>
                                <div className="max-w-full overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead className="text-right">
                                                    Received
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Accepted
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Rejected
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(viewingGr.lineItems ?? []).map(
                                                (li, i) => (
                                                    <TableRow
                                                        key={
                                                            li.grLineItemId ??
                                                            `${viewingGr.goodsReceiptId}-${i}`
                                                        }
                                                    >
                                                        <TableCell>
                                                            {li.lineNumber ??
                                                                i + 1}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityReceived ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityAccepted ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityRejected ??
                                                                '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setViewingGr(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
