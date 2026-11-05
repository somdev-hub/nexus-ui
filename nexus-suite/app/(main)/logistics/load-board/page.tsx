'use client';
import { useEffect, useState } from 'react';
import { Eye, ExternalLink, Map as MapIcon, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
    Driver,
    FleetAsset,
    LoadBoardShipment,
    ShipmentEta,
} from '@/types/logistics-ops';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    getLoadBoard,
    getPickedUpLoads,
    getDeliveredLoads,
    assignBooking,
    getDrivers,
    getFleetAssets,
    getShipmentEta,
} from '@/lib/services/logistics-ops-service';
import {
    getShipmentStops,
    getTrackingEvents,
    getShipmentDocuments,
    type ShipmentStop,
    type TrackingEvent,
    type ShipmentDocument,
} from '@/lib/services/shipment-service';
import ShipmentMap from '@/components/shipment-map';
import { useToast } from '@/hooks/use-toast';
import { LoadingButton } from '@/components/ui/loading-button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { DEFAULT_TABLE_PAGE_SIZE, useTables } from '@/hooks/use-tables';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical } from '@tabler/icons-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LoadBoardPage() {
    const { toast } = useToast();
    const [loads, setLoads] =
        useState<PaginatedResponse<LoadBoardShipment> | null>(null);
    const [pickedUp, setPickedUp] =
        useState<PaginatedResponse<LoadBoardShipment> | null>(null);
    const [delivered, setDelivered] =
        useState<PaginatedResponse<LoadBoardShipment> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [mode, setMode] = useState('all');
    const PAGE_SIZE = 100;
    const [busy, setBusy] = useState<string | null>(null);
    const withBusy = async (key: string, fn: () => Promise<unknown>) => {
        if (busy) return;
        setBusy(key);
        try {
            await fn();
        } finally {
            setBusy(null);
        }
    };
    const [details, setDetails] = useState<LoadBoardShipment | null>(null);
    const [detailStops, setDetailStops] = useState<ShipmentStop[]>([]);
    const [detailTracking, setDetailTracking] = useState<TrackingEvent[]>([]);
    const [detailDocs, setDetailDocs] = useState<ShipmentDocument[]>([]);
    // Trackers live on the Picked Up tab (admin surface).
    const [eta, setEta] = useState<ShipmentEta | null>(null);
    const [etaOpen, setEtaOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [mapShipmentId, setMapShipmentId] = useState<number | null>(null);

    const handleEta = async (id: number) => {
        try {
            setEta(await getShipmentEta(id));
            setEtaOpen(true);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    // Assign asset + driver straight from the board.
    const [assigning, setAssigning] = useState<LoadBoardShipment | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [assets, setAssets] = useState<FleetAsset[]>([]);
    const [assignDriverId, setAssignDriverId] = useState('');
    const [assignAssetId, setAssignAssetId] = useState('');
    const [assignBolDocId, setAssignBolDocId] = useState('');
    const [assignStartPickup, setAssignStartPickup] = useState(false);

    const openAssign = (s: LoadBoardShipment) => {
        setAssigning(s);
        setAssignDriverId('');
        setAssignAssetId('');
        setAssignBolDocId('');
        setAssignStartPickup(false);
        getDrivers({ page: 0, size: 100 })
            .then((res) =>
                setDrivers(
                    (res.content ?? []).filter((d) => d.status === 'AVAILABLE')
                )
            )
            .catch(() => setDrivers([]));
        getFleetAssets({ page: 0, size: 100 })
            .then((res) =>
                setAssets(
                    (res.content ?? []).filter((a) => a.status === 'AVAILABLE')
                )
            )
            .catch(() => setAssets([]));
    };

    const submitAssign = async () => {
        if (!assigning) return;
        if (!assignDriverId || !assignAssetId) {
            toast({
                title: 'Select both a driver and an asset',
                variant: 'destructive',
            });
            return;
        }
        try {
            await withBusy(`assign-${assigning.shipmentId}`, () =>
                assignBooking(assigning.shipmentId, {
                    driverId: Number(assignDriverId),
                    assetId: Number(assignAssetId),
                    bolDocumentId: assignBolDocId || undefined,
                    startPickup: assignStartPickup || undefined,
                })
            );
            toast({
                title: assignStartPickup
                    ? `Shipment ${assigning.shipmentNumber ?? ''} assigned — pickup started, ETA computed`
                    : `Shipment ${assigning.shipmentNumber ?? ''} assigned — ready for pickup`,
                variant: 'success',
            });
            setAssigning(null);
            setDetails(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    // Which tab opened the details dialog — the Assign action only
    // makes sense for unassigned available loads.
    const [detailsSource, setDetailsSource] = useState<
        'loads' | 'picked-up' | 'delivered'
    >('loads');
    const openDetails = (
        s: LoadBoardShipment,
        source: 'loads' | 'picked-up' | 'delivered' = 'loads'
    ) => {
        setDetailsSource(source);
        setDetails(s);
        setDetailStops([]);
        setDetailTracking([]);
        setDetailDocs([]);
        getShipmentStops(s.shipmentId)
            .then((list) => setDetailStops(list ?? []))
            .catch(() => {});
        getTrackingEvents(s.shipmentId)
            .then((res) => setDetailTracking(res.content ?? []))
            .catch(() => {});
        getShipmentDocuments(s.shipmentId)
            .then((list) => setDetailDocs(list ?? []))
            .catch(() => {});
    };

    const shortDate = (iso?: string | null): string => {
        if (!iso) return '—';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString();
    };

    const routeText = (s: LoadBoardShipment): string => {
        const from = (s.pickupLocation ?? s.pickupAddress ?? '').trim() || '—';
        const to =
            (s.deliveryLocation ?? s.deliveryAddress ?? '').trim() || '—';
        return `${from} → ${to}`;
    };

    const load = async () => {
        setLoading(true);
        try {
            const [l, p, d] = await Promise.all([
                getLoadBoard({
                    page: 0,
                    size: PAGE_SIZE,
                    search: search || undefined,
                    mode: mode === 'all' ? undefined : mode,
                }),
                getPickedUpLoads({ page: 0, size: PAGE_SIZE }),
                getDeliveredLoads({ page: 0, size: PAGE_SIZE }),
            ]);
            setLoads(l);
            setPickedUp(p);
            setDelivered(d);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);
    useEffect(() => {
        const t = setTimeout(() => {
            void load();
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const loadsColumns: ColumnDef<LoadBoardShipment>[] = [
        {
            id: 'shipment',
            header: 'Shipment',
            accessorFn: (row) => row.shipmentNumber ?? `#${row.shipmentId}`,
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div>
                        <div className="font-medium font-mono text-xs">
                            {s.shipmentNumber ?? `#${s.shipmentId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {s.poNumber || 'No PO'}
                            {s.isPartialShipment ? ' · Partial' : ''}
                        </div>
                        {s.backorderedQuantity !== undefined &&
                            s.backorderedQuantity !== null &&
                            s.backorderedQuantity > 0 && (
                                <div className="text-xs text-muted-foreground">
                                    Backordered: {s.backorderedQuantity}
                                </div>
                            )}
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            id: 'status',
            header: 'Status',
            accessorFn: (row) => row.status ?? '',
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original.status ?? '—'}
                </Badge>
            ),
        },
        {
            id: 'mode',
            header: 'Mode',
            accessorFn: (row) =>
                row.routeMode ?? row.shipmentMode ?? row.mode ?? '',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.routeMode ??
                        row.original.shipmentMode ??
                        row.original.mode ??
                        '—'}
                </Badge>
            ),
        },
        {
            id: 'route',
            header: 'Route',
            accessorFn: (row) => routeText(row),
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <span className="inline-flex max-w-48 items-center gap-1">
                        <span className="truncate">{routeText(s)}</span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    aria-label={`Full route: ${routeText(s)}`}
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    <Info className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="max-w-xs whitespace-pre-wrap"
                            >
                                {routeText(s)}
                            </TooltipContent>
                        </Tooltip>
                    </span>
                );
            },
        },
        {
            id: 'dates',
            header: 'Dates',
            accessorFn: (row) => row.pickupDate ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="whitespace-nowrap text-xs">
                        <div>P: {shortDate(s.pickupDate)}</div>
                        <div>
                            D:{' '}
                            {shortDate(s.deliveryDate ?? s.estimatedArrival)}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'load',
            header: 'Load',
            accessorFn: (row) => row.totalWeight ?? 0,
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="whitespace-nowrap text-xs">
                        <div>{s.totalWeight ?? '—'} kg</div>
                        <div className="text-muted-foreground">
                            {s.totalVolume ?? '—'} m³ ·{' '}
                            {s.totalPackages ?? '—'} pkgs
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'freight',
            header: 'Freight',
            accessorFn: (row) => row.freightCost ?? 0,
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="whitespace-nowrap text-xs">
                        {s.freightCost !== undefined &&
                        s.freightCost !== null ? (
                            <>
                                {s.freightCost} {s.currency ?? 'USD'}
                                {s.freightTerms
                                    ? ` · ${s.freightTerms}`
                                    : ''}
                            </>
                        ) : (
                            '—'
                        )}
                    </div>
                );
            },
        },
        {
            id: 'parties',
            header: 'Parties',
            accessorFn: (row) => row.supplierOrgName ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="text-xs">
                        <div className="max-w-40 truncate">
                            {s.supplierOrgName ?? '—'} →{' '}
                            {s.retailerOrgName ?? '—'}
                        </div>
                        {s.carrierName && (
                            <div className="text-muted-foreground">
                                via {s.carrierName}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const s = row.original;
                return (
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
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                                onClick={() => openDetails(s, 'loads')}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAssign(s)}>
                                <Truck className="mr-2 h-4 w-4" />
                                Assign driver & asset
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const pickedUpColumns: ColumnDef<LoadBoardShipment>[] = [
        {
            id: 'shipment',
            header: 'Shipment',
            accessorFn: (row) => row.shipmentNumber ?? `#${row.shipmentId}`,
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div>
                        <div className="font-medium font-mono text-xs">
                            {s.shipmentNumber ?? `#${s.shipmentId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {s.poNumber || 'No PO'}
                        </div>
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            id: 'status',
            header: 'Status',
            accessorFn: (row) => row.status ?? '',
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.status === 'IN_TRANSIT'
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {row.original.status ?? '—'}
                </Badge>
            ),
        },
        {
            id: 'mode',
            header: 'Mode',
            accessorFn: (row) =>
                row.routeMode ?? row.shipmentMode ?? row.mode ?? '',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.routeMode ??
                        row.original.shipmentMode ??
                        row.original.mode ??
                        '—'}
                </Badge>
            ),
        },
        {
            id: 'route',
            header: 'Route',
            accessorFn: (row) => routeText(row),
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <span className="inline-flex max-w-48 items-center gap-1">
                        <span className="truncate">{routeText(s)}</span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    aria-label={`Full route: ${routeText(s)}`}
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    <Info className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="max-w-xs whitespace-pre-wrap"
                            >
                                {routeText(s)}
                            </TooltipContent>
                        </Tooltip>
                    </span>
                );
            },
        },
        {
            id: 'pickedUp',
            header: 'Picked Up',
            accessorFn: (row) => row.actualDeparture ?? row.pickupDate ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="whitespace-nowrap text-xs">
                        {s.actualDeparture
                            ? new Date(s.actualDeparture).toLocaleString()
                            : shortDate(s.pickupDate)}
                    </div>
                );
            },
        },
        {
            id: 'eta',
            header: 'ETA',
            accessorFn: (row) => row.estimatedArrival ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="whitespace-nowrap text-xs">
                        {s.estimatedArrival
                            ? new Date(s.estimatedArrival).toLocaleString()
                            : '—'}
                    </div>
                );
            },
        },
        {
            id: 'driverAsset',
            header: 'Driver / Asset',
            accessorFn: (row) => row.carrierName ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="text-xs">
                        <div>{s.carrierName ?? '—'}</div>
                        <div className="font-mono text-muted-foreground">
                            {s.carrierReference ?? ''}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const s = row.original;
                const busyKey = `eta-${s.shipmentId}`;
                return (
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
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                                onClick={() => openDetails(s, 'picked-up')}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={busy === busyKey}
                                onClick={() =>
                                    withBusy(busyKey, () =>
                                        handleEta(s.shipmentId)
                                    )
                                }
                            >
                                <MapPin className="mr-2 h-4 w-4" />
                                {busy === busyKey ? 'Loading…' : 'ETA'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setMapShipmentId(s.shipmentId);
                                    setMapOpen(true);
                                }}
                            >
                                <MapIcon className="mr-2 h-4 w-4" />
                                Live map
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const deliveredColumns: ColumnDef<LoadBoardShipment>[] = [
        {
            id: 'shipment',
            header: 'Shipment',
            accessorFn: (row) => row.shipmentNumber ?? `#${row.shipmentId}`,
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div>
                        <div className="font-medium font-mono text-xs">
                            {s.shipmentNumber ?? `#${s.shipmentId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {s.poNumber || 'No PO'}
                        </div>
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            id: 'status',
            header: 'Status',
            accessorFn: (row) => row.status ?? '',
            cell: ({ row }) => (
                <Badge variant="default">
                    {row.original.status ?? '—'}
                </Badge>
            ),
        },
        {
            id: 'mode',
            header: 'Mode',
            accessorFn: (row) =>
                row.routeMode ?? row.shipmentMode ?? row.mode ?? '',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.routeMode ??
                        row.original.shipmentMode ??
                        row.original.mode ??
                        '—'}
                </Badge>
            ),
        },
        {
            id: 'route',
            header: 'Route',
            accessorFn: (row) => routeText(row),
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <span className="inline-flex max-w-48 items-center gap-1">
                        <span className="truncate">{routeText(s)}</span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    aria-label={`Full route: ${routeText(s)}`}
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    <Info className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="max-w-xs whitespace-pre-wrap"
                            >
                                {routeText(s)}
                            </TooltipContent>
                        </Tooltip>
                    </span>
                );
            },
        },
        {
            id: 'deliveredAt',
            header: 'Delivered At',
            accessorFn: (row) => row.actualArrival ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="whitespace-nowrap text-xs">
                        {s.actualArrival
                            ? new Date(s.actualArrival).toLocaleString()
                            : '—'}
                    </div>
                );
            },
        },
        {
            id: 'driverAsset',
            header: 'Driver / Asset',
            accessorFn: (row) => row.carrierName ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="text-xs">
                        <div>{s.carrierName ?? '—'}</div>
                        <div className="font-mono text-muted-foreground">
                            {s.carrierReference ?? ''}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const s = row.original;
                return (
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
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                                onClick={() => openDetails(s, 'delivered')}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const loadsTable = useTables<LoadBoardShipment>({
        data: loads?.content ?? [],
        columns: loadsColumns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        getRowId: (row, index) => String(row.shipmentId ?? index),
    });

    const pickedUpTable = useTables<LoadBoardShipment>({
        data: pickedUp?.content ?? [],
        columns: pickedUpColumns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        getRowId: (row, index) => String(row.shipmentId ?? index),
    });

    const deliveredTable = useTables<LoadBoardShipment>({
        data: delivered?.content ?? [],
        columns: deliveredColumns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        getRowId: (row, index) => String(row.shipmentId ?? index),
    });

    return (
        <div className="p-4 lg:p-6 space-y-4 min-w-0 max-w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Load Board</h1>
                <div className="flex items-center gap-2">
                    <Badge variant="outline">
                        {(loads?.totalElements ?? 0) +
                            (pickedUp?.totalElements ?? 0) +
                            (delivered?.totalElements ?? 0)}{' '}
                        loads
                    </Badge>
                </div>
            </div>
            <Tabs defaultValue="loads">
                <TabsList>
                    <TabsTrigger value="loads">Available Loads</TabsTrigger>
                    <TabsTrigger value="picked-up">Picked Up</TabsTrigger>
                    <TabsTrigger value="delivered">Delivered</TabsTrigger>
                </TabsList>
                <TabsContent value="loads">
                    <Card className="p-4 gap-2 min-w-0">
                        <CardHeader className="p-0">
                            <CardTitle className="flex justify-between w-full gap-2">
                                <Input
                                    placeholder="Search shipment or PO number"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm min-w-0 flex-1"
                                />
                                <Select
                                    value={mode}
                                    onValueChange={(v) => {
                                        setMode(v);
                                    }}
                                >
                                    <SelectTrigger className="">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Modes
                                        </SelectItem>
                                        <SelectItem value="ROAD">
                                            ROAD
                                        </SelectItem>
                                        <SelectItem value="RAIL">
                                            RAIL
                                        </SelectItem>
                                        <SelectItem value="AIR">AIR</SelectItem>
                                        <SelectItem value="SEA">SEA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <>
                                    <CentralizedDataTable
                                        table={loadsTable}
                                        emptyMessage="No available loads"
                                    />
                                    <div className="pt-2">
                                        <span className="text-sm text-muted-foreground">
                                            {loads?.totalElements ?? 0}{' '}
                                            load(s)
                                        </span>
                                    </div>
                                </>
                            )}
                            </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="picked-up">
                    <Card className="p-4 gap-2 min-w-0">
                        <CardHeader className="p-0">
                            <CardTitle>
                                Picked Up ({pickedUp?.totalElements ?? 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="pb-2 text-sm text-muted-foreground">
                                Loads collected from suppliers and heading to
                                delivery.
                            </p>
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <>
                                    <CentralizedDataTable
                                        table={pickedUpTable}
                                        emptyMessage="No picked up loads"
                                    />
                                    <div className="pt-2">
                                        <span className="text-sm text-muted-foreground">
                                            {pickedUp?.totalElements ?? 0}{' '}
                                            load(s)
                                        </span>
                                    </div>
                                </>
                            )}
                            </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="delivered">
                    <Card className="p-4 gap-2 min-w-0">
                        <CardHeader className="p-0">
                            <CardTitle>
                                Delivered ({delivered?.totalElements ?? 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="pb-2 text-sm text-muted-foreground">
                                Completed deliveries and their proof of
                                delivery.
                            </p>
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <>
                                    <CentralizedDataTable
                                        table={deliveredTable}
                                        emptyMessage="No delivered loads"
                                    />
                                    <div className="pt-2">
                                        <span className="text-sm text-muted-foreground">
                                            {delivered?.totalElements ?? 0}{' '}
                                            load(s)
                                        </span>
                                    </div>
                                </>
                            )}
                            </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Dialog
                open={details !== null}
                onOpenChange={(v) => {
                    if (!v) setDetails(null);
                }}
            >
                <DialogContent className="md:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Shipment {details?.shipmentNumber ?? ''} ·{' '}
                            {details?.status ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            {details ? routeText(details) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {details && (
                        <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-3">
                                <div>
                                    <p className="text-muted-foreground">PO</p>
                                    <p className="font-medium">
                                        {details.poNumber ?? '—'}
                                        {details.isPartialShipment
                                            ? ' (partial)'
                                            : ''}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Mode
                                    </p>
                                    <p className="font-medium">
                                        {details.shipmentMode ??
                                            details.mode ??
                                            '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Tracking
                                    </p>
                                    <p className="font-mono text-xs">
                                        {details.trackingNumber ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Supplier
                                    </p>
                                    <p className="font-medium">
                                        {details.supplierOrgName ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Retailer
                                    </p>
                                    <p className="font-medium">
                                        {details.retailerOrgName ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Carrier
                                    </p>
                                    <p className="font-medium">
                                        {details.carrierName ?? '—'}
                                        {details.carrierReference
                                            ? ` (${details.carrierReference})`
                                            : ''}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Weight / Volume / Packages
                                    </p>
                                    <p className="font-medium">
                                        {details.totalWeight ?? '—'} kg /{' '}
                                        {details.totalVolume ?? '—'} m³ /{' '}
                                        {details.totalPackages ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Freight
                                    </p>
                                    <p className="font-medium">
                                        {details.freightCost ?? '—'}{' '}
                                        {details.currency ?? ''}
                                        {details.freightTerms
                                            ? ` · ${details.freightTerms}`
                                            : ''}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Pickup / Delivery
                                    </p>
                                    <p className="font-medium break-words whitespace-normal">
                                        {details.pickupCity ??
                                            details.pickupLocation ??
                                            '—'}{' '}
                                        →{' '}
                                        {details.deliveryCity ??
                                            details.deliveryLocation ??
                                            '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">ETA</p>
                                    <p className="font-medium">
                                        {details.estimatedArrival ? (
                                            new Date(
                                                details.estimatedArrival
                                            ).toLocaleString()
                                        ) : details.poExpectedDeliveryDate ? (
                                            <>
                                                {shortDate(
                                                    details.poExpectedDeliveryDate
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {' '}
                                                    (per PO)
                                                </span>
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Delivery contract
                                    </p>
                                    <p className="font-medium">
                                        {details.deliveryContractId ? (
                                            <span className="inline-flex items-center gap-1">
                                                Contract #
                                                {details.deliveryContractId}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            href={`/logistics/partnership/management?contract=${details.deliveryContractId}`}
                                                            className="shrink-0 text-muted-foreground hover:text-foreground"
                                                            title="View the supplier–logistics contract"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        Open contract details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Pickup contact
                                    </p>
                                    <p className="font-medium">
                                        {details.pickupContactName ?? '—'}
                                        {details.pickupContactPhone
                                            ? ` · ${details.pickupContactPhone}`
                                            : ''}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Delivery contact
                                    </p>
                                    <p className="font-medium">
                                        {details.deliveryContactName ?? '—'}
                                        {details.deliveryContactPhone
                                            ? ` · ${details.deliveryContactPhone}`
                                            : ''}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Flags
                                    </p>
                                    <p className="font-medium">
                                        {[
                                            details.hazardousMaterial
                                                ? 'Hazardous'
                                                : null,
                                            details.temperatureControlled
                                                ? 'Temp-controlled'
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(', ') || '—'}
                                    </p>
                                </div>
                            </div>
                            {details.specialInstructions && (
                                <p className="rounded-md border p-3 text-sm">
                                    <span className="font-medium">
                                        Instructions:{' '}
                                    </span>
                                    {details.specialInstructions}
                                </p>
                            )}
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">
                                    Stops ({detailStops.length})
                                </p>
                                {detailStops.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No stops recorded.
                                    </p>
                                ) : (
                                    <div className="divide-y rounded-md border">
                                        {detailStops.map((st, i) => (
                                            <div
                                                key={
                                                    st.stopId ??
                                                    `${details.shipmentId}-${i}`
                                                }
                                                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                            >
                                                <span>
                                                    #
                                                    {st.sequenceNumber ?? i + 1}{' '}
                                                    {st.location ??
                                                        st.address ??
                                                        '—'}
                                                </span>
                                                <Badge variant="outline">
                                                    {st.status ?? '—'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">
                                    Tracking ({detailTracking.length})
                                </p>
                                {detailTracking.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No tracking events yet.
                                    </p>
                                ) : (
                                    <div className="divide-y rounded-md border">
                                        {detailTracking.map((t, i) => (
                                            <div
                                                key={
                                                    t.eventId ??
                                                    `${details.shipmentId}-t-${i}`
                                                }
                                                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                            >
                                                <span>
                                                    {t.eventType ?? 'Event'}
                                                    {t.location
                                                        ? ` · ${t.location}`
                                                        : ''}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {t.eventTimestamp
                                                        ? shortDate(
                                                              t.eventTimestamp
                                                          )
                                                        : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">
                                    Documents ({detailDocs.length})
                                </p>
                                {detailDocs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No documents uploaded.
                                    </p>
                                ) : (
                                    <div className="divide-y rounded-md border">
                                        {detailDocs.map((d, i) => (
                                            <div
                                                key={
                                                    d.documentId ??
                                                    `${details.shipmentId}-d-${i}`
                                                }
                                                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                            >
                                                <span>
                                                    {d.documentName ??
                                                        d.documentType ??
                                                        'Document'}
                                                </span>
                                                <Badge variant="outline">
                                                    {d.documentType ?? '—'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setDetails(null)}
                                >
                                    Close
                                </Button>
                                {detailsSource === 'loads' && (
                                    <Button
                                        onClick={() => {
                                            const s = details;
                                            setDetails(null);
                                            if (s) openAssign(s);
                                        }}
                                    >
                                        <Truck className="mr-2 h-4 w-4" />
                                        Assign this load
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog
                open={assigning !== null}
                onOpenChange={(v) => {
                    if (!v) setAssigning(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Assign {assigning?.shipmentNumber ?? ''} ·{' '}
                            {assigning ? routeText(assigning) : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Pick an available driver and asset. The shipment
                            moves BOOKED → ASSIGNED and leaves the load board.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Driver (available only)</Label>
                            <Select
                                value={assignDriverId}
                                onValueChange={setAssignDriverId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select driver" />
                                </SelectTrigger>
                                <SelectContent>
                                    {drivers.map((d) => (
                                        <SelectItem
                                            key={d.driverId}
                                            value={String(d.driverId)}
                                        >
                                            {d.fullName ?? d.driverCode} (
                                            {d.driverCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {drivers.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No available drivers.
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>Asset (available only)</Label>
                            <Select
                                value={assignAssetId}
                                onValueChange={setAssignAssetId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assets.map((a) => (
                                        <SelectItem
                                            key={a.assetId}
                                            value={String(a.assetId)}
                                        >
                                            {a.assetNumber} ({a.assetType}
                                            {a.licensePlate
                                                ? ` · ${a.licensePlate}`
                                                : ''}
                                            )
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {assets.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No available assets.
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>BOL document ID (DMS, optional)</Label>
                            <Input
                                value={assignBolDocId}
                                onChange={(e) =>
                                    setAssignBolDocId(e.target.value)
                                }
                                placeholder="e.g. DMS-12345"
                            />
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={assignStartPickup}
                                onChange={(e) =>
                                    setAssignStartPickup(e.target.checked)
                                }
                            />
                            Start pickup now (stamps pickup time and computes
                            ETA from the route&apos;s average delivery time)
                        </label>
                        <LoadingButton
                            loading={
                                !!assigning &&
                                busy === `assign-${assigning.shipmentId}`
                            }
                            onClick={submitAssign}
                        >
                            Confirm Assignment
                        </LoadingButton>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={etaOpen} onOpenChange={setEtaOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Tracking & ETA — Shipment #{eta?.shipmentId}
                        </DialogTitle>
                    </DialogHeader>
                    {eta && (
                        <div className="grid gap-3 text-sm">
                            <div className="flex justify-between">
                                <span>Status</span>
                                <Badge
                                    variant={
                                        eta.delayed
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    {eta.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Estimated Arrival</span>
                                <span className="font-medium">
                                    {eta.estimatedArrival ?? '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Milestones</span>
                                <span className="font-medium">
                                    {eta.totalMilestones}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Latest event
                                </span>
                                <div className="font-medium">
                                    {eta.latestEvent?.eventType ??
                                        'No events yet'}
                                    {eta.latestEvent?.location
                                        ? ` • ${eta.latestEvent.location}`
                                        : ''}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {eta.latestEvent?.description ?? ''}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={mapOpen} onOpenChange={setMapOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Live Tracking — Shipment #{mapShipmentId}
                        </DialogTitle>
                    </DialogHeader>
                    {mapShipmentId != null && (
                        <ShipmentMap
                            key={mapShipmentId}
                            shipmentId={mapShipmentId}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
