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
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    createGoodsReceipt,
    getGoodsReceiptSource,
} from '@/lib/services/procurement-extended-service';
import {
    getRetailerAsnByShipment,
    getRetailerPod,
    type AsnDocument,
} from '@/lib/services/counterparty-docs-service';
import {
    getShipmentById,
    getTrackingEvents,
    type Shipment,
    type TrackingEvent,
} from '@/lib/services/shipment-service';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { IconTruck, IconFileText, IconEye } from '@tabler/icons-react';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables } from '@/hooks/use-tables';

const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
    PICKUP_SCHEDULED: 'bg-amber-50 text-amber-700 border border-amber-200',
    IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    OUT_FOR_DELIVERY: 'bg-purple-50 text-purple-700 border border-purple-200',
    DELIVERED: 'bg-green-50 text-green-700 border border-green-200',
    PARTIALLY_DELIVERED: 'bg-orange-50 text-orange-700 border border-orange-200',
    EXCEPTION: 'bg-red-50 text-red-700 border border-red-200',
    CANCELLED: 'bg-slate-50 text-slate-700 border border-slate-200',
    CLOSED: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export default function RetailerShipmentDetailPage() {
    const params = useParams();
    const shipmentId = Number(params.id);
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tracking, setTracking] = useState<TrackingEvent[]>([]);
    const [asns, setAsns] = useState<AsnDocument[]>([]);
    const [asnLoading, setAsnLoading] = useState(false);
    const [openReceive, setOpenReceive] = useState(false);
    const [sourceContext, setSourceContext] = useState<Record<string, unknown> | null>(null);
    const [sourceLoading, setSourceLoading] = useState(false);
    const [receiving, setReceiving] = useState(false);
    const [pod, setPod] = useState<any>(null);
    const [podLoading, setPodLoading] = useState(false);
    const [viewAsn, setViewAsn] = useState<AsnDocument | null>(null);

    const load = async () => {
        setIsLoading(true);
        try {
            const [s, t] = await Promise.all([
                getShipmentById(shipmentId),
                getTrackingEvents(shipmentId, 0, 50).catch(() => ({ content: [] } as any)),
            ]);
            setShipment(s);
            setTracking(Array.isArray(t.content) ? t.content : (Array.isArray(t) ? t : []));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load shipment');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (Number.isFinite(shipmentId)) load();
    }, [shipmentId]);

    const loadAsns = async () => {
        setAsnLoading(true);
        try {
            const data = await getRetailerAsnByShipment(shipmentId);
            setAsns(data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'ASN lookup failed');
        } finally {
            setAsnLoading(false);
        }
    };

    const loadPod = async () => {
        setPodLoading(true);
        try {
            const p = await getRetailerPod(shipmentId);
            setPod(p ?? null);
        } catch {
            setPod(null);
        } finally {
            setPodLoading(false);
        }
    };

    const openReceiveDialog = async () => {
        if (!shipment) return;
        setSourceLoading(true);
        setSourceContext(null);
        try {
            const ctx = await getGoodsReceiptSource(shipment.shipmentId);
            setSourceContext(ctx);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load shipment source');
        } finally {
            setSourceLoading(false);
        }
        setOpenReceive(true);
    };

    const handleReceiveCreate = async () => {
        if (!shipment || !sourceContext) return;
        setReceiving(true);
        try {
            const materialId = sourceContext.materialId as number | undefined;
            const quantity = sourceContext.quantity as number | undefined;
            const supplierId = sourceContext.supplierId as number | undefined;
            if (!materialId || !quantity || !supplierId) {
                throw new Error('Shipment source is missing material/supplier/quantity');
            }
            await createGoodsReceipt({
                shipmentId: shipment.shipmentId,
                supplierId,
                receivedDate: new Date().toISOString().split('T')[0],
                deliveryNoteNumber: `DN-${shipment.shipmentNumber}`,
                notes: `Goods receipt for ${shipment.referenceType ?? 'core shipment'} ${shipment.shipmentNumber}`,
                lineItems: [
                    {
                        materialId,
                        lineNumber: 1,
                        quantityReceived: quantity,
                        unitOfMeasure: (sourceContext.unitOfMeasure as string) || undefined,
                        description: sourceContext.materialName as string | undefined,
                    },
                ],
            });
            toast.success('Goods receipt created');
            setOpenReceive(false);
            setSourceContext(null);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to create goods receipt');
        } finally {
            setReceiving(false);
        }
    };

    if (isLoading && !shipment) {
        return (
            <div className="p-6">
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    const delivered =
        shipment &&
        (shipment.status === 'DELIVERED' ||
            shipment.status === 'PARTIALLY_DELIVERED');

    const asnTable = useTables({
        data: asns,
        columns: [
            {
                id: 'asnNumber',
                header: 'ASN Number',
                accessorFn: (row) =>
                    String(row.asnNumber ?? row.asnId ?? ''),
                cell: ({ row }) => (
                    <div className="font-mono text-xs">
                        {String(
                            row.original.asnNumber ??
                                row.original.asnId ??
                                '—'
                        )}
                    </div>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                accessorFn: (row) => String(row.status ?? ''),
                cell: ({ row }) => (
                    <Badge>
                        {String(row.original.status ?? '—')}
                    </Badge>
                ),
            },
            {
                id: 'shippedOrdered',
                header: 'Shipped / Ordered',
                accessorFn: (row) => row.shippedQuantity ?? 0,
                cell: ({ row }) => (
                    <div className="text-xs whitespace-nowrap">
                        {row.original.shippedQuantity ?? 0} /
                        {row.original.orderedQuantity ?? 0}
                        {row.original.backorderedQuantity != null &&
                        row.original.backorderedQuantity > 0 ? (
                            <span className="text-muted-foreground">
                                {' '}
                                ({row.original.backorderedQuantity} backordered)
                            </span>
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'material',
                header: 'Material',
                accessorFn: (row) => String(row.materialName ?? '—'),
                cell: ({ row }) => (
                    <div className="text-xs whitespace-nowrap">
                        {String(row.original.materialName ?? '—')}
                        {row.original.unitOfMeasure ? (
                            <span className="text-muted-foreground ml-1">
                                {row.original.unitOfMeasure}
                            </span>
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewAsn(row.original)}
                    >
                        <IconEye />
                        <span className="sr-only">Details</span>
                    </Button>
                ),
            },
        ],
        enablePagination: false,
    });

    return (
        <div className="flex flex-1 flex-col p-6 gap-6 min-w-0 max-w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">
                        Shipment {shipment?.shipmentNumber ?? shipmentId}
                    </h1>
                    <p className="text-muted-foreground">
                        Core shipment detail, tracking and receiving.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => load()}>
                        Refresh
                    </Button>
                    {delivered && (
                        <Button
                            onClick={openReceiveDialog}
                            disabled={receiving || sourceLoading}
                        >
                            <IconTruck className="h-4 w-4 mr-1" /> Receive Goods
                        </Button>
                    )}
                </div>
            </div>

            {shipment && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="col-span-full md:col-span-1">
                        <CardHeader>
                            <CardTitle>Shipment</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2 text-sm">
                            <div className="grid gap-2">
                                <div>
                                    <p className="text-muted-foreground text-xs">Number</p>
                                    <p className="font-mono font-medium">
                                        {shipment.shipmentNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Type</p>
                                    <Badge variant="secondary" className="text-xs">
                                        {shipment.referenceType ?? '—'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Status</p>
                                    <Badge className={STATUS_COLOR[shipment.status] ?? 'bg-muted'}>
                                        {shipment.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Mode</p>
                                    <p className="font-medium">{shipment.mode ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Supplier</p>
                                    <p className="font-medium truncate">
                                        {shipment.supplierOrgName ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Material</p>
                                    <p className="font-medium truncate">
                                        {shipment.materialName ?? shipment.materialId ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Dispatched Qty</p>
                                    <p className="font-mono font-medium">
                                        {shipment.shippedQuantity ?? '—'}
                                        {' '}
                                        {shipment.quantityUom ?? ''}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-full md:col-span-1">
                        <CardHeader>
                            <CardTitle>Locations &amp; Timing</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2 text-sm">
                            <div className="grid gap-2">
                                <div>
                                    <p className="text-muted-foreground text-xs">Pickup</p>
                                    <p className="font-medium truncate">
                                        {shipment.pickupLocation ?? shipment.pickupAddress ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Delivery</p>
                                    <p className="font-medium truncate">
                                        {shipment.deliveryLocation ?? shipment.deliveryAddress ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Pickup Date</p>
                                    <p className="font-medium">
                                        {shipment.pickupDate ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Delivery Date</p>
                                    <p className="font-medium">
                                        {shipment.deliveryDate ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">ETA</p>
                                    <p className="font-medium">
                                        {shipment.estimatedArrival ?? shipment.deliveryDate ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Tracking</p>
                                    <p className="font-mono text-xs truncate">
                                        {shipment.trackingNumber ?? '—'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-full md:col-span-1">
                        <CardHeader>
                            <CardTitle>Received at</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2 text-sm">
                            <div className="grid gap-2">
                            </div>
                            {pod ? (
                                <div className="pt-2 border-t">
                                    <p className="text-muted-foreground text-xs">POD</p>
                                    <p className="text-sm">
                                        {pod.signatureUrl ? 'Signature captured' : 'No signature'}
                                        {pod.receivedByName ? ` — ${pod.receivedByName}` : ''}
                                    </p>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadPod}
                                    disabled={podLoading}
                                    className="w-full"
                                >
                                    {podLoading ? 'Loading...' : 'Fetch POD'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* ASNs */}
                    <Card className="col-span-full">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Advance Shipping Notices (ASN)</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadAsns}
                                disabled={asnLoading}
                            >
                                {asnLoading ? 'Loading...' : 'Refresh ASNs'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Dispatch notices linked to this shipment. Expand a row for
                                quantities, carrier and ETA.
                            </p>
                            {asnLoading && asns.length === 0 ? (
                                <div className="p-4">
                                    <Skeleton className="h-[200px] w-full" />
                                </div>
                            ) : asns.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    No ASN linked to this shipment yet.
                                </div>
                            ) : (
                                <CentralizedDataTable
                                    table={asnTable}
                                />
                                )}
                        </CardContent>
                    </Card>

                    {/* Tracking */}
                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle>Tracking Events</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-2">
                            {tracking.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    No tracking events yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tracking.slice().reverse().map((event, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-3 rounded-lg border p-3 text-sm"
                                        >
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                <IconFileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <p className="font-medium whitespace-nowrap">
                                                    {event.eventType ?? '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {event.description ?? '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {event.eventTimestamp ?? event.createdAt ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Receive goods dialog */}
            <Dialog open={openReceive} onOpenChange={(v) => !v && setOpenReceive(false)}>
                <DialogContent className="md:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Receive Goods</DialogTitle>
                        <DialogDescription>
                            Create a goods receipt for shipment{' '}
                            <span className="font-mono">{shipment?.shipmentNumber ?? ''}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {sourceLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : sourceContext ? (
                            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground">Shipment</p>
                                    <p className="font-mono font-medium">
                                        {shipment?.shipmentNumber ?? ''}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Supplier</p>
                                    <p className="font-medium">
                                        {String(sourceContext.supplierName ?? '—')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Material</p>
                                    <p className="font-medium">
                                        {String(sourceContext.materialName ?? '—')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Dispatched Qty</p>
                                    <p className="font-mono font-medium">
                                        {String(sourceContext.quantity ?? '—')}
                                        {' '}
                                        {String(sourceContext.unitOfMeasure ?? '')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">ASN</p>
                                    <p className="font-medium text-sm">
                                        {String(sourceContext.asnNumber ?? sourceContext.asnId ?? '—')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Shipment source not available — cannot create a receipt yet.
                            </p>
                        )}
                        <Button
                            onClick={handleReceiveCreate}
                            disabled={receiving || !sourceContext}
                        >
                            {receiving ? 'Creating...' : 'Create Goods Receipt'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ASN detail dialog */}
            <Dialog open={viewAsn !== null} onOpenChange={(v) => !v && setViewAsn(null)}>
                <DialogContent className="md:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            ASN {viewAsn?.asnNumber ?? viewAsn?.asnId ?? ''}
                        </DialogTitle>
                        <DialogDescription>Dispatch notice detail.</DialogDescription>
                    </DialogHeader>
                    {viewAsn && (
                        <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
                            <div>
                                <p className="text-muted-foreground">ASN Number</p>
                                <p className="font-mono font-medium">
                                    {viewAsn.asnNumber ?? viewAsn.asnId}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge>{viewAsn.status}</Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Shipment</p>
                                <p className="font-mono text-xs">
                                    {viewAsn.shipmentNumber ?? viewAsn.shipmentId ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Material</p>
                                <p className="font-medium">
                                    {viewAsn.materialName ?? '—'}
                                    {viewAsn.unitOfMeasure ? ` (${viewAsn.unitOfMeasure})` : ''}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Shipped / Ordered</p>
                                <p className="font-mono text-xs">
                                    {viewAsn.shippedQuantity ?? 0} /
                                    {viewAsn.orderedQuantity ?? 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Carrier</p>
                                <p className="font-medium">
                                    {viewAsn.carrierName ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Tracking</p>
                                <p className="font-mono text-xs">
                                    {viewAsn.trackingNumber ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">ETA</p>
                                <p className="font-medium">
                                    {viewAsn.estimatedArrival ?? '—'}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
