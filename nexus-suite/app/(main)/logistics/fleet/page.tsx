'use client';
import { useEffect, useState } from 'react';
import {
    Boxes,
    Caravan,
    ChevronLeft,
    Container,
    Plus,
    Trash2,
    Truck,
    Van,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
    Driver,
    FleetAsset,
    MaintenanceRecord,
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
    getFleetAssets,
    createFleetAsset,
    transitionAssetStatus,
    deleteFleetAsset,
    getDrivers,
    createDriver,
    transitionDriverStatus,
    deleteDriver,
    getMaintenanceRecords,
    createMaintenanceRecord,
    transitionMaintenanceStatus,
} from '@/lib/services/logistics-ops-service';
import { useToast } from '@/hooks/use-toast';

const ASSET_TYPES: {
    value: FleetAsset['assetType'];
    label: string;
    desc: string;
    icon: LucideIcon;
}[] = [
    {
        value: 'TRUCK',
        label: 'Truck',
        desc: 'Powered rig for road haulage',
        icon: Truck,
    },
    {
        value: 'TRAILER',
        label: 'Trailer',
        desc: 'Unpowered towed unit',
        icon: Caravan,
    },
    {
        value: 'CONTAINER',
        label: 'Container',
        desc: 'Intermodal freight box',
        icon: Container,
    },
    { value: 'VAN', label: 'Van', desc: 'Light delivery vehicle', icon: Van },
    {
        value: 'OTHER',
        label: 'Other',
        desc: 'Miscellaneous equipment',
        icon: Boxes,
    },
];

