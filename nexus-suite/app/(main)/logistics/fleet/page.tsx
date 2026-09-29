'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
	Boxes,
	Caravan,
	ChevronLeft,
	Container,
	Info,
	Pencil,
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	getFleetAssets,
	createFleetAsset,
	updateFleetAsset,
	transitionAssetStatus,
	deleteFleetAsset,
	getDrivers,
	createDriver,
	updateDriver,
	transitionDriverStatus,
	deleteDriver,
	getMaintenanceRecords,
	createMaintenanceRecord,
	updateMaintenanceRecord,
	transitionMaintenanceStatus,
} from '@/lib/services/logistics-ops-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';
import { LoadingButton } from '@/components/ui/loading-button';
import { TableSkeleton } from '@/components/ui/table-skeleton';

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
	useQuickCreateIntent('logistics:asset', () => setAssetOpen(true));
	useQuickCreateIntent('logistics:driver', () => setDriverOpen(true));
	useQuickCreateIntent('logistics:maintenance', () => setMaintOpen(true));
	const [busy, setBusy] = useState<string | null>(null);
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
	const [assetEdit, setAssetEdit] = useState<{
		id: number;
		assetNumber: string;
		make: string;
		model: string;
		licensePlate: string;
		capacityWeight: string;
	} | null>(null);
	const [driverEdit, setDriverEdit] = useState<{
		id: number;
		fullName: string;
		phone: string;
		email: string;
		licenseNumber: string;
		licenseClass: string;
		notes: string;
	} | null>(null);
	const [maintEdit, setMaintEdit] = useState<{
		id: number;
		maintenanceType: string;
		description: string;
		scheduledDate: string;
		odometerReading: string;
		cost: string;
		serviceProvider: string;
		notes: string;
	} | null>(null);

	const load = useCallback(async () => {
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
	}, [assetStatus, search, toast]);
	useEffect(() => {
		load();
	}, [assetStatus, load]);
	useEffect(() => {
		const t = setTimeout(load, 400);
		return () => clearTimeout(t);
	}, [load, search]);

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

	const handleAssetUpdate = async () => {
		if (!assetEdit) return;
		try {
			await updateFleetAsset(assetEdit.id, {
				assetNumber: assetEdit.assetNumber || undefined,
				make: assetEdit.make || undefined,
				model: assetEdit.model || undefined,
				licensePlate: assetEdit.licensePlate || undefined,
				capacityWeight: assetEdit.capacityWeight
					? Number(assetEdit.capacityWeight)
					: undefined,
			});
			toast({ title: 'Asset updated', variant: 'success' });
			setAssetEdit(null);
			load();
		} catch (e: unknown) {
			toast({
				title: e instanceof Error ? e.message : String(e),
				variant: 'destructive',
			});
		}
	};

	const handleDriverUpdate = async () => {
		if (!driverEdit) return;
		try {
			await updateDriver(driverEdit.id, {
				fullName: driverEdit.fullName || undefined,
				phone: driverEdit.phone || undefined,
				email: driverEdit.email || undefined,
				licenseNumber: driverEdit.licenseNumber || undefined,
				licenseClass: driverEdit.licenseClass || undefined,
				notes: driverEdit.notes || undefined,
			});
			toast({ title: 'Driver updated', variant: 'success' });
			setDriverEdit(null);
			load();
		} catch (e: unknown) {
			toast({
				title: e instanceof Error ? e.message : String(e),
				variant: 'destructive',
			});
		}
	};

	const handleMaintUpdate = async () => {
		if (!maintEdit) return;
		try {
			await updateMaintenanceRecord(maintEdit.id, {
				maintenanceType: maintEdit.maintenanceType || undefined,
				description: maintEdit.description || undefined,
				scheduledDate: maintEdit.scheduledDate || undefined,
				odometerReading: maintEdit.odometerReading
					? Number(maintEdit.odometerReading)
					: undefined,
				cost: maintEdit.cost ? Number(maintEdit.cost) : undefined,
				serviceProvider: maintEdit.serviceProvider || undefined,
				notes: maintEdit.notes || undefined,
			});
			toast({ title: 'Maintenance updated', variant: 'success' });
			setMaintEdit(null);
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
								<div className="grid gap-6">
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
									<div className="grid gap-2">
										<Label>Asset Number</Label>
										<Input placeholder="e.g. TRK-001"
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
										<div className="grid gap-2">
											<Label>Make</Label>
											<Input placeholder="e.g. Tata"
												value={assetForm.make}
												onChange={(e) =>
													setAssetForm({
														...assetForm,
														make: e.target.value,
													})
												}
											/>
										</div>
										<div className="grid gap-2">
											<Label>Model</Label>
											<Input placeholder="e.g. Prima 5530"
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
										<div className="grid gap-2">
											<Label>License Plate</Label>
											<Input placeholder="e.g. MH-12-AB-1234"
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
										<div className="grid gap-2">
											<Label>Capacity (kg)</Label>
											<Input placeholder="e.g. 15000"
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
										<LoadingButton loading={busy === 'asset-create'} onClick={() => withBusy('asset-create', handleAssetCreate)} className="flex-1">Create</LoadingButton>
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
							<div className="grid gap-6">
								<div className="grid grid-cols-2 gap-3">
									<div className="grid gap-2">
										<Label>Driver Code</Label>
										<Input placeholder="e.g. DRV-001"
											value={driverForm.driverCode}
											onChange={(e) =>
												setDriverForm({
													...driverForm,
													driverCode: e.target.value,
												})
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label>Full Name</Label>
										<Input placeholder="e.g. Rajesh Kumar"
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
									<div className="grid gap-2">
										<Label>Phone</Label>
										<Input placeholder="e.g. +91 98200 12345"
											value={driverForm.phone}
											onChange={(e) =>
												setDriverForm({
													...driverForm,
													phone: e.target.value,
												})
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label>License No</Label>
										<Input placeholder="e.g. MH12 20210012345"
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
									<div className="grid gap-2">
										<Label>Class</Label>
										<Input placeholder="e.g. HMV"
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
								<LoadingButton loading={busy === 'driver-create'} onClick={() => withBusy('driver-create', handleDriverCreate)}>
									Create
								</LoadingButton>
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
							<div className="grid gap-6">
								<div className="grid grid-cols-2 gap-3">
									<div className="grid gap-2">
										<Label>Asset ID</Label>
										<Input placeholder="e.g. 7"
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
								<div className="grid gap-2">
									<Label>Description</Label>
									<Input placeholder="e.g. Delayed due to traffic at depot"
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
										<Input placeholder="e.g. 2026-10-15"
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
									<div className="grid gap-2">
										<Label>Odometer</Label>
										<Input placeholder="e.g. 125000"
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
								<LoadingButton loading={busy === 'maint-create'} onClick={() => withBusy('maint-create', handleMaintCreate)}>
									Schedule
								</LoadingButton>
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
								<TableSkeleton rows={6} />
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Asset</TableHead>
											<TableHead>Spec</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Action</TableHead>
											<TableHead className="w-14">Info</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{assets?.content?.map((a) => (
											<TableRow key={a.assetId}>
												<TableCell>
													<div className="flex items-center gap-3">
														{(() => {
															const t =
																ASSET_TYPES.find(
																	(x) =>
																		x.value ===
																		a.assetType
																);
															const AssetIcon =
																t?.icon ?? Boxes;
															return (
																<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
																	<AssetIcon
																		className="h-5 w-5 text-foreground"
																		strokeWidth={
																			1.5
																		}
																	/>
																</span>
															);
														})()}
														<div>
															<Link
																href={`/logistics/fleet/asset/${a.assetId}`}
																className="font-medium hover:underline"
															>
																{a.assetNumber}
															</Link>
															<div className="text-xs text-muted-foreground">
																{a.assetType} •{' '}
																{a.licensePlate ??
																	'-'}
															</div>
														</div>
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
																<LoadingButton
																	loading={busy === `asset-${a.assetId}`}
																	size="sm"
																	variant="outline"
																	onClick={() => withBusy(`asset-${a.assetId}`, async () => {
																		await transitionAssetStatus(
																			a.assetId,
																			'IN_MAINTENANCE'
																		);
																		load();
																	})}
																>
																	To Maintenance
																</LoadingButton>
															)}
														{a.status ===
															'IN_MAINTENANCE' && (
																<LoadingButton
																	loading={busy === `asset-${a.assetId}`}
																	size="sm"
																	variant="outline"
																	onClick={() => withBusy(`asset-${a.assetId}`, async () => {
																		await transitionAssetStatus(
																			a.assetId,
																			'AVAILABLE'
																		);
																		load();
																	})}
																>
																	Release
																</LoadingButton>
															)}
														<LoadingButton
															loading={busy === `asset-del-${a.assetId}`}
															size="sm"
															variant="ghost"
															onClick={() => withBusy(`asset-del-${a.assetId}`, async () => {
																await deleteFleetAsset(
																	a.assetId
																);
																load();
															})}
														>
															<Trash2 className="h-4 w-4" />
														</LoadingButton>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex gap-1">
														<Button
															asChild
															size="sm"
															variant="ghost"
															title="Asset details"
														>
															<Link
																href={`/logistics/fleet/asset/${a.assetId}`}
															>
																<Info className="h-4 w-4" />
															</Link>
														</Button>
														<Button
															size="sm"
															variant="ghost"
															title="Edit asset"
															onClick={() =>
																setAssetEdit({
																	id: a.assetId,
																	assetNumber: a.assetNumber,
																	make: a.make ?? '',
																	model: a.model ?? '',
																	licensePlate: a.licensePlate ?? '',
																	capacityWeight:
																		a.capacityWeight != null
																			? String(a.capacityWeight)
																			: '',
																})
															}
														>
															<Pencil className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
										{!assets?.content?.length && (
											<TableRow>
												<TableCell
													colSpan={5}
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
								<TableSkeleton rows={6} />
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
														<Button
															size="sm"
															variant="ghost"
															title="Edit driver"
															onClick={() =>
																setDriverEdit({
																	id: d.driverId,
																	fullName: d.fullName,
																	phone: d.phone ?? '',
																	email: d.email ?? '',
																	licenseNumber: d.licenseNumber,
																	licenseClass: d.licenseClass ?? '',
																	notes: d.notes ?? '',
																})
															}
														>
															<Pencil className="h-4 w-4" />
														</Button>
														{d.status !==
															'AVAILABLE' &&
															d.status !==
															'INACTIVE' && (
																<LoadingButton
																	loading={busy === `driver-${d.driverId}`}
																	size="sm"
																	variant="outline"
																	onClick={() => withBusy(`driver-${d.driverId}`, async () => {
																		await transitionDriverStatus(
																			d.driverId,
																			'AVAILABLE'
																		);
																		load();
																	})}
																>
																	Release
																</LoadingButton>
															)}
														<LoadingButton
															loading={busy === `driver-del-${d.driverId}`}
															size="sm"
															variant="ghost"
															onClick={() => withBusy(`driver-del-${d.driverId}`, async () => {
																await deleteDriver(
																	d.driverId
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
								<TableSkeleton rows={6} />
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
														{(m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS') && (
															<Button
																size="sm"
																variant="ghost"
																title="Edit record"
																onClick={() =>
																	setMaintEdit({
																		id: m.maintenanceId,
																		maintenanceType: m.maintenanceType,
																		description: m.description ?? '',
																		scheduledDate: m.scheduledDate ?? '',
																		odometerReading:
																			m.odometerReading != null
																				? String(m.odometerReading)
																				: '',
																		cost:
																			m.cost != null ? String(m.cost) : '',
																		serviceProvider: m.serviceProvider ?? '',
																		notes: m.notes ?? '',
																	})
																}
															>
																<Pencil className="h-4 w-4" />
															</Button>
														)}
														{m.status ===
															'SCHEDULED' && (
																<LoadingButton
																	loading={busy === `maint-${m.maintenanceId}`}
																	size="sm"
																	variant="outline"
																	onClick={() => withBusy(`maint-${m.maintenanceId}`, async () => {
																		await transitionMaintenanceStatus(
																			m.maintenanceId,
																			'IN_PROGRESS'
																		);
																		load();
																	})}
																>
																	Start
																</LoadingButton>
															)}
														{m.status ===
															'IN_PROGRESS' && (
																<LoadingButton
																	loading={busy === `maint-${m.maintenanceId}`}
																	size="sm"
																	variant="outline"
																	onClick={() => withBusy(`maint-${m.maintenanceId}`, async () => {
																		await transitionMaintenanceStatus(
																			m.maintenanceId,
																			'COMPLETED'
																		);
																		load();
																	})}
																>
																	Complete
																</LoadingButton>
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
			<Dialog open={assetEdit != null} onOpenChange={(v) => { if (!v) setAssetEdit(null); }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Fleet Asset</DialogTitle>
						<DialogDescription>Update asset details</DialogDescription>
					</DialogHeader>
					{assetEdit && (
						<div className="grid gap-6">
							<div className="grid grid-cols-2 gap-3">
								<div className="grid gap-2">
									<Label>Asset Number</Label>
									<Input value={assetEdit.assetNumber} onChange={(e) => setAssetEdit({ ...assetEdit, assetNumber: e.target.value })} />
								</div>
								<div className="grid gap-2">
									<Label>License Plate</Label>
									<Input value={assetEdit.licensePlate} onChange={(e) => setAssetEdit({ ...assetEdit, licensePlate: e.target.value })} />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="grid gap-2">
									<Label>Make</Label>
									<Input value={assetEdit.make} onChange={(e) => setAssetEdit({ ...assetEdit, make: e.target.value })} />
								</div>
								<div className="grid gap-2">
									<Label>Model</Label>
									<Input value={assetEdit.model} onChange={(e) => setAssetEdit({ ...assetEdit, model: e.target.value })} />
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Capacity (kg)</Label>
								<Input type="number" value={assetEdit.capacityWeight} onChange={(e) => setAssetEdit({ ...assetEdit, capacityWeight: e.target.value })} />
							</div>
							<LoadingButton loading={busy === 'asset-update'} onClick={() => withBusy('asset-update', handleAssetUpdate)}>Save</LoadingButton>
						</div>
					)}
				</DialogContent>
			</Dialog>
			<Dialog open={driverEdit != null} onOpenChange={(v) => { if (!v) setDriverEdit(null); }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Driver</DialogTitle>
						<DialogDescription>Update driver details</DialogDescription>
					</DialogHeader>
					{driverEdit && (
						<div className="grid gap-6">
							<div className="grid grid-cols-2 gap-3">
								<div className="grid gap-2">
									<Label>Full Name</Label>
									<Input value={driverEdit.fullName} onChange={(e) => setDriverEdit({ ...driverEdit, fullName: e.target.value })} />
								</div>
								<div className="grid gap-2">
									<Label>Phone</Label>
									<Input value={driverEdit.phone} onChange={(e) => setDriverEdit({ ...driverEdit, phone: e.target.value })} />
								</div>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div className="grid gap-2">
									<Label>Email</Label>
									<Input value={driverEdit.email} onChange={(e) => setDriverEdit({ ...driverEdit, email: e.target.value })} />
								</div>
								<div className="grid gap-2">
									<Label>License No</Label>
									<Input value={driverEdit.licenseNumber} onChange={(e) => setDriverEdit({ ...driverEdit, licenseNumber: e.target.value })} />
								</div>
								<div className="grid gap-2">
									<Label>Class</Label>
									<Input value={driverEdit.licenseClass} onChange={(e) => setDriverEdit({ ...driverEdit, licenseClass: e.target.value })} />
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Notes</Label>
								<Textarea value={driverEdit.notes} onChange={(e) => setDriverEdit({ ...driverEdit, notes: e.target.value })} />
							</div>
							<LoadingButton loading={busy === 'driver-update'} onClick={() => withBusy('driver-update', handleDriverUpdate)}>Save</LoadingButton>
						</div>
					)}
				</DialogContent>
			</Dialog>
			<Dialog open={maintEdit != null} onOpenChange={(v) => { if (!v) setMaintEdit(null); }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Maintenance Record</DialogTitle>
						<DialogDescription>Update service details</DialogDescription>
					</DialogHeader>
					{maintEdit && (
						<div className="grid gap-6">
							<div className="grid grid-cols-2 gap-3">
								<div className="grid gap-2">
									<Label>Type</Label>
									<Select value={maintEdit.maintenanceType} onValueChange={(v) => setMaintEdit({ ...maintEdit, maintenanceType: v })}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="PREVENTIVE">PREVENTIVE</SelectItem>
											<SelectItem value="CORRECTIVE">CORRECTIVE</SelectItem>
											<SelectItem value="BREAKDOWN">BREAKDOWN</SelectItem>
											<SelectItem value="INSPECTION">INSPECTION</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label>Scheduled (YYYY-MM-DD)</Label>
									<Input value={maintEdit.scheduledDate} onChange={(e) => setMaintEdit({ ...maintEdit, scheduledDate: e.target.value })} placeholder="e.g. 2026-10-15" />
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Description</Label>
								<Input value={maintEdit.description} onChange={(e) => setMaintEdit({ ...maintEdit, description: e.target.value })} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div className="grid gap-2">
									<Label>Odometer</Label>
									<Input type="number" value={maintEdit.odometerReading} onChange={(e) => setMaintEdit({ ...maintEdit, odometerReading: e.target.value })} />
								</div>
								<div className="grid gap-2">
									<Label>Cost</Label>
									<Input type="number" value={maintEdit.cost} onChange={(e) => setMaintEdit({ ...maintEdit, cost: e.target.value })} />
								</div>
								<div className="grid gap-2">
									<Label>Provider</Label>
									<Input value={maintEdit.serviceProvider} onChange={(e) => setMaintEdit({ ...maintEdit, serviceProvider: e.target.value })} />
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Notes</Label>
								<Textarea value={maintEdit.notes} onChange={(e) => setMaintEdit({ ...maintEdit, notes: e.target.value })} />
							</div>
							<LoadingButton loading={busy === 'maint-update'} onClick={() => withBusy('maint-update', handleMaintUpdate)}>Save</LoadingButton>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
