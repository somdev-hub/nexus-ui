'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Ban,
    Boxes,
    Caravan,
    Check,
    Container,
    PauseCircle,
    Truck,
    Van,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
    AssetDriverHistory,
    AssetShipment,
    Driver,
    FleetAsset,
    MaintenanceRecord,
} from '@/types/logistics-ops';
import type { PaginatedResponse } from '@/types/paginated-response';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import ShipmentMap from '@/components/shipment-map';
import {
    getAssetCurrentShipment,
    getAssetDrivers,
    getAssetShipments,
    getFleetAssetById,
    getMaintenanceRecords,
    createMaintenanceRecord,
    updateFleetAsset,
    transitionAssetStatus,
} from '@/lib/services/logistics-ops-service';
import { useToast } from '@/hooks/use-toast';

const ASSET_ICONS: Record<string, LucideIcon> = {
    TRUCK: Truck,
    TRAILER: Caravan,
    CONTAINER: Container,
    VAN: Van,
    OTHER: Boxes,
};

const PAGE_SIZE = 10;

export default function AssetDetailPage() {
    const params = useParams();
    const assetId = Number(params.id);
    const { toast } = useToast();
    const [asset, setAsset] = useState<FleetAsset | null>(null);
    const [drivers, setDrivers] = useState<AssetDriverHistory[]>([]);
    const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
    const [currentShipmentId, setCurrentShipmentId] = useState<number | null>(
        null
    );
    const [loading, setLoading] = useState(true);

    const [ops, setOps] = useState<PaginatedResponse<AssetShipment> | null>(
        null
    );
    const [opsLoading, setOpsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('all');
    const [from, setFrom] = useState<Date | undefined>(undefined);
    const [to, setTo] = useState<Date | undefined>(undefined);
    const [busy, setBusy] = useState<string | null>(null);
    const [maintOpen, setMaintOpen] = useState(false);
    const [maintForm, setMaintForm] = useState({
        maintenanceType: 'PREVENTIVE',
        description: '',
        scheduledDate: '',
        odometerReading: '',
    });
    const [expiryOpen, setExpiryOpen] = useState(false);
    const [expiryForm, setExpiryForm] = useState({
        insuranceExpiry: '',
        permitExpiry: '',
        nextMaintenanceDueDate: '',
        nextMaintenanceDueMileage: '',
        currentMileage: '',
    });

    const runAssetAction = async (key: string, newStatus: string) => {
        if (busy) return;
        setBusy(key);
        try {
            await transitionAssetStatus(assetId, newStatus);
            toast({
                title: `Asset ${newStatus.toLowerCase().replaceAll('_', ' ')}`,
                variant: 'success',
            });
            await loadHeader();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setBusy(null);
        }
    };

    const loadHeader = useCallback(async () => {
        try {
            const [a, d, m, c] = await Promise.all([
                getFleetAssetById(assetId),
                getAssetDrivers(assetId).catch(() => []),
                getMaintenanceRecords({ assetId, page: 0, size: 50 }).catch(
                    () => null
                ),
                getAssetCurrentShipment(assetId).catch(() => null),
            ]);
            setAsset(a);
            setDrivers(d);
            setMaintenance(m?.content ?? []);
            setCurrentShipmentId(c?.shipmentId ?? null);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [assetId]);

    const toFilterValue = (d?: Date) =>
        d == null
            ? undefined
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const loadOps = useCallback(async () => {
        setOpsLoading(true);
        try {
            const res = await getAssetShipments(assetId, {
                page,
                size: PAGE_SIZE,
                sort: 'pickupDate,desc',
                status: status === 'all' ? undefined : status,
                from: toFilterValue(from),
                to: toFilterValue(to),
            });
            setOps(res);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setOpsLoading(false);
        }
    }, [assetId, page, status, from, to]);

    useEffect(() => {
        loadHeader();
    }, [loadHeader]);

    useEffect(() => {
        setOpsLoading(true);
        const t = setTimeout(loadOps, 300);
        return () => clearTimeout(t);
    }, [loadOps]);

    const applyFilters = async () => {
        if (busy) return;
        setBusy('apply');
        try {
            setPage(0);
            await loadOps();
        } finally {
            setBusy(null);
        }
    };

    const clearFilters = async () => {
        setStatus('all');
        setFrom(undefined);
        setTo(undefined);
        setPage(0);
    };

    const handleMaintCreate = async () => {
        if (busy) return;
        setBusy('maint-create');
        try {
            await createMaintenanceRecord({
                assetId,
                maintenanceType: maintForm.maintenanceType,
                description: maintForm.description || undefined,
                scheduledDate: maintForm.scheduledDate || undefined,
                odometerReading: maintForm.odometerReading
                    ? Number(maintForm.odometerReading)
                    : undefined,
            });
            toast({ title: 'Maintenance scheduled', variant: 'success' });
            setMaintOpen(false);
            setMaintForm({
                maintenanceType: 'PREVENTIVE',
                description: '',
                scheduledDate: '',
                odometerReading: '',
            });
            await loadHeader();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setBusy(null);
        }
    };

    const openExpiryEditor = () => {
        if (!asset) return;
        setExpiryForm({
            insuranceExpiry: asset.insuranceExpiry ?? '',
            permitExpiry: asset.permitExpiry ?? '',
            nextMaintenanceDueDate: asset.nextMaintenanceDueDate ?? '',
            nextMaintenanceDueMileage:
                asset.nextMaintenanceDueMileage != null
                    ? String(asset.nextMaintenanceDueMileage)
                    : '',
            currentMileage:
                asset.currentMileage != null
                    ? String(asset.currentMileage)
                    : '',
        });
        setExpiryOpen(true);
    };

    const handleExpirySave = async () => {
        if (busy) return;
        setBusy('expiry-save');
        try {
            await updateFleetAsset(assetId, {
                insuranceExpiry: expiryForm.insuranceExpiry || undefined,
                permitExpiry: expiryForm.permitExpiry || undefined,
                nextMaintenanceDueDate:
                    expiryForm.nextMaintenanceDueDate || undefined,
                nextMaintenanceDueMileage: expiryForm.nextMaintenanceDueMileage
                    ? Number(expiryForm.nextMaintenanceDueMileage)
                    : undefined,
                currentMileage: expiryForm.currentMileage
                    ? Number(expiryForm.currentMileage)
                    : undefined,
            });
            toast({ title: 'Expiries updated', variant: 'success' });
            setExpiryOpen(false);
            await loadHeader();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setBusy(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="p-4 lg:p-6">
                <div className="text-sm text-muted-foreground">
                    Asset not found.
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/logistics/fleet">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Fleet
                    </Link>
                </Button>
            </div>
        );
    }

    const AssetIcon = ASSET_ICONS[asset.assetType] ?? Boxes;
    const upcoming = maintenance
        .filter((m) => m.status === 'SCHEDULED' || m.status === 'OVERDUE')
        .sort((a, b) =>
            (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? '')
        );
    const totalPages = ops?.totalPages ?? 0;

    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/logistics/fleet">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Fleet
                    </Link>
                </Button>
                <Badge
                    variant={
                        asset.status === 'AVAILABLE' ? 'default' : 'secondary'
                    }
                >
                    {asset.status}
                </Badge>
            </div>

            <Card className="p-4 gap-2">
                <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted">
                            <AssetIcon
                                className="h-7 w-7 text-foreground"
                                strokeWidth={1.5}
                            />
                        </span>
                        <div className="flex-1">
                            <div className="text-xl font-semibold">
                                {asset.assetNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {asset.assetType} • {asset.make ?? ''}{' '}
                                {asset.model ?? ''} •{' '}
                                {asset.licensePlate ?? 'no plate'}
                            </div>
                        </div>
                        <div className="hidden text-right text-sm md:block">
                            <div className="text-muted-foreground">Mileage</div>
                            <div className="font-medium">
                                {asset.currentMileage ?? 0} km
                            </div>
                        </div>
                        <div className="hidden text-right text-sm md:block">
                            <div className="text-muted-foreground">
                                Capacity
                            </div>
                            <div className="font-medium">
                                {asset.capacityWeight ?? '-'} kg
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3">
                        {(asset.status === 'AVAILABLE' ||
                            asset.status === 'OUT_OF_SERVICE') && (
                            <LoadingButton
                                loading={busy === 'asset-maint'}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    runAssetAction(
                                        'asset-maint',
                                        'IN_MAINTENANCE'
                                    )
                                }
                            >
                                <Wrench className="mr-2 h-4 w-4" />
                                To Maintenance
                            </LoadingButton>
                        )}
                        {(asset.status === 'IN_MAINTENANCE' ||
                            asset.status === 'OUT_OF_SERVICE') && (
                            <LoadingButton
                                loading={busy === 'asset-release'}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    runAssetAction('asset-release', 'AVAILABLE')
                                }
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Release
                            </LoadingButton>
                        )}
                        {(asset.status === 'AVAILABLE' ||
                            asset.status === 'ASSIGNED' ||
                            asset.status === 'IN_MAINTENANCE') && (
                            <LoadingButton
                                loading={busy === 'asset-decom-temp'}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    runAssetAction(
                                        'asset-decom-temp',
                                        'OUT_OF_SERVICE'
                                    )
                                }
                            >
                                <PauseCircle className="mr-2 h-4 w-4" />
                                Decommission (Temporary)
                            </LoadingButton>
                        )}
                        {(asset.status === 'AVAILABLE' ||
                            asset.status === 'OUT_OF_SERVICE') && (
                            <LoadingButton
                                loading={busy === 'asset-decom-perm'}
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                    runAssetAction(
                                        'asset-decom-perm',
                                        'RETIRED'
                                    )
                                }
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Decommission (Permanent)
                            </LoadingButton>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Current Trip</CardTitle>
                        <CardDescription>
                            Live position and route
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {currentShipmentId != null ? (
                            <ShipmentMap
                                key={currentShipmentId}
                                shipmentId={currentShipmentId}
                            />
                        ) : (
                            <div className="grid gap-2 text-sm">
                                <div className="text-muted-foreground">
                                    Asset is idle — no active trip.
                                </div>
                                <div>
                                    Last known position:{' '}
                                    <span className="font-medium">
                                        {asset.currentLatitude != null &&
                                        asset.currentLongitude != null
                                            ? `${asset.currentLatitude.toFixed(4)}, ${asset.currentLongitude.toFixed(4)}`
                                            : 'unknown'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="flex items-center justify-between">
                            What&apos;s Next
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={openExpiryEditor}
                            >
                                Edit
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Upcoming service and expiries
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-0 text-sm">
                        <div className="flex justify-between">
                            <span>Next maintenance due</span>
                            <span className="font-medium">
                                {asset.nextMaintenanceDueDate ?? '—'}
                                {asset.nextMaintenanceDueMileage != null
                                    ? ` • ${asset.nextMaintenanceDueMileage} km`
                                    : ''}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Insurance expiry</span>
                            <span className="font-medium">
                                {asset.insuranceExpiry ?? '—'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Permit expiry</span>
                            <span className="font-medium">
                                {asset.permitExpiry ?? '—'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Scheduled jobs</span>
                            <Badge
                                variant={
                                    upcoming.length ? 'secondary' : 'outline'
                                }
                            >
                                {upcoming.length}
                            </Badge>
                        </div>
                        {upcoming.slice(0, 3).map((m) => (
                            <div
                                key={m.maintenanceId}
                                className="flex justify-between border-t pt-2 text-xs"
                            >
                                <span>
                                    {m.maintenanceNumber} • {m.maintenanceType}
                                </span>
                                <Badge
                                    variant={
                                        m.status === 'OVERDUE'
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                >
                                    {m.scheduledDate ?? m.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="operations">
                <TabsList>
                    <TabsTrigger value="operations">Operations</TabsTrigger>
                    <TabsTrigger value="drivers">
                        Drivers ({drivers.length})
                    </TabsTrigger>
                    <TabsTrigger value="maintenance">
                        Maintenance ({maintenance.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="operations">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex flex-wrap items-end gap-2">
                                <div className="grid gap-2">
                                    <Label>From</Label>
                                    <DateTimePicker
                                        value={from}
                                        onChange={setFrom}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>To</Label>
                                    <DateTimePicker
                                        value={to}
                                        onChange={setTo}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Status
                                            </SelectItem>
                                            <SelectItem value="ASSIGNED">
                                                ASSIGNED
                                            </SelectItem>
                                            <SelectItem value="PICKED_UP">
                                                PICKED_UP
                                            </SelectItem>
                                            <SelectItem value="IN_TRANSIT">
                                                IN_TRANSIT
                                            </SelectItem>
                                            <SelectItem value="DELIVERED">
                                                DELIVERED
                                            </SelectItem>
                                            <SelectItem value="EXCEPTION">
                                                EXCEPTION
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <LoadingButton
                                    loading={busy === 'apply'}
                                    onClick={applyFilters}
                                >
                                    Apply
                                </LoadingButton>
                                <Button variant="ghost" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {opsLoading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Shipment</TableHead>
                                                <TableHead>
                                                    Pickup → Delivery
                                                </TableHead>
                                                <TableHead>Driver</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ops?.content?.map(
                                                (s: AssetShipment) => (
                                                    <TableRow
                                                        key={s.shipmentId}
                                                    >
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {
                                                                    s.shipmentNumber
                                                                }
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                #{s.shipmentId}
                                                                {s.freightCost !=
                                                                null
                                                                    ? ` • $${Number(s.freightCost).toFixed(2)}`
                                                                    : ''}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {s.pickupDate ??
                                                                '?'}{' '}
                                                            →{' '}
                                                            {s.deliveryDate ??
                                                                '?'}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {s.driverName ??
                                                                (s.driverId !=
                                                                null
                                                                    ? `Driver #${s.driverId}`
                                                                    : '-')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    s.status ===
                                                                    'DELIVERED'
                                                                        ? 'default'
                                                                        : s.status ===
                                                                            'EXCEPTION'
                                                                          ? 'destructive'
                                                                          : 'secondary'
                                                                }
                                                            >
                                                                {s.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                            {!ops?.content?.length && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="text-center text-sm text-muted-foreground"
                                                    >
                                                        No operations in this
                                                        period
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    <div className="flex items-center justify-between pt-2 text-sm">
                                        <span className="text-muted-foreground">
                                            Page {(ops?.pageNo ?? page) + 1} of{' '}
                                            {Math.max(totalPages, 1)} •{' '}
                                            {ops?.totalElements ?? 0} total
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                    page === 0 || opsLoading
                                                }
                                                onClick={() =>
                                                    setPage((p) =>
                                                        Math.max(0, p - 1)
                                                    )
                                                }
                                            >
                                                Prev
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                    opsLoading ||
                                                    page + 1 >=
                                                        Math.max(totalPages, 1)
                                                }
                                                onClick={() =>
                                                    setPage((p) => p + 1)
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="drivers">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>Drivers of this asset</CardTitle>
                            <CardDescription>
                                Trip history only — assign/unassign is not
                                supported by the backend (no FleetService
                                endpoint).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Trips</TableHead>
                                        <TableHead>First Trip</TableHead>
                                        <TableHead>Last Trip</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {drivers.map((d: AssetDriverHistory) => (
                                        <TableRow key={d.driverId}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {d.driverName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    #{d.driverId}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {d.trips}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {d.firstTripAt
                                                    ? new Date(
                                                          d.firstTripAt
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {d.lastTripAt
                                                    ? new Date(
                                                          d.lastTripAt
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!drivers.length && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No driver history yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="maintenance">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex items-center justify-between">
                                Maintenance records
                                <Button
                                    size="sm"
                                    onClick={() => setMaintOpen(true)}
                                >
                                    <Wrench className="mr-2 h-4 w-4" />
                                    Schedule
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Record</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {maintenance.map((m: MaintenanceRecord) => (
                                        <TableRow key={m.maintenanceId}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {m.maintenanceNumber}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {m.scheduledDate ?? '-'}
                                                    {m.cost != null
                                                        ? ` • $${Number(m.cost).toFixed(2)}`
                                                        : ''}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        m.isBreakdown
                                                            ? 'destructive'
                                                            : 'outline'
                                                    }
                                                >
                                                    {m.maintenanceType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        m.status === 'COMPLETED'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {m.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!maintenance.length && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No maintenance records
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Maintenance</DialogTitle>
                        <DialogDescription>
                            Asset #{assetId} — a new service record
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select
                                value={maintForm.maintenanceType}
                                onValueChange={(v) =>
                                    setMaintForm({
                                        ...maintForm,
                                        maintenanceType: v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PREVENTIVE">
                                        PREVENTIVE
                                    </SelectItem>
                                    <SelectItem value="CORRECTIVE">
                                        CORRECTIVE
                                    </SelectItem>
                                    <SelectItem value="BREAKDOWN">
                                        BREAKDOWN
                                    </SelectItem>
                                    <SelectItem value="INSPECTION">
                                        INSPECTION
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="e.g. Engine oil and brake check"
                                value={maintForm.description}
                                onChange={(e) =>
                                    setMaintForm({
                                        ...maintForm,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Scheduled (YYYY-MM-DD)</Label>
                                <Input
                                    placeholder="e.g. 2026-10-15"
                                    value={maintForm.scheduledDate}
                                    onChange={(e) =>
                                        setMaintForm({
                                            ...maintForm,
                                            scheduledDate: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Odometer</Label>
                                <Input
                                    placeholder="e.g. 125000"
                                    type="number"
                                    value={maintForm.odometerReading}
                                    onChange={(e) =>
                                        setMaintForm({
                                            ...maintForm,
                                            odometerReading: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <LoadingButton
                            loading={busy === 'maint-create'}
                            onClick={handleMaintCreate}
                        >
                            Schedule
                        </LoadingButton>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={expiryOpen} onOpenChange={setExpiryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Service & Expiries</DialogTitle>
                        <DialogDescription>
                            Update upcoming service and document expiries
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Insurance Expiry</Label>
                                <Input
                                    placeholder="e.g. 2026-12-31"
                                    type="date"
                                    value={expiryForm.insuranceExpiry}
                                    onChange={(e) =>
                                        setExpiryForm({
                                            ...expiryForm,
                                            insuranceExpiry: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Permit Expiry</Label>
                                <Input
                                    placeholder="e.g. 2026-12-31"
                                    type="date"
                                    value={expiryForm.permitExpiry}
                                    onChange={(e) =>
                                        setExpiryForm({
                                            ...expiryForm,
                                            permitExpiry: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Next Maintenance Due</Label>
                                <Input
                                    placeholder="e.g. 2026-11-01"
                                    type="date"
                                    value={expiryForm.nextMaintenanceDueDate}
                                    onChange={(e) =>
                                        setExpiryForm({
                                            ...expiryForm,
                                            nextMaintenanceDueDate:
                                                e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Due Mileage (km)</Label>
                                <Input
                                    placeholder="e.g. 130000"
                                    type="number"
                                    value={expiryForm.nextMaintenanceDueMileage}
                                    onChange={(e) =>
                                        setExpiryForm({
                                            ...expiryForm,
                                            nextMaintenanceDueMileage:
                                                e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Current Mileage (km)</Label>
                            <Input
                                placeholder="e.g. 125000"
                                type="number"
                                value={expiryForm.currentMileage}
                                onChange={(e) =>
                                    setExpiryForm({
                                        ...expiryForm,
                                        currentMileage: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <LoadingButton
                            loading={busy === 'expiry-save'}
                            onClick={handleExpirySave}
                        >
                            Save
                        </LoadingButton>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
