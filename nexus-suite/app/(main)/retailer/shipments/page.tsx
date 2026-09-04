"use client";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShipments, type Shipment, type ShipmentFilter, type ShipmentMode, type ShipmentPaginatedResponse, type ShipmentStatus } from "@/lib/services/shipment-service";
import { Edit, Eye, Loader2, Package, Plane, Plus, Ship, Train, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<ShipmentStatus, string> = {
	DRAFT: "bg-gray-100 text-gray-800",
	CONFIRMED: "bg-blue-100 text-blue-800",
	PICKUP_SCHEDULED: "bg-indigo-100 text-indigo-800",
	IN_TRANSIT: "bg-purple-100 text-purple-800",
	OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
	DELIVERED: "bg-green-100 text-green-800",
	EXCEPTION: "bg-red-100 text-red-800",
	CANCELLED: "bg-gray-100 text-gray-600 line-through",
	RETURNED: "bg-amber-100 text-amber-800",
	ON_HOLD: "bg-yellow-100 text-yellow-800",
	CLOSED: "bg-slate-100 text-slate-800",
};

const MODE_ICONS: Record<ShipmentMode, React.ReactNode> = {
	ROAD: <Truck className="w-4 h-4" />,
	RAIL: <Train className="w-4 h-4" />,
	AIR: <Plane className="w-4 h-4" />,
	SEA: <Ship className="w-4 h-4" />,
	MULTIMODAL: <Package className="w-4 h-4" />,
};

export default function ShipmentsPage() {
	const [data, setData] = useState<ShipmentPaginatedResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filter, setFilter] = useState<ShipmentFilter>({
		pageNo: 0,
		pageOffset: 10,
		sortBy: "createdAt",
		sortDirection: "desc",
	});
	const [searchTerm, setSearchTerm] = useState("");

	const fetchShipments = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await getShipments(filter);
			setData(result);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to load shipments";
			setError(message);
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	}, [filter]);

	useEffect(() => {
		fetchShipments();
	}, [fetchShipments, filter]);

	const handlePageChange = (newPage: number) => {
		setFilter((prev) => ({ ...prev, pageNo: newPage }));
	};

	const handleFilterChange = (newFilter: Partial<ShipmentFilter>) => {
		setFilter((prev) => ({ ...prev, ...newFilter, pageNo: 0 }));
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		handleFilterChange({ pageNo: 0 });
	};

	if (isLoading && !data) {
		return (
			<div className="flex flex-col gap-4 p-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Shipments</h1>
					<Button disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</Button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="animate-pulse space-y-3 p-4 border rounded-lg bg-card">
							<div className="h-4 w-3/4 bg-muted rounded" />
							<div className="h-3 w-1/2 bg-muted rounded" />
							<div className="h-3 w-1/3 bg-muted rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center p-12">
				<p className="text-muted-foreground">{error}</p>
				<Button onClick={fetchShipments} className="mt-4">Retry</Button>
			</div>
		);
	}

	const columns = [
		{ key: "shipmentNumber", header: "Shipment #", className: "font-mono font-medium" },
		{
			key: "status", header: "Status", render: (row: Shipment) => (
				<Badge className={STATUS_COLORS[row.status as ShipmentStatus] || "bg-gray-100 text-gray-800"}>
					{row.status}
				</Badge>
			)
		},
		{
			key: "mode", header: "Mode", render: (row: Shipment) => (
				<span className="flex items-center gap-2">
					{MODE_ICONS[row.mode as ShipmentMode] || <Package className="w-4 h-4" />}
					{row.mode}
				</span>
			)
		},
		{ key: "supplierOrgName", header: "Supplier" },
		{ key: "logisticsOrgName", header: "Logistics" },
		{ key: "pickupDate", header: "Pickup Date", render: (row: Shipment) => row.pickupDate ? new Date(row.pickupDate).toLocaleDateString() : "—" },
		{ key: "deliveryDate", header: "Delivery Date", render: (row: Shipment) => row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : "—" },
		{ key: "freightCost", header: "Freight Cost", render: (row: Shipment) => row.freightCost ? `${row.currency || "USD"} ${row.freightCost.toLocaleString()}` : "—" },
		{
			key: "actions", header: "Actions", render: (row: Shipment) => (
				<div className="flex items-center gap-2">
					<Link href={`/retailer/shipments/${row.shipmentId}`}>
						<Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
					</Link>
					<Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
					<Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
				</div>
			)
		},
	];

	// Transform shipment data to match DataTable schema
	const tableData = data?.content.map((shipment, index) => ({
		id: index + 1 + ((filter.pageNo ?? 0) * (filter.pageOffset ?? 10)),
		header: shipment.shipmentNumber,
		type: shipment.mode,
		status: shipment.status,
		target: shipment.supplierOrgName || "—",
		limit: shipment.logisticsOrgName || "—",
		reviewer: shipment.freightCost ? `${shipment.currency || "USD"} ${shipment.freightCost.toLocaleString()}` : "—",
	})) || [];

	return (
		<div className="flex flex-1 flex-col p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Shipments</h1>
					<p className="text-muted-foreground">Manage and track all shipments</p>
				</div>
				<Link href="/retailer/shipments/new">
					<Button><Plus className="w-4 h-4 mr-2" />New Shipment</Button>
				</Link>
			</div>

			<form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row p-4 border rounded-lg bg-card">
				<div className="flex-1">
					<Input
						placeholder="Search shipments..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full"
					/>
				</div>
				<div className="flex gap-2">
					<Select value={filter.status || ""} onValueChange={(value) => handleFilterChange({ status: value || undefined })}>
						<SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Statuses</SelectItem>
							<SelectItem value="DRAFT">Draft</SelectItem>
							<SelectItem value="CONFIRMED">Confirmed</SelectItem>
							<SelectItem value="PICKUP_SCHEDULED">Pickup Scheduled</SelectItem>
							<SelectItem value="IN_TRANSIT">In Transit</SelectItem>
							<SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
							<SelectItem value="DELIVERED">Delivered</SelectItem>
							<SelectItem value="EXCEPTION">Exception</SelectItem>
							<SelectItem value="CANCELLED">Cancelled</SelectItem>
							<SelectItem value="RETURNED">Returned</SelectItem>
							<SelectItem value="ON_HOLD">On Hold</SelectItem>
							<SelectItem value="CLOSED">Closed</SelectItem>
						</SelectContent>
					</Select>
					<Select value={filter.mode || ""} onValueChange={(value) => handleFilterChange({ mode: value || undefined })}>
						<SelectTrigger className="w-40"><SelectValue placeholder="All Modes" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Modes</SelectItem>
							<SelectItem value="ROAD">Road</SelectItem>
							<SelectItem value="RAIL">Rail</SelectItem>
							<SelectItem value="AIR">Air</SelectItem>
							<SelectItem value="SEA">Sea</SelectItem>
							<SelectItem value="MULTIMODAL">Multimodal</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</form>

			<DataTable data={tableData} />
		</div>
	);
}