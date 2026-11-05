'use client';
import { useEffect, useState } from 'react';
import { CalendarClock, Check, Plus } from 'lucide-react';
import type {
    CapacityForecast,
    ConsolidationGroup,
} from '@/types/logistics-ops';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    getConsolidationGroups,
    createConsolidationGroup,
    updateGroup,
    transitionGroupStatus,
    addShipmentsToGroup,
    deleteConsolidationGroup,
    getCapacityForecasts,
    createCapacityForecast,
    updateCapacity,
    deleteCapacityForecast,
    extendCapacityForPartnership,
    CAPACITY_UNITS,
    TRANSPORT_MODES,
    isUnitizedCapacityUnit,
    formatUnitSpecs,
    capacityUnitLabel,
} from '@/lib/services/logistics-ops-service';
import {
    getShipmentStops,
    addShipmentStop,
    deleteShipmentStop,
    transitionShipmentStopStatus,
    type ShipmentStop,
} from '@/lib/services/shipment-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';
import { LoadingButton } from '@/components/ui/loading-button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import Link from 'next/link';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables } from '@/hooks/use-tables';
import type { ColumnDef } from '@tanstack/react-table';
import {
    IconDotsVertical,
    IconEdit,
    IconLock,
    IconTrash,
    IconTruck,
} from '@tabler/icons-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function CapacityLaneCell({ c }: { c: CapacityForecast }) {
    return (
        <div className="text-xs">
            {c.originLane ?? '?'} → {c.destinationLane ?? '?'}
        </div>
    );
}

function CapacityPartnershipCell({ c }: { c: CapacityForecast }) {
    return (
        <Link
            href="/logistics/partnership/management"
            title="Open partnership management"
        >
            <Badge variant="secondary">#{c.partnershipId}</Badge>
        </Link>
    );
}

function CapacityEquipmentCell({ c }: { c: CapacityForecast }) {
    return (
        <div>
            <Badge variant="outline">{c.equipmentType ?? '-'}</Badge>
            {c.transportMode && (
                <Badge variant="secondary" className="ml-1">
                    {c.transportMode}
                </Badge>
            )}
        </div>
    );
}

function CapacityPeriodCell({ c }: { c: CapacityForecast }) {
    return (
        <div className="text-xs">
            {c.periodStart ?? '-'} → {c.periodEnd ?? '-'}
        </div>
    );
}

