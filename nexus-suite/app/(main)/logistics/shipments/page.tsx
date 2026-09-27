'use client';
import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Check,
    Map as MapIcon,
    MapPin,
    PackageCheck,
    Truck,
} from 'lucide-react';
import type {
    LoadBoardShipment,
    ShipmentEta,
    ShipmentIncident,
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    getLoadBoard,
    assignBooking,
    getShipmentEta,
    transitionShipmentStatus,
    capturePod,
    reportIncident,
    getShipmentIncidents,
    transitionIncidentStatus,
} from '@/lib/services/logistics-ops-service';
import ShipmentMap from '@/components/shipment-map';
import { useToast } from '@/hooks/use-toast';

const LIFECYCLE = [
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
];

export default function LogisticsShipmentsPage() {
    const { toast } = useToast();
    const [shipments, setShipments] =
        useState<PaginatedResponse<LoadBoardShipment> | null>(null);
    const [incidents, setIncidents] =
        useState<PaginatedResponse<ShipmentIncident> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [eta, setEta] = useState<ShipmentEta | null>(null);
    const [etaOpen, setEtaOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [mapShipmentId, setMapShipmentId] = useState<number | null>(null);
    const [assignForm, setAssignForm] = useState({
        shipmentId: '',
        driverId: '',
        assetId: '',
        bolDocumentId: '',
    });
    const [assignOpen, setAssignOpen] = useState(false);
    const [podForm, setPodForm] = useState({
        shipmentId: '',
        receivedBy: '',
        signature: '',
        latitude: '',
        longitude: '',
        conditionNotes: '',
    });
    const [podOpen, setPodOpen] = useState(false);
    const [incidentForm, setIncidentForm] = useState({
        shipmentId: '',
        incidentType: 'DELAY',
        description: '',
        claimAmount: '',
    });
    const [incidentOpen, setIncidentOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [s, i] = await Promise.all([
                getLoadBoard({
                    page: 0,
                    size: 20,
                    search: search || undefined,
                }),
                getShipmentIncidents({ page: 0, size: 20 }),
            ]);
            setShipments(s);
            setIncidents(i);
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

    const handleAssign = async () => {
        try {
            await assignBooking(Number(assignForm.shipmentId), {
                driverId: assignForm.driverId
                    ? Number(assignForm.driverId)
                    : undefined,
                assetId: assignForm.assetId
                    ? Number(assignForm.assetId)
                    : undefined,
                bolDocumentId: assignForm.bolDocumentId || undefined,
            });
            toast({ title: 'Booking assigned', variant: 'success' });
            setAssignOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleTransition = async (id: number, newStatus: string) => {
        try {
            await transitionShipmentStatus(id, newStatus);
            toast({
                title: `Shipment ${newStatus.toLowerCase()}`,
                variant: 'success',
            });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

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

    const handlePod = async () => {
        try {
            await capturePod({
                shipmentId: Number(podForm.shipmentId),
                receivedBy: podForm.receivedBy || undefined,
                signature: podForm.signature || undefined,
                latitude: podForm.latitude
                    ? Number(podForm.latitude)
                    : undefined,
                longitude: podForm.longitude
                    ? Number(podForm.longitude)
                    : undefined,
                conditionNotes: podForm.conditionNotes || undefined,
            });
            toast({ title: 'POD captured', variant: 'success' });
            setPodOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleIncident = async () => {
        try {
            await reportIncident({
                shipmentId: Number(incidentForm.shipmentId),
                incidentType:
                    incidentForm.incidentType as ShipmentIncident['incidentType'],
                description: incidentForm.description || undefined,
                claimAmount: incidentForm.claimAmount
                    ? Number(incidentForm.claimAmount)
                    : undefined,
            });
            toast({ title: 'Incident reported', variant: 'success' });
            setIncidentOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const resolveIncident = async (id: number) => {
        try {
            await transitionIncidentStatus(id, 'RESOLVED');
            toast({ title: 'Incident resolved', variant: 'success' });
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
                <h1 className="text-2xl font-semibold">Shipments</h1>
                <div className="flex gap-2">
                    <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Truck className="mr-2 h-4 w-4" />
                                Assign Booking
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Confirm Booking & Assign
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Shipment ID</Label>
                                        <Input
                                            value={assignForm.shipmentId}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    shipmentId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>BOL Doc ID (DMS)</Label>
                                        <Input
                                            value={assignForm.bolDocumentId}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    bolDocumentId:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Driver ID</Label>
                                        <Input
                                            value={assignForm.driverId}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    driverId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Asset ID</Label>
                                        <Input
                                            value={assignForm.assetId}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    assetId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleAssign}>Assign</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={podOpen} onOpenChange={setPodOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <PackageCheck className="mr-2 h-4 w-4" />
                                Capture POD
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Proof of Delivery</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Shipment ID</Label>
                                        <Input
                                            value={podForm.shipmentId}
                                            onChange={(e) =>
                                                setPodForm({
                                                    ...podForm,
                                                    shipmentId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Received By</Label>
                                        <Input
                                            value={podForm.receivedBy}
                                            onChange={(e) =>
                                                setPodForm({
                                                    ...podForm,
                                                    receivedBy: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Signature</Label>
                                    <Input
                                        value={podForm.signature}
                                        onChange={(e) =>
                                            setPodForm({
                                                ...podForm,
                                                signature: e.target.value,
                                            })
                                        }
                                        placeholder="Signature reference"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Latitude</Label>
                                        <Input
                                            value={podForm.latitude}
                                            onChange={(e) =>
                                                setPodForm({
                                                    ...podForm,
                                                    latitude: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Longitude</Label>
                                        <Input
                                            value={podForm.longitude}
                                            onChange={(e) =>
                                                setPodForm({
                                                    ...podForm,
                                                    longitude: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Condition Notes</Label>
                                    <Textarea
                                        value={podForm.conditionNotes}
                                        onChange={(e) =>
                                            setPodForm({
                                                ...podForm,
                                                conditionNotes: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <Button onClick={handlePod}>Capture</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Report Exception
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Report Exception / Claim
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Shipment ID</Label>
                                        <Input
                                            value={incidentForm.shipmentId}
                                            onChange={(e) =>
                                                setIncidentForm({
                                                    ...incidentForm,
                                                    shipmentId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Type</Label>
                                        <Select
                                            value={incidentForm.incidentType}
                                            onValueChange={(v) =>
                                                setIncidentForm({
                                                    ...incidentForm,
                                                    incidentType: v,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DELAY">
                                                    DELAY
                                                </SelectItem>
                                                <SelectItem value="REROUTE">
                                                    REROUTE
                                                </SelectItem>
                                                <SelectItem value="DAMAGE">
                                                    DAMAGE
                                                </SelectItem>
                                                <SelectItem value="LOSS">
                                                    LOSS
                                                </SelectItem>
                                                <SelectItem value="CLAIM">
                                                    CLAIM
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={incidentForm.description}
                                        onChange={(e) =>
                                            setIncidentForm({
                                                ...incidentForm,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Claim Amount</Label>
                                    <Input
                                        type="number"
                                        value={incidentForm.claimAmount}
                                        onChange={(e) =>
                                            setIncidentForm({
                                                ...incidentForm,
                                                claimAmount: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <Button onClick={handleIncident}>Report</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Tabs defaultValue="shipments">
                <TabsList>
                    <TabsTrigger value="shipments">Execution</TabsTrigger>
                    <TabsTrigger value="incidents">Exceptions</TabsTrigger>
                </TabsList>
                <TabsContent value="shipments">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Search shipments"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
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
                                            <TableHead>Shipment</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Lifecycle</TableHead>
                                            <TableHead>Tracking</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shipments?.content?.map((s) => (
                                            <TableRow key={s.shipmentId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {s.shipmentNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        #{s.shipmentId} •{' '}
                                                        {s.carrierName ??
                                                            'unassigned'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {s.pickupAddress ?? '?'} →{' '}
                                                    {s.deliveryAddress ?? '?'}
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
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {LIFECYCLE.filter(
                                                            (st) =>
                                                                st !== s.status
                                                        )
                                                            .slice(0, 2)
                                                            .map((st) => (
                                                                <Button
                                                                    key={st}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleTransition(
                                                                            s.shipmentId,
                                                                            st
                                                                        )
                                                                    }
                                                                >
                                                                    <Check className="mr-1 h-3 w-3" />
                                                                    {st}
                                                                </Button>
                                                            ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleEta(
                                                                    s.shipmentId
                                                                )
                                                            }
                                                        >
                                                            <MapPin className="mr-1 h-3 w-3" />
                                                            ETA
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
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
                                        {!shipments?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No shipments
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="incidents">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>
                                Delay / Reroute / Damage / Loss / Claims
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
                                            <TableHead>Incident</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {incidents?.content?.map((i) => (
                                            <TableRow key={i.incidentId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {i.incidentNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Shipment #{i.shipmentId}{' '}
                                                        • {i.description ?? '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {i.incidentType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            i.status === 'OPEN'
                                                                ? 'destructive'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {i.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {(i.status === 'OPEN' ||
                                                        i.status ===
                                                            'IN_PROGRESS') && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                resolveIncident(
                                                                    i.incidentId
                                                                )
                                                            }
                                                        >
                                                            <Check className="mr-2 h-4 w-4" />
                                                            Resolve
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!incidents?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No exceptions
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
