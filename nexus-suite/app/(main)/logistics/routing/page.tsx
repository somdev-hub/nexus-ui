'use client';
import { useEffect, useState } from 'react';
import { CalendarClock, Check, Pencil, Plus, Trash2 } from 'lucide-react';
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
        periodStart: '',
        periodEnd: '',
        availableCapacity: '',
        capacityUnit: 'KG',
        unitPrice: '',
        currency: 'USD',
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
        periodStart: string;
        periodEnd: string;
        availableCapacity: string;
        bookedCapacity: string;
        capacityUnit: string;
        unitPrice: string;
        currency: string;
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
                    size: 20,
                    search: search || undefined,
                }),
                getCapacityForecasts({
                    page: 0,
                    size: 20,
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
    }, []);
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
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
                periodStart: capForm.periodStart || undefined,
                periodEnd: capForm.periodEnd || undefined,
                availableCapacity: capForm.availableCapacity
                    ? Number(capForm.availableCapacity)
                    : undefined,
                capacityUnit: capForm.capacityUnit as CapacityForecast['capacityUnit'],
                unitPrice: capForm.unitPrice
                    ? Number(capForm.unitPrice)
                    : undefined,
                currency: capForm.currency || undefined,
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
                periodStart: capEdit.periodStart || undefined,
                periodEnd: capEdit.periodEnd || undefined,
                availableCapacity: capEdit.availableCapacity
                    ? Number(capEdit.availableCapacity)
                    : undefined,
                bookedCapacity: capEdit.bookedCapacity
                    ? Number(capEdit.bookedCapacity)
                    : undefined,
                capacityUnit: capEdit.capacityUnit as CapacityForecast['capacityUnit'],
                unitPrice: capEdit.unitPrice
                    ? Number(capEdit.unitPrice)
                    : undefined,
                currency: capEdit.currency || undefined,
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
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Capacity Entry</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6">
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
                                <div className="grid grid-cols-3 gap-3">
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
                                                    currency: e.target.value.toUpperCase(),
                                                })
                                            }
                                        />
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
                                                    value={
                                                        capForm.dimensionUom
                                                    }
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
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Group</TableHead>
                                            <TableHead>Shipments</TableHead>
                                            <TableHead>Totals</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groups?.content?.map((g) => (
                                            <TableRow key={g.groupId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {g.groupNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        #{g.groupId}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {g.shipmentIds?.join(
                                                        ', '
                                                    ) || '-'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {g.totalWeight ?? 0} kg •{' '}
                                                    {g.totalVolume ?? 0} m³
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            g.status === 'OPEN'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {g.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {g.status ===
                                                            'OPEN' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                title="Edit group"
                                                                onClick={() =>
                                                                    setGroupEdit(
                                                                        {
                                                                            id: g.groupId,
                                                                            notes:
                                                                                g.notes ??
                                                                                '',
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {g.status ===
                                                            'OPEN' && (
                                                            <LoadingButton
                                                                loading={
                                                                    busy ===
                                                                    `group-${g.groupId}`
                                                                }
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    withBusy(
                                                                        `group-${g.groupId}`,
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
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Lock
                                                            </LoadingButton>
                                                        )}
                                                        {g.status ===
                                                            'LOCKED' && (
                                                            <LoadingButton
                                                                loading={
                                                                    busy ===
                                                                    `group-${g.groupId}`
                                                                }
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    withBusy(
                                                                        `group-${g.groupId}`,
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
                                                                Dispatch
                                                            </LoadingButton>
                                                        )}
                                                        <LoadingButton
                                                            loading={
                                                                busy ===
                                                                `group-del-${g.groupId}`
                                                            }
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                withBusy(
                                                                    `group-del-${g.groupId}`,
                                                                    async () => {
                                                                        await deleteConsolidationGroup(
                                                                            g.groupId
                                                                        );
                                                                        load();
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </LoadingButton>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!groups?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No groups
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="capacity">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>
                                Available Capacity by Lane & Equipment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lane</TableHead>
                                            <TableHead>Equipment</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Capacity</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {capacity?.content?.map((c) => (
                                            <TableRow key={c.forecastId}>
                                                <TableCell className="text-xs">
                                                    {c.originLane ?? '?'} →{' '}
                                                    {c.destinationLane ?? '?'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {c.equipmentType ?? '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {c.periodStart ?? '-'} →{' '}
                                                    {c.periodEnd ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span>
                                                        avail{' '}
                                                        {c.availableCapacity ??
                                                            0}{' '}
                                                        {capacityUnitLabel(
                                                            c.capacityUnit
                                                        )}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {' '}
                                                        • booked{' '}
                                                        {c.bookedCapacity ??
                                                            0}
                                                    </span>
                                                    {formatUnitSpecs(c) && (
                                                        <span className="block text-muted-foreground">
                                                            {formatUnitSpecs(c)}
                                                        </span>
                                                    )}
                                                    {c.unitPrice !== undefined &&
                                                        c.unitPrice !== null && (
                                                            <span className="block font-medium">
                                                                {c.unitPrice}{' '}
                                                                {c.currency ??
                                                                    'USD'}{' '}
                                                                /{' '}
                                                                {capacityUnitLabel(
                                                                    c.capacityUnit
                                                                ).replace(
                                                                    /s$/,
                                                                    ''
                                                                )}
                                                            </span>
                                                        )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Extend period for LONG_TERM partner"
                                                            onClick={() =>
                                                                setCapExtend({
                                                                    id: c.forecastId,
                                                                    periodEnd:
                                                                        c.periodEnd ??
                                                                        '',
                                                                    partnershipId:
                                                                        '',
                                                                    newPeriodEnd:
                                                                        c.periodEnd ??
                                                                        '',
                                                                })
                                                            }
                                                        >
                                                            <CalendarClock className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Edit capacity"
                                                            onClick={() =>
                                                                setCapEdit({
                                                                    id: c.forecastId,
                                                                    originLane:
                                                                        c.originLane ??
                                                                        '',
                                                                    destinationLane:
                                                                        c.destinationLane ??
                                                                        '',
                                                                    equipmentType:
                                                                        c.equipmentType ??
                                                                        'TRUCK',
                                                                    periodStart:
                                                                        c.periodStart ??
                                                                        '',
                                                                    periodEnd:
                                                                        c.periodEnd ??
                                                                        '',
                                                                    availableCapacity:
                                                                        c.availableCapacity !=
                                                                        null
                                                                            ? String(
                                                                                  c.availableCapacity
                                                                              )
                                                                            : '',
                                                                    bookedCapacity:
                                                                        c.bookedCapacity !=
                                                                        null
                                                                            ? String(
                                                                                  c.bookedCapacity
                                                                              )
                                                                            : '',
                                                                    capacityUnit:
                                                                        c.capacityUnit ??
                                                                        'KG',
                                                                    unitLength:
                                                                        c.unitLength !=
                                                                        null &&
                                                                        c.unitLength !==
                                                                            undefined
                                                                            ? String(
                                                                                  c.unitLength
                                                                              )
                                                                            : '',
                                                                    unitWidth:
                                                                        c.unitWidth !=
                                                                        null &&
                                                                        c.unitWidth !==
                                                                            undefined
                                                                            ? String(
                                                                                  c.unitWidth
                                                                              )
                                                                            : '',
                                                                    unitHeight:
                                                                        c.unitHeight !=
                                                                        null &&
                                                                        c.unitHeight !==
                                                                            undefined
                                                                            ? String(
                                                                                  c.unitHeight
                                                                              )
                                                                            : '',
                                                                    dimensionUom:
                                                                        c.dimensionUom ??
                                                                        'M',
                                                                    unitVolume:
                                                                        c.unitVolume !=
                                                                        null &&
                                                                        c.unitVolume !==
                                                                            undefined
                                                                            ? String(
                                                                                  c.unitVolume
                                                                              )
                                                                            : '',
                                                                    volumeUom:
                                                                        c.volumeUom ??
                                                                        'CBM',
                                                                    unitPrice:
                                                                        c.unitPrice !=
                                                                        null &&
                                                                        c.unitPrice !==
                                                                            undefined
                                                                            ? String(
                                                                                  c.unitPrice
                                                                              )
                                                                            : '',
                                                                    currency:
                                                                        c.currency ??
                                                                        'USD',
                                                                    notes:
                                                                        c.notes ??
                                                                        '',
                                                                })
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <LoadingButton
                                                            loading={
                                                                busy ===
                                                                `cap-del-${c.forecastId}`
                                                            }
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                withBusy(
                                                                    `cap-del-${c.forecastId}`,
                                                                    async () => {
                                                                        await deleteCapacityForecast(
                                                                            c.forecastId
                                                                        );
                                                                        load();
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </LoadingButton>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!capacity?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No capacity entries
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
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
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Seq</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stops.map((s) => (
                                            <TableRow key={s.stopId}>
                                                <TableCell className="font-medium">
                                                    {s.sequenceNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {s.stopType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {s.location ?? '-'}
                                                    <div className="text-muted-foreground">
                                                        {s.address ?? ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            s.status ===
                                                            'COMPLETED'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {s.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {[
                                                            'PENDING',
                                                            'ARRIVED',
                                                            'DEPARTED',
                                                        ].includes(
                                                            s.status
                                                        ) && (
                                                            <LoadingButton
                                                                loading={
                                                                    busy ===
                                                                    `stop-${s.stopId}`
                                                                }
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    withBusy(
                                                                        `stop-${s.stopId}`,
                                                                        () =>
                                                                            handleStopAdvance(
                                                                                s.stopId,
                                                                                s.status
                                                                            )
                                                                    )
                                                                }
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Advance
                                                            </LoadingButton>
                                                        )}
                                                        <LoadingButton
                                                            loading={
                                                                busy ===
                                                                `stop-del-${s.stopId}`
                                                            }
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                withBusy(
                                                                    `stop-del-${s.stopId}`,
                                                                    () =>
                                                                        handleStopRemove(
                                                                            s.stopId
                                                                        )
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </LoadingButton>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!stops.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No stops on this shipment
                                                    yet
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Capacity Entry</DialogTitle>
                        <DialogDescription>
                            Update lane capacity
                        </DialogDescription>
                    </DialogHeader>
                    {capEdit && (
                        <div className="grid gap-6">
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
                            <div className="grid grid-cols-3 gap-3">
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
                            {isUnitizedCapacityUnit(
                                capEdit.capacityUnit
                            ) && (
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
                                                Total volume per unit
                                                (optional — auto from L×W×H)
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