export default function FleetPage() {
    const { toast } = useToast();
    const [assets, setAssets] = useState<PaginatedResponse<FleetAsset> | null>(
        null
    );
    const [drivers, setDrivers] = useState<PaginatedResponse<Driver> | null>(
        null
    );
    const [maintenance, setMaintenance] =
        useState<PaginatedResponse<MaintenanceRecord> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [assetStatus, setAssetStatus] = useState('all');
    const [assetOpen, setAssetOpen] = useState(false);
    const [assetStep, setAssetStep] = useState(1);
    const [driverOpen, setDriverOpen] = useState(false);
    const [maintOpen, setMaintOpen] = useState(false);
    const [assetForm, setAssetForm] = useState({
        assetNumber: '',
        assetType: 'TRUCK',
        make: '',
        model: '',
        licensePlate: '',
        capacityWeight: '',
    });
    const [driverForm, setDriverForm] = useState({
        driverCode: '',
        fullName: '',
        phone: '',
        licenseNumber: '',
        licenseClass: '',
    });
    const [maintForm, setMaintForm] = useState({
        assetId: '',
        maintenanceType: 'PREVENTIVE',
        description: '',
        scheduledDate: '',
        odometerReading: '',
    });

    const load = async () => {
        setLoading(true);
        try {
            const [a, d, m] = await Promise.all([
                getFleetAssets({
                    page: 0,
                    size: 20,
                    search: search || undefined,
                    status: assetStatus === 'all' ? undefined : assetStatus,
                }),
                getDrivers({ page: 0, size: 20, search: search || undefined }),
                getMaintenanceRecords({ page: 0, size: 20 }),
            ]);
            setAssets(a);
            setDrivers(d);
            setMaintenance(m);
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
    }, [assetStatus]);
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
    }, [search]);

    const handleAssetCreate = async () => {
        try {
            await createFleetAsset({
                assetNumber: assetForm.assetNumber,
                assetType: assetForm.assetType as FleetAsset['assetType'],
                make: assetForm.make || undefined,
                model: assetForm.model || undefined,
                licensePlate: assetForm.licensePlate || undefined,
                capacityWeight: assetForm.capacityWeight
                    ? Number(assetForm.capacityWeight)
                    : undefined,
            });
            toast({ title: 'Asset created', variant: 'success' });
            setAssetOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleDriverCreate = async () => {
        try {
            await createDriver({
                driverCode: driverForm.driverCode,
                fullName: driverForm.fullName,
                phone: driverForm.phone || undefined,
                licenseNumber: driverForm.licenseNumber,
                licenseClass: driverForm.licenseClass || undefined,
            });
            toast({ title: 'Driver created', variant: 'success' });
            setDriverOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleMaintCreate = async () => {
        try {
            await createMaintenanceRecord({
                assetId: Number(maintForm.assetId),
                maintenanceType: maintForm.maintenanceType,
                description: maintForm.description || undefined,
                scheduledDate: maintForm.scheduledDate || undefined,
                odometerReading: maintForm.odometerReading
                    ? Number(maintForm.odometerReading)
                    : undefined,
            });
            toast({ title: 'Maintenance scheduled', variant: 'success' });
            setMaintOpen(false);
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
                <h1 className="text-2xl font-semibold">Fleet</h1>
                <div className="flex gap-2">
                    <Dialog
                        open={assetOpen}
                        onOpenChange={(v) => {
                            setAssetOpen(v);
                            if (!v) setAssetStep(1);
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Fleet Asset</DialogTitle>
                                <DialogDescription>
                                    {assetStep === 1
                                        ? 'Choose the equipment type to continue'
                                        : 'Fill in the asset details'}
                                </DialogDescription>
                            </DialogHeader>
                            {assetStep === 1 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {ASSET_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => {
                                                setAssetForm({
                                                    ...assetForm,
                                                    assetType: t.value,
                                                });
                                                setAssetStep(2);
                                            }}
                                            className={`flex flex-col items-center gap-1 rounded-lg border p-4 transition hover:border-foreground hover:bg-accent ${t.value === 'OTHER' ? 'col-span-2' : ''}`}
                                        >
                                            <t.icon
                                                className="h-8 w-8 text-foreground"
                                                strokeWidth={1.5}
                                            />
                                            <span className="text-sm font-medium">
                                                {t.label}
                                            </span>
                                            <span className="text-center text-xs text-muted-foreground">
                                                {t.desc}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {(() => {
                                        const selected =
                                            ASSET_TYPES.find(
                                                (t) =>
                                                    t.value ===
                                                    assetForm.assetType
                                            ) ?? ASSET_TYPES[0];
                                        return (
                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="flex items-center gap-3">
                                                    <selected.icon
                                                        className="h-6 w-6 text-foreground"
                                                        strokeWidth={1.5}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {selected.label}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {selected.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setAssetStep(1)
                                                    }
                                                >
                                                    Change
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                    <div className="grid gap-1.5">
                                        <Label>Asset Number</Label>
                                        <Input
                                            value={assetForm.assetNumber}
                                            onChange={(e) =>
                                                setAssetForm({
                                                    ...assetForm,
                                                    assetNumber: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label>Make</Label>
                                            <Input
                                                value={assetForm.make}
                                                onChange={(e) =>
                                                    setAssetForm({
                                                        ...assetForm,
                                                        make: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Model</Label>
                                            <Input
                                                value={assetForm.model}
                                                onChange={(e) =>
                                                    setAssetForm({
                                                        ...assetForm,
                                                        model: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label>License Plate</Label>
                                            <Input
                                                value={assetForm.licensePlate}
                                                onChange={(e) =>
                                                    setAssetForm({
                                                        ...assetForm,
                                                        licensePlate:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Capacity (kg)</Label>
                                            <Input
                                                type="number"
                                                value={assetForm.capacityWeight}
                                                onChange={(e) =>
                                                    setAssetForm({
                                                        ...assetForm,
                                                        capacityWeight:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setAssetStep(1)}
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleAssetCreate}
                                            className="flex-1"
                                        >
                                            Create
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                    <Dialog open={driverOpen} onOpenChange={setDriverOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Driver
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Driver</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Driver Code</Label>
                                        <Input
                                            value={driverForm.driverCode}
                                            onChange={(e) =>
                                                setDriverForm({
                                                    ...driverForm,
                                                    driverCode: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Full Name</Label>
                                        <Input
                                            value={driverForm.fullName}
                                            onChange={(e) =>
                                                setDriverForm({
                                                    ...driverForm,
                                                    fullName: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Phone</Label>
                                        <Input
                                            value={driverForm.phone}
                                            onChange={(e) =>
                                                setDriverForm({
                                                    ...driverForm,
                                                    phone: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>License No</Label>
                                        <Input
                                            value={driverForm.licenseNumber}
                                            onChange={(e) =>
                                                setDriverForm({
                                                    ...driverForm,
                                                    licenseNumber:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Class</Label>
                                        <Input
                                            value={driverForm.licenseClass}
                                            onChange={(e) =>
                                                setDriverForm({
                                                    ...driverForm,
                                                    licenseClass:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleDriverCreate}>
                                    Create
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Wrench className="mr-2 h-4 w-4" />
                                Schedule Maintenance
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Schedule Maintenance</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Asset ID</Label>
                                        <Input
                                            type="number"
                                            value={maintForm.assetId}
                                            onChange={(e) =>
                                                setMaintForm({
                                                    ...maintForm,
                                                    assetId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
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
                                            <SelectTrigger>
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
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Description</Label>
                                    <Input
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
                                    <div className="grid gap-1.5">
                                        <Label>Scheduled (YYYY-MM-DD)</Label>
                                        <Input
                                            value={maintForm.scheduledDate}
                                            onChange={(e) =>
                                                setMaintForm({
                                                    ...maintForm,
                                                    scheduledDate:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Odometer</Label>
                                        <Input
                                            type="number"
                                            value={maintForm.odometerReading}
                                            onChange={(e) =>
                                                setMaintForm({
                                                    ...maintForm,
                                                    odometerReading:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleMaintCreate}>
                                    Schedule
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Tabs defaultValue="assets">
                <TabsList>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="drivers">Drivers</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>
                <TabsContent value="assets">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Search number/plate/make"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Select
                                    value={assetStatus}
                                    onValueChange={setAssetStatus}
                                >
                                    <SelectTrigger className="w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="AVAILABLE">
                                            AVAILABLE
                                        </SelectItem>
                                        <SelectItem value="ASSIGNED">
                                            ASSIGNED
                                        </SelectItem>
                                        <SelectItem value="IN_MAINTENANCE">
                                            IN_MAINTENANCE
                                        </SelectItem>
                                        <SelectItem value="OUT_OF_SERVICE">
                                            OUT_OF_SERVICE
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
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
                                            <TableHead>Asset</TableHead>
                                            <TableHead>Spec</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assets?.content?.map((a) => (
                                            <TableRow key={a.assetId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {a.assetNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {a.assetType} •{' '}
                                                        {a.licensePlate ?? '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {a.make ?? ''}{' '}
                                                    {a.model ?? ''} •{' '}
                                                    {a.capacityWeight ?? '-'} kg
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            a.status ===
                                                            'AVAILABLE'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {a.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {a.status ===
                                                            'AVAILABLE' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionAssetStatus(
                                                                        a.assetId,
                                                                        'IN_MAINTENANCE'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                To Maintenance
                                                            </Button>
                                                        )}
                                                        {a.status ===
                                                            'IN_MAINTENANCE' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionAssetStatus(
                                                                        a.assetId,
                                                                        'AVAILABLE'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                Release
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={async () => {
                                                                await deleteFleetAsset(
                                                                    a.assetId
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
                                        {!assets?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No assets
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="drivers">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Search name/code/license"
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
                                            <TableHead>Driver</TableHead>
                                            <TableHead>License</TableHead>
                                            <TableHead>Performance</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {drivers?.content?.map((d) => (
                                            <TableRow key={d.driverId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {d.fullName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {d.driverCode} •{' '}
                                                        {d.phone ?? '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {d.licenseNumber} (
                                                    {d.licenseClass ?? '-'})
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    OT {d.onTimeRate ?? 0}% •{' '}
                                                    {d.totalTrips ?? 0} trips
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            d.status ===
                                                            'AVAILABLE'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {d.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {d.status !==
                                                            'AVAILABLE' &&
                                                            d.status !==
                                                                'INACTIVE' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={async () => {
                                                                        await transitionDriverStatus(
                                                                            d.driverId,
                                                                            'AVAILABLE'
                                                                        );
                                                                        load();
                                                                    }}
                                                                >
                                                                    Release
                                                                </Button>
                                                            )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={async () => {
                                                                await deleteDriver(
                                                                    d.driverId
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
                                        {!drivers?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No drivers
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="maintenance">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>
                                Preventive & Breakdown Records
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
                                            <TableHead>Record</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {maintenance?.content?.map((m) => (
                                            <TableRow key={m.maintenanceId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {m.maintenanceNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Asset #{m.assetId} •{' '}
                                                        {m.scheduledDate ?? '-'}
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
                                                            m.status ===
                                                            'COMPLETED'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {m.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {m.status ===
                                                            'SCHEDULED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionMaintenanceStatus(
                                                                        m.maintenanceId,
                                                                        'IN_PROGRESS'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                Start
                                                            </Button>
                                                        )}
                                                        {m.status ===
                                                            'IN_PROGRESS' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionMaintenanceStatus(
                                                                        m.maintenanceId,
                                                                        'COMPLETED'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                Complete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!maintenance?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No records
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
