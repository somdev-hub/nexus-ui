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
import { HRTable, type ColumnDef } from "@/components/hr-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
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
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import type {
	Department,
	RoleCompensation
} from "@/types";
import {
	addRoleCompensation,
	getDeptOverview,
	getDeptRoles,
	fetchRoleCompensation
} from "@/lib/auth-service";

export default function OrganizationCompensationPage() {
	const userOrgId = useOrgId();

	const [departments, setDepartments] = useState<Department[]>([]);
	const [compensations, setCompensations] = useState<RoleCompensation[]>([]);
	const [compensationDeptRoles, setCompensationDeptRoles] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [departmentsLoading, setDepartmentsLoading] = useState(true);
	const [showAddCompensationDialog, setShowAddCompensationDialog] =
		useState(false);

	// Compensation form state
	const [compensationFormData, setCompensationFormData] =
		useState<RoleCompensation>({
			orgId: 0, // Will be set from userOrgId when submitting
			role: "",
			deptId: 0,
			minBasePay: 0,
			maxBasePay: 0,
			minTotalBonuses: 0,
			maxTotalBonuses: 0,
			minTotalDeductions: 0,
			maxTotalDeductions: 0,
			minAnnualSalary: "",
			maxAnnualSalary: ""
		});

	const [compensationCurrentPage, setCompensationCurrentPage] = useState(1);
	const [compensationTotalPages, setCompensationTotalPages] = useState(1);

	// Departments feed the department dropdown
	useEffect(() => {
		if (!userOrgId) return;

		let active = true;
		const fetchDepartments = async () => {
			try {
				const data = await getDeptOverview(parseInt(userOrgId));
				if (!active) return;
				if (data) {
					setDepartments(data);
				}
			} catch (error) {
				console.error("Failed to fetch departments:", error);
				toast.error("Failed to fetch departments");
			} finally {
				if (active) setDepartmentsLoading(false);
			}
		};
		fetchDepartments();
		return () => {
			active = false;
		};
	}, [userOrgId]);

	// Fetch roles for selected department in compensation dialog
	useEffect(() => {
		if (compensationFormData.deptId === 0) {
			return;
		}

		const fetchRoles = async () => {
			try {
				const rolesData = await getDeptRoles(compensationFormData.deptId || 0);
				if (rolesData) {
					setCompensationDeptRoles(rolesData);
				}
			} catch (error) {
				console.error("Failed to fetch department roles:", error);
				toast.error("Failed to fetch department roles");
			}
		};

		fetchRoles();

		return () => {
			setCompensationDeptRoles([]);
		};
	}, [compensationFormData.deptId]);

	// Fetch compensation data with pagination
	useEffect(() => {
		if (!userOrgId) return;

		const fetchCompensationData = async () => {
			try {
				const orgId = parseInt(userOrgId);
				const pageNo = compensationCurrentPage - 1;
				const data = await fetchRoleCompensation(orgId, pageNo, 10);

				if (data) {
					setCompensations(data.content);
					setCompensationTotalPages(data.totalPages);
				}
			} catch (error) {
				console.error("Failed to fetch role compensation:", error);
				toast.error("Failed to fetch role compensation");
			}
		};

		fetchCompensationData();
	}, [userOrgId, compensationCurrentPage]);

	const handleAddCompensation = async () => {
		if (
			!compensationFormData.role ||
			!compensationFormData.deptId ||
			compensationFormData.minBasePay === 0 ||
			compensationFormData.maxBasePay === 0
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Ensure orgId is set from current user's organization
		if (!userOrgId) {
			toast.error("Organization information not available");
			return;
		}

		try {
			const submissionData: RoleCompensation = {
				...compensationFormData,
				orgId: parseInt(userOrgId)
			};
			const response = await addRoleCompensation(submissionData);

			if (response) {
				toast.success("Role compensation details added successfully");

				// Reset form and pagination to fetch fresh data
				setCompensationFormData({
					orgId: 0, // Will be set from userOrgId when submitting
					role: "",
					deptId: 0,
					minBasePay: 0,
					maxBasePay: 0,
					minTotalBonuses: 0,
					maxTotalBonuses: 0,
					minTotalDeductions: 0,
					maxTotalDeductions: 0,
					minAnnualSalary: "",
					maxAnnualSalary: ""
				});
				setCompensationDeptRoles([]);
				setCompensationCurrentPage(1);
				setShowAddCompensationDialog(false);
			} else {
				toast.error("Failed to add role compensation: No response from server");
			}
		} catch (error: unknown) {
			toast.error(
				`Failed to add role compensation: ${(error as Error).message}`
			);
		}
	};

	// Compensation table columns
	const compensationColumns: ColumnDef<RoleCompensation>[] = [
		{
			accessorKey: "role",
			header: "Role"
		},
		{
			accessorKey: "deptId",
			header: "Department ID"
		},
		{
			accessorKey: "minBasePay",
			header: "Min Base Pay",
			cell: (row: RoleCompensation) =>
				`₹${(row.minBasePay || 0).toLocaleString()}`
		},
		{
			accessorKey: "maxBasePay",
			header: "Max Base Pay",
			cell: (row: RoleCompensation) =>
				`₹${(row.maxBasePay || 0).toLocaleString()}`
		},
		{
			accessorKey: "minTotalBonuses",
			header: "Min Bonuses",
			cell: (row: RoleCompensation) =>
				`₹${(row.minTotalBonuses || 0).toLocaleString()}`
		},
		{
			accessorKey: "maxTotalBonuses",
			header: "Max Bonuses",
			cell: (row: RoleCompensation) =>
				`₹${(row.maxTotalBonuses || 0).toLocaleString()}`
		},
		{
			accessorKey: "minAnnualSalary",
			header: "Min Annual Salary"
		},
		{
			accessorKey: "maxAnnualSalary",
			header: "Max Annual Salary"
		},
		{
			id: "actions",
			header: "Actions",
			cell: () => (
				<div className="flex gap-2">
					<Button variant="ghost" size="sm">
						<Edit className="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="sm">
						<Trash2 className="w-4 h-4 text-red-500" />
					</Button>
				</div>
			)
		}
	];

	return (
		<div className="space-y-8">
			{/* Role Compensation Table */}
			<Card className="p-4 gap-2">
				<CardHeader className="p-0 flex flex-row items-center justify-between mb-4">
					<div>
						<CardTitle>Role Compensation Structure</CardTitle>
						<CardDescription>
							Compensation details for each role across departments
						</CardDescription>
					</div>
					<Dialog
						open={showAddCompensationDialog}
						onOpenChange={setShowAddCompensationDialog}
					>
						<DialogTrigger asChild>
							<Button size="sm">
								<Plus className="w-4 h-4 mr-2" />
								Add Compensation
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
							<DialogHeader>
								<DialogTitle>Add Role Compensation</DialogTitle>
								<DialogDescription>
									Define compensation range for a role
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 w-full">
								<div className="grid grid-cols-2 gap-4 w-full">
									<div className="space-y-2 w-full">
										<Label htmlFor="comp-department">Department *</Label>
										<Select
											value={(compensationFormData.deptId || 0).toString()}
											onValueChange={(value) =>
												setCompensationFormData({
													...compensationFormData,
													deptId: parseInt(value)
												})
											}
										>
											<SelectTrigger id="comp-department" className="w-full">
												<SelectValue placeholder="Select department" />
											</SelectTrigger>
											<SelectContent className="w-full block">
												{departments.map((dept) => (
													<SelectItem
														className="w-full"
														key={dept.departmentId}
														value={dept.departmentId.toString()}
													>
														{dept.departmentName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2 w-full">
										<Label htmlFor="comp-role">Role *</Label>
										<Select
											value={compensationFormData.role}
											onValueChange={(value) =>
												setCompensationFormData({
													...compensationFormData,
													role: value
												})
											}
											disabled={compensationFormData.deptId === 0}
										>
											<SelectTrigger id="comp-role" className="w-full">
												<SelectValue
													placeholder={
														compensationFormData.deptId === 0
															? "Select department first"
															: "Select role"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{compensationDeptRoles.map((role) => (
													<SelectItem key={role.id} value={role.name}>
														{role.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="border-t pt-4">
									<h3 className="font-semibold mb-3">Base Pay Range</h3>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="min-base-pay">Min Base Pay *</Label>
											<Input
												id="min-base-pay"
												type="number"
												placeholder="30000"
												value={compensationFormData.minBasePay || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														minBasePay: parseFloat(e.target.value) || 0
													})
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="max-base-pay">Max Base Pay *</Label>
											<Input
												id="max-base-pay"
												type="number"
												placeholder="60000"
												value={compensationFormData.maxBasePay || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														maxBasePay: parseFloat(e.target.value) || 0
													})
												}
											/>
										</div>
									</div>
								</div>

								<div className="border-t pt-4">
									<h3 className="font-semibold mb-3">Bonuses Range</h3>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="min-bonus">Min Total Bonuses</Label>
											<Input
												id="min-bonus"
												type="number"
												placeholder="5000"
												value={compensationFormData.minTotalBonuses || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														minTotalBonuses: parseFloat(e.target.value) || 0
													})
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="max-bonus">Max Total Bonuses</Label>
											<Input
												id="max-bonus"
												type="number"
												placeholder="15000"
												value={compensationFormData.maxTotalBonuses || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														maxTotalBonuses: parseFloat(e.target.value) || 0
													})
												}
											/>
										</div>
									</div>
								</div>

								<div className="border-t pt-4">
									<h3 className="font-semibold mb-3">Deductions Range</h3>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="min-deduction">
												Min Total Deductions
											</Label>
											<Input
												id="min-deduction"
												type="number"
												placeholder="2000"
												value={compensationFormData.minTotalDeductions || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														minTotalDeductions: parseFloat(e.target.value) || 0
													})
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="max-deduction">
												Max Total Deductions
											</Label>
											<Input
												id="max-deduction"
												type="number"
												placeholder="5000"
												value={compensationFormData.maxTotalDeductions || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														maxTotalDeductions: parseFloat(e.target.value) || 0
													})
												}
											/>
										</div>
									</div>
								</div>

								<div className="border-t pt-4">
									<h3 className="font-semibold mb-3">Annual Salary Range</h3>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="min-annual-salary">
												Min Annual Salary
											</Label>
											<Input
												id="min-annual-salary"
												placeholder="360000"
												value={compensationFormData.minAnnualSalary || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														minAnnualSalary: e.target.value
													})
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="max-annual-salary">
												Max Annual Salary
											</Label>
											<Input
												id="max-annual-salary"
												placeholder="720000"
												value={compensationFormData.maxAnnualSalary || ""}
												onChange={(e) =>
													setCompensationFormData({
														...compensationFormData,
														maxAnnualSalary: e.target.value
													})
												}
											/>
										</div>
									</div>
								</div>

								<div className="flex justify-end gap-2 pt-4">
									<Button
										variant="outline"
										onClick={() => setShowAddCompensationDialog(false)}
									>
										Cancel
									</Button>
									<Button onClick={handleAddCompensation}>
										Add Compensation
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent className="p-0 space-y-4">
					{departmentsLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center space-x-4 p-3">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-16" />
								</div>
							))}
						</div>
					) : (
						<>
							<HRTable columns={compensationColumns} data={compensations} />
							{compensationTotalPages > 1 && (
								<div className="flex justify-center">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													onClick={() =>
														setCompensationCurrentPage((prev) =>
															Math.max(prev - 1, 1)
														)
													}
													className={
														compensationCurrentPage === 1
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
											{Array.from(
												{ length: compensationTotalPages },
												(_, i) => i + 1
											).map((page) => (
												<PaginationItem key={page}>
													<PaginationLink
														onClick={() => setCompensationCurrentPage(page)}
														isActive={compensationCurrentPage === page}
														className="cursor-pointer"
													>
														{page}
													</PaginationLink>
												</PaginationItem>
											))}
											<PaginationItem>
												<PaginationNext
													onClick={() =>
														setCompensationCurrentPage((prev) =>
															Math.min(prev + 1, compensationTotalPages)
														)
													}
													className={
														compensationCurrentPage === compensationTotalPages
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
