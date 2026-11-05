'use client';

import { CentralizedDataTable } from '@/components/centralized-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select, SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { DEFAULT_TABLE_PAGE_SIZE, useTables } from '@/hooks/use-tables';
import {
	createGoodsReceipt,
	getGoodsReceiptSource
} from '@/lib/services/procurement-extended-service';
import {
	getShipments,
	type Shipment,
} from '@/lib/services/shipment-service';
import { IconDotsVertical, IconEye, IconTruck } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
	DRAFT: 'bg-muted text-muted-foreground',
	CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
	PICKUP_SCHEDULED: 'bg-amber-50 text-amber-700 border border-amber-200',
	IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
	OUT_FOR_DELIVERY: 'bg-purple-50 text-purple-700 border border-purple-200',
	DELIVERED: 'bg-green-50 text-green-700 border border-green-200',
	PARTIALLY_DELIVERED: 'bg-orange-50 text-orange-700 border border-orange-200',
	EXCEPTION: 'bg-red-50 text-red-700 border border-red-200',
	CANCELLED: 'bg-slate-50 text-slate-700 border border-slate-200',
	CLOSED: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const SHIPMENT_PAGE_SIZE = DEFAULT_TABLE_PAGE_SIZE;

export default function RetailerShipmentsPage() {
	const [data, setData] = useState<Shipment[]>([]);
	const [totalElements, setTotalElements] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [referenceTypeFilter, setReferenceTypeFilter] = useState('');
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(SHIPMENT_PAGE_SIZE);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [openReceive, setOpenReceive] = useState(false);
	const [receiveShipment, setReceiveShipment] = useState<Shipment | null>(null);
	const [sourceContext, setSourceContext] = useState<Record<string, unknown> | null>(null);
	const [sourceLoading, setSourceLoading] = useState(false);
	const [receiving, setReceiving] = useState(false);
	const [viewShipment, setViewShipment] = useState<Shipment | null>(null);

	const load = async () => {
		setIsLoading(true);
		try {
			const res = await getShipments({
				page,
				size: pageSize,
				status: statusFilter || undefined,
				referenceType: referenceTypeFilter || undefined,
				search: searchQuery || undefined,
			} as any);
			setData(res.content ?? []);
			setTotalElements(res.totalElements ?? 0);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to load shipments');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// Debounce search input to avoid refetching on every keystroke.
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		const timer = setTimeout(() => {
			setPage(0);
			load();
		}, 300);
		debounceTimer.current = timer;
		return () => clearTimeout(timer);
	}, [searchQuery, statusFilter, referenceTypeFilter, page, pageSize]);

	const columns: ColumnDef<Shipment>[] = [
		{
			id: 'shipmentNumber',
			header: 'Shipment',
			accessorFn: (row) => row.shipmentNumber,
			cell: ({ row }) => (
				<div className="font-mono text-sm">
					<Link
						href={`/retailer/shipments/${row.original.shipmentId}`}
						className="underline underline-offset-4 hover:text-blue-600"
					>
						{row.original.shipmentNumber}
					</Link>
				</div>
			),
			enableHiding: false,
		},
		{
			id: 'referenceType',
			header: 'Type',
			accessorFn: (row) => row.referenceType ?? '—',
			cell: ({ row }) => (
				<Badge variant="secondary" className="text-xs whitespace-nowrap">
					{String(row.original.referenceType ?? '—')}
				</Badge>
			),
			enableSorting: true,
		},
		{
			id: 'status',
			header: 'Status',
			accessorFn: (row) => row.status,
			cell: ({ row }) => (
				<Badge className={STATUS_COLOR[row.original.status] ?? 'bg-muted'}>
					{row.original.status}
				</Badge>
			),
			enableSorting: true,
		},
		{
			id: 'shippedQuantity',
			header: 'Dispatched Qty',
			accessorFn: (row) => row.shippedQuantity ?? 0,
			cell: ({ row }) => (
				<div className="text-sm whitespace-nowrap font-mono text-xs">
					{row.original.shippedQuantity ?? '—'}
				</div>
			),
		},
		{
			id: 'supplier',
			header: 'Supplier',
			accessorFn: (row) => row.supplierOrgName ?? '—',
			cell: ({ row }) => (
				<div className="text-sm whitespace-nowrap">
					{row.original.supplierOrgName ?? '—'}
				</div>
			),
		},
		{
			id: 'eta',
			header: 'ETA',
			accessorFn: (row) => row.estimatedArrival ?? row.deliveryDate ?? '—',
			cell: ({ row }) => (
				<div className="text-sm whitespace-nowrap">
					{row.original.estimatedArrival
						? new Date(row.original.estimatedArrival).toLocaleDateString()
						: row.original.deliveryDate
							? new Date(row.original.deliveryDate).toLocaleDateString()
							: '—'}
				</div>
			),
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => {
				const r = row.original;
				const isCore = Boolean(r.referenceType);
				const delivered =
					r.status === 'DELIVERED' || r.status === 'PARTIALLY_DELIVERED';
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
								size="icon"
								disabled={viewShipment !== null || receiving}
							>
								<IconDotsVertical />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem
								disabled={viewShipment !== null}
								onClick={() => setViewShipment(r)}
							>
								<IconEye className="mr-2 h-4 w-4" />
								View Details
							</DropdownMenuItem>
							{isCore && delivered && (
								<DropdownMenuItem
									disabled={receiving}
									onClick={() => {
										setReceiveShipment(r);
										setOpenReceive(true);
									}}
								>
									<IconTruck className="mr-2 h-4 w-4" />
									Receive Goods
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const shipmentsTable = useTables<Shipment>({
		data,
		columns,
		pageSize,
		manualPagination: true,
		pageCount: Math.max(1, Math.ceil(totalElements / pageSize)),
		pagination: { pageIndex: page, pageSize },
		onPaginationChange: (next) => {
			setPage(next.pageIndex);
			setPageSize(next.pageSize);
		},
		sorting: [],
	});

	const openReceiveDialog = async (shipment: Shipment) => {
		setReceiveShipment(shipment);
		setSourceLoading(true);
		setSourceContext(null);
		try {
			const ctx = await getGoodsReceiptSource(shipment.shipmentId);
			setSourceContext(ctx);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to load shipment source');
		} finally {
			setSourceLoading(false);
		}
		setOpenReceive(true);
	};

	const handleReceiveCreate = async () => {
		if (!receiveShipment || !sourceContext) return;
		setReceiving(true);
		try {
			const materialId = sourceContext.materialId as number | undefined;
			const quantity = sourceContext.quantity as number | undefined;
			const supplierId = sourceContext.supplierId as number | undefined;
			if (!materialId || !quantity || !supplierId) {
				throw new Error('Shipment source is missing material/supplier/quantity');
			}
			await createGoodsReceipt({
				shipmentId: receiveShipment.shipmentId,
				supplierId,
				receivedDate: new Date().toISOString().split('T')[0],
				deliveryNoteNumber: `DN-${receiveShipment.shipmentNumber}`,
				notes: `Goods receipt for ${receiveShipment.referenceType ?? 'core shipment'} ${receiveShipment.shipmentNumber}`,
				lineItems: [
					{
						materialId,
						lineNumber: 1,
						quantityReceived: quantity,
						unitOfMeasure: (sourceContext.unitOfMeasure as string) || undefined,
						description: sourceContext.materialName as string | undefined,
					},
				],
			});
			toast.success('Goods receipt created');
			setOpenReceive(false);
			setReceiveShipment(null);
			setSourceContext(null);
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to create goods receipt');
		} finally {
			setReceiving(false);
		}
	};

	return (
		<div className="flex flex-1 flex-col p-6 gap-6 min-w-0 max-w-full">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold">Inbound Shipments</h1>
					<p className="text-muted-foreground">
						Consignment fill and VMI replenishment shipments dispatched
						by your suppliers. Use &quot;View&quot; to track a shipment and
						&quot;Receive Goods&quot; once it is delivered.
					</p>
				</div>
				<Button variant="outline" onClick={() => load()}>
					Refresh
				</Button>
			</div>
			<Card className="p-4 gap-2">
				<CardContent className="p-0 space-y-4">
					{/* Search & filters */}
					<div className="flex flex-wrap gap-4 items-end justify-between">
						<div className="flex-1 space-y-2 max-w-[25%]">
							<Label>Search</Label>
							<Input
								placeholder="Shipment #, supplier, material, tracking…"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="flex gap-4 min-w-[25%]">
							<div className=" space-y-2 flex-1">
								<Label>Status</Label>
								<Select
									value={statusFilter}
									onValueChange={(v) => setStatusFilter(v ?? '')}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="All statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All</SelectItem>
										<SelectItem value="DRAFT">Draft</SelectItem>
										<SelectItem value="CONFIRMED">Confirmed</SelectItem>
										<SelectItem value="PICKUP_SCHEDULED">Pickup Scheduled</SelectItem>
										<SelectItem value="IN_TRANSIT">In Transit</SelectItem>
										<SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
										<SelectItem value="DELIVERED">Delivered</SelectItem>
										<SelectItem value="PARTIALLY_DELIVERED">Partially Delivered</SelectItem>
										<SelectItem value="EXCEPTION">Exception</SelectItem>
										<SelectItem value="CANCELLED">Cancelled</SelectItem>
										<SelectItem value="CLOSED">Closed</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className=" space-y-2 flex-1">
								<Label>Type</Label>
								<Select
									value={referenceTypeFilter}
									onValueChange={(v) => setReferenceTypeFilter(v ?? '')}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="All types" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All</SelectItem>
										<SelectItem value="CONSIGNMENT_FILL">Consignment Fill</SelectItem>
										<SelectItem value="VMI_REPLENISHMENT">VMI Replenishment</SelectItem>
										<SelectItem value="PURCHASE_ORDER">Purchase Order</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{isLoading ? (
						<TableSkeleton rows={6} />
					) : (
						<CentralizedDataTable
							table={shipmentsTable}
							emptyMessage="No inbound shipments match your filters"
						/>
					)}
				</CardContent>
			</Card>

			{/* View detail dialog */}
			<Dialog open={viewShipment !== null} onOpenChange={(v) => !v && setViewShipment(null)}>
				<DialogContent className="md:max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							Shipment {viewShipment?.shipmentNumber ?? ''}
						</DialogTitle>
						<DialogDescription>
							Shipment detail and tracking context.
						</DialogDescription>
					</DialogHeader>
					{viewShipment && (
						<div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 text-sm">
							<div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
								<div>
									<p className="text-muted-foreground">Shipment</p>
									<p className="font-medium font-mono">
										{viewShipment.shipmentNumber}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Type</p>
									<p className="font-medium">
										{viewShipment.referenceType ?? '—'}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Status</p>
									<Badge className={STATUS_COLOR[viewShipment.status] ?? 'bg-muted'}>
										{viewShipment.status}
									</Badge>
								</div>
								<div>
									<p className="text-muted-foreground">Supplier</p>
									<p className="font-medium">
										{viewShipment.supplierOrgName ?? '—'}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Material</p>
									<p className="font-medium">
										{viewShipment.materialName ?? viewShipment.materialId ?? '—'}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Dispatched Qty</p>
									<p className="font-mono font-medium">
										{viewShipment.shippedQuantity ?? '—'}
										{viewShipment.quantityUom ? ` ${viewShipment.quantityUom}` : ''}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Pickup</p>
									<p className="font-medium text-sm truncate">
										{viewShipment.pickupLocation ?? viewShipment.pickupAddress ?? '—'}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Delivery</p>
									<p className="font-medium text-sm truncate">
										{viewShipment.deliveryLocation ?? viewShipment.deliveryAddress ?? '—'}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">ETA</p>
									<p className="font-medium text-sm">
										{viewShipment.estimatedArrival ?? viewShipment.deliveryDate ?? '—'}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Tracking</p>
									<p className="font-mono text-xs">
										{viewShipment.trackingNumber ?? '—'}
									</p>
								</div>
							</div>
							{viewShipment.notes && (
								<div className="col-span-full">
									<p className="text-muted-foreground">Notes</p>
									<p className="font-medium whitespace-pre-wrap">{viewShipment.notes}</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Receive goods dialog */}
			<Dialog open={openReceive} onOpenChange={(v) => !v && setOpenReceive(false)}>
				<DialogContent className="md:max-w-lg">
					<DialogHeader>
						<DialogTitle>Receive Goods</DialogTitle>
						<DialogDescription>
							Create a goods receipt for shipment{' '}
							<span className="font-mono">{receiveShipment?.shipmentNumber ?? ''}</span>.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{sourceLoading ? (
							<Skeleton className="h-75 w-full" />
						) : sourceContext ? (
							<div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
								<div>
									<p className="text-muted-foreground">Shipment</p>
									<p className="font-mono font-medium">
										{receiveShipment?.shipmentNumber ?? ''}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Type</p>
									<p className="font-medium">
										{receiveShipment?.referenceType ?? '—'}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Supplier</p>
									<p className="font-medium">
										{String(sourceContext.supplierName ?? '—')}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Material</p>
									<p className="font-medium">
										{String(sourceContext.materialName ?? '—')}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Dispatched Qty</p>
									<p className="font-mono font-medium">
										{String(sourceContext.quantity ?? '—')}
										{' '}
										{String(sourceContext.unitOfMeasure ?? '')}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">ASN</p>
									<p className="font-medium text-sm">
										{String(sourceContext.asnNumber ?? sourceContext.asnId ?? '—')}
									</p>
								</div>
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								Shipment source not available — cannot create a receipt yet.
							</p>
						)}
						<Button
							onClick={handleReceiveCreate}
							disabled={receiving || !sourceContext}
						>
							{receiving ? 'Creating...' : 'Create Goods Receipt'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
