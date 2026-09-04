"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createShipment, type ShipmentCreateRequest } from "@/lib/services/shipment-service";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Package, Plane, Ship, Train, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


// Zod schema for shipment creation validation
const shipmentCreateSchema = z.object({
	supplierOrgId: z.number().min(1, "Supplier Organization ID is required"),
	logisticsOrgId: z.number().optional(),
	partnershipId: z.number().optional(),
	mode: z.enum(["ROAD", "RAIL", "AIR", "SEA", "MULTIMODAL"]),
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
	hazardousMaterial: z.boolean(),
	temperatureControlled: z.boolean(),
	minTemperature: z.number().optional(),
	maxTemperature: z.number().optional(),
	freightCost: z.number().min(0, "Freight cost must be positive").optional(),
	currency: z.string().min(1, "Currency is required").max(3, "Currency must be 3 characters"),
	freightTerms: z.enum(["PREPAID", "COLLECT", "THIRD_PARTY"]).optional(),
	carrierName: z.string().max(100, "Carrier name must be 100 characters or less").optional(),
	carrierReference: z.string().max(100, "Carrier reference must be 100 characters or less").optional(),
	estimatedDeparture: z.string().optional(),
	estimatedArrival: z.string().optional(),
	notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
});

type ShipmentCreateFormData = z.infer<typeof shipmentCreateSchema>;

