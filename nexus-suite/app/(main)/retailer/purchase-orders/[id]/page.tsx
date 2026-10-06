'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Money } from '@/components/money';
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
    getPurchaseOrderById,
    transitionPurchaseOrder,
} from '@/lib/services/purchase-orders-service';
import {
    browseSupplierCatalog,
    type SupplierBrowseItem,
} from '@/lib/services/supplier-market-service';
import { getRetailerQuotationById } from '@/lib/services/counterparty-docs-service';
import type { PurchaseOrder } from '@/types/purchase-orders';
import type { SupplierQuotation } from '@/types/supplier';

/** Raw ISO timestamps from the API -> locale date, with safe fallbacks. */
const formatDate = (value?: string | null): string => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const numericId = Number(id);

    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [catalogById, setCatalogById] = useState<
        Record<number, SupplierBrowseItem>
    >({});
    const [sourceQuotation, setSourceQuotation] =
        useState<SupplierQuotation | null>(null);

    // Best-effort enrichment for the detail view: supplier catalog names
    // (a PO is raised strictly against supplier catalog material) and the
    // source quotation. Never blocks rendering.
    const enrichDetails = useCallback(
        async (po: PurchaseOrder, isActive: () => boolean) => {
        if (po.supplierOrgId) {
            try {
                const res = await browseSupplierCatalog({
                    supplierOrgId: po.supplierOrgId,
                    pageNo: 0,
                    pageOffset: 100,
                });
                if (!isActive()) return;
                const map: Record<number, SupplierBrowseItem> = {};
                for (const item of res.content ?? []) {
                    const cid = item.catalogId ?? item.id;
                    if (cid !== undefined) map[Number(cid)] = item;
                }
                setCatalogById(map);
            } catch {
                // catalog extras are best-effort; lines still render
            }
        }
        if (po.sourceQuotationId) {
            try {
                const q = await getRetailerQuotationById(
                    po.sourceQuotationId
                );
                if (!isActive()) return;
                setSourceQuotation(q);
            } catch {
                // IDs from the PO still render below
            }
        }
    }, []);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            if (!Number.isFinite(numericId)) {
                setLoadError('Invalid purchase order id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getPurchaseOrderById(numericId);
                if (!active) return;
                setPurchaseOrder(data);
                // Best-effort enrichment (never blocks the detail view).
                void enrichDetails(data, () => active);
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch purchase order:', error);
                const message =
                    (
                        error as {
                            response?: { data?: { message?: string } };
                        }
                    )?.response?.data?.message ||
                    (error instanceof Error
                        ? error.message
                        : 'Failed to load purchase order');
                setLoadError(
                    `Could not load purchase order #${id}: ${message}`
                );
                toast.error('Failed to load purchase order');
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [id, numericId, enrichDetails]);

    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [confirmSend, setConfirmSend] = useState(false);

    const handleSubmitForApproval = async () => {
        if (!purchaseOrder) return;
        setIsSubmitting(true);
        try {
            const updated = await transitionPurchaseOrder(
                purchaseOrder.purchaseOrderId,
                'PENDING_APPROVAL'
            );
            setPurchaseOrder(updated);
            toast.success('Purchase order submitted for approval');
            router.refresh();
        } catch (error) {
            console.error('Failed to submit purchase order:', error);
            toast.error('Failed to submit purchase order. Please try again.');
        } finally {
            setIsSubmitting(false);
            setConfirmSubmit(false);
        }
    };

    const handleSendToSupplier = async () => {
        if (!purchaseOrder) return;
        setIsSubmitting(true);
        try {
            const updated = await transitionPurchaseOrder(
                purchaseOrder.purchaseOrderId,
                'SENT_TO_SUPPLIER'
            );
            setPurchaseOrder(updated);
            toast.success('Purchase order sent to supplier');
            router.refresh();
        } catch (error) {
            console.error('Failed to send purchase order:', error);
            toast.error('Failed to send purchase order. Please try again.');
        } finally {
            setIsSubmitting(false);
            setConfirmSend(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (loadError || !purchaseOrder) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
                <p className="text-muted-foreground">
                    {loadError ?? 'Purchase order not found'}
                </p>
                <Button variant="outline" asChild>
                    <Link href="/retailer/purchase-orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Purchase Orders
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:gap-6 md:p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/retailer/purchase-orders"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">
                                    {purchaseOrder.purchaseOrderNumber}
                                </h2>
                                <Badge variant="outline">
                                    {purchaseOrder.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {purchaseOrder.supplierOrgName}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={`/retailer/purchase-orders/${purchaseOrder.purchaseOrderId}/edit`}
                            >
                                Edit
                            </Link>
                        </Button>
                        {purchaseOrder.status === 'DRAFT' && (
                            <Button
                                onClick={() => setConfirmSubmit(true)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting
                                    ? 'Submitting...'
                                    : 'Submit for Approval'}
                            </Button>
                        )}
                        {purchaseOrder.status === 'APPROVED' && (
                            <Button
                                onClick={() => setConfirmSend(true)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting
                                    ? 'Sending...'
                                    : 'Send to Supplier'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">
                                Order Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Retailer
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.retailerOrgName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Supplier
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.supplierOrgName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Order Date
                                </span>
                                <span className="font-medium">
                                    {formatDate(purchaseOrder.orderDate)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Expected Delivery
                                </span>
                                <span className="font-medium">
                                    {formatDate(
                                        purchaseOrder.expectedDeliveryDate
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Requested Delivery
                                </span>
                                <span className="font-medium">
                                    {formatDate(
                                        purchaseOrder.requestedDeliveryDate
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Payment Terms
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.paymentTerms || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Incoterms
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.incoterms || '—'}
                                </span>
                            </div>
                            {(purchaseOrder.revisionNumber ?? 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Revision
                                    </span>
                                    <span className="font-medium">
                                        Rev {purchaseOrder.revisionNumber}
                                        {purchaseOrder.parentPoId
                                            ? ` of PO #${purchaseOrder.parentPoId}`
                                            : ''}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">Totals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Currency
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.currency}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">
                                    Total Amount
                                </span>
                                <span className="font-mono text-lg font-semibold">
                                    {purchaseOrder.currency}{' '}
                                    {purchaseOrder.totalAmount.toLocaleString(
                                        undefined,
                                        { minimumFractionDigits: 2 }
                                    )}
                                </span>
                            </div>
                            {purchaseOrder.approvedBy && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Approved By
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.approvedBy}
                                        {purchaseOrder.approvedAt
                                            ? ` on ${formatDate(purchaseOrder.approvedAt)}`
                                            : ''}
                                    </span>
                                </div>
                            )}
                            {purchaseOrder.rejectionReason && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Rejection Reason
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.rejectionReason}
                                    </span>
                                </div>
                            )}
                            {purchaseOrder.approvalLevel && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Approval Level
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.approvalLevel}
                                    </span>
                                </div>
                            )}
                            {purchaseOrder.requiredApproverLevel && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Required Approver
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.requiredApproverLevel}
                                    </span>
                                </div>
                            )}
                            {purchaseOrder.currentApprover && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Current Approver
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.currentApprover}
                                    </span>
                                </div>
                            )}
                            {purchaseOrder.approvalDelegatedTo && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Delegated To
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.approvalDelegatedTo}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">Addresses</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Shipping Address
                                </p>
                                <p className="font-medium">
                                    {purchaseOrder.shippingAddress || '—'}
                                </p>
                            </div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Billing Address
                                </p>
                                <p className="font-medium">
                                    {purchaseOrder.billingAddress || '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">
                                Notes & Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="text-sm">
                                <p className="text-muted-foreground">Notes</p>
                                <p className="font-medium">
                                    {purchaseOrder.notes || '—'}
                                </p>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Created
                                </span>
                                <span className="font-medium">
                                    {formatDate(purchaseOrder.createdAt)} by{' '}
                                    {purchaseOrder.createdBy}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Updated
                                </span>
                                <span className="font-medium">
                                    {formatDate(purchaseOrder.updatedAt)} by{' '}
                                    {purchaseOrder.updatedBy}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4 md:col-span-2">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">
                                Requested Materials (
                                {purchaseOrder.lineItems?.length ?? 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {purchaseOrder.lineItems?.length ? (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">
                                                Ordered
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Received
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Invoiced
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Unit Price
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Total
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseOrder.lineItems.map(
                                            (li, idx) => {
                                                const catalog =
                                                    li.catalogId !==
                                                    undefined
                                                        ? catalogById[
                                                              li.catalogId
                                                          ]
                                                        : undefined;
                                                return (
                                                    <TableRow
                                                        key={
                                                            li.lineItemId ??
                                                            `${idx}`
                                                        }
                                                    >
                                                        <TableCell>
                                                            {li.lineNumber ??
                                                                idx + 1}
                                                        </TableCell>
                                                        <TableCell className="max-w-xs">
                                                            <div className="font-medium">
                                                                {li.description ||
                                                                    '—'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {[
                                                                    li.catalogId !==
                                                                    undefined
                                                                        ? `Catalog: ${catalog?.name ?? `#${li.catalogId}`}`
                                                                        : null,
                                                                    catalog?.sku ??
                                                                        null,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(
                                                                        ' · '
                                                                    ) || '—'}
                                                            </div>
                                                            {(li.unitOfMeasure ||
                                                                li.deliveryLocation ||
                                                                li.incoterms) && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {[
                                                                        li.unitOfMeasure,
                                                                        li.deliveryLocation,
                                                                        li.incoterms,
                                                                    ]
                                                                        .filter(
                                                                            Boolean
                                                                        )
                                                                        .join(
                                                                            ' · '
                                                                        )}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityOrdered ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityReceived ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {li.quantityInvoiced ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Money
                                                                amount={
                                                                    li.unitPrice
                                                                }
                                                                currency={
                                                                    purchaseOrder.currency
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Money
                                                                amount={
                                                                    li.totalPrice
                                                                }
                                                                currency={
                                                                    purchaseOrder.currency
                                                                }
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }
                                        )}
                                    </TableBody>
                                </Table>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No line items.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {(purchaseOrder.sourceQuotationId || sourceQuotation) && (
                        <Card className="gap-2 p-4 md:col-span-2">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg">
                                    Source Quotation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-0">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Quotation
                                    </span>
                                    {purchaseOrder.sourceQuotationId ? (
                                        <Link
                                            href={`/retailer/quotations/${purchaseOrder.sourceQuotationId}`}
                                            className="font-mono font-medium underline underline-offset-2"
                                        >
                                            {sourceQuotation?.quotationNumber ??
                                                purchaseOrder.sourceQuotationNumber ??
                                                `#${purchaseOrder.sourceQuotationId}`}
                                        </Link>
                                    ) : (
                                        <span className="font-mono font-medium">
                                            {purchaseOrder.sourceQuotationNumber ??
                                                '—'}
                                        </span>
                                    )}
                                </div>
                                {sourceQuotation && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Status
                                            </span>
                                            <Badge variant="outline">
                                                {sourceQuotation.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Supplier
                                            </span>
                                            <span className="font-medium">
                                                {sourceQuotation.supplierOrgName ||
                                                    (sourceQuotation.supplierOrgId !==
                                                    undefined
                                                        ? `Org #${sourceQuotation.supplierOrgId}`
                                                        : '—')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Validity
                                            </span>
                                            <span className="font-medium">
                                                {sourceQuotation.validFrom
                                                    ? new Date(
                                                          sourceQuotation.validFrom
                                                      ).toLocaleDateString()
                                                    : '—'}{' '}
                                                →{' '}
                                                {sourceQuotation.validTo
                                                    ? new Date(
                                                          sourceQuotation.validTo
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Quotation Total
                                            </span>
                                            <span className="font-medium">
                                                <Money
                                                    amount={
                                                        sourceQuotation.totalAmount
                                                    }
                                                    currency={
                                                        sourceQuotation.currency
                                                    }
                                                />
                                            </span>
                                        </div>
                                        {sourceQuotation.terms && (
                                            <div className="text-sm">
                                                <p className="text-muted-foreground">
                                                    Quotation Terms
                                                </p>
                                                <p className="font-medium">
                                                    {sourceQuotation.terms}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {purchaseOrder.isBlanketOrder && (
                        <Card className="gap-2 p-4 md:col-span-2">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg">
                                    Blanket Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-0">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Start Date
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(
                                            purchaseOrder.blanketStartDate
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        End Date
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(
                                            purchaseOrder.blanketEndDate
                                        )}
                                    </span>
                                </div>
                                <div className="text-sm">
                                    <p className="text-muted-foreground">
                                        Release Schedule
                                    </p>
                                    <p className="font-medium">
                                        {purchaseOrder.releaseSchedule || '—'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
            <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Submit purchase order?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Submit purchase order{' '}
                            {purchaseOrder.purchaseOrderNumber} for approval?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmitForApproval}>
                            Submit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Send purchase order?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Send purchase order{' '}
                            {purchaseOrder.purchaseOrderNumber} to the supplier?
                            The supplier will then be able to acknowledge it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSendToSupplier}>
                            Send
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default Page;
