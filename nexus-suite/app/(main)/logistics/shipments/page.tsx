'use client';
import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Check,
    Map as MapIcon,
    MapPin,
    PackageCheck,
    Pencil,
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
    DialogDescription,
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
    getPodByShipment,
    updatePod,
    reportIncident,
    updateIncident,
    getShipmentIncidents,
    transitionIncidentStatus,
} from '@/lib/services/logistics-ops-service';
import {
    getShipmentDocuments,
    type ShipmentDocument,
} from '@/lib/services/shipment-service';
import ShipmentMap from '@/components/shipment-map';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';
import { LoadingButton } from '@/components/ui/loading-button';
import { TableSkeleton } from '@/components/ui/table-skeleton';

const LIFECYCLE = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

function nextLifecycleState(status: string): string | null {
    const idx = LIFECYCLE.indexOf(status);
    if (idx === -1 || idx === LIFECYCLE.length - 1) return null;
    return LIFECYCLE[idx + 1];
}

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
    const [assignForm, setAssignForm] = useState({
        shipmentId: '',
        driverId: '',
        assetId: '',
        bolDocumentId: '',
    });
    const [assignOpen, setAssignOpen] = useState(false);
    const [bolDocs, setBolDocs] = useState<ShipmentDocument[]>([]);
    const [bolDocsLoaded, setBolDocsLoaded] = useState(false);
    const [podForm, setPodForm] = useState({
        shipmentId: '',
        receivedBy: '',
        signature: '',
        photoUrls: '',
        dmsDocumentId: '',
        latitude: '',
        longitude: '',
        conditionNotes: '',
    });
    const [podOpen, setPodOpen] = useState(false);
    const [incidentEdit, setIncidentEdit] = useState<{
        id: number;
        description: string;
        claimAmount: string;
        notes: string;
    } | null>(null);
    const [podManageOpen, setPodManageOpen] = useState(false);
    const [podLookupId, setPodLookupId] = useState('');
    const [podEdit, setPodEdit] = useState<{
        id: number;
        receivedBy: string;
        signature: string;
        photoUrls: string;
        dmsDocumentId: string;
        conditionNotes: string;
        notes: string;
    } | null>(null);
    const [incidentForm, setIncidentForm] = useState({
        shipmentId: '',
        incidentType: 'DELAY',
        description: '',
        claimAmount: '',
    });
    const [incidentOpen, setIncidentOpen] = useState(false);
    useQuickCreateIntent('logistics:incident', () => setIncidentOpen(true));
    useQuickCreateIntent('logistics:pod', () => setPodOpen(true));

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

    const handleBolDocsLookup = async () => {
        if (!assignForm.shipmentId) return;
        try {
            const docs = await getShipmentDocuments(
                Number(assignForm.shipmentId)
            );
            setBolDocs(docs);
            setBolDocsLoaded(true);
        } catch (e: unknown) {
            setBolDocs([]);
            setBolDocsLoaded(false);
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
                photoUrls: podForm.photoUrls || undefined,
                dmsDocumentId: podForm.dmsDocumentId || undefined,
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

    const handleIncidentUpdate = async () => {
        if (!incidentEdit) return;
        try {
            await updateIncident(incidentEdit.id, {
                description: incidentEdit.description || undefined,
                claimAmount: incidentEdit.claimAmount
                    ? Number(incidentEdit.claimAmount)
                    : undefined,
                notes: incidentEdit.notes || undefined,
            });
            toast({ title: 'Incident updated', variant: 'success' });
            setIncidentEdit(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handlePodLookup = async () => {
        if (!podLookupId) return;
        try {
            const pod = await getPodByShipment(Number(podLookupId));
            setPodEdit({
                id: pod.podId,
                receivedBy: pod.receivedBy ?? '',
                signature: pod.signature ?? '',
                photoUrls: pod.photoUrls ?? '',
                dmsDocumentId: pod.dmsDocumentId ?? '',
                conditionNotes: pod.conditionNotes ?? '',
                notes: pod.notes ?? '',
            });
        } catch (e: unknown) {
            setPodEdit(null);
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handlePodUpdate = async () => {
        if (!podEdit) return;
        try {
            await updatePod(podEdit.id, {
                receivedBy: podEdit.receivedBy || undefined,
                signature: podEdit.signature || undefined,
                photoUrls: podEdit.photoUrls || undefined,
                dmsDocumentId: podEdit.dmsDocumentId || undefined,
                conditionNotes: podEdit.conditionNotes || undefined,
                notes: podEdit.notes || undefined,
            });
            toast({ title: 'POD updated', variant: 'success' });
            setPodEdit(null);
            setPodManageOpen(false);
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
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPodLookupId('');
                            setPodEdit(null);
                            setPodManageOpen(true);
                        }}
                    >
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Manage POD
                    </Button>
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
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Shipment ID</Label>
                                        <Input
                                            placeholder="e.g. 12"
                                            value={assignForm.shipmentId}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    shipmentId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>BOL Doc ID (DMS)</Label>
                                        <Input
                                            placeholder="e.g. BOL-4521"
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
                                    <div className="grid gap-2">
                                        <Label>Driver ID</Label>
                                        <Input
                                            placeholder="e.g. 3"
                                            value={assignForm.driverId}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    driverId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Asset ID</Label>
                                        <Input
                                            placeholder="e.g. 7"
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
                                <LoadingButton
                                    loading={busy === 'assign'}
                                    onClick={() =>
                                        withBusy('assign', handleAssign)
                                    }
                                >
                                    Assign
                                </LoadingButton>
                                <div className="grid gap-2 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label>
                                            Linked documents (BOL view)
                                        </Label>
                                        <LoadingButton
                                            loading={busy === 'bol-docs'}
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                withBusy(
                                                    'bol-docs',
                                                    handleBolDocsLookup
                                                )
                                            }
                                        >
                                            View
                                        </LoadingButton>
                                    </div>
                                    {bolDocsLoaded && (
                                        <div className="grid gap-2 text-sm">
                                            {bolDocs.map((d) => (
                                                <div
                                                    key={d.documentId}
                                                    className="flex items-center justify-between rounded-lg border p-2"
                                                >
                                                    <div>
                                                        <div className="font-medium">
                                                            {d.documentName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {d.documentType}
                                                            {d.dmsDocumentId
                                                                ? ` • ${d.dmsDocumentId}`
                                                                : ''}
                                                        </div>
                                                    </div>
                                                    {d.documentUrl && (
                                                        <a
                                                            href={d.documentUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-blue-600 hover:underline"
                                                        >
                                                            Open
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                            {!bolDocs.length && (
                                                <div className="text-xs text-muted-foreground">
                                                    No documents linked to this
                                                    shipment yet — paste a DMS
                                                    document ID above to link
                                                    the BOL.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Shipment ID</Label>
                                        <Input
                                            placeholder="e.g. 12"
                                            value={podForm.shipmentId}
                                            onChange={(e) =>
                                                setPodForm({
                                                    ...podForm,
                                                    shipmentId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Received By</Label>
                                        <Input
                                            placeholder="e.g. John Carter"
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
                                <div className="grid gap-2">
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
                                <div className="grid gap-2">
                                    <Label>Photo URLs</Label>
                                    <Input
                                        value={podForm.photoUrls}
                                        onChange={(e) =>
                                            setPodForm({
                                                ...podForm,
                                                photoUrls: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. https://…/pod-12-a.jpg, https://…/pod-12-b.jpg"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Linked DMS Document ID</Label>
                                    <Input
                                        value={podForm.dmsDocumentId}
                                        onChange={(e) =>
                                            setPodForm({
                                                ...podForm,
                                                dmsDocumentId: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. DOC-8891"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Latitude</Label>
                                        <Input
                                            placeholder="e.g. 19.0760"
                                            value={podForm.latitude}
                                            onChange={(e) =>
                                                setPodForm({
                                                    ...podForm,
                                                    latitude: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Longitude</Label>
                                        <Input
                                            placeholder="e.g. 72.8777"
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
                                <div className="grid gap-2">
                                    <Label>Condition Notes</Label>
                                    <Textarea
                                        placeholder="e.g. Cartons intact, no damage"
                                        value={podForm.conditionNotes}
                                        onChange={(e) =>
                                            setPodForm({
                                                ...podForm,
                                                conditionNotes: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <LoadingButton
                                    loading={busy === 'pod'}
                                    onClick={() => withBusy('pod', handlePod)}
                                >
                                    Capture
                                </LoadingButton>
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
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Shipment ID</Label>
                                        <Input
                                            placeholder="e.g. 12"
                                            value={incidentForm.shipmentId}
                                            onChange={(e) =>
                                                setIncidentForm({
                                                    ...incidentForm,
                                                    shipmentId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
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
                                            <SelectTrigger className="w-full">
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
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="e.g. Delayed due to traffic at depot"
                                        value={incidentForm.description}
                                        onChange={(e) =>
                                            setIncidentForm({
                                                ...incidentForm,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Claim Amount</Label>
                                    <Input
                                        placeholder="e.g. 250"
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
                                <LoadingButton
                                    loading={busy === 'incident'}
                                    onClick={() =>
                                        withBusy('incident', handleIncident)
                                    }
                                >
                                    Report
                                </LoadingButton>
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
                                <TableSkeleton rows={6} />
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
                                                    {(() => {
                                                        const next =
                                                            nextLifecycleState(
                                                                s.status
                                                            );
                                                        if (!next)
                                                            return (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Terminal
                                                                </span>
                                                            );
                                                        return (
                                                            <div className="flex flex-wrap gap-1">
                                                                <LoadingButton
                                                                    loading={
                                                                        busy ===
                                                                        `ship-${s.shipmentId}-${next}`
                                                                    }
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        withBusy(
                                                                            `ship-${s.shipmentId}-${next}`,
                                                                            () =>
                                                                                handleTransition(
                                                                                    s.shipmentId,
                                                                                    next
                                                                                )
                                                                        )
                                                                    }
                                                                >
                                                                    <Check className="mr-1 h-3 w-3" />
                                                                    {next}
                                                                </LoadingButton>
                                                            </div>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <LoadingButton
                                                            loading={
                                                                busy ===
                                                                `eta-${s.shipmentId}`
                                                            }
                                                            size="sm"
                                                            variant="ghost"
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
                                <TableSkeleton rows={6} />
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
                                                    <div className="flex gap-2">
                                                        {(i.status === 'OPEN' ||
                                                            i.status ===
                                                                'IN_PROGRESS') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                title="Edit incident"
                                                                onClick={() =>
                                                                    setIncidentEdit(
                                                                        {
                                                                            id: i.incidentId,
                                                                            description:
                                                                                i.description ??
                                                                                '',
                                                                            claimAmount:
                                                                                i.claimAmount !=
                                                                                null
                                                                                    ? String(
                                                                                          i.claimAmount
                                                                                      )
                                                                                    : '',
                                                                            notes:
                                                                                i.notes ??
                                                                                '',
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {(i.status === 'OPEN' ||
                                                            i.status ===
                                                                'IN_PROGRESS') && (
                                                            <LoadingButton
                                                                loading={
                                                                    busy ===
                                                                    `incident-${i.incidentId}`
                                                                }
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    withBusy(
                                                                        `incident-${i.incidentId}`,
                                                                        () =>
                                                                            resolveIncident(
                                                                                i.incidentId
                                                                            )
                                                                    )
                                                                }
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Resolve
                                                            </LoadingButton>
                                                        )}
                                                    </div>
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
            <Dialog
                open={incidentEdit != null}
                onOpenChange={(v) => {
                    if (!v) setIncidentEdit(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Incident</DialogTitle>
                        <DialogDescription>
                            Only open or in-progress incidents can be edited
                        </DialogDescription>
                    </DialogHeader>
                    {incidentEdit && (
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={incidentEdit.description}
                                    onChange={(e) =>
                                        setIncidentEdit({
                                            ...incidentEdit,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Delayed due to traffic at depot"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Claim Amount</Label>
                                <Input
                                    type="number"
                                    value={incidentEdit.claimAmount}
                                    onChange={(e) =>
                                        setIncidentEdit({
                                            ...incidentEdit,
                                            claimAmount: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 250"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={incidentEdit.notes}
                                    onChange={(e) =>
                                        setIncidentEdit({
                                            ...incidentEdit,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Handle with care"
                                />
                            </div>
                            <LoadingButton
                                loading={busy === 'incident-update'}
                                onClick={() =>
                                    withBusy(
                                        'incident-update',
                                        handleIncidentUpdate
                                    )
                                }
                            >
                                Save
                            </LoadingButton>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={podManageOpen} onOpenChange={setPodManageOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Proof of Delivery</DialogTitle>
                        <DialogDescription>
                            Load a shipment&apos;s POD by ID, then correct it
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6">
                        <div className="flex items-end gap-2">
                            <div className="grid flex-1 gap-2">
                                <Label>Shipment ID</Label>
                                <Input
                                    type="number"
                                    value={podLookupId}
                                    onChange={(e) =>
                                        setPodLookupId(e.target.value)
                                    }
                                    placeholder="e.g. 12"
                                />
                            </div>
                            <LoadingButton
                                loading={busy === 'pod-load'}
                                variant="outline"
                                onClick={() =>
                                    withBusy('pod-load', handlePodLookup)
                                }
                            >
                                Load
                            </LoadingButton>
                        </div>
                        {podEdit && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Received By</Label>
                                        <Input
                                            value={podEdit.receivedBy}
                                            onChange={(e) =>
                                                setPodEdit({
                                                    ...podEdit,
                                                    receivedBy: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. John Carter"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Signature</Label>
                                        <Input
                                            value={podEdit.signature}
                                            onChange={(e) =>
                                                setPodEdit({
                                                    ...podEdit,
                                                    signature: e.target.value,
                                                })
                                            }
                                            placeholder="Signature reference"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Photo URLs</Label>
                                    <Input
                                        value={podEdit.photoUrls}
                                        onChange={(e) =>
                                            setPodEdit({
                                                ...podEdit,
                                                photoUrls: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. https://…/pod-12-a.jpg"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Linked DMS Document ID</Label>
                                    <Input
                                        value={podEdit.dmsDocumentId}
                                        onChange={(e) =>
                                            setPodEdit({
                                                ...podEdit,
                                                dmsDocumentId: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. DOC-8891"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Condition Notes</Label>
                                    <Textarea
                                        value={podEdit.conditionNotes}
                                        onChange={(e) =>
                                            setPodEdit({
                                                ...podEdit,
                                                conditionNotes: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Cartons intact, no damage"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={podEdit.notes}
                                        onChange={(e) =>
                                            setPodEdit({
                                                ...podEdit,
                                                notes: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Handle with care"
                                    />
                                </div>
                                <LoadingButton
                                    loading={busy === 'pod-update'}
                                    onClick={() =>
                                        withBusy('pod-update', handlePodUpdate)
                                    }
                                >
                                    Save
                                </LoadingButton>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