export default function NewShipmentPage() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<ShipmentCreateFormData>({
		resolver: zodResolver(shipmentCreateSchema),
		defaultValues: {
			supplierOrgId: 0,
			mode: "ROAD",
			currency: "USD",
			freightTerms: "PREPAID",
			hazardousMaterial: false,
			temperatureControlled: false,
		},
	});

	const onSubmit = async (data: ShipmentCreateFormData) => {
		setIsSubmitting(true);
		try {
			const createRequest: ShipmentCreateRequest = {
				supplierOrgId: data.supplierOrgId,
				logisticsOrgId: data.logisticsOrgId,
				partnershipId: data.partnershipId,
				mode: data.mode,
				incoterms: data.incoterms,
				pickupLocation: data.pickupLocation,
				pickupAddress: data.pickupAddress,
				pickupContactName: data.pickupContactName,
				pickupContactPhone: data.pickupContactPhone,
				pickupContactEmail: data.pickupContactEmail || undefined,
				pickupDate: data.pickupDate,
				pickupTimeWindowStart: data.pickupTimeWindowStart,
				pickupTimeWindowEnd: data.pickupTimeWindowEnd,
				deliveryLocation: data.deliveryLocation,
				deliveryAddress: data.deliveryAddress,
				deliveryContactName: data.deliveryContactName,
				deliveryContactPhone: data.deliveryContactPhone,
				deliveryContactEmail: data.deliveryContactEmail || undefined,
				deliveryDate: data.deliveryDate,
				deliveryTimeWindowStart: data.deliveryTimeWindowStart,
				deliveryTimeWindowEnd: data.deliveryTimeWindowEnd,
				totalWeight: data.totalWeight,
				totalVolume: data.totalVolume,
				totalPackages: data.totalPackages,
				packageType: data.packageType,
				specialInstructions: data.specialInstructions,
				hazardousMaterial: data.hazardousMaterial,
				temperatureControlled: data.temperatureControlled,
				minTemperature: data.minTemperature,
				maxTemperature: data.maxTemperature,
				freightCost: data.freightCost,
				currency: data.currency,
				freightTerms: data.freightTerms,
				carrierName: data.carrierName,
				carrierReference: data.carrierReference,
				estimatedDeparture: data.estimatedDeparture,
				estimatedArrival: data.estimatedArrival,
				notes: data.notes,
			};
			const shipment = await createShipment(createRequest);
			toast.success("Shipment created successfully");
			router.push(`/retailer/shipments/${shipment.shipmentId}`);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to create shipment";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col p-6">
				<div className="flex items-center gap-4 mb-6">
					<Button variant="ghost" size="icon" type="button" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
					<div>
						<h1 className="text-2xl font-bold">New Shipment</h1>
						<p className="text-muted-foreground">Create a new shipment record</p>
					</div>
				</div>

				<div className="max-w-4xl mx-auto w-full space-y-4">
					<Card>
						<CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="supplierOrgId"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Supplier Organization ID *</FormLabel>
										<FormControl>
											<Input type="number" placeholder="Enter supplier org ID" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="logisticsOrgId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Logistics Organization ID</FormLabel>
										<FormControl>
											<Input type="number" placeholder="Optional" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
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
								control={form.control}
								name="mode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Transport Mode *</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select mode" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="ROAD"><Truck className="w-4 h-4 mr-2" />Road</SelectItem>
												<SelectItem value="RAIL"><Train className="w-4 h-4 mr-2" />Rail</SelectItem>
												<SelectItem value="AIR"><Plane className="w-4 h-4 mr-2" />Air</SelectItem>
												<SelectItem value="SEA"><Ship className="w-4 h-4 mr-2" />Sea</SelectItem>
												<SelectItem value="MULTIMODAL"><Package className="w-4 h-4 mr-2" />Multimodal</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="incoterms"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Incoterms</FormLabel>
										<FormControl>
											<Input placeholder="e.g., FOB, CIF, EXW" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader><CardTitle>Pickup Details</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="pickupLocation"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Pickup Location</FormLabel>
										<FormControl>
											<Input placeholder="Warehouse, factory, port, etc." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="pickupAddress"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Pickup Address</FormLabel>
										<FormControl>
											<Textarea placeholder="Full pickup address" rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="pickupContactName"
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
								control={form.control}
								name="pickupContactPhone"
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
								control={form.control}
								name="pickupContactEmail"
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
								control={form.control}
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
								control={form.control}
								name="pickupTimeWindowStart"
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
								control={form.control}
								name="pickupTimeWindowEnd"
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
						</CardContent>
					</Card>

					<Card>
						<CardHeader><CardTitle>Delivery Details</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="deliveryLocation"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Delivery Location</FormLabel>
										<FormControl>
											<Input placeholder="Warehouse, store, customer address, etc." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="deliveryAddress"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Delivery Address</FormLabel>
										<FormControl>
											<Textarea placeholder="Full delivery address" rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="deliveryContactName"
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
								control={form.control}
								name="deliveryContactPhone"
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
								control={form.control}
								name="deliveryContactEmail"
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
								control={form.control}
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
								control={form.control}
								name="deliveryTimeWindowStart"
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
								control={form.control}
								name="deliveryTimeWindowEnd"
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
						</CardContent>
					</Card>

					<Card>
						<CardHeader><CardTitle>Shipment Details</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="totalWeight"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Total Weight (kg)</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="totalVolume"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Total Volume (m³)</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
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
								control={form.control}
								name="packageType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Package Type</FormLabel>
										<FormControl>
											<Input placeholder="Pallet, Box, Crate, etc." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="specialInstructions"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Special Instructions</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="hazardousMaterial"
								render={({ field }) => (
									<FormItem className="flex items-center gap-2">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="text-sm cursor-pointer">Hazardous Material</FormLabel>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="temperatureControlled"
								render={({ field }) => (
									<FormItem className="flex items-center gap-2">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="text-sm cursor-pointer">Temperature Controlled</FormLabel>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="minTemperature"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Min Temperature (°C)</FormLabel>
										<FormControl>
											<Input type="number" step="0.1" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="maxTemperature"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Max Temperature (°C)</FormLabel>
										<FormControl>
											<Input type="number" step="0.1" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader><CardTitle>Freight & Carrier</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="freightCost"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estimated Freight Cost</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
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
								control={form.control}
								name="freightTerms"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Freight Terms</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select terms" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="PREPAID">Prepaid</SelectItem>
												<SelectItem value="COLLECT">Collect</SelectItem>
												<SelectItem value="THIRD_PARTY">Third Party</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="carrierName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Carrier Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
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
								control={form.control}
								name="estimatedDeparture"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estimated Departure</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="estimatedArrival"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estimated Arrival</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
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

					<div className="flex justify-end gap-4 pt-4 border-t">
						<Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Create Shipment
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}