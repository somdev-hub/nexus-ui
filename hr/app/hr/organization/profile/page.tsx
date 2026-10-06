"use client";

import { useState, useEffect } from "react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HRTable, type ColumnDef } from "@/components/hr-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Landmark, MapPin } from "lucide-react";
import type {
	OrgAccountInfo,
	OrgAddress
} from "@/types";
import {
	getOrgAccountInfo,
	createOrgAccountInfo,
	updateOrgAccountInfo,
	deleteOrgAccountInfo,
	getOrgAddresses,
	createOrgAddress,
	updateOrgAddress,
	deleteOrgAddress
} from "@/lib/auth-service";

const emptyAccountForm: OrgAccountInfo = {
	bankName: "",
	bankAccountBranch: "",
	bankAccountName: "",
	bankAccountNumber: "",
	bankAccountType: "CURRENT",
	bankIfscCode: "",
	panNumber: ""
};

const emptyAddressForm: OrgAddress = {
	label: "",
	addressType: "HEAD_OFFICE",
	addressLine1: "",
	addressLine2: "",
	city: "",
	state: "",
	country: "",
	pincode: "",
	contactName: "",
	contactPhone: "",
	isDefaultBilling: false,
	isDefaultShipping: false
};

export default function OrganizationProfilePage() {
	const userOrgId = useOrgId();

	// Organization bank/account details state
	const [accountInfo, setAccountInfo] = useState<OrgAccountInfo | null>(null);
	const [accountLoading, setAccountLoading] = useState(true);
	const [showAccountDialog, setShowAccountDialog] = useState(false);
	const [accountSaving, setAccountSaving] = useState(false);
	const [accountFormData, setAccountFormData] =
		useState<OrgAccountInfo>(emptyAccountForm);

	// Organization addresses state
	const [addresses, setAddresses] = useState<OrgAddress[]>([]);
	const [addressesLoading, setAddressesLoading] = useState(true);
	const [showAddressDialog, setShowAddressDialog] = useState(false);
	const [addressSaving, setAddressSaving] = useState(false);
	const [editingAddress, setEditingAddress] = useState<OrgAddress | null>(
		null
	);
	const [addressFormData, setAddressFormData] =
		useState<OrgAddress>(emptyAddressForm);
	const [deleteTarget, setDeleteTarget] = useState<{
		kind: "account" | "address";
		id?: number;
		label: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);

	// Fetch organization bank/account details + addresses
	useEffect(() => {
		if (!userOrgId) return;

		let active = true;
		const fetchProfile = async () => {
			setAccountLoading(true);
			setAddressesLoading(true);
			try {
				const orgId = parseInt(userOrgId);
				const [info, list] = await Promise.all([
					getOrgAccountInfo(orgId).catch(() => null),
					getOrgAddresses(orgId).catch(() => [] as OrgAddress[])
				]);
				if (!active) return;
				setAccountInfo(info);
				setAddresses(list);
			} finally {
				if (active) {
					setAccountLoading(false);
					setAddressesLoading(false);
				}
			}
		};
		fetchProfile();
		return () => {
			active = false;
		};
	}, [userOrgId]);

	const reloadProfile = async () => {
		if (!userOrgId) return;
		const orgId = parseInt(userOrgId);
		const [info, list] = await Promise.all([
			getOrgAccountInfo(orgId).catch(() => null),
			getOrgAddresses(orgId).catch(() => [] as OrgAddress[])
		]);
		setAccountInfo(info);
		setAddresses(list);
	};

	const openAddAccount = () => {
		setAccountFormData({ ...emptyAccountForm });
		setShowAccountDialog(true);
	};

	const openEditAccount = () => {
		if (!accountInfo) return;
		setAccountFormData({ ...accountInfo });
		setShowAccountDialog(true);
	};

	const saveAccount = async () => {
		if (!userOrgId) return;
		if (
			!accountFormData.bankName?.trim() ||
			!accountFormData.bankAccountNumber?.trim()
		) {
			toast.error("Bank name and account number are required");
			return;
		}
		const orgId = parseInt(userOrgId);
		setAccountSaving(true);
		try {
			const saved = accountInfo?.orgAccountInfoId
				? await updateOrgAccountInfo(orgId, accountFormData)
				: await createOrgAccountInfo(orgId, accountFormData);
			setAccountInfo(saved);
			setShowAccountDialog(false);
			toast.success("Organization account details saved");
		} catch (error) {
			toast.error(
				`Failed to save account details: ${(error as Error).message}`
			);
		} finally {
			setAccountSaving(false);
		}
	};

	const openAddAddress = () => {
		setEditingAddress(null);
		setAddressFormData({ ...emptyAddressForm });
		setShowAddressDialog(true);
	};

	const openEditAddress = (address: OrgAddress) => {
		setEditingAddress(address);
		setAddressFormData({ ...address });
		setShowAddressDialog(true);
	};

	const saveAddress = async () => {
		if (!userOrgId) return;
		if (
			!addressFormData.addressLine1?.trim() ||
			!addressFormData.city?.trim() ||
			!addressFormData.country?.trim()
		) {
			toast.error("Address line 1, city and country are required");
			return;
		}
		const orgId = parseInt(userOrgId);
		setAddressSaving(true);
		try {
			if (editingAddress?.orgAddressId) {
				await updateOrgAddress(
					orgId,
					editingAddress.orgAddressId,
					addressFormData
				);
				toast.success("Organization address updated");
			} else {
				await createOrgAddress(orgId, addressFormData);
				toast.success("Organization address added");
			}
			setShowAddressDialog(false);
			setEditingAddress(null);
			await reloadProfile();
		} catch (error) {
			toast.error(
				`Failed to save address: ${(error as Error).message}`
			);
		} finally {
			setAddressSaving(false);
		}
	};

	const confirmDelete = async () => {
		if (!userOrgId || !deleteTarget) return;
		const orgId = parseInt(userOrgId);
		setDeleting(true);
		try {
			if (deleteTarget.kind === "account") {
				await deleteOrgAccountInfo(orgId);
				setAccountInfo(null);
				toast.success("Organization account details deleted");
			} else if (deleteTarget.id !== undefined) {
				await deleteOrgAddress(orgId, deleteTarget.id);
				toast.success("Organization address deleted");
			}
			setDeleteTarget(null);
			await reloadProfile();
		} catch (error) {
			toast.error(`Failed to delete: ${(error as Error).message}`);
		} finally {
			setDeleting(false);
		}
	};

	const addressColumns: ColumnDef<OrgAddress>[] = [
		{
			header: "Label",
			cell: (a) => (
				<div>
					<div className="font-medium">{a.label || "—"}</div>
					<div className="flex gap-1 mt-1">
						{a.isDefaultShipping && (
							<Badge>Default shipping</Badge>
						)}
						{a.isDefaultBilling && (
							<Badge variant="secondary">Default billing</Badge>
						)}
					</div>
				</div>
			)
		},
		{
			header: "Type",
			cell: (a) =>
				a.addressType ? (
					<Badge variant="outline">{a.addressType}</Badge>
				) : (
					"—"
				)
		},
		{
			header: "Address",
			cell: (a) => (
				<div className="text-sm">
					<div>
						{[a.addressLine1, a.addressLine2]
							.filter(Boolean)
							.join(", ") || "—"}
					</div>
					<div className="text-gray-500">
						{[a.city, a.state, a.pincode]
							.filter(Boolean)
							.join(", ")}
						{a.country ? ` · ${a.country}` : ""}
					</div>
				</div>
			)
		},
		{
			header: "Contact",
			cell: (a) => (
				<div className="text-sm">
					<div>{a.contactName || "—"}</div>
					<div className="text-gray-500">
						{a.contactPhone || ""}
					</div>
				</div>
			)
		},
		{
			header: "Actions",
			cell: (a) => (
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => openEditAddress(a)}
					>
						<Edit className="h-3 w-3" />
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={() =>
							setDeleteTarget({
								kind: "address",
								id: a.orgAddressId,
								label:
									a.label ||
									`Address #${a.orgAddressId ?? ""}`
							})
						}
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				</div>
			)
		}
	];

	return (
		<div className="space-y-8">
			{/* Organization Bank & Account Details */}
			<Card className="p-4 gap-2">
				<CardHeader className="p-0">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Landmark className="h-5 w-5" />
								Organization Bank & Account Details
							</CardTitle>
							<CardDescription>
								Bank account used for payouts and tax records
							</CardDescription>
						</div>
						{accountInfo ? (
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={openEditAccount}
								>
									<Edit className="h-3 w-3 mr-1" />
									Edit
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() =>
										setDeleteTarget({
											kind: "account",
											label: accountInfo.bankName ?? "account details"
										})
									}
								>
									<Trash2 className="h-3 w-3 mr-1" />
									Delete
								</Button>
							</div>
						) : (
							!accountLoading && (
								<Button size="sm" onClick={openAddAccount}>
									<Plus className="h-3 w-3 mr-1" />
									Add Details
								</Button>
							)
						)}
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{accountLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					) : accountInfo ? (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							<div>
								<p className="text-gray-500">Bank Name</p>
								<p className="font-medium">
									{accountInfo.bankName || "—"}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Branch</p>
								<p className="font-medium">
									{accountInfo.bankAccountBranch || "—"}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Account Type</p>
								<p className="font-medium">
									{accountInfo.bankAccountType ? (
										<Badge variant="outline">
											{accountInfo.bankAccountType}
										</Badge>
									) : (
										"—"
									)}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Account Holder</p>
								<p className="font-medium">
									{accountInfo.bankAccountName || "—"}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Account Number</p>
								<p className="font-medium font-mono">
									{accountInfo.bankAccountNumber || "—"}
								</p>
							</div>
							<div>
								<p className="text-gray-500">IFSC Code</p>
								<p className="font-medium font-mono">
									{accountInfo.bankIfscCode || "—"}
								</p>
							</div>
							<div>
								<p className="text-gray-500">PAN</p>
								<p className="font-medium font-mono">
									{accountInfo.panNumber || "—"}
								</p>
							</div>
						</div>
					) : (
						<div className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
							No bank details saved yet. Add the
							organization&apos;s bank account for payouts and
							tax records.
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
				<DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{accountInfo?.orgAccountInfoId
								? "Edit Bank & Account Details"
								: "Add Bank & Account Details"}
						</DialogTitle>
						<DialogDescription>
							Used for payouts and tax records
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>Bank Name *</Label>
								<Input
									placeholder="e.g. HDFC Bank"
									value={accountFormData.bankName ?? ""}
									onChange={(e) =>
										setAccountFormData({
											...accountFormData,
											bankName: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Branch</Label>
								<Input
									placeholder="e.g. Andheri West"
									value={accountFormData.bankAccountBranch ?? ""}
									onChange={(e) =>
										setAccountFormData({
											...accountFormData,
											bankAccountBranch: e.target.value
										})
									}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>Account Holder Name</Label>
								<Input
									placeholder="e.g. Acme Pvt Ltd"
									value={accountFormData.bankAccountName ?? ""}
									onChange={(e) =>
										setAccountFormData({
											...accountFormData,
											bankAccountName: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Account Number *</Label>
								<Input
									placeholder="e.g. 50200012345678"
									value={accountFormData.bankAccountNumber ?? ""}
									onChange={(e) =>
										setAccountFormData({
											...accountFormData,
											bankAccountNumber: e.target.value
										})
									}
								/>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="grid gap-2">
								<Label>Account Type</Label>
								<Select
									value={accountFormData.bankAccountType ?? "CURRENT"}
									onValueChange={(v) =>
										setAccountFormData({
											...accountFormData,
											bankAccountType: v
										})
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{["SAVINGS", "CURRENT", "CHECKING", "BUSINESS", "JOINT"].map(
											(t) => (
												<SelectItem key={t} value={t}>
													{t}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label>IFSC Code</Label>
								<Input
									placeholder="e.g. HDFC0001234"
									value={accountFormData.bankIfscCode ?? ""}
									onChange={(e) =>
										setAccountFormData({
											...accountFormData,
											bankIfscCode: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>PAN</Label>
								<Input
									placeholder="e.g. ABCDE1234F"
									value={accountFormData.panNumber ?? ""}
									onChange={(e) =>
										setAccountFormData({
											...accountFormData,
											panNumber: e.target.value
										})
									}
								/>
							</div>
						</div>
						<Button onClick={saveAccount} disabled={accountSaving}>
							{accountSaving ? "Saving…" : "Save Details"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Organization Addresses */}
			<Card className="p-4 gap-2">
				<CardHeader className="p-0">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								Organization Addresses
							</CardTitle>
							<CardDescription>
								Delivery, billing and office addresses for this
								organization
							</CardDescription>
						</div>
						<Button size="sm" onClick={openAddAddress}>
							<Plus className="h-3 w-3 mr-1" />
							Add Address
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{addressesLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : (
						<HRTable columns={addressColumns} data={addresses} />
					)}
				</CardContent>
			</Card>

			<Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
				<DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingAddress?.orgAddressId
								? "Edit Address"
								: "Add Address"}
						</DialogTitle>
						<DialogDescription>
							Mark one address as the default for shipping and
							billing
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>Label</Label>
								<Input
									placeholder="e.g. Mumbai Warehouse"
									value={addressFormData.label ?? ""}
									onChange={(e) =>
										setAddressFormData({
											...addressFormData,
											label: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Type</Label>
								<Select
									value={addressFormData.addressType ?? "HEAD_OFFICE"}
									onValueChange={(v) =>
										setAddressFormData({
											...addressFormData,
											addressType: v
										})
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{[
											"HEAD_OFFICE",
											"BRANCH_OFFICE",
											"BILLING",
											"SHIPPING",
											"WAREHOUSE",
											"OTHER"
										].map((t) => (
											<SelectItem key={t} value={t}>
												{t}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid gap-2">
							<Label>Address Line 1 *</Label>
							<Input
								placeholder="e.g. Plot 42, MIDC Industrial Area"
								value={addressFormData.addressLine1 ?? ""}
								onChange={(e) =>
									setAddressFormData({
										...addressFormData,
										addressLine1: e.target.value
									})
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label>Address Line 2</Label>
							<Input
								placeholder="e.g. Near Railway Station"
								value={addressFormData.addressLine2 ?? ""}
								onChange={(e) =>
									setAddressFormData({
										...addressFormData,
										addressLine2: e.target.value
									})
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>City *</Label>
								<Input
									placeholder="e.g. Mumbai"
									value={addressFormData.city ?? ""}
									onChange={(e) =>
										setAddressFormData({
											...addressFormData,
											city: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>State</Label>
								<Input
									placeholder="e.g. Maharashtra"
									value={addressFormData.state ?? ""}
									onChange={(e) =>
										setAddressFormData({
											...addressFormData,
											state: e.target.value
										})
									}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>Country *</Label>
								<Input
									placeholder="e.g. India"
									value={addressFormData.country ?? ""}
									onChange={(e) =>
										setAddressFormData({
											...addressFormData,
											country: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Pincode</Label>
								<Input
									placeholder="e.g. 400093"
									value={addressFormData.pincode ?? ""}
									onChange={(e) =>
										setAddressFormData({
											...addressFormData,
											pincode: e.target.value
										})
									}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>Contact Name</Label>
								<Input
									placeholder="e.g. Rahul Sharma"
									value={addressFormData.contactName ?? ""}
									onChange={(e) =>
										setAddressFormData({
											...addressFormData,
											contactName: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Contact Phone</Label>
								<Input
									placeholder="e.g. +91 98765 43210"
									value={addressFormData.contactPhone ?? ""}
									onChange={(e) =>
										setAddressFormData({
											...addressFormData,
											contactPhone: e.target.value
										})
									}
								/>
							</div>
						</div>
						<div className="flex gap-6">
							<label className="flex cursor-pointer items-center gap-2 text-sm">
								<Checkbox
									checked={
										addressFormData.isDefaultShipping === true
									}
									onCheckedChange={(v) =>
										setAddressFormData({
											...addressFormData,
											isDefaultShipping: v === true
										})
									}
								/>
								Default shipping address
							</label>
							<label className="flex cursor-pointer items-center gap-2 text-sm">
								<Checkbox
									checked={
										addressFormData.isDefaultBilling === true
									}
									onCheckedChange={(v) =>
										setAddressFormData({
											...addressFormData,
											isDefaultBilling: v === true
										})
									}
								/>
								Default billing address
							</label>
						</div>
						<Button onClick={saveAddress} disabled={addressSaving}>
							{addressSaving
								? "Saving…"
								: editingAddress?.orgAddressId
									? "Save Changes"
									: "Add Address"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(v) => !v && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete{" "}
							{deleteTarget?.kind === "account"
								? "account details"
								: "address"}
							?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete &ldquo;
							{deleteTarget?.label}&rdquo;. This cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={deleting}
						>
							{deleting ? "Deleting…" : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
