'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { TablePagination } from '@/components/ui/table-pagination';
import {
    createSuiteIntent,
    listSuiteIntents,
    suiteIdempotencyKey,
} from '@/lib/services/payments-service';
import type { SuiteIntent } from '@/types/payments';
import {
    getInvoiceById,
    getInvoices,
    transitionInvoice,
} from '@/lib/services/procurement-extended-service';
import type { Invoice } from '@/types/procurement';
import { parseChargesBreakdown } from '@/lib/services/supplier-invoices-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Retailer invoice review: invoices are raised by the supplier
// from the shared goods receipt (charges + taxes included) and
// submitted for approval. The retailer reviews, approves (gated
// by three-way matching on the backend) or rejects with a reason,
// then pays via the standalone mock PMS gateway.
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600 line-through',
};

function fmtDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function fmtMoney(amount?: number | null, currency?: string): string {
    if (amount === undefined || amount === null) return '—';
    return `${currency ?? ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim();
}

export default function InvoicesPage() {
    const router = useRouter();
    const { email, name } = useUserMetadata();
    const [data, setData] = useState<Invoice[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [last, setLast] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [viewing, setViewing] = useState<Invoice | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [rejectFor, setRejectFor] = useState<Invoice | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [payBusyId, setPayBusyId] = useState<number | null>(null);
    // invoiceId -> in-flight session (INITIATED / PROCESSING / FAILED)
    const [inflight, setInflight] = useState<Record<number, SuiteIntent>>({});
    const [confirm, setConfirm] = useState<{
        invoice: Invoice;
        status: 'APPROVED';
    } | null>(null);

    const load = async (pageNo: number = page) => {
        setIsLoading(true);
        try {
            const r = await getInvoices({ pageNo, pageOffset: PAGE_SIZE });
            setData(r.content ?? []);
            setPage(pageNo);
            setTotalPages(r.totalPages ?? 1);
            setTotalElements(r.totalElements ?? 0);
            setLast(r.last ?? pageNo >= (r.totalPages ?? 1) - 1);
            // Best-effort: map in-flight payment sessions so APPROVED rows
            // show Continue instead of starting a duplicate session.
            try {
                const s = await listSuiteIntents({ page: 0, size: 100 });
                const map: Record<number, SuiteIntent> = {};
                for (const it of s.content ?? []) {
                    if (
                        it.invoiceId !== undefined &&
                        it.invoiceId !== null &&
                        (it.status === 'INITIATED' ||
                            it.status === 'PROCESSING' ||
                            it.status === 'FAILED')
                    ) {
                        map[it.invoiceId] = it;
                    }
                }
                setInflight(map);
            } catch {
                // sessions are optional — Pay still works via idempotent create
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const openView = async (row: Invoice) => {
        setViewLoading(true);
        try {
            setViewing(await getInvoiceById(row.invoiceId));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setViewLoading(false);
        }
    };

    const doApprove = async () => {
        if (!confirm) return;
        setBusy(true);
        try {
            await transitionInvoice(confirm.invoice.invoiceId, 'APPROVED', {
                approvedBy: email ?? name ?? 'retailer',
            });
            toast.success('Invoice approved — ready for payment');
            setConfirm(null);
            setViewing(null);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Approval failed');
        } finally {
            setBusy(false);
        }
    };

    const doReject = async () => {
        if (!rejectFor) return;
        if (!rejectReason.trim()) {
            toast.error('Rejection reason is required');
            return;
        }
        setBusy(true);
        try {
            await transitionInvoice(rejectFor.invoiceId, 'REJECTED', {
                rejectionReason: rejectReason.trim(),
            });
            toast.success('Invoice rejected — returned to supplier');
            setRejectFor(null);
            setRejectReason('');
            setViewing(null);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Rejection failed');
        } finally {
            setBusy(false);
        }
    };

    // Capture invoice snapshot into t_suite_payments, then hand off to
    // the standalone (checkout) gateway with an encrypted ref param.
    // Intent key is deterministic per invoice → double-clicks replay
    // the same session (idempotent by nature).
    const continueCheckout = (inv: Invoice) => {
        const it = inflight[inv.invoiceId];
        if (!it) {
            startCheckout(inv);
            return;
        }
        setViewing(null);
        router.push(`/checkout?ref=${encodeURIComponent(it.ref)}`);
    };

    const startCheckout = async (inv: Invoice) => {
        setPayBusyId(inv.invoiceId);
        try {
            const intent = await createSuiteIntent({
                amount: inv.totalAmount,
                currency: inv.currency,
                description: `Invoice ${inv.supplierInvoiceNumber ?? inv.invoiceNumber}`,
                invoiceId: inv.invoiceId,
                invoiceNumber:
                    inv.supplierInvoiceNumber ?? inv.invoiceNumber,
                purchaseOrderId: inv.purchaseOrderId,
                payerRole: 'RETAILER',
                idempotencyKey: suiteIdempotencyKey(inv.invoiceId),
            });
            setViewing(null);
            router.push(`/checkout?ref=${encodeURIComponent(intent.ref)}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not start checkout');
        } finally {
            setPayBusyId(null);
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
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground">
                        Supplier invoices · review, approve, pay
                    </p>
                </div>
                <Button variant="outline" onClick={() => load()}>
                    Refresh
                </Button>
            </div>
            <div className="rounded-lg border overflow-hidden max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>PO</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Invoice Date</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((i) => (
                            <TableRow key={i.invoiceId}>
                                <TableCell className="font-mono">
                                    {i.supplierInvoiceNumber ?? i.invoiceNumber}
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
                                    {fmtMoney(i.totalAmount, i.currency)}
                                </TableCell>
                                <TableCell>{fmtDate(i.invoiceDate)}</TableCell>
                                <TableCell>{fmtDate(i.dueDate)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={viewLoading}
                                            onClick={() => openView(i)}
                                        >
                                            View
                                        </Button>
                                        {i.status === 'PENDING_APPROVAL' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={viewLoading}
                                                    onClick={() =>
                                                        setConfirm({
                                                            invoice: i,
                                                            status: 'APPROVED',
                                                        })
                                                    }
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={viewLoading}
                                                    onClick={() => {
                                                        setRejectFor(i);
                                                        setRejectReason('');
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {i.status === 'APPROVED' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                    viewLoading ||
                                                    payBusyId === i.invoiceId
                                                }
                                                onClick={() =>
                                                    continueCheckout(i)
                                                }
                                            >
                                                {payBusyId === i.invoiceId
                                                    ? 'Starting…'
                                                    : inflight[i.invoiceId]
                                                      ? 'Continue'
                                                      : 'Pay'}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-8"
                                >
                                    No invoices — suppliers submit them from
                                    shared goods receipts
                                </TableCell>
                            </TableRow>
                        )}
                        {isLoading && data.length > 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    Loading invoices...
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                    {totalElements} invoice(s)
                </span>
                <TablePagination
                    pageIndex={page}
                    pageCount={totalPages}
                    canPreviousPage={page > 0}
                    canNextPage={!last}
                    onPageChange={setPage}
                    onPreviousPage={() =>
                        setPage((p) => Math.max(0, p - 1))
                    }
                    onNextPage={() => setPage((p) => p + 1)}
                    showFirstLast={false}
                />
                <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {Math.max(totalPages, 1)}
                </span>
            </div>

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
                                ? ` · PO ${viewing.poNumber}`
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
                                            className={COLOR[viewing.status]}
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
                                                {(
                                                    Number(c.amount) || 0
                                                ).toLocaleString()}{' '}
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
                                                (li, idx) => (
                                                    <TableRow
                                                        key={
                                                            li.invoiceLineItemId ??
                                                            `${viewing.invoiceId}-${idx}`
                                                        }
                                                    >
                                                        <TableCell>
                                                            {li.lineNumber ??
                                                                idx + 1}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityInvoiced ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.unitPrice ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {li.lineTotal ??
                                                                '—'}
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
                                {viewing.status === 'PENDING_APPROVAL' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            disabled={busy}
                                            onClick={() => {
                                                setRejectFor(viewing);
                                                setRejectReason('');
                                            }}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            disabled={busy}
                                            onClick={() =>
                                                setConfirm({
                                                    invoice: viewing,
                                                    status: 'APPROVED',
                                                })
                                            }
                                        >
                                            Approve
                                        </Button>
                                    </>
                                )}
                                {viewing.status === 'APPROVED' && (
                                    <Button
                                        variant="outline"
                                        disabled={
                                            payBusyId === viewing.invoiceId
                                        }
                                        onClick={() =>
                                            continueCheckout(viewing)
                                        }
                                    >
                                        {payBusyId === viewing.invoiceId
                                            ? 'Starting…'
                                            : inflight[viewing.invoiceId]
                                              ? 'Continue'
                                              : 'Pay'}
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
                        <DialogTitle>Approve invoice?</DialogTitle>
                        <DialogDescription>
                            Approval runs three-way matching (PO vs goods
                            receipt vs invoice) — a mismatch blocks approval.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => setConfirm(null)}
                        >
                            Back
                        </Button>
                        <Button onClick={doApprove} disabled={busy}>
                            {busy ? 'Approving…' : 'Approve'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={rejectFor !== null}
                onOpenChange={(v) => {
                    if (!v) {
                        setRejectFor(null);
                        setRejectReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject invoice?</DialogTitle>
                        <DialogDescription>
                            The supplier sees the reason and can correct and
                            resubmit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Rejection reason *</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                placeholder="e.g. Tax amount does not match the agreed rate"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                    setRejectFor(null);
                                    setRejectReason('');
                                }}
                            >
                                Back
                            </Button>
                            <Button onClick={doReject} disabled={busy}>
                                {busy ? 'Rejecting…' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