function CapacityDetailCell({ c }: { c: CapacityForecast }) {
    return (
        <div className="text-xs">
            <span>
                avail {c.availableCapacity ?? 0}{' '}
                {capacityUnitLabel(c.capacityUnit)}
            </span>
            <span className="text-muted-foreground">
                {' '}
                • booked {c.bookedCapacity ?? 0}
            </span>
            {formatUnitSpecs(c) && (
                <span className="block text-muted-foreground">
                    {formatUnitSpecs(c)}
                </span>
            )}
            {c.unitPrice !== undefined && c.unitPrice !== null && (
                <span className="block font-medium">
                    {c.unitPrice} {c.currency ?? 'USD'} /{' '}
                    {capacityUnitLabel(c.capacityUnit).replace(/s$/, '')}
                </span>
            )}
            {(c.fuelSurcharge !== undefined && c.fuelSurcharge !== null) ||
            (c.driverFees !== undefined && c.driverFees !== null) ||
            (c.miscPrice !== undefined && c.miscPrice !== null) ? (
                <span className="block text-muted-foreground">
                    {[
                        c.fuelSurcharge !== undefined &&
                        c.fuelSurcharge !== null
                            ? `fuel +${c.fuelSurcharge}`
                            : null,
                        c.driverFees !== undefined && c.driverFees !== null
                            ? `driver +${c.driverFees}`
                            : null,
                        c.miscPrice !== undefined && c.miscPrice !== null
                            ? `misc +${c.miscPrice}`
                            : null,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </span>
            ) : null}
            {(c.totalDistance !== undefined && c.totalDistance !== null) ||
            (c.averageDeliveryTime !== undefined &&
                c.averageDeliveryTime !== null) ? (
                <span className="block text-muted-foreground">
                    {c.totalDistance !== undefined && c.totalDistance !== null
                        ? `${c.totalDistance} km`
                        : ''}
                    {c.totalDistance !== undefined &&
                    c.totalDistance !== null &&
                    c.averageDeliveryTime !== undefined &&
                    c.averageDeliveryTime !== null
                        ? ' · '
                        : ''}
                    {c.averageDeliveryTime !== undefined &&
                    c.averageDeliveryTime !== null
                        ? `~${c.averageDeliveryTime} ${(c.deliveryTimeUom ?? 'HOURS').toLowerCase()}`
                        : ''}
                </span>
            ) : null}
        </div>
    );
}
export default function RoutingPage() {
    const { toast } = useToast();
    const [groups, setGroups] =
        useState<PaginatedResponse<ConsolidationGroup> | null>(null);
    const [capacity, setCapacity] =
        useState<PaginatedResponse<CapacityForecast> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [groupOpen, setGroupOpen] = useState(false);
    const [capOpen, setCapOpen] = useState(false);
    useQuickCreateIntent('logistics:group', () => setGroupOpen(true));
    useQuickCreateIntent('logistics:capacity', () => setCapOpen(true));
    const [groupNotes, setGroupNotes] = useState('');
    const [addForm, setAddForm] = useState({ groupId: '', shipmentIds: '' });
    const [capForm, setCapForm] = useState({
        originLane: '',
        destinationLane: '',
        equipmentType: 'TRUCK',
        transportMode: '',
        periodStart: '',
        periodEnd: '',
        availableCapacity: '',
        capacityUnit: 'KG',
        unitPrice: '',
        currency: 'USD',
        totalFuelRequired: '',
        fuelPrice: '',
        driverFees: '',
        miscPrice: '',
        totalDistance: '',
        averageDeliveryTime: '',
        deliveryTimeUom: 'HOURS',
        unitLength: '',
        unitWidth: '',
        unitHeight: '',
        dimensionUom: 'M',
        unitVolume: '',
        volumeUom: 'CBM',
    });
    const [busy, setBusy] = useState<string | null>(null);
    const [stopsShipmentId, setStopsShipmentId] = useState('');
    const [stops, setStops] = useState<ShipmentStop[]>([]);
    const [stopsLoaded, setStopsLoaded] = useState(false);
    const [stopForm, setStopForm] = useState({
        sequenceNumber: '',
        stopType: 'DELIVERY',
        location: '',
        address: '',
        scheduledDate: '',
        notes: '',
    });
    const [groupEdit, setGroupEdit] = useState<{
        id: number;
        notes: string;
    } | null>(null);
    const [capEdit, setCapEdit] = useState<{
        id: number;
        originLane: string;
        destinationLane: string;
        equipmentType: string;
        transportMode: string;
        periodStart: string;
        periodEnd: string;
        availableCapacity: string;
        bookedCapacity: string;
        capacityUnit: string;
        unitPrice: string;
        currency: string;
        totalFuelRequired: string;
        fuelPrice: string;
        driverFees: string;
        miscPrice: string;
        totalDistance: string;
        averageDeliveryTime: string;
        deliveryTimeUom: string;
        unitLength: string;
        unitWidth: string;
        unitHeight: string;
        dimensionUom: string;
        unitVolume: string;
        volumeUom: string;
        notes: string;
    } | null>(null);
    // LONG_TERM partner flexibility: extend a routing-capacity period so the
    // partner supplier keeps logistics availability.
    const [capExtend, setCapExtend] = useState<{
        id: number;
        periodEnd: string;
        partnershipId: string;
        newPeriodEnd: string;
    } | null>(null);
    const withBusy = async (key: string, fn: () => Promise<unknown>) => {
        if (busy) return;
        setBusy(key);
        try {
            await fn();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setBusy(null);
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const [g, c] = await Promise.all([
                getConsolidationGroups({
                    page: 0,
                    size: 100,
                    search: search || undefined,
                }),
                getCapacityForecasts({
                    page: 0,
                    size: 100,
                    search: search || undefined,
                }),
            ]);
            setGroups(g);
            setCapacity(c);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleGroupCreate = async () => {
        try {
            await createConsolidationGroup({ notes: groupNotes || undefined });
            toast({ title: 'Group created', variant: 'success' });
            setGroupOpen(false);
            setGroupNotes('');
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleAddShipments = async () => {
        try {
            const ids = addForm.shipmentIds
                .split(',')
                .map((s) => Number(s.trim()))
                .filter((n) => !isNaN(n));
            await addShipmentsToGroup(Number(addForm.groupId), ids);
            toast({ title: 'Shipments added', variant: 'success' });
            setAddForm({ groupId: '', shipmentIds: '' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleCapCreate = async () => {
        if (
            isUnitizedCapacityUnit(capForm.capacityUnit) &&
            (!capForm.unitLength || !capForm.unitWidth || !capForm.unitHeight)
        ) {
            toast({
                title: 'Container/pallet capacity needs length, width and height specs',
                variant: 'destructive',
            });
            return;
        }
        try {
            await createCapacityForecast({
                originLane: capForm.originLane || undefined,
                destinationLane: capForm.destinationLane || undefined,
                equipmentType:
                    capForm.equipmentType as CapacityForecast['equipmentType'],
                transportMode: capForm.transportMode || undefined,
                periodStart: capForm.periodStart || undefined,
                periodEnd: capForm.periodEnd || undefined,
                availableCapacity: capForm.availableCapacity
                    ? Number(capForm.availableCapacity)
                    : undefined,
                capacityUnit:
                    capForm.capacityUnit as CapacityForecast['capacityUnit'],
                unitPrice: capForm.unitPrice
                    ? Number(capForm.unitPrice)
                    : undefined,
                currency: capForm.currency || undefined,
                totalFuelRequired: capForm.totalFuelRequired
                    ? Number(capForm.totalFuelRequired)
                    : undefined,
                fuelPrice: capForm.fuelPrice
                    ? Number(capForm.fuelPrice)
                    : undefined,
                driverFees: capForm.driverFees
                    ? Number(capForm.driverFees)
                    : undefined,
                miscPrice: capForm.miscPrice
                    ? Number(capForm.miscPrice)
                    : undefined,
                totalDistance: capForm.totalDistance
                    ? Number(capForm.totalDistance)
                    : undefined,
                averageDeliveryTime: capForm.averageDeliveryTime
                    ? Number(capForm.averageDeliveryTime)
                    : undefined,
                deliveryTimeUom: capForm.deliveryTimeUom || undefined,
                unitLength: capForm.unitLength
                    ? Number(capForm.unitLength)
                    : undefined,
                unitWidth: capForm.unitWidth
                    ? Number(capForm.unitWidth)
                    : undefined,
                unitHeight: capForm.unitHeight
                    ? Number(capForm.unitHeight)
                    : undefined,
                dimensionUom: capForm.dimensionUom || undefined,
                unitVolume: capForm.unitVolume
                    ? Number(capForm.unitVolume)
                    : undefined,
                volumeUom: capForm.volumeUom || undefined,
            });
            toast({ title: 'Capacity added', variant: 'success' });
            setCapOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleStopsLoad = async () => {
        if (!stopsShipmentId) return;
        try {
            const list = await getShipmentStops(Number(stopsShipmentId));
            setStops(
                [...list].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
            );
            setStopsLoaded(true);
        } catch (e: unknown) {
            setStops([]);
            setStopsLoaded(false);
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleStopAdd = async () => {
        if (!stopsShipmentId || !stopForm.sequenceNumber) return;
        try {
            await addShipmentStop(Number(stopsShipmentId), {
                sequenceNumber: Number(stopForm.sequenceNumber),
                stopType: stopForm.stopType as ShipmentStop['stopType'],
                location: stopForm.location || undefined,
                address: stopForm.address || undefined,
                scheduledDate: stopForm.scheduledDate || undefined,
                notes: stopForm.notes || undefined,
            });
            toast({ title: 'Stop added', variant: 'success' });
            setStopForm({
                sequenceNumber: '',
                stopType: 'DELIVERY',
                location: '',
                address: '',
                scheduledDate: '',
                notes: '',
            });
            await handleStopsLoad();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleStopRemove = async (stopId: number) => {
        if (!stopsShipmentId) return;
        try {
            await deleteShipmentStop(Number(stopsShipmentId), stopId);
            toast({ title: 'Stop removed', variant: 'success' });
            await handleStopsLoad();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleStopAdvance = async (stopId: number, current: string) => {
        const next =
            current === 'PENDING'
                ? 'ARRIVED'
                : current === 'ARRIVED'
                  ? 'DEPARTED'
                  : current === 'DEPARTED'
                    ? 'COMPLETED'
                    : null;
        if (!next || !stopsShipmentId) return;
        try {
            await transitionShipmentStopStatus(
                Number(stopsShipmentId),
                stopId,
                next
            );
            toast({ title: `Stop ${next.toLowerCase()}`, variant: 'success' });
            await handleStopsLoad();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleGroupUpdate = async () => {
        if (!groupEdit) return;
        try {
            await updateGroup(groupEdit.id, {
                notes: groupEdit.notes || undefined,
            });
            toast({ title: 'Group updated', variant: 'success' });
            setGroupEdit(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleCapUpdate = async () => {
        if (!capEdit) return;
        if (
            isUnitizedCapacityUnit(capEdit.capacityUnit) &&
            (!capEdit.unitLength || !capEdit.unitWidth || !capEdit.unitHeight)
        ) {
            toast({
                title: 'Container/pallet capacity needs length, width and height specs',
                variant: 'destructive',
            });
            return;
        }
        try {
            await updateCapacity(capEdit.id, {
                originLane: capEdit.originLane || undefined,
                destinationLane: capEdit.destinationLane || undefined,
                equipmentType:
                    capEdit.equipmentType as CapacityForecast['equipmentType'],
                transportMode: capEdit.transportMode || undefined,
                periodStart: capEdit.periodStart || undefined,
                periodEnd: capEdit.periodEnd || undefined,
                availableCapacity: capEdit.availableCapacity
                    ? Number(capEdit.availableCapacity)
                    : undefined,
                bookedCapacity: capEdit.bookedCapacity
                    ? Number(capEdit.bookedCapacity)
                    : undefined,
                capacityUnit:
                    capEdit.capacityUnit as CapacityForecast['capacityUnit'],
                unitPrice: capEdit.unitPrice
                    ? Number(capEdit.unitPrice)
                    : undefined,
                currency: capEdit.currency || undefined,
                totalFuelRequired: capEdit.totalFuelRequired
                    ? Number(capEdit.totalFuelRequired)
                    : undefined,
                fuelPrice: capEdit.fuelPrice
                    ? Number(capEdit.fuelPrice)
                    : undefined,
                driverFees: capEdit.driverFees
                    ? Number(capEdit.driverFees)
                    : undefined,
                miscPrice: capEdit.miscPrice
                    ? Number(capEdit.miscPrice)
                    : undefined,
                totalDistance: capEdit.totalDistance
                    ? Number(capEdit.totalDistance)
                    : undefined,
                averageDeliveryTime: capEdit.averageDeliveryTime
                    ? Number(capEdit.averageDeliveryTime)
                    : undefined,
                deliveryTimeUom: capEdit.deliveryTimeUom || undefined,
                unitLength: capEdit.unitLength
                    ? Number(capEdit.unitLength)
                    : undefined,
                unitWidth: capEdit.unitWidth
                    ? Number(capEdit.unitWidth)
                    : undefined,
                unitHeight: capEdit.unitHeight
                    ? Number(capEdit.unitHeight)
                    : undefined,
                dimensionUom: capEdit.dimensionUom || undefined,
                unitVolume: capEdit.unitVolume
                    ? Number(capEdit.unitVolume)
                    : undefined,
                volumeUom: capEdit.volumeUom || undefined,
                notes: capEdit.notes || undefined,
            });
            toast({ title: 'Capacity updated', variant: 'success' });
            setCapEdit(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    // Public lanes vs lanes dedicated to one long-term partnership.
    const publicCapacities = (capacity?.content ?? []).filter(
        (c) => c.partnershipId === undefined || c.partnershipId === null
    );
    const dedicatedCapacities = (capacity?.content ?? []).filter(
        (c) => c.partnershipId !== undefined && c.partnershipId !== null
    );

    const handleCapExtendRow = (c: CapacityForecast) =>
        setCapExtend({
            id: c.forecastId,
            periodEnd: c.periodEnd ?? '',
            partnershipId: '',
            newPeriodEnd: c.periodEnd ?? '',
        });

    const handleCapEditRow = (c: CapacityForecast) =>
        setCapEdit({
            id: c.forecastId,
            originLane: c.originLane ?? '',
            destinationLane: c.destinationLane ?? '',
            equipmentType: c.equipmentType ?? 'TRUCK',
            transportMode: c.transportMode ?? '',
            periodStart: c.periodStart ?? '',
            periodEnd: c.periodEnd ?? '',
            availableCapacity:
                c.availableCapacity != null ? String(c.availableCapacity) : '',
            bookedCapacity:
                c.bookedCapacity != null ? String(c.bookedCapacity) : '',
            capacityUnit: c.capacityUnit ?? 'KG',
            unitLength:
                c.unitLength != null && c.unitLength !== undefined
                    ? String(c.unitLength)
                    : '',
            unitWidth:
                c.unitWidth != null && c.unitWidth !== undefined
                    ? String(c.unitWidth)
                    : '',
            unitHeight:
                c.unitHeight != null && c.unitHeight !== undefined
                    ? String(c.unitHeight)
                    : '',
            dimensionUom: c.dimensionUom ?? 'M',
            unitVolume:
                c.unitVolume != null && c.unitVolume !== undefined
                    ? String(c.unitVolume)
                    : '',
            volumeUom: c.volumeUom ?? 'CBM',
            unitPrice:
                c.unitPrice != null && c.unitPrice !== undefined
                    ? String(c.unitPrice)
                    : '',
            currency: c.currency ?? 'USD',
            totalFuelRequired:
                c.totalFuelRequired != null && c.totalFuelRequired !== undefined
                    ? String(c.totalFuelRequired)
                    : '',
            fuelPrice:
                c.fuelPrice != null && c.fuelPrice !== undefined
                    ? String(c.fuelPrice)
                    : '',
            driverFees:
                c.driverFees != null && c.driverFees !== undefined
                    ? String(c.driverFees)
                    : '',
            miscPrice:
                c.miscPrice != null && c.miscPrice !== undefined
                    ? String(c.miscPrice)
                    : '',
            totalDistance:
                c.totalDistance != null && c.totalDistance !== undefined
                    ? String(c.totalDistance)
                    : '',
            averageDeliveryTime:
                c.averageDeliveryTime != null &&
                c.averageDeliveryTime !== undefined
                    ? String(c.averageDeliveryTime)
                    : '',
            deliveryTimeUom: c.deliveryTimeUom ?? 'HOURS',
            notes: c.notes ?? '',
        });

    const handleCapDeleteRow = (c: CapacityForecast) =>
        withBusy(`cap-del-${c.forecastId}`, async () => {
            await deleteCapacityForecast(c.forecastId);
            load();
        });

    const groupColumns: ColumnDef<ConsolidationGroup>[] = [
        {
            id: 'group',
            header: 'Group',
            accessorFn: (row) => row.groupNumber ?? '',
            cell: ({ row }) => {
                const g = row.original;
                return (
                    <div>
                        <div className="font-medium">{g.groupNumber}</div>
                        <div className="text-xs text-muted-foreground">
                            #{g.groupId}
                        </div>
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            id: 'shipments',
            header: 'Shipments',
            accessorFn: (row) => row.shipmentIds?.join(', ') ?? '',
            cell: ({ row }) => (
                <div className="text-xs">
                    {row.original.shipmentIds?.join(', ') || '-'}
                </div>
            ),
        },
        {
            id: 'totals',
            header: 'Totals',
            accessorFn: (row) => row.totalWeight ?? 0,
            cell: ({ row }) => (
                <div className="text-xs">
                    {row.original.totalWeight ?? 0} kg •{' '}
                    {row.original.totalVolume ?? 0} m³
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            accessorFn: (row) => row.status ?? '',
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.status === 'OPEN' ? 'default' : 'secondary'
                    }
                >
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const g = row.original;
                const lockDispatchKey = `group-${g.groupId}`;
                const delKey = `group-del-${g.groupId}`;
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
                        <DropdownMenuContent align="end" className="w-40">
                            {g.status === 'OPEN' && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        setGroupEdit({
                                            id: g.groupId,
                                            notes: g.notes ?? '',
                                        })
                                    }
                                >
                                    <IconEdit className="mr-2 h-4 w-4" />
                                    Edit notes
                                </DropdownMenuItem>
                            )}
                            {g.status === 'OPEN' && (
                                <DropdownMenuItem
                                    disabled={busy === lockDispatchKey}
                                    onClick={() =>
                                        void withBusy(
                                            lockDispatchKey,
                                            async () => {
                                                await transitionGroupStatus(
                                                    g.groupId,
                                                    'LOCKED'
                                                );
                                                load();
                                            }
                                        )
                                    }
                                >
                                    <IconLock className="mr-2 h-4 w-4" />
                                    {busy === lockDispatchKey
                                        ? 'Updating…'
                                        : 'Lock'}
                                </DropdownMenuItem>
                            )}
                            {g.status === 'LOCKED' && (
                                <DropdownMenuItem
                                    disabled={busy === lockDispatchKey}
                                    onClick={() =>
                                        void withBusy(
                                            lockDispatchKey,
                                            async () => {
                                                await transitionGroupStatus(
                                                    g.groupId,
                                                    'IN_TRANSIT'
                                                );
                                                load();
                                            }
                                        )
                                    }
                                >
                                    <IconTruck className="mr-2 h-4 w-4" />
                                    {busy === lockDispatchKey
                                        ? 'Updating…'
                                        : 'Dispatch'}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={busy === delKey}
                                onClick={() =>
                                    void withBusy(delKey, async () => {
                                        await deleteConsolidationGroup(
                                            g.groupId
                                        );
                                        load();
                                    })
                                }
                            >
                                <IconTrash className="mr-2 h-4 w-4" />
                                {busy === delKey ? 'Deleting…' : 'Delete'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const makeCapColumns = (
        showPartnership: boolean
    ): ColumnDef<CapacityForecast>[] => {
        const cols: ColumnDef<CapacityForecast>[] = [
            {
                id: 'lane',
                header: 'Lane',
                accessorFn: (row) =>
                    `${row.originLane ?? '?'} → ${row.destinationLane ?? '?'}`,
                cell: ({ row }) => <CapacityLaneCell c={row.original} />,
                enableHiding: false,
            },
        ];
        if (showPartnership) {
            cols.push({
                id: 'partnership',
                header: 'Partnership',
                accessorFn: (row) => String(row.partnershipId ?? ''),
                cell: ({ row }) => <CapacityPartnershipCell c={row.original} />,
            });
        }
        cols.push(
            {
                id: 'equipment',
                header: 'Equipment',
                accessorFn: (row) => row.equipmentType ?? '',
                cell: ({ row }) => <CapacityEquipmentCell c={row.original} />,
            },
            {
                id: 'period',
                header: 'Period',
                accessorFn: (row) => row.periodStart ?? '',
                cell: ({ row }) => <CapacityPeriodCell c={row.original} />,
            },
            {
                id: 'capacity',
                header: 'Capacity',
                accessorFn: (row) => row.availableCapacity ?? 0,
                cell: ({ row }) => <CapacityDetailCell c={row.original} />,
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const cap = row.original;
                    const delKey = `cap-del-${cap.forecastId}`;
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
                                    onClick={() => handleCapExtendRow(cap)}
                                >
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                    Extend period
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleCapEditRow(cap)}
                                >
                                    <IconEdit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    variant="destructive"
                                    disabled={busy === delKey}
                                    onClick={() => void handleCapDeleteRow(cap)}
                                >
                                    <IconTrash className="mr-2 h-4 w-4" />
                                    {busy === delKey ? 'Deleting…' : 'Delete'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            }
        );
        return cols;
    };

    const stopColumns: ColumnDef<ShipmentStop>[] = [
        {
            accessorKey: 'sequenceNumber',
            header: 'Seq',
            cell: ({ row }) => (
                <div className="font-medium">{row.original.sequenceNumber}</div>
            ),
        },
        {
            accessorKey: 'stopType',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.stopType}</Badge>
            ),
        },
        {
            id: 'location',
            header: 'Location',
            accessorFn: (row) => row.location ?? '',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <div className="text-xs">
                        {s.location ?? '-'}
                        <div className="text-muted-foreground">
                            {s.address ?? ''}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'status',
            header: 'Status',
            accessorFn: (row) => row.status ?? '',
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.status === 'COMPLETED'
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const s = row.original;
                const advKey = `stop-${s.stopId}`;
                const delKey = `stop-del-${s.stopId}`;
                const canAdvance = ['PENDING', 'ARRIVED', 'DEPARTED'].includes(
                    s.status
                );
                const advanceNext =
                    s.status === 'PENDING'
                        ? 'Arrived'
                        : s.status === 'ARRIVED'
                          ? 'Departed'
                          : 'Completed';
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
                        <DropdownMenuContent align="end" className="w-40">
                            {canAdvance && (
                                <DropdownMenuItem
                                    disabled={busy === advKey}
                                    onClick={() =>
                                        void withBusy(advKey, () =>
                                            handleStopAdvance(
                                                s.stopId,
                                                s.status
                                            )
                                        )
                                    }
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    {busy === advKey
                                        ? 'Updating…'
                                        : `Advance (${advanceNext})`}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={busy === delKey}
                                onClick={() =>
                                    void withBusy(delKey, () =>
                                        handleStopRemove(s.stopId)
                                    )
                                }
                            >
                                <IconTrash className="mr-2 h-4 w-4" />
                                {busy === delKey ? 'Deleting…' : 'Remove stop'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const groupsTable = useTables<ConsolidationGroup>({
        data: groups?.content ?? [],
        columns: groupColumns,
        getRowId: (r) => String(r.groupId),
    });

    const publicCapTable = useTables<CapacityForecast>({
        data: publicCapacities,
        columns: makeCapColumns(false),
        getRowId: (r) => String(r.forecastId),
    });

    const dedicatedCapTable = useTables<CapacityForecast>({
        data: dedicatedCapacities,
        columns: makeCapColumns(true),
        getRowId: (r) => String(r.forecastId),
    });

    const stopsTable = useTables<ShipmentStop>({
        data: stops,
        columns: stopColumns,
        getRowId: (r) => String(r.stopId),
    });

    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Routing</h1>
                <div className="flex gap-2">
                    <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Consolidation Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    New Consolidation Group
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={groupNotes}
                                        onChange={(e) =>
                                            setGroupNotes(e.target.value)
                                        }
                                        placeholder="Lane, trailer, ..."
                                    />
                                </div>
                                <LoadingButton
                                    loading={busy === 'group-create'}
                                    onClick={() =>
                                        withBusy(
                                            'group-create',
                                            handleGroupCreate
                                        )
                                    }
                                >
                                    Create
                                </LoadingButton>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={capOpen} onOpenChange={setCapOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Capacity Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="md:max-w-4xl h-[90dvh] *:overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>New Capacity Entry</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 slim-scrollbar">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Origin Lane</Label>
                                        <Input
                                            placeholder="e.g. Mumbai"
                                            value={capForm.originLane}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    originLane: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Destination Lane</Label>
                                        <Input
                                            placeholder="e.g. Pune"
                                            value={capForm.destinationLane}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    destinationLane:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Equipment</Label>
                                        <Input
                                            placeholder="e.g. TRUCK"
                                            value={capForm.equipmentType}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    equipmentType:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Transport Mode</Label>
                                        <Select
                                            value={
                                                capForm.transportMode || 'NONE'
                                            }
                                            onValueChange={(v) =>
                                                setCapForm({
                                                    ...capForm,
                                                    transportMode:
                                                        v === 'NONE' ? '' : v,
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NONE">
                                                    Not set
                                                </SelectItem>
                                                {TRANSPORT_MODES.map((m) => (
                                                    <SelectItem
                                                        key={m}
                                                        value={m}
                                                    >
                                                        {m}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>From (YYYY-MM-DD)</Label>
                                        <Input
                                            placeholder="e.g. 2026-10-01"
                                            value={capForm.periodStart}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    periodStart: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>To (YYYY-MM-DD)</Label>
                                        <Input
                                            placeholder="e.g. 2026-12-31"
                                            value={capForm.periodEnd}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    periodEnd: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Available Capacity</Label>
                                        <Input
                                            placeholder="e.g. 40"
                                            type="number"
                                            value={capForm.availableCapacity}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    availableCapacity:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Unit</Label>
                                        <Select
                                            value={capForm.capacityUnit}
                                            onValueChange={(v) =>
                                                setCapForm({
                                                    ...capForm,
                                                    capacityUnit: v,
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CAPACITY_UNITS.map((u) => (
                                                    <SelectItem
                                                        key={u}
                                                        value={u}
                                                    >
                                                        {capacityUnitLabel(u)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>
                                            Price per{' '}
                                            {capacityUnitLabel(
                                                capForm.capacityUnit
                                            ).replace(/s$/, '')}
                                        </Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 1200"
                                            value={capForm.unitPrice}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    unitPrice: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Currency</Label>
                                        <Input
                                            placeholder="USD"
                                            value={capForm.currency}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    currency:
                                                        e.target.value.toUpperCase(),
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 rounded-md border p-3">
                                    <p className="text-sm font-medium">
                                        Fuel & cost breakup
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="grid gap-2">
                                            <Label>Total fuel (L)</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 120"
                                                value={
                                                    capForm.totalFuelRequired
                                                }
                                                onChange={(e) =>
                                                    setCapForm({
                                                        ...capForm,
                                                        totalFuelRequired:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Fuel price / L</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 90"
                                                value={capForm.fuelPrice}
                                                onChange={(e) =>
                                                    setCapForm({
                                                        ...capForm,
                                                        fuelPrice:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>
                                                Fuel surcharge (auto = fuel ×
                                                price)
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="auto"
                                                value={String(
                                                    capForm.totalFuelRequired &&
                                                        capForm.fuelPrice
                                                        ? Math.round(
                                                              Number(
                                                                  capForm.totalFuelRequired
                                                              ) *
                                                                  Number(
                                                                      capForm.fuelPrice
                                                                  ) *
                                                                  100
                                                          ) / 100
                                                        : ''
                                                )}
                                                disabled
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-2">
                                            <Label>Driver&apos;s fees</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 3000"
                                                value={capForm.driverFees}
                                                onChange={(e) =>
                                                    setCapForm({
                                                        ...capForm,
                                                        driverFees:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Misc price</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 500"
                                                value={capForm.miscPrice}
                                                onChange={(e) =>
                                                    setCapForm({
                                                        ...capForm,
                                                        miscPrice:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Total distance (km)</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 850"
                                            value={capForm.totalDistance}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    totalDistance:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Avg. delivery time</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 18"
                                            value={capForm.averageDeliveryTime}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    averageDeliveryTime:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Time unit</Label>
                                        <Select
                                            value={capForm.deliveryTimeUom}
                                            onValueChange={(v) =>
                                                setCapForm({
                                                    ...capForm,
                                                    deliveryTimeUom: v,
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HOURS">
                                                    Hours
                                                </SelectItem>
                                                <SelectItem value="DAYS">
                                                    Days
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {isUnitizedCapacityUnit(
                                    capForm.capacityUnit
                                ) && (
                                    <div className="grid gap-3 rounded-md border p-3">
                                        <p className="text-sm font-medium">
                                            Unit specifications (per{' '}
                                            {capacityUnitLabel(
                                                capForm.capacityUnit
                                            ).replace(/s$/, '')}
                                            )
                                        </p>
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="grid gap-2">
                                                <Label>Length</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 12"
                                                    value={capForm.unitLength}
                                                    onChange={(e) =>
                                                        setCapForm({
                                                            ...capForm,
                                                            unitLength:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Width</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 2.4"
                                                    value={capForm.unitWidth}
                                                    onChange={(e) =>
                                                        setCapForm({
                                                            ...capForm,
                                                            unitWidth:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Height</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 2.6"
                                                    value={capForm.unitHeight}
                                                    onChange={(e) =>
                                                        setCapForm({
                                                            ...capForm,
                                                            unitHeight:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Dim. unit</Label>
                                                <Select
                                                    value={capForm.dimensionUom}
                                                    onValueChange={(v) =>
                                                        setCapForm({
                                                            ...capForm,
                                                            dimensionUom: v,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="M">
                                                            Meters
                                                        </SelectItem>
                                                        <SelectItem value="FT">
                                                            Feet
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-2">
                                                <Label>
                                                    Total volume per unit
                                                    (optional — auto from L×W×H)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 76"
                                                    value={capForm.unitVolume}
                                                    onChange={(e) =>
                                                        setCapForm({
                                                            ...capForm,
                                                            unitVolume:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Volume unit</Label>
                                                <Select
                                                    value={capForm.volumeUom}
                                                    onValueChange={(v) =>
                                                        setCapForm({
                                                            ...capForm,
                                                            volumeUom: v,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CBM">
                                                            CBM
                                                        </SelectItem>
                                                        <SelectItem value="CFT">
                                                            CFT
                                                        </SelectItem>
                                                        <SelectItem value="L">
                                                            Litres
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <LoadingButton
                                    loading={busy === 'cap-create'}
                                    onClick={() =>
                                        withBusy('cap-create', handleCapCreate)
                                    }
                                >
                                    Create
                                </LoadingButton>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Tabs defaultValue="consolidation">
                <TabsList>
                    <TabsTrigger value="consolidation">
                        Consolidation
                    </TabsTrigger>
                    <TabsTrigger value="capacity">Capacity</TabsTrigger>
                    <TabsTrigger value="stops">Shipment Stops</TabsTrigger>
                </TabsList>
                <TabsContent value="consolidation" className="space-y-4">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Search groups"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Input
                                    placeholder="Group ID"
                                    value={addForm.groupId}
                                    onChange={(e) =>
                                        setAddForm({
                                            ...addForm,
                                            groupId: e.target.value,
                                        })
                                    }
                                    className="max-w-36"
                                />
                                <Input
                                    placeholder="Shipment IDs (1,2,3)"
                                    value={addForm.shipmentIds}
                                    onChange={(e) =>
                                        setAddForm({
                                            ...addForm,
                                            shipmentIds: e.target.value,
                                        })
                                    }
                                    className="max-w-56"
                                />
                                <LoadingButton
                                    loading={busy === 'group-add'}
                                    variant="outline"
                                    onClick={() =>
                                        withBusy(
                                            'group-add',
                                            handleAddShipments
                                        )
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </LoadingButton>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <CentralizedDataTable
                                    table={groupsTable}
                                    emptyMessage="No groups"
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="capacity" className="space-y-4">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>
                                Public Route Capacities (
                                {publicCapacities.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <CentralizedDataTable
                                    table={publicCapTable}
                                    emptyMessage="No public routes"
                                />
                            )}
                        </CardContent>
                    </Card>
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>
                                Dedicated Partnership Routes (
                                {dedicatedCapacities.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="pb-2 text-sm text-muted-foreground">
                                Lanes reserved for one long-term partnership
                                each — hidden from the public marketplace.
                            </p>
                            {loading ? (
                                <TableSkeleton rows={3} />
                            ) : (
                                <CentralizedDataTable
                                    table={dedicatedCapTable}
                                    emptyMessage="No dedicated routes"
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="stops">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Shipment ID"
                                    type="number"
                                    value={stopsShipmentId}
                                    onChange={(e) =>
                                        setStopsShipmentId(e.target.value)
                                    }
                                    className="max-w-36"
                                />
                                <LoadingButton
                                    loading={busy === 'stops-load'}
                                    variant="outline"
                                    onClick={() =>
                                        withBusy('stops-load', handleStopsLoad)
                                    }
                                >
                                    Load Stops
                                </LoadingButton>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!stopsLoaded ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Enter a shipment ID to view its multi-stop
                                    route
                                </div>
                            ) : (
                                <CentralizedDataTable
                                    table={stopsTable}
                                    emptyMessage="No stops on this shipment yet"
                                />
                            )}
                            {stopsLoaded && (
                                <div className="grid gap-6 border-t pt-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="grid gap-2">
                                            <Label>Sequence</Label>
                                            <Input
                                                placeholder="e.g. 1"
                                                type="number"
                                                value={stopForm.sequenceNumber}
                                                onChange={(e) =>
                                                    setStopForm({
                                                        ...stopForm,
                                                        sequenceNumber:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Type</Label>
                                            <Input
                                                placeholder="e.g. DELIVERY"
                                                value={stopForm.stopType}
                                                onChange={(e) =>
                                                    setStopForm({
                                                        ...stopForm,
                                                        stopType:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>
                                                Scheduled (YYYY-MM-DD)
                                            </Label>
                                            <Input
                                                placeholder="e.g. 2026-10-15"
                                                value={stopForm.scheduledDate}
                                                onChange={(e) =>
                                                    setStopForm({
                                                        ...stopForm,
                                                        scheduledDate:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-2">
                                            <Label>Location</Label>
                                            <Input
                                                placeholder="e.g. Mumbai Hub"
                                                value={stopForm.location}
                                                onChange={(e) =>
                                                    setStopForm({
                                                        ...stopForm,
                                                        location:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Address</Label>
                                            <Input
                                                placeholder="e.g. Plot 7, MIDC Andheri"
                                                value={stopForm.address}
                                                onChange={(e) =>
                                                    setStopForm({
                                                        ...stopForm,
                                                        address: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={stopForm.notes}
                                            onChange={(e) =>
                                                setStopForm({
                                                    ...stopForm,
                                                    notes: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. Call consignee before arrival"
                                        />
                                    </div>
                                    <LoadingButton
                                        loading={busy === 'stop-add'}
                                        onClick={() =>
                                            withBusy('stop-add', handleStopAdd)
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Stop
                                    </LoadingButton>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Dialog
                open={groupEdit != null}
                onOpenChange={(v) => {
                    if (!v) setGroupEdit(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Consolidation Group</DialogTitle>
                        <DialogDescription>
                            Only open groups can be edited
                        </DialogDescription>
                    </DialogHeader>
                    {groupEdit && (
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={groupEdit.notes}
                                    onChange={(e) =>
                                        setGroupEdit({
                                            ...groupEdit,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="Lane, trailer, ..."
                                />
                            </div>
                            <LoadingButton
                                loading={busy === 'group-update'}
                                onClick={() =>
                                    withBusy('group-update', handleGroupUpdate)
                                }
                            >
                                Save
                            </LoadingButton>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog
                open={capEdit != null}
                onOpenChange={(v) => {
                    if (!v) setCapEdit(null);
                }}
            >
                <DialogContent className="md:max-w-4xl h-[90dvh] *:overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Capacity Entry</DialogTitle>
                        <DialogDescription>
                            Update lane capacity
                        </DialogDescription>
                    </DialogHeader>
                    {capEdit && (
                        <div className="grid gap-6 slim-scrollbar">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Origin Lane</Label>
                                    <Input
                                        value={capEdit.originLane}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                originLane: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Mumbai"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Destination Lane</Label>
                                    <Input
                                        value={capEdit.destinationLane}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                destinationLane: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Pune"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Equipment</Label>
                                    <Input
                                        value={capEdit.equipmentType}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                equipmentType: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. TRUCK"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Transport Mode</Label>
                                    <Select
                                        value={capEdit.transportMode || 'NONE'}
                                        onValueChange={(v) =>
                                            setCapEdit({
                                                ...capEdit,
                                                transportMode:
                                                    v === 'NONE' ? '' : v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">
                                                Not set
                                            </SelectItem>
                                            {TRANSPORT_MODES.map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>From (YYYY-MM-DD)</Label>
                                    <Input
                                        value={capEdit.periodStart}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                periodStart: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 2026-10-01"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>To (YYYY-MM-DD)</Label>
                                    <Input
                                        value={capEdit.periodEnd}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                periodEnd: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 2026-12-31"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label>Available Capacity</Label>
                                    <Input
                                        type="number"
                                        value={capEdit.availableCapacity}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                availableCapacity:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 40"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Booked Capacity</Label>
                                    <Input
                                        type="number"
                                        value={capEdit.bookedCapacity}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                bookedCapacity: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 10"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Unit</Label>
                                    <Select
                                        value={capEdit.capacityUnit}
                                        onValueChange={(v) =>
                                            setCapEdit({
                                                ...capEdit,
                                                capacityUnit: v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CAPACITY_UNITS.map((u) => (
                                                <SelectItem key={u} value={u}>
                                                    {capacityUnitLabel(u)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>
                                        Price per{' '}
                                        {capacityUnitLabel(
                                            capEdit.capacityUnit
                                        ).replace(/s$/, '')}
                                    </Label>
                                    <Input
                                        type="number"
                                        value={capEdit.unitPrice}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                unitPrice: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 1200"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Currency</Label>
                                    <Input
                                        value={capEdit.currency}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                currency:
                                                    e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="USD"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-3 rounded-md border p-3">
                                <p className="text-sm font-medium">
                                    Fuel & cost breakup
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Total fuel (L)</Label>
                                        <Input
                                            type="number"
                                            value={capEdit.totalFuelRequired}
                                            onChange={(e) =>
                                                setCapEdit({
                                                    ...capEdit,
                                                    totalFuelRequired:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="e.g. 120"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Fuel price / L</Label>
                                        <Input
                                            type="number"
                                            value={capEdit.fuelPrice}
                                            onChange={(e) =>
                                                setCapEdit({
                                                    ...capEdit,
                                                    fuelPrice: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. 90"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>
                                            Fuel surcharge (auto = fuel × price)
                                        </Label>
                                        <Input
                                            type="number"
                                            placeholder="auto"
                                            value={String(
                                                capEdit.totalFuelRequired &&
                                                    capEdit.fuelPrice
                                                    ? Math.round(
                                                          Number(
                                                              capEdit.totalFuelRequired
                                                          ) *
                                                              Number(
                                                                  capEdit.fuelPrice
                                                              ) *
                                                              100
                                                      ) / 100
                                                    : ''
                                            )}
                                            disabled
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Driver&apos;s fees</Label>
                                        <Input
                                            type="number"
                                            value={capEdit.driverFees}
                                            onChange={(e) =>
                                                setCapEdit({
                                                    ...capEdit,
                                                    driverFees: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. 3000"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Misc price</Label>
                                        <Input
                                            type="number"
                                            value={capEdit.miscPrice}
                                            onChange={(e) =>
                                                setCapEdit({
                                                    ...capEdit,
                                                    miscPrice: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. 500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label>Total distance (km)</Label>
                                    <Input
                                        type="number"
                                        value={capEdit.totalDistance}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                totalDistance: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 850"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Avg. delivery time</Label>
                                    <Input
                                        type="number"
                                        value={capEdit.averageDeliveryTime}
                                        onChange={(e) =>
                                            setCapEdit({
                                                ...capEdit,
                                                averageDeliveryTime:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 18"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Time unit</Label>
                                    <Select
                                        value={capEdit.deliveryTimeUom}
                                        onValueChange={(v) =>
                                            setCapEdit({
                                                ...capEdit,
                                                deliveryTimeUom: v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HOURS">
                                                Hours
                                            </SelectItem>
                                            <SelectItem value="DAYS">
                                                Days
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {isUnitizedCapacityUnit(capEdit.capacityUnit) && (
                                <div className="grid gap-3 rounded-md border p-3">
                                    <p className="text-sm font-medium">
                                        Unit specifications (per{' '}
                                        {capacityUnitLabel(
                                            capEdit.capacityUnit
                                        ).replace(/s$/, '')}
                                        )
                                    </p>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="grid gap-2">
                                            <Label>Length</Label>
                                            <Input
                                                type="number"
                                                value={capEdit.unitLength}
                                                onChange={(e) =>
                                                    setCapEdit({
                                                        ...capEdit,
                                                        unitLength:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="e.g. 12"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Width</Label>
                                            <Input
                                                type="number"
                                                value={capEdit.unitWidth}
                                                onChange={(e) =>
                                                    setCapEdit({
                                                        ...capEdit,
                                                        unitWidth:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="e.g. 2.4"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Height</Label>
                                            <Input
                                                type="number"
                                                value={capEdit.unitHeight}
                                                onChange={(e) =>
                                                    setCapEdit({
                                                        ...capEdit,
                                                        unitHeight:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="e.g. 2.6"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Dim. unit</Label>
                                            <Select
                                                value={capEdit.dimensionUom}
                                                onValueChange={(v) =>
                                                    setCapEdit({
                                                        ...capEdit,
                                                        dimensionUom: v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="M">
                                                        Meters
                                                    </SelectItem>
                                                    <SelectItem value="FT">
                                                        Feet
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-2">
                                            <Label>
                                                Total volume per unit (optional
                                                — auto from L×W×H)
                                            </Label>
                                            <Input
                                                type="number"
                                                value={capEdit.unitVolume}
                                                onChange={(e) =>
                                                    setCapEdit({
                                                        ...capEdit,
                                                        unitVolume:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="e.g. 76"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Volume unit</Label>
                                            <Select
                                                value={capEdit.volumeUom}
                                                onValueChange={(v) =>
                                                    setCapEdit({
                                                        ...capEdit,
                                                        volumeUom: v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CBM">
                                                        CBM
                                                    </SelectItem>
                                                    <SelectItem value="CFT">
                                                        CFT
                                                    </SelectItem>
                                                    <SelectItem value="L">
                                                        Litres
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={capEdit.notes}
                                    onChange={(e) =>
                                        setCapEdit({
                                            ...capEdit,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Handle with care"
                                />
                            </div>
                            <LoadingButton
                                loading={busy === 'cap-update'}
                                onClick={() =>
                                    withBusy('cap-update', handleCapUpdate)
                                }
                            >
                                Save
                            </LoadingButton>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog
                open={capExtend != null}
                onOpenChange={(v) => {
                    if (!v) setCapExtend(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Extend capacity for LONG_TERM partner
                        </DialogTitle>
                        <DialogDescription>
                            Current period ends {capExtend?.periodEnd ?? '—'}.
                            Only LONG_TERM partnerships qualify — the partner
                            supplier keeps logistics flexibility beyond the
                            current window.
                        </DialogDescription>
                    </DialogHeader>
                    {capExtend && (
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Partnership ID (LONG_TERM)</Label>
                                <Input
                                    type="number"
                                    value={capExtend.partnershipId}
                                    onChange={(e) =>
                                        setCapExtend({
                                            ...capExtend,
                                            partnershipId: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 12"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>New period end (YYYY-MM-DD)</Label>
                                <Input
                                    type="date"
                                    value={capExtend.newPeriodEnd}
                                    onChange={(e) =>
                                        setCapExtend({
                                            ...capExtend,
                                            newPeriodEnd: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <LoadingButton
                                loading={busy === 'cap-extend'}
                                onClick={() =>
                                    withBusy('cap-extend', async () => {
                                        await extendCapacityForPartnership(
                                            capExtend.id,
                                            {
                                                partnershipId: Number(
                                                    capExtend.partnershipId
                                                ),
                                                newPeriodEnd:
                                                    capExtend.newPeriodEnd,
                                            }
                                        );
                                        toast({
                                            title: 'Capacity period extended',
                                            variant: 'success',
                                        });
                                        setCapExtend(null);
                                        load();
                                    })
                                }
                            >
                                Extend Period
                            </LoadingButton>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
