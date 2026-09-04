"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	addShipmentStop,
	addTrackingEvent,
	deleteShipment,
	deleteShipmentDocument,
	getShipmentById,
	getShipmentDocuments,
	getShipmentStops,
	getTrackingEvents,
	transitionShipmentStatus,
	transitionShipmentStopStatus,
	updateFreightCost,
	updateShipment,
	uploadShipmentDocument,
	type FreightCostUpdateRequest,
	type Shipment,
	type ShipmentDocument,
	type ShipmentMode,
	type ShipmentStatus,
	type ShipmentStop,
	type ShipmentStopCreateRequest,
	type ShipmentUpdateRequest,
	type StopStatus,
	type StopType,
	type TrackingEvent,
	type TrackingEventCreateRequest,
	type TrackingEventType,
} from "@/lib/services/shipment-service";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, DollarSign, Download, Edit, ExternalLink, Loader2, Package, Plane, Plus, RefreshCw, Ship, Train, Trash2, Truck, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

const STOP_TYPE_LABELS: Record<StopType, string> = {
	PICKUP: "Pickup",
	DELIVERY: "Delivery",
	TRANSSHIPMENT: "Transshipment",
	CUSTOMS: "Customs",
	INSPECTION: "Inspection",
};

const STOP_STATUS_COLORS: Record<StopStatus, string> = {
	PENDING: "bg-gray-100 text-gray-800",
	ARRIVED: "bg-blue-100 text-blue-800",
	DEPARTED: "bg-indigo-100 text-indigo-800",
	COMPLETED: "bg-green-100 text-green-800",
	SKIPPED: "bg-gray-100 text-gray-600 line-through",
	EXCEPTION: "bg-red-100 text-red-800",
};

const TRACKING_EVENT_COLORS: Record<TrackingEventType, string> = {
	CREATED: "bg-gray-100 text-gray-800",
	CONFIRMED: "bg-blue-100 text-blue-800",
	PICKUP_SCHEDULED: "bg-indigo-100 text-indigo-800",
	PICKUP_ARRIVED: "bg-blue-100 text-blue-800",
	PICKUP_COMPLETED: "bg-green-100 text-green-800",
	DEPARTED: "bg-indigo-100 text-indigo-800",
	IN_TRANSIT: "bg-purple-100 text-purple-800",
	LOCATION_UPDATE: "bg-blue-100 text-blue-800",
	ARRIVED_AT_HUB: "bg-blue-100 text-blue-800",
	DEPARTED_FROM_HUB: "bg-indigo-100 text-indigo-800",
	OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
	DELIVERY_ATTEMPTED: "bg-amber-100 text-amber-800",
	DELIVERED: "bg-green-100 text-green-800",
	EXCEPTION: "bg-red-100 text-red-800",
	DELAYED: "bg-amber-100 text-amber-800",
	REROUTED: "bg-purple-100 text-purple-800",
	CUSTOMS_CLEARANCE: "bg-amber-100 text-amber-800",
	CUSTOMS_CLEARED: "bg-green-100 text-green-800",
	RETURNED: "bg-amber-100 text-amber-800",
	CANCELLED: "bg-gray-100 text-gray-600",
	ON_HOLD: "bg-yellow-100 text-yellow-800",
	RELEASED: "bg-green-100 text-green-800",
};

const VALID_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
	DRAFT: ["CONFIRMED", "CANCELLED"],
	CONFIRMED: ["PICKUP_SCHEDULED", "CANCELLED", "ON_HOLD"],
	PICKUP_SCHEDULED: ["IN_TRANSIT", "CANCELLED", "ON_HOLD"],
	IN_TRANSIT: ["OUT_FOR_DELIVERY", "EXCEPTION", "ON_HOLD"],
	OUT_FOR_DELIVERY: ["DELIVERED", "EXCEPTION", "ON_HOLD"],
	DELIVERED: ["CLOSED", "RETURNED"],
	EXCEPTION: ["IN_TRANSIT", "ON_HOLD", "CANCELLED"],
	CANCELLED: [],
	RETURNED: ["IN_TRANSIT", "CLOSED"],
	ON_HOLD: ["CONFIRMED", "PICKUP_SCHEDULED", "IN_TRANSIT", "CANCELLED"],
	CLOSED: [],
};

const VALID_STOP_STATUS_TRANSITIONS: Record<StopStatus, StopStatus[]> = {
	PENDING: ["ARRIVED", "SKIPPED"],
	ARRIVED: ["DEPARTED", "COMPLETED", "EXCEPTION"],
	DEPARTED: ["COMPLETED", "EXCEPTION"],
	COMPLETED: [],
	SKIPPED: [],
	EXCEPTION: ["ARRIVED", "SKIPPED"],
};

