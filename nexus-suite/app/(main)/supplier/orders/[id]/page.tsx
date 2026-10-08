'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    acknowledgeOrder,
    getSupplierOrderById,
} from '@/lib/services/supplier-orders-service';
import PartialShipmentDialog from '@/components/supplier-handover-dialog';
import {
    getSupplierAsnByPo,
    getSupplierPod,
} from '@/lib/services/counterparty-docs-service';
import { getSupplierCatalogs } from '@/lib/services/supplier-catalog-service';
import PodSection from '@/components/pod-section';
import { useToast } from '@/hooks/use-toast';
import type { SupplierOrder, SupplierCatalog } from '@/types/supplier';

/** Raw ISO timestamps from the API -> locale date, with safe fallbacks. */
const formatDate = (value?: string | null): string => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

export default function SupplierOrderDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const numericId = Number(id);
    const { toast } = useToast();

    const [order, setOrder] = useState<SupplierOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [partialOpen, setPartialOpen] = useState(false);
    const [podOpen, setPodOpen] = useState(false);
    const [shipmentId, setShipmentId] = useState<number | null>(null);
    const [shipmentNumber, setShipmentNumber] = useState<string | null>(null);
    const [catalogById, setCatalogById] = useState<
        Record<number, SupplierCatalog>
    >({});

    // Best-effort enrichment: own-catalog names for the lines + the latest
    // ASN/shipment refs for the POD viewer. Never blocks rendering.
    const enrichDetails = useCallback(
        async (o: SupplierOrder, isActive: () => boolean) => {
            try {
                const catalogs = await getSupplierCatalogs({
                    page: 0,
                    size: 100,
                });
                if (!isActive()) return;
                const map: Record<number, SupplierCatalog> = {};
                for (const c of catalogs.content ?? []) {
                    map[c.catalogId] = c;
                }
                setCatalogById(map);
            } catch {
                // catalog extras are best-effort; lines still render
            }
            try {
                const asns = await getSupplierAsnByPo(o.purchaseOrderId);
                if (!isActive()) return;
                const withShipment = asns.find(
                    (a) => a.shipmentId !== undefined
                );
                if (withShipment?.shipmentId !== undefined) {
                    setShipmentId(withShipment.shipmentId);
                    setShipmentNumber(
                        withShipment.shipmentNumber ??
                            withShipment.asnNumber ??
                            null
                    );
                }
            } catch {
                // ASN/POD info is best-effort
            }
        },
        []
    );

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            if (!Number.isFinite(numericId)) {
                setLoadError('Invalid order id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getSupplierOrderById(numericId);
                if (!active) return;
                setOrder(data);
                void enrichDetails(data, () => active);
            } catch (e) {
                if (!active) return;
                setLoadError(
                    e instanceof Error ? e.message : 'Failed to load order'
                );
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [id, numericId, enrichDetails]);

    const reload = async () => {
        if (!Number.isFinite(numericId)) return;
        try {
            const data = await getSupplierOrderById(numericId);
            setOrder(data);
        } catch (e) {
            toast({
                title: e instanceof Error ? e.message : 'Reload failed',
                variant: 'destructive',
            });
        }
    };

    const handleAcknowledge = async () => {
        if (!order || actionBusy) return;
        setActionBusy(true);
        try {
            await acknowledgeOrder(
                order.purchaseOrderId,
                undefined,
                'Acknowledged via portal'
            );
            toast({ title: 'Acknowledged', variant: 'success' });
            await reload();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setActionBusy(false);
        }
    };

    const handlePartialCreated = (
        res: import('@/types/supplier').PartialShipmentResponse
    ) => {
        setShipmentId(res.shipmentId);
        setShipmentNumber(res.shipmentNumber);
        void reload();
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (loadError || !order) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
                <p className="text-muted-foreground">
                    {loadError ?? 'Order not found'}
                </p>
                <Button variant="outline" asChild>
                    <Link href="/supplier/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Link>
                </Button>
            </div>
        );
    }

    const buyerName =
        order.buyerOrgName ||
        order.buyerOrg?.name ||
        (order.buyerOrgId !== undefined
            ? `Org #${order.buyerOrgId}`
            : '—');

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:gap-6 md:p-6">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/supplier/orders"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold">
                                        {order.poNumber}
                                    </h2>
                                    <Badge variant="outline">
                                        {order.status}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Buyer: {buyerName}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            {order.status === 'SENT_TO_SUPPLIER' && (
                                <Button
                                    size="sm"
                                    disabled={actionBusy}
                                    onClick={handleAcknowledge}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    {actionBusy
                                        ? 'Acknowledging…'
                                        : 'Acknowledge'}
                                </Button>
                            )}
                            {(order.status === 'ACKNOWLEDGED' ||
                                order.status === 'PARTIALLY_RECEIVED') && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPartialOpen(true)}
                                    >
                                        <Truck className="mr-2 h-4 w-4" />
                                        Partial Ship
                                    </Button>
                                    <PartialShipmentDialog
                                        order={order}
                                        open={partialOpen}
                                        onOpenChange={setPartialOpen}
                                        onCreated={handlePartialCreated}
                                    />
                                </>
                            )}
                            {shipmentId !== null && (
                                <Dialog
                                    open={podOpen}
                                    onOpenChange={setPodOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            POD
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Proof of Delivery ·{' '}
                                                {shipmentNumber ?? '—'}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <PodSection
                                            fetchPod={() =>
                                                getSupplierPod(shipmentId)
                                            }
                                        />
                                    </DialogContent>
                                </Dialog>
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
                                        Buyer
                                    </span>
                                    <span className="font-medium">
                                        {buyerName}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Order Date
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(
                                            order.orderDate ?? order.createdAt
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Requested Delivery
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(
                                            order.requestedDeliveryDate
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Expected Delivery
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(
                                            order.expectedDeliveryDate
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Confirmed Delivery
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(
                                            order.confirmedDeliveryDate
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Payment Terms
                                    </span>
                                    <span className="font-medium">
                                        {order.paymentTerms || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Incoterms
                                    </span>
                                    <span className="font-medium">
                                        {order.incoterms || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Currency
                                    </span>
                                    <span className="font-medium">
                                        {order.currency || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Amount
                                    </span>
                                    <span className="font-medium">
                                        <Money
                                            amount={order.totalAmount}
                                            currency={order.currency}
                                        />
                                    </span>
                                </div>
                                {order.acknowledgedBy && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Acknowledged By
                                        </span>
                                        <span className="font-medium">
                                            {order.acknowledgedBy}
                                            {order.acknowledgedAt
                                                ? ` on ${formatDate(order.acknowledgedAt)}`
                                                : ''}
                                        </span>
                                    </div>
                                )}
                                {(order.revisionNumber ?? 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Revision
                                        </span>
                                        <span className="font-medium">
                                            Rev {order.revisionNumber}
                                            {order.parentPoId
                                                ? ` of PO #${order.parentPoId}`
                                                : ''}
                                        </span>
                                    </div>
                                )}
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
                                    <p className="text-muted-foreground">
                                        Buyer Notes
                                    </p>
                                    <p className="font-medium">
                                        {order.notes || '—'}
                                    </p>
                                </div>
                                <div className="text-sm">
                                    <p className="text-muted-foreground">
                                        Supplier Notes
                                    </p>
                                    <p className="font-medium">
                                        {order.supplierNotes || '—'}
                                    </p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Created
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>
                                {order.updatedAt && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Updated
                                        </span>
                                        <span className="font-medium">
                                            {formatDate(order.updatedAt)}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="gap-2 p-4 md:col-span-2">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg">
                                    Addresses
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-0">
                                <div className="text-sm">
                                    <p className="text-muted-foreground">
                                        Shipping Address
                                    </p>
                                    <p className="font-medium">
                                        {order.shippingAddress || '—'}
                                    </p>
                                </div>
                                <div className="text-sm">
                                    <p className="text-muted-foreground">
                                        Billing Address
                                    </p>
                                    <p className="font-medium">
                                        {order.billingAddress || '—'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="gap-2 p-4 md:col-span-2">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg">
                                    Requested Materials (
                                    {order.lineItems?.length ?? 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {order.lineItems?.length ? (
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
                                                {order.lineItems.map(
                                                    (li, idx) => {
                                                        const catalog =
                                                            li.catalogId !==
                                                            undefined
                                                                ? catalogById[
                                                                      li
                                                                          .catalogId
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
                                                                        idx +
                                                                            1}
                                                                </TableCell>
                                                                <TableCell className="max-w-xs">
                                                                    <div className="font-medium">
                                                                        {li.description ||
                                                                            catalog?.name ||
                                                                            '—'}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {[
                                                                            catalog
                                                                                ?.sku ??
                                                                                null,
                                                                            catalog?.unitOfMeasure ??
                                                                                li.unitOfMeasure ??
                                                                                null,
                                                                            catalog?.category ??
                                                                                null,
                                                                            li.deliveryLocation ??
                                                                                null,
                                                                            li.incoterms ??
                                                                                null,
                                                                        ]
                                                                            .filter(
                                                                                Boolean
                                                                            )
                                                                            .join(
                                                                                ' · '
                                                                            ) || '—'}
                                                                    </div>
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
                                                                            order.currency
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Money
                                                                        amount={
                                                                            li.totalPrice
                                                                        }
                                                                        currency={
                                                                            order.currency
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

                        {order.sourceQuotationId && (
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
                                        <Link
                                            href={`/supplier/quotations/${order.sourceQuotationId}`}
                                            className="font-mono font-medium underline underline-offset-2"
                                        >
                                            {order.sourceQuotationNumber ??
                                                `#${order.sourceQuotationId}`}
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {order.isBlanketOrder && (
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
                                                order.blanketStartDate
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            End Date
                                        </span>
                                        <span className="font-medium">
                                            {formatDate(order.blanketEndDate)}
                                        </span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-muted-foreground">
                                            Release Schedule
                                        </p>
                                        <p className="font-medium">
                                            {order.releaseSchedule || '—'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
