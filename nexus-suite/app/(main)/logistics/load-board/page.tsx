'use client';
import { useEffect, useState } from 'react';
import { Eye, Map as MapIcon, MapPin, Truck } from 'lucide-react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    DialogTrigger,
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
    const [form, setForm] = useState({
        shipmentId: '',
        baseRate: '',
        fuelSurcharge: '',
        accessorialCharges: '',
        accessorialDetails: '',
        validUntil: '',
        notes: '',
    });
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

    const openDetails = (s: LoadBoardShipment) => {
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
        const from =
            (s.pickupLocation ?? s.pickupAddress ?? '').trim() || '—';
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
                    size: 20,
                    search: search || undefined,
                    mode: mode === 'all' ? undefined : mode,
                }),
                getPickedUpLoads({ page: 0, size: 50 }),
                getDeliveredLoads({ page: 0, size: 50 }),
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
        load();
    }, [mode]);
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <div className="p-4 lg:p-6 space-y-4">
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
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Search shipment or PO number"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Select value={mode} onValueChange={setMode}>
                                    <SelectTrigger className="w-full">
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
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shipment</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead>Dates</TableHead>
                                            <TableHead>Load</TableHead>
                                            <TableHead>Freight</TableHead>
                                            <TableHead>Parties</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loads?.content?.map((s) => (
                                            <TableRow key={s.shipmentId}>
                                                <TableCell>
                                                    <div className="font-medium font-mono text-xs">
                                                        {s.shipmentNumber ??
                                                            `#${s.shipmentId}`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {s.poNumber
                                                            ? `PO ${s.poNumber}`
                                                            : 'No PO'}
                                                        {s.isPartialShipment
                                                            ? ' · Partial'
                                                            : ''}
                                                    </div>
                                                    {s.backorderedQuantity !== undefined &&
                                                        s.backorderedQuantity !== null &&
                                                        s.backorderedQuantity > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Backordered:{' '}
                                                                {
                                                                    s.backorderedQuantity
                                                                }
                                                            </div>
                                                        )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {s.status ?? '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {s.routeMode ??
                                                            s.shipmentMode ??
                                                            s.mode ??
                                                            '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="inline-flex max-w-48 items-center gap-1">
                                                        <span className="truncate">
                                                            {routeText(s)}
                                                        </span>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
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
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    <div>
                                                        P:{' '}
                                                        {shortDate(
                                                            s.pickupDate
                                                        )}
                                                    </div>
                                                    <div>
                                                        D:{' '}
                                                        {shortDate(
                                                            s.deliveryDate ??
                                                                s.estimatedArrival
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    <div>
                                                        {s.totalWeight ?? '—'}{' '}
                                                        kg
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {s.totalVolume ?? '—'}{' '}
                                                        m³ ·{' '}
                                                        {s.totalPackages ??
                                                            '—'}{' '}
                                                        pkgs
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {s.freightCost !==
                                                        undefined &&
                                                    s.freightCost !== null ? (
                                                        <>
                                                            {s.freightCost}{' '}
                                                            {s.currency ??
                                                                'USD'}
                                                            {s.freightTerms
                                                                ? ` · ${s.freightTerms}`
                                                                : ''}
                                                        </>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="max-w-40 truncate">
                                                        {s.supplierOrgName ??
                                                            '—'}{' '}
                                                        →{' '}
                                                        {s.retailerOrgName ??
                                                            '—'}
                                                    </div>
                                                    {s.carrierName && (
                                                        <div className="text-muted-foreground">
                                                            via {s.carrierName}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Shipment details"
                                                            onClick={() =>
                                                                openDetails(s)
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            title="Assign driver and asset"
                                                            onClick={() =>
                                                                openAssign(s)
                                                            }
                                                        >
                                                            <Truck className="mr-2 h-4 w-4" />
                                                            Assign
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!loads?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No available loads
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="picked-up">
                    <Card className="p-4 gap-2">
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
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shipment</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead>Picked Up</TableHead>
                                            <TableHead>ETA</TableHead>
                                            <TableHead>Driver / Asset</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pickedUp?.content?.map((s) => (
                                            <TableRow key={s.shipmentId}>
                                                <TableCell>
                                                    <div className="font-medium font-mono text-xs">
                                                        {s.shipmentNumber ??
                                                            `#${s.shipmentId}`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {s.poNumber
                                                            ? `PO ${s.poNumber}`
                                                            : 'No PO'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            s.status ===
                                                            'IN_TRANSIT'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {s.status ?? '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {s.routeMode ??
                                                            s.shipmentMode ??
                                                            s.mode ??
                                                            '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="inline-flex max-w-48 items-center gap-1">
                                                        <span className="truncate">
                                                            {routeText(s)}
                                                        </span>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
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
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {s.actualDeparture
                                                        ? new Date(
                                                              s.actualDeparture
                                                          ).toLocaleString()
                                                        : shortDate(
                                                              s.pickupDate
                                                          )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {s.estimatedArrival
                                                        ? new Date(
                                                              s.estimatedArrival
                                                          ).toLocaleString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div>
                                                        {s.carrierName ?? '—'}
                                                    </div>
                                                    <div className="font-mono text-muted-foreground">
                                                        {s.carrierReference ??
                                                            ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Shipment details"
                                                            onClick={() =>
                                                                openDetails(s)
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <LoadingButton
                                                            loading={
                                                                busy ===
                                                                `eta-${s.shipmentId}`
                                                            }
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Tracking & ETA"
                                                            onClick={() =>
                                                                withBusy(
                                                                    `eta-${s.shipmentId}`,
                                                                    () =>
                                                                        handleEta(
                                                                            s.shipmentId
                                                                        )
                                                                )
                                                            }
                                                        >
                                                            <MapPin className="mr-1 h-3 w-3" />
                                                            ETA
                                                        </LoadingButton>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Live map"
                                                            onClick={() => {
                                                                setMapShipmentId(
                                                                    s.shipmentId
                                                                );
                                                                setMapOpen(
                                                                    true
                                                                );
                                                            }}
                                                        >
                                                            <MapIcon className="mr-1 h-3 w-3" />
                                                            Map
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!pickedUp?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No picked up loads
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="delivered">
                    <Card className="p-4 gap-2">
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
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shipment</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead>Delivered At</TableHead>
                                            <TableHead>Driver / Asset</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {delivered?.content?.map((s) => (
                                            <TableRow key={s.shipmentId}>
                                                <TableCell>
                                                    <div className="font-medium font-mono text-xs">
                                                        {s.shipmentNumber ??
                                                            `#${s.shipmentId}`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {s.poNumber
                                                            ? `PO ${s.poNumber}`
                                                            : 'No PO'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default">
                                                        {s.status ?? '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {s.routeMode ??
                                                            s.shipmentMode ??
                                                            s.mode ??
                                                            '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="inline-flex max-w-48 items-center gap-1">
                                                        <span className="truncate">
                                                            {routeText(s)}
                                                        </span>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
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
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {s.actualArrival
                                                        ? new Date(
                                                              s.actualArrival
                                                          ).toLocaleString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div>
                                                        {s.carrierName ?? '—'}
                                                    </div>
                                                    <div className="font-mono text-muted-foreground">
                                                        {s.carrierReference ??
                                                            ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="Shipment details"
                                                        onClick={() =>
                                                            openDetails(s)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!delivered?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No delivered loads
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                </div>
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
                                    <p className="text-muted-foreground">Mode</p>
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
                                    <p className="text-muted-foreground">
                                        Expected delivery (ETA)
                                    </p>
                                    <p className="font-medium">
                                        {details.estimatedArrival
                                            ? new Date(
                                                  details.estimatedArrival
                                              ).toLocaleString()
                                            : '—'}
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
                                                    #{st.sequenceNumber ?? i + 1}{' '}
                                                    {st.location ?? st.address ?? '—'}
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