// Zod schemas for form validation
const shipmentUpdateSchema = z.object({
	supplierOrgId: z.number().min(1, "Supplier Organization ID is required").optional(),
	logisticsOrgId: z.number().optional(),
	partnershipId: z.number().optional(),
	mode: z.enum(["ROAD", "RAIL", "AIR", "SEA", "MULTIMODAL"]).optional(),
	incoterms: z.string().max(50, "Incoterms must be 50 characters or less").optional(),
	pickupLocation: z.string().max(100, "Pickup location must be 100 characters or less").optional(),
	pickupAddress: z.string().max(500, "Pickup address must be 500 characters or less").optional(),
	pickupContactName: z.string().max(100, "Contact name must be 100 characters or less").optional(),
	pickupContactPhone: z.string().max(20, "Phone must be 20 characters or less").optional(),
	pickupContactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
	pickupDate: z.string().optional(),
	pickupTimeWindowStart: z.string().optional(),
	pickupTimeWindowEnd: z.string().optional(),
	deliveryLocation: z.string().max(100, "Delivery location must be 100 characters or less").optional(),
	deliveryAddress: z.string().max(500, "Delivery address must be 500 characters or less").optional(),
	deliveryContactName: z.string().max(100, "Contact name must be 100 characters or less").optional(),
	deliveryContactPhone: z.string().max(20, "Phone must be 20 characters or less").optional(),
	deliveryContactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
	deliveryDate: z.string().optional(),
	deliveryTimeWindowStart: z.string().optional(),
	deliveryTimeWindowEnd: z.string().optional(),
	totalWeight: z.number().min(0, "Weight must be positive").optional(),
	totalVolume: z.number().min(0, "Volume must be positive").optional(),
	totalPackages: z.number().min(0, "Packages must be positive").optional(),
	packageType: z.string().max(50, "Package type must be 50 characters or less").optional(),
	specialInstructions: z.string().max(1000, "Special instructions must be 1000 characters or less").optional(),
	hazardousMaterial: z.boolean().optional(),
	temperatureControlled: z.boolean().optional(),
	minTemperature: z.number().optional(),
	maxTemperature: z.number().optional(),
	freightCost: z.number().min(0, "Freight cost must be positive").optional(),
	currency: z.string().max(3, "Currency must be 3 characters").optional(),
	freightTerms: z.string().max(50, "Freight terms must be 50 characters or less").optional(),
	carrierName: z.string().max(100, "Carrier name must be 100 characters or less").optional(),
	carrierReference: z.string().max(100, "Carrier reference must be 100 characters or less").optional(),
	estimatedDeparture: z.string().optional(),
	estimatedArrival: z.string().optional(),
	notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
});

const shipmentStopCreateSchema = z.object({
	sequenceNumber: z.number().min(1, "Sequence number must be at least 1"),
	stopType: z.enum(["PICKUP", "DELIVERY", "TRANSSHIPMENT", "CUSTOMS", "INSPECTION"]),
	location: z.string().max(100, "Location must be 100 characters or less").optional(),
	address: z.string().max(500, "Address must be 500 characters or less").optional(),
	contactName: z.string().max(100, "Contact name must be 100 characters or less").optional(),
	contactPhone: z.string().max(20, "Phone must be 20 characters or less").optional(),
	contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
	scheduledDate: z.string().optional(),
	scheduledTimeWindowStart: z.string().optional(),
	scheduledTimeWindowEnd: z.string().optional(),
	notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
});

const trackingEventCreateSchema = z.object({
	eventType: z.enum([
		"CREATED", "CONFIRMED", "PICKUP_SCHEDULED", "PICKUP_ARRIVED", "PICKUP_COMPLETED",
		"DEPARTED", "IN_TRANSIT", "LOCATION_UPDATE", "ARRIVED_AT_HUB", "DEPARTED_FROM_HUB",
		"OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED", "DELIVERED", "EXCEPTION", "DELAYED",
		"REROUTED", "CUSTOMS_CLEARANCE", "CUSTOMS_CLEARED", "RETURNED", "CANCELLED",
		"ON_HOLD", "RELEASED"
	]),
	eventTimestamp: z.string().min(1, "Timestamp is required"),
	location: z.string().max(100, "Location must be 100 characters or less").optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
	carrierStatusCode: z.string().max(50, "Carrier status code must be 50 characters or less").optional(),
	carrierStatusDescription: z.string().max(200, "Carrier status description must be 200 characters or less").optional(),
	isMilestone: z.boolean(),
});

const freightCostUpdateSchema = z.object({
	estimatedCost: z.number().min(0, "Estimated cost must be positive").optional(),
	actualCost: z.number().min(0, "Actual cost must be positive").optional(),
	currency: z.string().min(1, "Currency is required").max(3, "Currency must be 3 characters"),
});

const documentUploadSchema = z.object({
	documentType: z.enum([
		"BILL_OF_LADING", "COMMERCIAL_INVOICE", "PACKING_LIST", "CERTIFICATE_OF_ORIGIN",
		"INSURANCE_CERTIFICATE", "CUSTOMS_DECLARATION", "DELIVERY_RECEIPT", "PROOF_OF_DELIVERY",
		"INSPECTION_CERTIFICATE", "DANGEROUS_GOODS_DECLARATION", "WAYBILL", "OTHER"
	]),
	documentName: z.string().min(1, "Document name is required").max(100, "Document name must be 100 characters or less"),
	remarks: z.string().max(500, "Remarks must be 500 characters or less").optional(),
});

