'use client';

import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShipmentMap from '@/components/shipment-map';
import PartialShipmentDialog from '@/components/supplier-handover-dialog';
import type { ShipmentEta } from '@/types/logistics-ops';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PaginatedResponse } from '@/types/paginated-response';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { IconDotsVertical, IconEye, IconMapPin } from '@tabler/icons-react';
import { useToast } from '@/hooks/use-toast';
import { useTables } from '@/hooks/use-tables';
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

/** Shipment/consignment addresses are sometimes stored URL-encoded. */
function decodeAddress(value?: string | null): string {
    const text = (value ?? '').trim();
    if (!text) return '';
    try {
        return decodeURIComponent(text);
    } catch {
        return text;
    }
}

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
    const fullPickup = decodeAddress(pickup) || '—';
    const fullDelivery = decodeAddress(delivery) || '—';
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

export default function SupplierShipmentsPage() {
    const { toast } = useToast();
    const [shipments, setShipments] = useState<SupplierShipment[]>([]);
    const [coreShipments, setCoreShipments] = useState<SupplierShipment[]>([]);
    const [totalShipments, setTotalShipments] = useState(0);
    const [coreTotal, setCoreTotal] = useState(0);
    const [corePageCount, setCorePageCount] = useState(1);
    const [coreLoading, setCoreLoading] = useState(true);
    const [corePagination, setCorePagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [handoverShipment, setHandoverShipment] =
        useState<SupplierShipment | null>(null);
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

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const ships = await getSupplierShipments({ page: 0, size: 100 });
            setShipments(ships.content ?? []);
            setTotalShipments(ships.totalElements ?? 0);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const loadCoreShipments = useCallback(async () => {
        setCoreLoading(true);
        try {
            const res = await apiClient.get<
                PaginatedResponse<SupplierShipment> | SupplierShipment[]
            >(
                `/iam/core/supplier/core-shipments?page=${corePagination.pageIndex}&size=${corePagination.pageSize}`
            );
            const d = res.data;
            const raw = Array.isArray(d) ? d : (d.content ?? []);
            // Defensive filter: the table must only ever show core shipments,
            // even if an older backend returns the full supplier-org list.
            const list = raw.filter(
                (s) =>
                    s.referenceType === 'CONSIGNMENT_FILL' ||
                    s.referenceType === 'VMI_REPLENISHMENT'
            );
            setCoreShipments(list);
            if (Array.isArray(d)) {
                setCoreTotal(list.length);
                setCorePageCount(1);
            } else {
                setCoreTotal(d.totalElements ?? list.length);
                setCorePageCount(Math.max(1, d.totalPages ?? 1));
            }
        } catch {
            setCoreShipments([]);
            setCoreTotal(0);
            setCorePageCount(1);
        } finally {
            setCoreLoading(false);
        }
    }, [corePagination.pageIndex, corePagination.pageSize]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        loadCoreShipments();
    }, [loadCoreShipments]);

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

    const renderExpectedDelivery = (s: SupplierShipment) => {
        const when =
            s.scheduledDeliveryDate || s.estimatedArrival || s.deliveryDate;
        return when ? new Date(when as string).toLocaleString() : '—';
    };

    const shipmentColumns: ColumnDef<SupplierShipment>[] = [
        {
            id: 'shipmentNumber',
            accessorFn: (row) =>
                row.shipmentNumber ?? String(row.shipmentId ?? ''),
            header: 'Shipment #',
            cell: ({ row }) => (
                <div className="font-mono text-sm">
                    {row.original.shipmentNumber ?? row.original.shipmentId}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <Badge>{row.original.status ?? '—'}</Badge>,
        },
        {
            id: 'po',
            accessorFn: (row) => row.purchaseOrder?.poNumber ?? '',
            header: 'PO',
            cell: ({ row }) => row.original.purchaseOrder?.poNumber ?? '—',
        },
        {
            accessorKey: 'backorderedQuantity',
            header: 'Backordered',
            cell: ({ row }) => {
                const qty = row.original.backorderedQuantity;
                return qty !== undefined && qty !== null && qty > 0 ? (
                    <Badge variant="secondary">{qty} pending</Badge>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Full qty
                    </span>
                );
            },
        },
        {
            id: 'expectedDelivery',
            accessorFn: (row) =>
                row.scheduledDeliveryDate ||
                row.estimatedArrival ||
                row.deliveryDate ||
                '',
            header: 'Expected Delivery',
            cell: ({ row }) => (
                <div className="text-xs whitespace-nowrap">
                    {renderExpectedDelivery(row.original)}
                </div>
            ),
        },
        {
            id: 'tracking',
            accessorFn: (row) =>
                row.carrierTrackingNumber || row.trackingNumber || '',
            header: 'Tracking',
            cell: ({ row }) => (
                <div className="font-mono text-xs">
                    {row.original.carrierTrackingNumber ||
                        row.original.trackingNumber ||
                        '—'}
                </div>
            ),
        },
        {
            id: 'addresses',
            header: 'Pickup → Delivery',
            cell: ({ row }) => (
                <AddressCell
                    pickup={
                        row.original.pickupAddress ||
                        row.original.pickupLocation
                    }
                    delivery={
                        row.original.deliveryAddress ||
                        row.original.deliveryLocation
                    }
                />
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        >
                            <IconDotsVertical />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                            onClick={() => setViewing(row.original)}
                        >
                            <IconEye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => openTracking(row.original)}
                        >
                            <IconMapPin className="mr-2 h-4 w-4" />
                            Track
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const coreShipmentColumns: ColumnDef<SupplierShipment>[] = [
        {
            id: 'shipmentNumber',
            accessorFn: (row) =>
                row.shipmentNumber ?? String(row.shipmentId ?? ''),
            header: 'Shipment #',
            cell: ({ row }) => (
                <div className="font-mono text-sm">
                    {row.original.shipmentNumber ?? row.original.shipmentId}
                </div>
            ),
        },
        {
            id: 'referenceType',
            accessorFn: (row) =>
                row.referenceType === 'CONSIGNMENT_FILL'
                    ? 'Consignment'
                    : row.referenceType === 'VMI_REPLENISHMENT'
                      ? 'VMI'
                      : 'PO',
            header: 'Type',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.referenceType === 'CONSIGNMENT_FILL'
                        ? 'Consignment'
                        : row.original.referenceType === 'VMI_REPLENISHMENT'
                          ? 'VMI'
                          : 'PO'}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <Badge>{row.original.status ?? '—'}</Badge>,
        },
        {
            id: 'expectedDelivery',
            accessorFn: (row) =>
                row.scheduledDeliveryDate ||
                row.estimatedArrival ||
                row.deliveryDate ||
                '',
            header: 'Expected Delivery',
            cell: ({ row }) => (
                <div className="text-xs whitespace-nowrap">
                    {renderExpectedDelivery(row.original)}
                </div>
            ),
        },
        {
            id: 'tracking',
            accessorFn: (row) =>
                row.carrierTrackingNumber || row.trackingNumber || '',
            header: 'Tracking',
            cell: ({ row }) => (
                <div className="font-mono text-xs">
                    {row.original.carrierTrackingNumber ||
                        row.original.trackingNumber ||
                        '—'}
                </div>
            ),
        },
        {
            id: 'addresses',
            header: 'Pickup → Delivery',
            cell: ({ row }) => (
                <AddressCell
                    pickup={
                        row.original.pickupAddress ||
                        row.original.pickupLocation
                    }
                    delivery={
                        row.original.deliveryAddress ||
                        row.original.deliveryLocation
                    }
                />
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        >
                            <IconDotsVertical />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                            onClick={() => setViewing(row.original)}
                        >
                            <IconEye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        {row.original.status === 'DRAFT' && (
                            <DropdownMenuItem
                                onClick={() => setHandoverShipment(row.original)}
                            >
                                <IconMapPin className="mr-2 h-4 w-4" />
                                Handover
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const shipmentsTable = useTables<SupplierShipment>({
        data: shipments,
        columns: shipmentColumns,
        getRowId: (row, index) =>
            row.shipmentId !== undefined ? String(row.shipmentId) : String(index),
    });

    const coreShipmentsTable = useTables<SupplierShipment>({
        data: coreShipments,
        columns: coreShipmentColumns,
        getRowId: (row, index) =>
            row.shipmentId !== undefined ? String(row.shipmentId) : String(index),
        manualPagination: true,
        pageCount: corePageCount,
        pagination: corePagination,
        onPaginationChange: setCorePagination,
    });

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
                        Hand shipments over from an acknowledged order or a
                        prepared consignment/VMI core shipment — delivery is
                        owned by the supplier.
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
                        My Shipments ({totalShipments})
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
                        <CentralizedDataTable
                            table={shipmentsTable}
                            emptyMessage="No shipments yet — create one from an acknowledged order via Partial Ship."
                        />
                    )}
                </CardContent>
            </Card>

            <Card className="p-4 gap-2 min-w-0">
                <CardHeader className="p-0">
                    <CardTitle>
                        Core Shipments (Consignment / VMI) ({coreTotal})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 min-w-0">
                    {coreLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <CentralizedDataTable
                            table={coreShipmentsTable}
                            emptyMessage="No core shipments"
                        />
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

            <PartialShipmentDialog
                shipment={handoverShipment}
                open={handoverShipment !== null}
                onOpenChange={(v) => {
                    if (!v) setHandoverShipment(null);
                }}
                onHandedOver={() => {
                    setHandoverShipment(null);
                    load();
                    loadCoreShipments();
                }}
            />
        </div>
    );
}
