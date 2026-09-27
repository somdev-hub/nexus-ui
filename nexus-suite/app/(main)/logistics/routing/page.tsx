'use client';
import { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
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
    transitionGroupStatus,
    addShipmentsToGroup,
    deleteConsolidationGroup,
    getCapacityForecasts,
    createCapacityForecast,
    deleteCapacityForecast,
} from '@/lib/services/logistics-ops-service';
import { useToast } from '@/hooks/use-toast';

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
                            <div className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={groupNotes}
                                        onChange={(e) =>
                                            setGroupNotes(e.target.value)
                                        }
                                        placeholder="Lane, trailer, ..."
                                    />
                                </div>
                                <Button onClick={handleGroupCreate}>
                                    Create
                                </Button>
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
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Origin Lane</Label>
                                        <Input
                                            value={capForm.originLane}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    originLane: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Destination Lane</Label>
                                        <Input
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
                                    <div className="grid gap-1.5">
                                        <Label>Equipment</Label>
                                        <Input
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
                                    <div className="grid gap-1.5">
                                        <Label>From (YYYY-MM-DD)</Label>
                                        <Input
                                            value={capForm.periodStart}
                                            onChange={(e) =>
                                                setCapForm({
                                                    ...capForm,
                                                    periodStart: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>To (YYYY-MM-DD)</Label>
                                        <Input
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
                                <div className="grid gap-1.5">
                                    <Label>Available Capacity</Label>
                                    <Input
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
                                <Button onClick={handleCapCreate}>
                                    Create
                                </Button>
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
                                <Button
                                    variant="outline"
                                    onClick={handleAddShipments}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="text-sm text-muted-foreground">
                                    Loading...
                                </div>
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
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionGroupStatus(
                                                                        g.groupId,
                                                                        'LOCKED'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Lock
                                                            </Button>
                                                        )}
                                                        {g.status ===
                                                            'LOCKED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionGroupStatus(
                                                                        g.groupId,
                                                                        'IN_TRANSIT'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                Dispatch
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={async () => {
                                                                await deleteConsolidationGroup(
                                                                    g.groupId
                                                                );
                                                                load();
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
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
                                <div className="text-sm text-muted-foreground">
                                    Loading...
                                </div>
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
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={async () => {
                                                            await deleteCapacityForecast(
                                                                c.forecastId
                                                            );
                                                            load();
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
        </div>
    );
}