type ShipmentUpdateFormData = z.infer<typeof shipmentUpdateSchema>;
type ShipmentStopCreateFormData = z.infer<typeof shipmentStopCreateSchema>;
type TrackingEventCreateFormData = z.infer<typeof trackingEventCreateSchema>;
type FreightCostUpdateFormData = z.infer<typeof freightCostUpdateSchema>;
type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

export default function ShipmentDetailPage() {
	const params = useParams();
	const router = useRouter();
	const shipmentId = Number(params.id);

	const [shipment, setShipment] = useState<Shipment | null>(null);
	const [stops, setStops] = useState<ShipmentStop[]>([]);
	const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
	const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("overview");
	const [isEditing, setIsEditing] = useState(false);
	const [showAddStop, setShowAddStop] = useState(false);
	const [showAddTracking, setShowAddTracking] = useState(false);
	const [showUploadDoc, setShowUploadDoc] = useState(false);
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [showFreightCost, setShowFreightCost] = useState(false);

	// React Hook Forms
	const editForm = useForm<ShipmentUpdateFormData>({
		resolver: zodResolver(shipmentUpdateSchema),
		defaultValues: {},
	});

	const newStopForm = useForm<ShipmentStopCreateFormData>({
		resolver: zodResolver(shipmentStopCreateSchema),
		defaultValues: {
			sequenceNumber: 1,
			stopType: "PICKUP",
		},
	});

	const newTrackingForm = useForm<TrackingEventCreateFormData>({
		resolver: zodResolver(trackingEventCreateSchema),
		defaultValues: {
			eventType: "LOCATION_UPDATE",
			eventTimestamp: new Date().toISOString(),
		},
	});

	const freightCostForm = useForm<FreightCostUpdateFormData>({
		resolver: zodResolver(freightCostUpdateSchema),
		defaultValues: {
			currency: "USD",
		},
	});

	const documentUploadForm = useForm<DocumentUploadFormData>({
		resolver: zodResolver(documentUploadSchema),
		defaultValues: {
			documentType: "OTHER",
		},
	});

	const fetchShipment = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [shipmentData, stopsData, trackingData, documentsData] = await Promise.all([
				getShipmentById(shipmentId),
				getShipmentStops(shipmentId),
				getTrackingEvents(shipmentId, 0, 50),
				getShipmentDocuments(shipmentId),
			]);
			setShipment(shipmentData);
			setStops(stopsData);
			setTrackingEvents(trackingData.content);
			setDocuments(documentsData);
			if (!isEditing) {
				editForm.reset({
					supplierOrgId: shipmentData.supplierOrgId,
					logisticsOrgId: shipmentData.logisticsOrgId,
					partnershipId: shipmentData.partnershipId,
					mode: shipmentData.mode,
					incoterms: shipmentData.incoterms,
					pickupLocation: shipmentData.pickupLocation,
					pickupAddress: shipmentData.pickupAddress,
					pickupContactName: shipmentData.pickupContactName,
					pickupContactPhone: shipmentData.pickupContactPhone,
					pickupContactEmail: shipmentData.pickupContactEmail,
					pickupDate: shipmentData.pickupDate,
					pickupTimeWindowStart: shipmentData.pickupTimeWindowStart,
					pickupTimeWindowEnd: shipmentData.pickupTimeWindowEnd,
					deliveryLocation: shipmentData.deliveryLocation,
					deliveryAddress: shipmentData.deliveryAddress,
					deliveryContactName: shipmentData.deliveryContactName,
					deliveryContactPhone: shipmentData.deliveryContactPhone,
					deliveryContactEmail: shipmentData.deliveryContactEmail,
					deliveryDate: shipmentData.deliveryDate,
					deliveryTimeWindowStart: shipmentData.deliveryTimeWindowStart,
					deliveryTimeWindowEnd: shipmentData.deliveryTimeWindowEnd,
					totalWeight: shipmentData.totalWeight,
					totalVolume: shipmentData.totalVolume,
					totalPackages: shipmentData.totalPackages,
					packageType: shipmentData.packageType,
					specialInstructions: shipmentData.specialInstructions,
					hazardousMaterial: shipmentData.hazardousMaterial,
					temperatureControlled: shipmentData.temperatureControlled,
					minTemperature: shipmentData.minTemperature,
					maxTemperature: shipmentData.maxTemperature,
					freightCost: shipmentData.freightCost,
					currency: shipmentData.currency,
					freightTerms: shipmentData.freightTerms,
					carrierName: shipmentData.carrierName,
					carrierReference: shipmentData.carrierReference,
					estimatedDeparture: shipmentData.estimatedDeparture,
					estimatedArrival: shipmentData.estimatedArrival,
					notes: shipmentData.notes,
				});
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to load shipment";
			setError(message);
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	}, [isEditing, shipmentId, editForm]);

	useEffect(() => {
		fetchShipment();
	}, [fetchShipment, shipmentId]);

	const handleSave = async (data: ShipmentUpdateFormData) => {
		try {
			const updated = await updateShipment(shipmentId, data as ShipmentUpdateRequest);
			setShipment(updated);
			setIsEditing(false);
			toast.success("Shipment updated successfully");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to update shipment";
			toast.error(message);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this shipment?")) return;
		try {
			await deleteShipment(shipmentId);
			toast.success("Shipment deleted");
			router.push("/retailer/shipments");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to delete shipment";
			toast.error(message);
		}
	};

	const handleStatusTransition = async (newStatus: ShipmentStatus) => {
		try {
			const updated = await transitionShipmentStatus(shipmentId, newStatus);
			setShipment(updated);
			toast.success(`Status changed to ${newStatus}`);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to transition status";
			toast.error(message);
		}
	};

	const handleAddStop = async (data: ShipmentStopCreateFormData) => {
		try {
			const stop = await addShipmentStop(shipmentId, data as ShipmentStopCreateRequest);
			setStops([...stops, stop].sort((a, b) => a.sequenceNumber - b.sequenceNumber));
			setShowAddStop(false);
			newStopForm.reset({ sequenceNumber: stops.length + 1, stopType: "PICKUP" });
			toast.success("Stop added");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to add stop";
			toast.error(message);
		}
	};

	const handleStopStatusTransition = async (stopId: number, newStatus: StopStatus) => {
		try {
			const updated = await transitionShipmentStopStatus(shipmentId, stopId, newStatus);
			setStops(stops.map(s => s.stopId === stopId ? updated : s));
			toast.success(`Stop status changed to ${newStatus}`);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to transition stop status";
			toast.error(message);
		}
	};

	const handleAddTracking = async (data: TrackingEventCreateFormData) => {
		try {
			const event = await addTrackingEvent(shipmentId, data as TrackingEventCreateRequest);
			setTrackingEvents([event, ...trackingEvents]);
			setShowAddTracking(false);
			newTrackingForm.reset({ eventType: "LOCATION_UPDATE", eventTimestamp: new Date().toISOString(), isMilestone: false });
			toast.success("Tracking event added");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to add tracking event";
			toast.error(message);
		}
	};

	const handleUpdateFreightCost = async (data: FreightCostUpdateFormData) => {
		try {
			const updated = await updateFreightCost(shipmentId, data as FreightCostUpdateRequest);
			setShipment(updated);
			setShowFreightCost(false);
			freightCostForm.reset({ currency: "USD" });
			toast.success("Freight cost updated");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to update freight cost";
			toast.error(message);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4 p-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Loading...</h1>
					<Button disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /></Button>
				</div>
			</div>
		);
	}

	if (error || !shipment) {
		return (
			<div className="flex flex-col items-center justify-center p-12">
				<p className="text-muted-foreground">{error || "Shipment not found"}</p>
				<Button onClick={() => router.push("/retailer/shipments")} className="mt-4">Back to Shipments</Button>
			</div>
		);
	}

	const validNextStatuses = VALID_STATUS_TRANSITIONS[shipment.status] || [];

	return (
		<div className="flex flex-1 flex-col p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold">{shipment.shipmentNumber}</h1>
						<Badge className={STATUS_COLORS[shipment.status]}>
							{shipment.status}
						</Badge>
						<span className="flex items-center gap-2 text-muted-foreground">
							{MODE_ICONS[shipment.mode]} {shipment.mode}
						</span>
					</div>
					<p className="text-muted-foreground mt-1">Shipment ID: {shipment.shipmentId}</p>
				</div>
				<div className="flex gap-2">
					{isEditing ? (
						<>
							<Button variant="outline" onClick={() => { setIsEditing(false); fetchShipment(); }}>Cancel</Button>
							<Button type="submit" form="edit-shipment-form">Save</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
							<Button variant="outline" onClick={() => setShowAddStop(true)}><Plus className="w-4 h-4 mr-2" />Add Stop</Button>
							<Button variant="outline" onClick={() => setShowAddTracking(true)}><Plus className="w-4 h-4 mr-2" />Add Tracking</Button>
							<Button variant="outline" onClick={() => setShowUploadDoc(true)}><Plus className="w-4 h-4 mr-2" />Upload Doc</Button>
							<Button variant="outline" onClick={() => setShowFreightCost(true)}><DollarSign className="w-4 h-4 mr-2" />Freight Cost</Button>
							<Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
						</>
					)}
				</div>
			</div>

			{isEditing && (
				<Form {...editForm}>
					<form id="edit-shipment-form" onSubmit={editForm.handleSubmit(handleSave)} className="space-y-4">
						<Card className="mb-6">
							<CardHeader><CardTitle>Edit Shipment</CardTitle></CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<FormField
									control={editForm.control}
									name="supplierOrgId"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Supplier Org ID</FormLabel>
											<FormControl>
												<Input type="number" placeholder="Enter supplier org ID" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="logisticsOrgId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Logistics Org ID</FormLabel>
											<FormControl>
												<Input type="number" placeholder="Optional" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="partnershipId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Partnership ID</FormLabel>
											<FormControl>
												<Input type="number" placeholder="Optional" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="mode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Mode</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select mode" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="ROAD">Road</SelectItem>
													<SelectItem value="RAIL">Rail</SelectItem>
													<SelectItem value="AIR">Air</SelectItem>
													<SelectItem value="SEA">Sea</SelectItem>
													<SelectItem value="MULTIMODAL">Multimodal</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="incoterms"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Incoterms</FormLabel>
											<FormControl>
												<Input placeholder="e.g., FOB, CIF, EXW" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="pickupAddress"
									render={({ field }) => (
										<FormItem className="md:col-span-3">
											<FormLabel>Pickup Address</FormLabel>
											<FormControl>
												<Textarea rows={2} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="deliveryAddress"
									render={({ field }) => (
										<FormItem className="md:col-span-3">
											<FormLabel>Delivery Address</FormLabel>
											<FormControl>
												<Textarea rows={2} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="pickupDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Pickup Date</FormLabel>
											<FormControl>
												<Input type="datetime-local" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="deliveryDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Delivery Date</FormLabel>
											<FormControl>
												<Input type="datetime-local" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="totalWeight"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Total Weight</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="totalVolume"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Total Volume</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="totalPackages"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Total Packages</FormLabel>
											<FormControl>
												<Input type="number" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="freightCost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Freight Cost</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="currency"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Currency</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="carrierName"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Carrier Name</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="carrierReference"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Carrier Reference</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name="notes"
									render={({ field }) => (
										<FormItem className="md:col-span-3">
											<FormLabel>Notes</FormLabel>
											<FormControl>
												<Textarea rows={3} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					</form>
				</Form>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="stops">Stops ({stops.length})</TabsTrigger>
					<TabsTrigger value="tracking">Tracking ({trackingEvents.length})</TabsTrigger>
					<TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
					<TabsTrigger value="freight">Freight Cost</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-4 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Supplier</CardTitle></CardHeader>
							<CardContent className="text-2xl font-bold">{shipment.supplierOrgName || shipment.supplierOrgId}</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Logistics</CardTitle></CardHeader>
							<CardContent className="text-2xl font-bold">{shipment.logisticsOrgName || shipment.logisticsOrgId || "—"}</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Partnership</CardTitle></CardHeader>
							<CardContent className="text-2xl font-bold">{shipment.partnershipNumber || shipment.partnershipId || "—"}</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Incoterms</CardTitle></CardHeader>
							<CardContent className="text-2xl font-bold">{shipment.incoterms || "—"}</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader><CardTitle>Pickup Details</CardTitle></CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{shipment.pickupLocation || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Address</span><span>{shipment.pickupAddress || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{shipment.pickupContactName || "—"} ({shipment.pickupContactPhone || "—"})</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{shipment.pickupContactEmail || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleString() : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Time Window</span><span>{shipment.pickupTimeWindowStart && shipment.pickupTimeWindowEnd ? `${new Date(shipment.pickupTimeWindowStart).toLocaleTimeString()} - ${new Date(shipment.pickupTimeWindowEnd).toLocaleTimeString()}` : "—"}</span></div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader><CardTitle>Delivery Details</CardTitle></CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{shipment.deliveryLocation || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Address</span><span>{shipment.deliveryAddress || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{shipment.deliveryContactName || "—"} ({shipment.deliveryContactPhone || "—"})</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{shipment.deliveryContactEmail || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleString() : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Time Window</span><span>{shipment.deliveryTimeWindowStart && shipment.deliveryTimeWindowEnd ? `${new Date(shipment.deliveryTimeWindowStart).toLocaleTimeString()} - ${new Date(shipment.deliveryTimeWindowEnd).toLocaleTimeString()}` : "—"}</span></div>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader><CardTitle>Shipment Details</CardTitle></CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between"><span className="text-muted-foreground">Total Weight</span><span>{shipment.totalWeight ? `${shipment.totalWeight} kg` : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Total Volume</span><span>{shipment.totalVolume ? `${shipment.totalVolume} m³` : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Total Packages</span><span>{shipment.totalPackages || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Package Type</span><span>{shipment.packageType || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Hazardous Material</span><span>{shipment.hazardousMaterial ? "Yes" : "No"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Temperature Controlled</span><span>{shipment.temperatureControlled ? "Yes" : "No"}</span></div>
								{shipment.temperatureControlled && (
									<>
										<div className="flex justify-between"><span className="text-muted-foreground">Min Temperature</span><span>{shipment.minTemperature}°C</span></div>
										<div className="flex justify-between"><span className="text-muted-foreground">Max Temperature</span><span>{shipment.maxTemperature}°C</span></div>
									</>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader><CardTitle>Freight & Carrier</CardTitle></CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between"><span className="text-muted-foreground">Estimated Freight Cost</span><span>{shipment.freightCost ? `${shipment.currency || "USD"} ${shipment.freightCost.toLocaleString()}` : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Actual Freight Cost</span><span>{shipment.actualFreightCost ? `${shipment.currency || "USD"} ${shipment.actualFreightCost.toLocaleString()}` : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Freight Terms</span><span>{shipment.freightTerms || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Tracking Number</span><span>{shipment.trackingNumber || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Carrier</span><span>{shipment.carrierName || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Carrier Reference</span><span>{shipment.carrierReference || "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Est. Departure</span><span>{shipment.estimatedDeparture ? new Date(shipment.estimatedDeparture).toLocaleString() : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Actual Departure</span><span>{shipment.actualDeparture ? new Date(shipment.actualDeparture).toLocaleString() : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Est. Arrival</span><span>{shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleString() : "—"}</span></div>
								<div className="flex justify-between"><span className="text-muted-foreground">Actual Arrival</span><span>{shipment.actualArrival ? new Date(shipment.actualArrival).toLocaleString() : "—"}</span></div>
							</CardContent>
						</Card>
					</div>

					{shipment.specialInstructions && (
						<Card>
							<CardHeader><CardTitle>Special Instructions</CardTitle></CardHeader>
							<CardContent><p className="whitespace-pre-wrap">{shipment.specialInstructions}</p></CardContent>
						</Card>
					)}

					<Card>
						<CardHeader><CardTitle>Status Actions</CardTitle></CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{validNextStatuses.map(status => (
									<Button
										key={status}
										variant="outline"
										onClick={() => handleStatusTransition(status)}
										className={STATUS_COLORS[status].replace("bg-", "border-").replace("text-", "text-")}
									>
										{status}
									</Button>
								))}
								{validNextStatuses.length === 0 && <span className="text-muted-foreground">No valid transitions from {shipment.status}</span>}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="stops" className="mt-4 space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Shipment Stops</h3>
						<Button onClick={() => setShowAddStop(true)}><Plus className="w-4 h-4 mr-2" />Add Stop</Button>
					</div>

					{showAddStop && (
						<Form {...newStopForm}>
							<form onSubmit={newStopForm.handleSubmit(handleAddStop)} className="space-y-4">
								<Card>
									<CardHeader><CardTitle>Add Stop</CardTitle></CardHeader>
									<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={newStopForm.control}
											name="sequenceNumber"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Sequence Number</FormLabel>
													<FormControl>
														<Input type="number" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="stopType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Stop Type</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select type" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="PICKUP">Pickup</SelectItem>
															<SelectItem value="DELIVERY">Delivery</SelectItem>
															<SelectItem value="TRANSSHIPMENT">Transshipment</SelectItem>
															<SelectItem value="CUSTOMS">Customs</SelectItem>
															<SelectItem value="INSPECTION">Inspection</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="location"
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Location</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="address"
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Address</FormLabel>
													<FormControl>
														<Textarea rows={2} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="contactName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Contact Name</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="contactPhone"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Contact Phone</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="contactEmail"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Contact Email</FormLabel>
													<FormControl>
														<Input type="email" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="scheduledDate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Scheduled Date</FormLabel>
													<FormControl>
														<Input type="datetime-local" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="scheduledTimeWindowStart"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Time Window Start</FormLabel>
													<FormControl>
														<Input type="datetime-local" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="scheduledTimeWindowEnd"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Time Window End</FormLabel>
													<FormControl>
														<Input type="datetime-local" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newStopForm.control}
											name="notes"
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Notes</FormLabel>
													<FormControl>
														<Textarea rows={2} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div className="md:col-span-2 flex gap-2">
											<Button type="submit">Add Stop</Button>
											<Button type="button" variant="outline" onClick={() => setShowAddStop(false)}>Cancel</Button>
										</div>
									</CardContent>
								</Card>
							</form>
						</Form>
					)}

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Seq</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Scheduled</TableHead>
								<TableHead>Actual</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{stops.map(stop => (
								<TableRow key={stop.stopId}>
									<TableCell>{stop.sequenceNumber}</TableCell>
									<TableCell><Badge variant="secondary">{STOP_TYPE_LABELS[stop.stopType] || stop.stopType}</Badge></TableCell>
									<TableCell>{stop.location || stop.address || "—"}</TableCell>
									<TableCell>{stop.scheduledDate ? new Date(stop.scheduledDate).toLocaleString() : "—"}</TableCell>
									<TableCell>{stop.actualDate ? new Date(stop.actualDate).toLocaleString() : "—"}</TableCell>
									<TableCell><Badge className={STOP_STATUS_COLORS[stop.status]}>{stop.status}</Badge></TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											{VALID_STOP_STATUS_TRANSITIONS[stop.status]?.map(s => (
												<Button key={s} variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStopStatusTransition(stop.stopId, s)}>
													<RefreshCw className="w-3 h-3" />
												</Button>
											))}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{stops.length === 0 && !showAddStop && (
						<div className="text-center py-8 text-muted-foreground">No stops added yet. Click &quot;Add Stop&quot; to create one.</div>
					)}
				</TabsContent>

				<TabsContent value="tracking" className="mt-4 space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Tracking Events</h3>
						<Button onClick={() => setShowAddTracking(true)}><Plus className="w-4 h-4 mr-2" />Add Event</Button>
					</div>

					{showAddTracking && (
						<Form {...newTrackingForm}>
							<form onSubmit={newTrackingForm.handleSubmit(handleAddTracking)} className="space-y-4">
								<Card>
									<CardHeader><CardTitle>Add Tracking Event</CardTitle></CardHeader>
									<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={newTrackingForm.control}
											name="eventType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Event Type</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select event type" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{Object.values(["CREATED", "CONFIRMED", "PICKUP_SCHEDULED", "PICKUP_ARRIVED", "PICKUP_COMPLETED", "DEPARTED", "IN_TRANSIT", "LOCATION_UPDATE", "ARRIVED_AT_HUB", "DEPARTED_FROM_HUB", "OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED", "DELIVERED", "EXCEPTION", "DELAYED", "REROUTED", "CUSTOMS_CLEARANCE", "CUSTOMS_CLEARED", "RETURNED", "CANCELLED", "ON_HOLD", "RELEASED"]).map(t => (
																<SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="eventTimestamp"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Timestamp</FormLabel>
													<FormControl>
														<Input type="datetime-local" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="location"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Location</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="latitude"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Latitude</FormLabel>
													<FormControl>
														<Input type="number" step="any" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="longitude"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Longitude</FormLabel>
													<FormControl>
														<Input type="number" step="any" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="description"
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Description</FormLabel>
													<FormControl>
														<Textarea rows={2} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="carrierStatusCode"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Carrier Status Code</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="carrierStatusDescription"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Carrier Status Description</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={newTrackingForm.control}
											name="isMilestone"
											render={({ field }) => (
												<FormItem className="md:col-span-2 flex items-center gap-2">
													<FormControl>
														<input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
													</FormControl>
													<FormLabel className="text-sm cursor-pointer">Milestone</FormLabel>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div className="md:col-span-2 flex gap-2">
											<Button type="submit">Add Event</Button>
											<Button type="button" variant="outline" onClick={() => setShowAddTracking(false)}>Cancel</Button>
										</div>
									</CardContent>
								</Card>
							</form>
						</Form>
					)}

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Timestamp</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Coordinates</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Carrier Status</TableHead>
								<TableHead>Milestone</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{trackingEvents.map(event => (
								<TableRow key={event.eventId}>
									<TableCell><Badge className={TRACKING_EVENT_COLORS[event.eventType] || "bg-gray-100 text-gray-800"}>{event.eventType.replace(/_/g, " ")}</Badge></TableCell>
									<TableCell>{new Date(event.eventTimestamp).toLocaleString()}</TableCell>
									<TableCell>{event.location || "—"}</TableCell>
									<TableCell>{event.latitude && event.longitude ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}` : "—"}</TableCell>
									<TableCell>{event.description || "—"}</TableCell>
									<TableCell>{event.carrierStatusCode || "—"} {event.carrierStatusDescription ? `(${event.carrierStatusDescription})` : ""}</TableCell>
									<TableCell>{event.isMilestone ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-400 mx-auto" />}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{trackingEvents.length === 0 && !showAddTracking && (
						<div className="text-center py-8 text-muted-foreground">No tracking events yet. Click &quot;Add Event&quot; to create one.</div>
					)}
				</TabsContent>

				<TabsContent value="documents" className="mt-4 space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Documents</h3>
						<Button onClick={() => setShowUploadDoc(true)}><Plus className="w-4 h-4 mr-2" />Upload Document</Button>
					</div>

					{showUploadDoc && (
						<Form {...documentUploadForm}>
							<form onSubmit={documentUploadForm.handleSubmit(async (data) => {
								if (!uploadFile) {
									toast.error("Please select a file");
									return;
								}
								try {
									const doc = await uploadShipmentDocument(shipmentId, uploadFile, data.documentType, data.documentName, data.remarks);
									setDocuments([doc, ...documents]);
									setShowUploadDoc(false);
									setUploadFile(null);
									documentUploadForm.reset({ documentType: "OTHER" });
									toast.success("Document uploaded");
								} catch (err: unknown) {
									const message = err instanceof Error ? err.message : "Failed to upload document";
									toast.error(message);
								}
							})} className="space-y-4">
								<Card>
									<CardHeader><CardTitle>Upload Document</CardTitle></CardHeader>
									<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={documentUploadForm.control}
											name="documentType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Document Type</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select type" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{["BILL_OF_LADING", "COMMERCIAL_INVOICE", "PACKING_LIST", "CERTIFICATE_OF_ORIGIN", "INSURANCE_CERTIFICATE", "CUSTOMS_DECLARATION", "DELIVERY_RECEIPT", "PROOF_OF_DELIVERY", "INSPECTION_CERTIFICATE", "DANGEROUS_GOODS_DECLARATION", "WAYBILL", "OTHER"].map(t => (
																<SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={documentUploadForm.control}
											name="documentName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Document Name</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={documentUploadForm.control}
											name="remarks"
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Remarks</FormLabel>
													<FormControl>
														<Textarea rows={2} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium mb-1">File</label>
											<Input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
										</div>
										<div className="md:col-span-2 flex gap-2">
											<Button type="submit" disabled={!uploadFile}>Upload</Button>
											<Button type="button" variant="outline" onClick={() => { setShowUploadDoc(false); setUploadFile(null); documentUploadForm.reset({ documentType: "OTHER" }); }}>Cancel</Button>
										</div>
									</CardContent>
								</Card>
							</form>
						</Form>
					)}

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Size</TableHead>
								<TableHead>MIME Type</TableHead>
								<TableHead>Remarks</TableHead>
								<TableHead>Uploaded</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{documents.map(doc => (
								<TableRow key={doc.documentId}>
									<TableCell><Badge variant="secondary">{doc.documentType.replace(/_/g, " ")}</Badge></TableCell>
									<TableCell>{doc.documentName}</TableCell>
									<TableCell>{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—"}</TableCell>
									<TableCell>{doc.mimeType || "—"}</TableCell>
									<TableCell>{doc.remarks || "—"}</TableCell>
									<TableCell>{new Date(doc.createdAt).toLocaleString()}</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" className="h-7 w-7"><Download className="w-4 h-4" /></Button>
											<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(doc.documentUrl, "_blank")}><ExternalLink className="w-4 h-4" /></Button>
											<Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => { if (confirm("Delete this document?")) deleteShipmentDocument(shipmentId, doc.documentId).then(() => { setDocuments(documents.filter(d => d.documentId !== doc.documentId)); toast.success("Document deleted"); }); }}><Trash2 className="w-4 h-4" /></Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{documents.length === 0 && !showUploadDoc && (
						<div className="text-center py-8 text-muted-foreground">No documents uploaded yet. Click &quot;Upload Document&quot; to add one.</div>
					)}
				</TabsContent>

				<TabsContent value="freight" className="mt-4 space-y-4">
					<Card>
						<CardHeader><CardTitle>Freight Cost Management</CardTitle></CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<Card>
									<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Estimated Cost</CardTitle></CardHeader>
									<CardContent className="text-2xl font-bold">{shipment.freightCost ? `${shipment.currency || "USD"} ${shipment.freightCost.toLocaleString()}` : "—"}</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Actual Cost</CardTitle></CardHeader>
									<CardContent className="text-2xl font-bold">{shipment.actualFreightCost ? `${shipment.currency || "USD"} ${shipment.actualFreightCost.toLocaleString()}` : "—"}</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Currency</CardTitle></CardHeader>
									<CardContent className="text-2xl font-bold">{shipment.currency || "USD"}</CardContent>
								</Card>
							</div>

							<div className="flex justify-between items-center">
								<h4 className="font-semibold">Update Freight Cost</h4>
								{showFreightCost ? (
									<Button variant="outline" size="sm" onClick={() => setShowFreightCost(false)}>Cancel</Button>
								) : (
									<Button onClick={() => setShowFreightCost(true)}><Plus className="w-4 h-4 mr-2" />Update</Button>
								)}
							</div>

							{showFreightCost && (
								<Form {...freightCostForm}>
									<form onSubmit={freightCostForm.handleSubmit(handleUpdateFreightCost)} className="space-y-4">
										<Card className="bg-muted/50">
											<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
												<FormField
													control={freightCostForm.control}
													name="estimatedCost"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Estimated Cost</FormLabel>
															<FormControl>
																<Input type="number" step="0.01" placeholder="Optional" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={freightCostForm.control}
													name="actualCost"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Actual Cost</FormLabel>
															<FormControl>
																<Input type="number" step="0.01" placeholder="Optional" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={freightCostForm.control}
													name="currency"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Currency</FormLabel>
															<FormControl>
																<Input {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<div className="md:col-span-3 flex gap-2">
													<Button type="submit">Update</Button>
													<Button type="button" variant="outline" onClick={() => { setShowFreightCost(false); freightCostForm.reset({ currency: "USD" }); }}>Cancel</Button>
												</div>
											</CardContent>
										</Card>
									</form>
								</Form>
							)}

							{shipment.freightTerms && (
								<div className="p-4 bg-muted/50 rounded-lg">
									<p className="text-sm text-muted-foreground">Freight Terms: <span className="font-medium">{shipment.freightTerms}</span></p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}