'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShipmentMap from '@/components/shipment-map';
import type { ShipmentEta } from '@/types/logistics-ops';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useToast } from '@/hooks/use-toast';
import {
    getSupplierShipments,
    getSupplierShipmentEta,
    getSupplierShipmentPosition,
    type SupplierShipment,
} from '@/lib/services/supplier-logistics-service';

// ─────────────────────────────────────────────────────────────
// Supplier-owned delivery: shipments are prepared and handed over
// to a partnered logistics org from an acknowledged order
// (Partial Ship on the orders page, DRAFT -> BOOKED). This page
// is read-only: it lists every shipment and shows the full detail
// captured at creation / handover time.
// ─────────────────────────────────────────────────────────────

const ADDRESS_PREVIEW_CHARS = 28;

function truncateMiddle(value: string, limit: number): string {
    const text = (value ?? '').trim();
    if (text.length <= limit) return text;
    return `${text.slice(0, limit).trimEnd()}…`;
}

function AddressCell({
    pickup,
    delivery,
}: {
    pickup?: string;
    delivery?: string;
}) {
    const fullPickup = (pickup ?? '').trim() || '—';
    const fullDelivery = (delivery ?? '').trim() || '—';
    const preview = `${truncateMiddle(fullPickup, ADDRESS_PREVIEW_CHARS)} → ${truncateMiddle(fullDelivery, ADDRESS_PREVIEW_CHARS)}`;
    const full = `${fullPickup} → ${fullDelivery}`;
    return (
        <span className="inline-flex max-w-56 items-center gap-1 text-xs">
            <span className="truncate">{preview}</span>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Full addresses: ${full}`}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                        <Info className="h-3.5 w-3.5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="max-w-xs whitespace-pre-wrap"
                >
                    {full}
                </TooltipContent>
            </Tooltip>
        </span>
    );
}

function fmtDateTime(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function fmtDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function fmtNum(value?: number | null): string {
    if (value === undefined || value === null) return '—';
    return String(value);
}

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="wrap-break-word text-sm font-medium whitespace-normal">
                {value ?? '—'}
            </p>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-3 rounded-md border p-3">
            <p className="text-sm font-semibold">{title}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {children}
            </div>
        </div>
    );
}

const SHIPMENTS_PAGE_SIZE = 10;

export default function SupplierShipmentsPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<SupplierShipment> | null>(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewing, setViewing] = useState<SupplierShipment | null>(null);
    const [tracking, setTracking] = useState<SupplierShipment | null>(null);
    const [eta, setEta] = useState<ShipmentEta | null>(null);

    const openTracking = (s: SupplierShipment) => {
        setTracking(s);
        setEta(null);
        getSupplierShipmentEta(s.shipmentId)
            .then((e) => setEta(e))
            .catch((e: unknown) =>
                toast({
                    title: e instanceof Error ? e.message : String(e),
                    variant: 'destructive',
                })
            );
    };

    const load = useCallback(
        async (pageNo: number = page) => {
            setLoading(true);
            try {
                const ships = await getSupplierShipments({
                    page: pageNo,
                    size: SHIPMENTS_PAGE_SIZE,
                });
                setData(ships);
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

    const shipments = data?.content ?? [];

    const ordered = viewing?.orderedQuantity;
    const backordered = viewing?.backorderedQuantity ?? 0;
    const shipped =
        ordered !== undefined && ordered !== null
            ? Math.max(0, ordered - backordered)
            : undefined;
    const dims =
        viewing?.packageLength !== undefined ||
        viewing?.packageWidth !== undefined ||
        viewing?.packageHeight !== undefined
            ? `${viewing?.packageLength ?? '—'} × ${viewing?.packageWidth ?? '—'} × ${viewing?.packageHeight ?? '—'} ${viewing?.packageDimensionUom ?? ''}`.trim()
            : undefined;

    return (
        <div className="p-4 lg:p-6 space-y-4 min-w-0 max-w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold">
                        Delivery Shipments
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Every shipment prepared from your orders with the full
                        detail captured at partial-ship and handover time.{' '}
                        <br />
                        Hand shipments over from an acknowledged order —
                        delivery is owned by the supplier.
                    </p>
                </div>
                <Button variant="outline" asChild className="shrink-0">
                    <Link href="/supplier/partnership/logistics-market">
                        Logistics Marketplace
                    </Link>
                </Button>
            </div>

            <Card className="p-4 gap-2 min-w-0">
                <CardHeader className="p-0">
                    <CardTitle>
                        My Shipments ({data?.totalElements ?? 0})
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
                                        <TableHead>Shipment #</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>PO</TableHead>
                                        <TableHead>Backordered</TableHead>
                                        <TableHead>Expected Delivery</TableHead>
                                        <TableHead>Tracking</TableHead>
                                        <TableHead>Pickup → Delivery</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shipments.map((s) => (
                                        <TableRow key={s.shipmentId}>
                                            <TableCell className="font-mono">
                                                {s.shipmentNumber ??
                                                    s.shipmentId}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{s.status ?? '—'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {(
                                                    s.purchaseOrder as
                                                        | { poNumber?: string }
                                                        | undefined
                                                )?.poNumber ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {s.backorderedQuantity !==
                                                    undefined &&
                                                s.backorderedQuantity !==
                                                    null &&
                                                s.backorderedQuantity > 0 ? (
                                                    <Badge variant="secondary">
                                                        {s.backorderedQuantity}{' '}
                                                        pending
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Full qty
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-xs">
                                                {s.estimatedArrival
                                                    ? new Date(
                                                          s.estimatedArrival
                                                      ).toLocaleString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {s.trackingNumber ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <AddressCell
                                                    pickup={s.pickupLocation}
                                                    delivery={
                                                        s.deliveryLocation
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setViewing(s)
                                                        }
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="Live tracking"
                                                        onClick={() =>
                                                            openTracking(s)
                                                        }
                                                    >
                                                        <MapPin className="mr-1 h-3 w-3" />
                                                        Track
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!shipments.length && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No shipments yet — create one
                                                from an acknowledged order via
                                                Partial Ship.
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
                                {data?.totalElements ?? 0} shipment(s)
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
                open={viewing !== null}
                onOpenChange={(v) => !v && setViewing(null)}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Shipment{' '}
                            {viewing?.shipmentNumber ??
                                viewing?.shipmentId ??
                                ''}
                        </DialogTitle>
                        <DialogDescription>
                            Full detail captured at partial-ship and handover
                            time.
                        </DialogDescription>
                    </DialogHeader>
                    {viewing && (
                        <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
                            <Section title="Shipment">
                                <Detail label="Status" value={viewing.status} />
                                <Detail
                                    label="Tracking number"
                                    value={
                                        viewing.trackingNumber ? (
                                            <span className="font-mono break-all">
                                                {viewing.trackingNumber}
                                            </span>
                                        ) : undefined
                                    }
                                />
                                <Detail
                                    label="Carrier"
                                    value={viewing.carrierName}
                                />
                                <Detail
                                    label="Carrier reference"
                                    value={viewing.carrierReference}
                                />
                                <Detail
                                    label="Shipment mode"
                                    value={viewing.shipmentMode}
                                />
                                <Detail
                                    label="Incoterms"
                                    value={viewing.incoterms}
                                />
                                <Detail
                                    label="Partial shipment"
                                    value={
                                        viewing.isPartialShipment === undefined
                                            ? undefined
                                            : viewing.isPartialShipment
                                              ? 'Yes'
                                              : 'No'
                                    }
                                />
                            </Section>

                            <Section title="Order & handover">
                                <Detail
                                    label="Purchase order"
                                    value={viewing.purchaseOrder?.poNumber}
                                />
                                <Detail
                                    label="Ordered qty"
                                    value={fmtNum(ordered)}
                                />
                                <Detail
                                    label="Shipped qty"
                                    value={fmtNum(shipped)}
                                />
                                <Detail
                                    label="Backordered qty"
                                    value={fmtNum(viewing.backorderedQuantity)}
                                />
                                <Detail
                                    label="Logistics partner"
                                    value={viewing.logisticsOrg?.name}
                                />
                                <Detail
                                    label="Partnership ID"
                                    value={
                                        viewing.partnership?.partnershipId !==
                                        undefined
                                            ? String(
                                                  viewing.partnership
                                                      .partnershipId
                                              )
                                            : undefined
                                    }
                                />
                            </Section>

                            <Section title="Packages">
                                <Detail
                                    label="Total packages"
                                    value={fmtNum(viewing.totalPackages)}
                                />
                                <Detail
                                    label="Weight each (kg)"
                                    value={fmtNum(viewing.packageWeight)}
                                />
                                <Detail
                                    label="Dimensions (L × W × H)"
                                    value={dims}
                                />
                                <Detail
                                    label="Dimension unit"
                                    value={viewing.packageDimensionUom}
                                />
                                <Detail
                                    label="Total weight (kg)"
                                    value={fmtNum(viewing.totalWeight)}
                                />
                                <Detail
                                    label="Total volume (CBM)"
                                    value={fmtNum(viewing.totalVolume)}
                                />
                            </Section>

                            <Section title="Route">
                                <Detail
                                    label="Pickup location"
                                    value={viewing.pickupLocation}
                                />
                                <Detail
                                    label="Pickup date"
                                    value={fmtDate(viewing.pickupDate)}
                                />
                                <Detail
                                    label="Delivery location"
                                    value={viewing.deliveryLocation}
                                />
                                <Detail
                                    label="Delivery date"
                                    value={fmtDate(viewing.deliveryDate)}
                                />
                            </Section>

                            <Section title="Schedule">
                                <Detail
                                    label="Estimated departure"
                                    value={fmtDateTime(
                                        viewing.estimatedDeparture
                                    )}
                                />
                                <Detail
                                    label="Actual departure"
                                    value={fmtDateTime(viewing.actualDeparture)}
                                />
                                <Detail
                                    label="Estimated arrival"
                                    value={fmtDateTime(
                                        viewing.estimatedArrival
                                    )}
                                />
                                <Detail
                                    label="Actual arrival"
                                    value={fmtDateTime(viewing.actualArrival)}
                                />
                                <Detail
                                    label="Created"
                                    value={fmtDateTime(viewing.createdAt)}
                                />
                                <Detail
                                    label="Last updated"
                                    value={fmtDateTime(viewing.updatedAt)}
                                />
                            </Section>

                            <Section title="Freight & notes">
                                <Detail
                                    label="Freight cost"
                                    value={
                                        viewing.freightCost !== undefined &&
                                        viewing.freightCost !== null
                                            ? `${viewing.freightCost} ${viewing.currency ?? ''}`.trim()
                                            : undefined
                                    }
                                />
                                <Detail
                                    label="Actual freight cost"
                                    value={
                                        viewing.actualFreightCost !==
                                            undefined &&
                                        viewing.actualFreightCost !== null
                                            ? `${viewing.actualFreightCost} ${viewing.currency ?? ''}`.trim()
                                            : undefined
                                    }
                                />
                                <Detail
                                    label="Freight terms"
                                    value={viewing.freightTerms}
                                />
                                {viewing.laneCost && (
                                    <>
                                        <Detail
                                            label="Lane rate"
                                            value={
                                                viewing.laneCost.unitPrice !==
                                                    undefined &&
                                                viewing.laneCost.unitPrice !==
                                                    null
                                                    ? `${viewing.laneCost.unitPrice} ${viewing.laneCost.currency ?? ''} per ${viewing.laneCost.capacityUnit ?? 'unit'}`.trim()
                                                    : undefined
                                            }
                                        />
                                        <Detail
                                            label="Lane"
                                            value={
                                                viewing.laneCost.originLane ||
                                                viewing.laneCost.destinationLane
                                                    ? `${viewing.laneCost.originLane ?? '—'} → ${viewing.laneCost.destinationLane ?? '—'}`
                                                    : undefined
                                            }
                                        />
                                        <Detail
                                            label="Fuel surcharge"
                                            value={
                                                viewing.laneCost
                                                    .fuelSurcharge !==
                                                    undefined &&
                                                viewing.laneCost
                                                    .fuelSurcharge !== null
                                                    ? `${viewing.laneCost.fuelSurcharge} ${viewing.laneCost.currency ?? ''}`.trim()
                                                    : undefined
                                            }
                                        />
                                        <Detail
                                            label="Driver fees"
                                            value={
                                                viewing.laneCost.driverFees !==
                                                    undefined &&
                                                viewing.laneCost.driverFees !==
                                                    null
                                                    ? `${viewing.laneCost.driverFees} ${viewing.laneCost.currency ?? ''}`.trim()
                                                    : undefined
                                            }
                                        />
                                        <Detail
                                            label="Misc charges"
                                            value={
                                                viewing.laneCost.miscPrice !==
                                                    undefined &&
                                                viewing.laneCost.miscPrice !==
                                                    null
                                                    ? `${viewing.laneCost.miscPrice} ${viewing.laneCost.currency ?? ''}`.trim()
                                                    : undefined
                                            }
                                        />
                                    </>
                                )}
                                <Detail label="Notes" value={viewing.notes} />
                            </Section>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={tracking !== null}
                onOpenChange={(v) => {
                    if (!v) {
                        setTracking(null);
                        setEta(null);
                    }
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Live Tracking —{' '}
                            {tracking?.shipmentNumber ??
                                (tracking ? `#${tracking.shipmentId}` : '')}
                        </DialogTitle>
                        <DialogDescription>
                            Simulated GPS, same feed as the logistics load
                            board.
                        </DialogDescription>
                    </DialogHeader>
                    {tracking && (
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            eta?.delayed
                                                ? 'destructive'
                                                : 'secondary'
                                        }
                                    >
                                        {eta?.status ?? tracking.status ?? '…'}
                                    </Badge>
                                    {eta?.delayed && (
                                        <span className="text-xs text-muted-foreground">
                                            delayed
                                        </span>
                                    )}
                                </div>
                                <span className="font-medium">
                                    ETA:{' '}
                                    {eta?.estimatedArrival
                                        ? new Date(
                                              eta.estimatedArrival
                                          ).toLocaleString()
                                        : tracking.estimatedArrival
                                          ? new Date(
                                                tracking.estimatedArrival
                                            ).toLocaleString()
                                          : '—'}
                                </span>
                            </div>
                            <ShipmentMap
                                key={tracking.shipmentId}
                                shipmentId={tracking.shipmentId}
                                fetchPosition={getSupplierShipmentPosition}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
