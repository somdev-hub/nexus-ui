'use client';
import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
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
    } from '@/lib/services/logistics-ops-service';
import { useToast } from '@/hooks/use-toast';
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
    const [groupNotes, setGroupNotes] = useState('');
    const [addForm, setAddForm] = useState({ groupId: '', shipmentIds: '' });
    const [capForm, setCapForm] = useState({
        originLane: '',
        destinationLane: '',
        equipmentType: 'TRUCK',
        periodStart: '',
        periodEnd: '',
        availableCapacity: '',
    });
    const [busy, setBusy] = useState<string | null>(null);
    const [groupEdit, setGroupEdit] = useState<{ id: number; notes: string } | null>(null);
    const [capEdit, setCapEdit] = useState<{
        id: number;
        originLane: string;
        destinationLane: string;
        equipmentType: string;
        periodStart: string;
        periodEnd: string;
        availableCapacity: string;
        bookedCapacity: string;
        notes: string;
    } | null>(null);
    const withBusy = async (key: string, fn: () => Promise<unknown>) => {
        if (busy) return;
        setBusy(key);
        try {
            await fn();
        } catch (e: unknown) {
            toast({ title: e instanceof Error ? e.message : String(e), variant: 'destructive' });
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

    const handleGroupUpdate = async () => {
        if (!groupEdit) return;
        try {
            await updateGroup(groupEdit.id, { notes: groupEdit.notes || undefined });
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
        try {
            await updateCapacity(capEdit.id, {
                originLane: capEdit.originLane || undefined,
                destinationLane: capEdit.destinationLane || undefined,
                equipmentType: capEdit.equipmentType as CapacityForecast['equipmentType'],
                periodStart: capEdit.periodStart || undefined,
                periodEnd: capEdit.periodEnd || undefined,
                availableCapacity: capEdit.availableCapacity
                    ? Number(capEdit.availableCapacity)
                    : undefined,
                bookedCapacity: capEdit.bookedCapacity ? Number(capEdit.bookedCapacity) : undefined,
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
                                <LoadingButton loading={busy === 'group-create'} onClick={() => withBusy('group-create', handleGroupCreate)}>
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
                                        <Input placeholder="e.g. Mumbai"
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
                                        <Input placeholder="e.g. Pune"
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
                                        <Input placeholder="e.g. TRUCK"
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
                                        <Input placeholder="e.g. 2026-10-01"
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
                                        <Input placeholder="e.g. 2026-12-31"
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
                                <div className="grid gap-2">
                                    <Label>Available Capacity</Label>
                                    <Input placeholder="e.g. 40"
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
                                <LoadingButton loading={busy === 'cap-create'} onClick={() => withBusy('cap-create', handleCapCreate)}>
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
                                    onClick={() => withBusy('group-add', handleAddShipments)}
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
                                                        {g.status === 'OPEN' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                title="Edit group"
                                                                onClick={() =>
                                                                    setGroupEdit({
                                                                        id: g.groupId,
                                                                        notes: g.notes ?? '',
                                                                    })
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {g.status ===
                                                            'OPEN' && (
                                                            <LoadingButton
                                                                loading={busy === `group-${g.groupId}`}
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => withBusy(`group-${g.groupId}`, async () => {
                                                                    await transitionGroupStatus(
                                                                        g.groupId,
                                                                        'LOCKED'
                                                                    );
                                                                    load();
                                                                })}
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Lock
                                                            </LoadingButton>
                                                        )}
                                                        {g.status ===
                                                            'LOCKED' && (
                                                            <LoadingButton
                                                                loading={busy === `group-${g.groupId}`}
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => withBusy(`group-${g.groupId}`, async () => {
                                                                    await transitionGroupStatus(
                                                                        g.groupId,
                                                                        'IN_TRANSIT'
                                                                    );
                                                                    load();
                                                                })}
                                                            >
                                                                Dispatch
                                                            </LoadingButton>
                                                        )}
                                                        <LoadingButton
                                                            loading={busy === `group-del-${g.groupId}`}
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => withBusy(`group-del-${g.groupId}`, async () => {
                                                                await deleteConsolidationGroup(
                                                                    g.groupId
                                                                );
                                                                load();
                                                            })}
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
                                                    avail{' '}
                                                    {c.availableCapacity ?? 0} •
                                                    booked{' '}
                                                    {c.bookedCapacity ?? 0}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Edit capacity"
                                                            onClick={() =>
                                                                setCapEdit({
                                                                    id: c.forecastId,
                                                                    originLane: c.originLane ?? '',
                                                                    destinationLane: c.destinationLane ?? '',
                                                                    equipmentType: c.equipmentType ?? 'TRUCK',
                                                                    periodStart: c.periodStart ?? '',
                                                                    periodEnd: c.periodEnd ?? '',
                                                                    availableCapacity:
                                                                        c.availableCapacity != null
                                                                            ? String(c.availableCapacity)
                                                                            : '',
                                                                    bookedCapacity:
                                                                        c.bookedCapacity != null
                                                                            ? String(c.bookedCapacity)
                                                                            : '',
                                                                    notes: c.notes ?? '',
                                                                })
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <LoadingButton
                                                            loading={busy === `cap-del-${c.forecastId}`}
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => withBusy(`cap-del-${c.forecastId}`, async () => {
                                                                await deleteCapacityForecast(
                                                                    c.forecastId
                                                                );
                                                                load();
                                                            })}
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
            </Tabs>
            <Dialog open={groupEdit != null} onOpenChange={(v) => { if (!v) setGroupEdit(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Consolidation Group</DialogTitle>
                        <DialogDescription>Only open groups can be edited</DialogDescription>
                    </DialogHeader>
                    {groupEdit && (
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea value={groupEdit.notes} onChange={(e) => setGroupEdit({ ...groupEdit, notes: e.target.value })} placeholder="Lane, trailer, ..." />
                            </div>
                            <LoadingButton loading={busy === 'group-update'} onClick={() => withBusy('group-update', handleGroupUpdate)}>Save</LoadingButton>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={capEdit != null} onOpenChange={(v) => { if (!v) setCapEdit(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Capacity Entry</DialogTitle>
                        <DialogDescription>Update lane capacity</DialogDescription>
                    </DialogHeader>
                    {capEdit && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Origin Lane</Label>
                                    <Input value={capEdit.originLane} onChange={(e) => setCapEdit({ ...capEdit, originLane: e.target.value })} placeholder="e.g. Mumbai" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Destination Lane</Label>
                                    <Input value={capEdit.destinationLane} onChange={(e) => setCapEdit({ ...capEdit, destinationLane: e.target.value })} placeholder="e.g. Pune" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label>Equipment</Label>
                                    <Input value={capEdit.equipmentType} onChange={(e) => setCapEdit({ ...capEdit, equipmentType: e.target.value })} placeholder="e.g. TRUCK" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>From (YYYY-MM-DD)</Label>
                                    <Input value={capEdit.periodStart} onChange={(e) => setCapEdit({ ...capEdit, periodStart: e.target.value })} placeholder="e.g. 2026-10-01" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>To (YYYY-MM-DD)</Label>
                                    <Input value={capEdit.periodEnd} onChange={(e) => setCapEdit({ ...capEdit, periodEnd: e.target.value })} placeholder="e.g. 2026-12-31" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Available Capacity</Label>
                                    <Input type="number" value={capEdit.availableCapacity} onChange={(e) => setCapEdit({ ...capEdit, availableCapacity: e.target.value })} placeholder="e.g. 40" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Booked Capacity</Label>
                                    <Input type="number" value={capEdit.bookedCapacity} onChange={(e) => setCapEdit({ ...capEdit, bookedCapacity: e.target.value })} placeholder="e.g. 10" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea value={capEdit.notes} onChange={(e) => setCapEdit({ ...capEdit, notes: e.target.value })} placeholder="e.g. Handle with care" />
                            </div>
                            <LoadingButton loading={busy === 'cap-update'} onClick={() => withBusy('cap-update', handleCapUpdate)}>Save</LoadingButton>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
