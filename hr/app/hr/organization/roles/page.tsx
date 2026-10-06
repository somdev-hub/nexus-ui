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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "@/components/ui/popover";
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
import { rolesData } from "../data";
import type {
	Department,
	RoleRecord,
	GrantPermission
} from "@/types";
import { ResourceType } from "@/types/ResourceTypes";
import { PermissionAction } from "@/types/PermissionAction";
import {
	grantPermission,
	createRole,
	getDeptOverview,
	getDeptRoles,
	fetchDeptRolesTable
} from "@/lib/auth-service";

export default function OrganizationRolesPage() {
	const userOrgId = useOrgId();

	const [departments, setDepartments] = useState<Department[]>([]);
	const [roles, setRoles] = useState<RoleRecord[]>(rolesData);
	const [deptRoles, setDeptRoles] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [departmentsLoading, setDepartmentsLoading] = useState(true);
	const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
	const [showGrantPermissionDialog, setShowGrantPermissionDialog] =
		useState(false);

	const [roleFormData, setRoleFormData] = useState({
		department: "",
		role: "",
		description: "",
		permissions: [] as string[]
	});

	const [permissionInput, setPermissionInput] = useState("");

	const [grantPermissionFormData, setGrantPermissionFormData] =
		useState<GrantPermission>({
			resourceName: "",
			description: "",
			resourceType: ResourceType.DOCUMENT,
			role: "",
			actions: [PermissionAction.READ],
			departmentId: 0
		});

	const [grantPermissionExtraFields, setGrantPermissionExtraFields] = useState({
		endpoint: "",
		featureId: ""
	});

	const [rolesCurrentPage, setRolesCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Departments feed the department dropdowns
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

	// Fetch roles for selected department in grant permission dialog
	useEffect(() => {
		if (grantPermissionFormData.departmentId === 0) {
			return;
		}

		const fetchRoles = async () => {
			try {
				const rolesData = await getDeptRoles(
					grantPermissionFormData.departmentId
				);
				if (rolesData) {
					setDeptRoles(rolesData);
				}
			} catch (error) {
				console.error("Failed to fetch department roles:", error);
				toast.error("Failed to fetch department roles");
			}
		};

		fetchRoles();

		return () => {
			setDeptRoles([]);
		};
	}, [grantPermissionFormData.departmentId]);

	// Fetch roles table data
	useEffect(() => {
		if (!userOrgId) return;

		const fetchRolesTable = async () => {
			try {
				const orgId = parseInt(userOrgId);
				const rolesTableData = await fetchDeptRolesTable(orgId, 0, 10);

				if (rolesTableData) {
					const formattedRoles: RoleRecord[] = rolesTableData.map((role) => ({
						id: role.role,
						department: role.departmentName,
						role: role.role,
						employeeCount: role.noOfEmployees,
						createdOn: role.createdOn,
						permissions: role.permissions,
						status: (role.status === "Active" ? "Active" : "Inactive") as
							| "Active"
							| "Inactive"
					}));
					setRoles(formattedRoles);
				}
			} catch (error) {
				console.error("Failed to fetch roles table:", error);
				toast.error("Failed to fetch roles table");
			}
		};

		fetchRolesTable();
	}, [userOrgId]);

	// Calculate pagination for roles
	const rolesStartIndex = (rolesCurrentPage - 1) * itemsPerPage;
	const rolesEndIndex = rolesStartIndex + itemsPerPage;
	const rolesPaginatedData = roles.slice(rolesStartIndex, rolesEndIndex);
	const rolesTotalPages = Math.ceil(roles.length / itemsPerPage);

	// Handle add role
	const handleAddRole = async () => {
		if (!roleFormData.department || !roleFormData.role) {
			toast.error("Please fill in all required fields (Department and Role)");
			return;
		}

		try {
			// Find department ID based on department name
			const department = departments.find(
				(dept) => dept.departmentName === roleFormData.department
			);

			if (!department) {
				toast.error("Invalid department selected");
				return;
			}

			const deptId = department.departmentId;

			const response = await createRole(roleFormData.role, deptId);

			// Check if response status is 200 (OK) or 201 (CREATED)
			if (response.status === 200 || response.status === 201) {
				const newRole: RoleRecord = {
					id: response.data.roleId || `ROLE${roles.length + 1}`,
					department: roleFormData.department,
					role: roleFormData.role,
					employeeCount: 0,
					description: roleFormData.description,
					permissions: roleFormData.permissions,
					status: "Active"
				};

				setRoles([...roles, newRole]);

				// Show different message based on status code
				if (response.status === 201) {
					toast.success("New role created and assigned to department");
				} else {
					toast.success("Role already existed and assigned to department");
				}

				setRoleFormData({
					department: "",
					role: "",
					description: "",
					permissions: []
				});
				setShowAddRoleDialog(false);
			} else {
				toast.error("Failed to create role: Invalid response status");
			}
		} catch (error: unknown) {
			toast.error(`Failed to create role: ${(error as Error).message}`);
		}
	};

	// Add permission to role
	const handleAddPermission = () => {
		if (permissionInput.trim()) {
			setRoleFormData({
				...roleFormData,
				permissions: [...roleFormData.permissions, permissionInput]
			});
			setPermissionInput("");
		}
	};

	// Remove permission
	const handleRemovePermission = (index: number) => {
		setRoleFormData({
			...roleFormData,
			permissions: roleFormData.permissions.filter((_, i) => i !== index)
		});
	};

	// Handle add grant permission
	const handleAddGrantPermission = async () => {
		if (
			!grantPermissionFormData.resourceName ||
			!grantPermissionFormData.description ||
			!grantPermissionFormData.role ||
			grantPermissionFormData.departmentId === 0
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		const isModuleType =
			grantPermissionFormData.resourceType === ResourceType.MODULE ||
			grantPermissionFormData.resourceType === ResourceType.API_ENDPOINT ||
			grantPermissionFormData.resourceType === ResourceType.UI_COMPONENT;
		const isFeatureType =
			grantPermissionFormData.resourceType === ResourceType.FEATURE;

		if (isModuleType && !grantPermissionExtraFields.endpoint) {
			toast.error("Please fill in the endpoint field");
			return;
		}

		if (isFeatureType && !grantPermissionExtraFields.featureId) {
			toast.error("Please fill in the feature ID field");
			return;
		}

		try {
			// Build the permission data including optional fields
			const permissionData: GrantPermission = {
				...grantPermissionFormData,
				resourceUrl: isModuleType
					? grantPermissionExtraFields.endpoint
					: undefined,
				featureId: isFeatureType
					? grantPermissionExtraFields.featureId
					: undefined
			};

			const response = await grantPermission(permissionData);

			// Check if permissionId is present in response
			if (response.permissionId) {
				toast.success("Permission granted successfully");
				setGrantPermissionFormData({
					resourceName: "",
					description: "",
					resourceType: ResourceType.DOCUMENT,
					role: "",
					actions: [PermissionAction.READ],
					departmentId: 0
				});
				setGrantPermissionExtraFields({
					endpoint: "",
					featureId: ""
				});
				setShowGrantPermissionDialog(false);
			} else {
				toast.error("Failed to grant permission: No permission ID returned");
			}
		} catch (error: unknown) {
			toast.error(`Failed to grant permission: ${(error as Error).message}`);
		}
	};

	// Role table columns
	const roleColumns: ColumnDef<RoleRecord>[] = [
		{
			accessorKey: "department",
			header: "Department"
		},
		{
			accessorKey: "role",
			header: "Role"
		},
		{
			accessorKey: "employeeCount",
			header: "No. of Employees",
			cell: (row: RoleRecord) => (
				<span className="font-medium">{row.employeeCount}</span>
			)
		},
		{
			accessorKey: "createdOn",
			header: "Created On"
		},
		{
			accessorKey: "permissions",
			header: "Permissions",
			cell: (row: RoleRecord) => (
				<div className="flex gap-1 flex-wrap">
					{row.permissions.slice(0, 2).map((perm, idx) => (
						<Badge key={idx} variant="outline" className="text-xs">
							{perm}
						</Badge>
					))}
					{row.permissions.length > 2 && (
						<Badge variant="outline" className="text-xs">
							+{row.permissions.length - 2}
						</Badge>
					)}
				</div>
			)
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: (row: RoleRecord) => (
				<Badge
					variant={row.status === "Active" ? "default" : "secondary"}
					className="text-xs"
				>
					{row.status}
				</Badge>
			)
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
			{/* Roles Table */}
			<Card className="p-4 gap-2">
				<CardHeader className="p-0 flex flex-row items-center justify-between mb-4">
					<div>
						<CardTitle>Roles</CardTitle>
						<CardDescription>
							Manage roles and their permissions across departments
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<Dialog
							open={showAddRoleDialog}
							onOpenChange={setShowAddRoleDialog}
						>
							<DialogTrigger asChild>
								<Button size="sm">
									<Plus className="w-4 h-4 mr-2" />
									Add Role
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-lg">
								<DialogHeader>
									<DialogTitle>Add New Role</DialogTitle>
									<DialogDescription>
										Create a new role and assign to a department
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="role-department">Department *</Label>
										<Select
											value={roleFormData.department}
											onValueChange={(value) =>
												setRoleFormData({
													...roleFormData,
													department: value
												})
											}
										>
											<SelectTrigger id="role-department" className="w-full">
												<SelectValue placeholder="Select department" />
											</SelectTrigger>
											<SelectContent>
												{departments.map((dept) => (
													<SelectItem
														key={dept.departmentId}
														value={dept.departmentName}
													>
														{dept.departmentName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="role-name">Role Name *</Label>
										<Input
											id="role-name"
											placeholder="e.g., Senior Developer"
											value={roleFormData.role}
											onChange={(e) =>
												setRoleFormData({
													...roleFormData,
													role: e.target.value
												})
											}
											onKeyPress={(e) => {
												if (e.key === "Enter") {
													handleAddRole();
												}
											}}
										/>
									</div>

									<div className="flex justify-end gap-2 pt-4">
										<Button
											variant="outline"
											onClick={() => setShowAddRoleDialog(false)}
										>
											Cancel
										</Button>
										<Button onClick={handleAddRole}>Add Role</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
						<Dialog
							open={showGrantPermissionDialog}
							onOpenChange={setShowGrantPermissionDialog}
						>
							<DialogTrigger asChild>
								<Button size="sm">
									<Plus className="w-4 h-4 mr-2" />
									Grant Permission
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
								<DialogHeader>
									<DialogTitle>Grant Permission</DialogTitle>
									<DialogDescription>
										Grant permissions to roles for specific resources and
										actions
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="grant-department">Department *</Label>
											<Select
												value={grantPermissionFormData.departmentId.toString()}
												onValueChange={(value) =>
													setGrantPermissionFormData({
														...grantPermissionFormData,
														departmentId: parseInt(value)
													})
												}
											>
												<SelectTrigger id="grant-department" className="w-full">
													<SelectValue placeholder="Select department" />
												</SelectTrigger>
												<SelectContent>
													{departments.map((dept, idx) => (
														<SelectItem
															key={dept.departmentId}
															value={dept.departmentId.toString()}
														>
															{dept.departmentName}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label htmlFor="grant-role">Role *</Label>
											<Select
												value={grantPermissionFormData.role}
												onValueChange={(value) =>
													setGrantPermissionFormData({
														...grantPermissionFormData,
														role: value
													})
												}
												disabled={grantPermissionFormData.departmentId === 0}
											>
												<SelectTrigger id="grant-role" className="w-full">
													<SelectValue
														placeholder={
															grantPermissionFormData.departmentId === 0
																? "Select department first"
																: "Select role"
														}
													/>
												</SelectTrigger>
												<SelectContent>
													{deptRoles.map((role) => (
														<SelectItem key={role.id} value={role.name}>
															{role.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="grant-resource-type">
												Resource Type *
											</Label>
											<Select
												value={grantPermissionFormData.resourceType}
												onValueChange={(value) =>
													setGrantPermissionFormData({
														...grantPermissionFormData,
														resourceType: value as ResourceType
													})
												}
											>
												<SelectTrigger
													id="grant-resource-type"
													className="w-full"
												>
													<SelectValue placeholder="Select resource type" />
												</SelectTrigger>
												<SelectContent>
													{Object.values(ResourceType).map((type) => (
														<SelectItem key={type} value={type}>
															{type}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label htmlFor="grant-action">Actions *</Label>
											<Popover>
												<PopoverTrigger asChild>
													<Button
														id="grant-action"
														variant="outline"
														className="w-full justify-start text-left"
													>
														{grantPermissionFormData.actions.length > 0
															? `${grantPermissionFormData.actions.length} action(s) selected`
															: "Select actions"}
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-56 p-4">
													<div className="space-y-3">
														{Object.values(PermissionAction).map((action) => (
															<div
																key={action}
																className="flex items-center space-x-2"
															>
																<Checkbox
																	id={`action-${action}`}
																	checked={grantPermissionFormData.actions.includes(
																		action
																	)}
																	onCheckedChange={(checked) => {
																		if (checked) {
																			setGrantPermissionFormData({
																				...grantPermissionFormData,
																				actions: [
																					...grantPermissionFormData.actions,
																					action
																				]
																			});
																		} else {
																			setGrantPermissionFormData({
																				...grantPermissionFormData,
																				actions:
																					grantPermissionFormData.actions.filter(
																						(a) => a !== action
																					)
																			});
																		}
																	}}
																/>
																<Label
																	htmlFor={`action-${action}`}
																	className="text-sm font-normal cursor-pointer"
																>
																	{action}
																</Label>
															</div>
														))}
													</div>
												</PopoverContent>
											</Popover>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="grant-resource-name">Resource Name *</Label>
										<Input
											id="grant-resource-name"
											placeholder="e.g., Employee Report"
											value={grantPermissionFormData.resourceName}
											onChange={(e) =>
												setGrantPermissionFormData({
													...grantPermissionFormData,
													resourceName: e.target.value
												})
											}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="grant-description">Description *</Label>
										<Textarea
											id="grant-description"
											placeholder="Describe what this permission grants"
											value={grantPermissionFormData.description}
											onChange={(e) =>
												setGrantPermissionFormData({
													...grantPermissionFormData,
													description: e.target.value
												})
											}
											rows={3}
										/>
									</div>

									{(grantPermissionFormData.resourceType ===
										ResourceType.MODULE ||
										grantPermissionFormData.resourceType ===
										ResourceType.API_ENDPOINT ||
										grantPermissionFormData.resourceType ===
										ResourceType.UI_COMPONENT) && (
											<div className="space-y-2">
												<Label htmlFor="grant-endpoint">Endpoint *</Label>
												<Input
													id="grant-endpoint"
													placeholder="e.g., /api/employees, /dashboard/reports"
													value={grantPermissionExtraFields.endpoint}
													onChange={(e) =>
														setGrantPermissionExtraFields({
															...grantPermissionExtraFields,
															endpoint: e.target.value
														})
													}
												/>
											</div>
										)}

									{grantPermissionFormData.resourceType ===
										ResourceType.FEATURE && (
											<div className="space-y-2">
												<Label htmlFor="grant-feature-id">Feature ID *</Label>
												<Input
													id="grant-feature-id"
													placeholder="e.g., FEAT-001, FEAT-PAYROLL"
													value={grantPermissionExtraFields.featureId}
													onChange={(e) =>
														setGrantPermissionExtraFields({
															...grantPermissionExtraFields,
															featureId: e.target.value
														})
													}
												/>
											</div>
										)}

									<div className="flex justify-end gap-2 pt-4">
										<Button
											variant="outline"
											onClick={() => setShowGrantPermissionDialog(false)}
										>
											Cancel
										</Button>
										<Button onClick={handleAddGrantPermission}>
											Grant Permission
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent className="p-0 space-y-4">
					{departmentsLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center space-x-4 p-3">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-20" />
								</div>
							))}
						</div>
					) : (
						<>
							<HRTable columns={roleColumns} data={rolesPaginatedData} />
							{rolesTotalPages > 1 && (
								<div className="flex justify-center">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													onClick={() =>
														setRolesCurrentPage((prev) => Math.max(prev - 1, 1))
													}
													className={
														rolesCurrentPage === 1
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
											{Array.from({ length: rolesTotalPages }, (_, i) => i + 1).map(
												(page) => (
													<PaginationItem key={page}>
														<PaginationLink
															onClick={() => setRolesCurrentPage(page)}
															isActive={rolesCurrentPage === page}
															className="cursor-pointer"
														>
															{page}
														</PaginationLink>
													</PaginationItem>
												)
											)}
											<PaginationItem>
												<PaginationNext
													onClick={() =>
														setRolesCurrentPage((prev) =>
															Math.min(prev + 1, rolesTotalPages)
														)
													}
													className={
														rolesCurrentPage === rolesTotalPages
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
