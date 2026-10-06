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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Briefcase, Users } from "lucide-react";
import type { Department } from "@/types";
import {
	createDepartment,
	getDeptOverview,
	getAllDeptOverview
} from "@/lib/auth-service";

export default function OrganizationOverviewPage() {
	const userOrgId = useOrgId();

	const [departments, setDepartments] = useState<Department[]>([]);
	const [departmentsLoading, setDepartmentsLoading] = useState(true);
	const [showAddDepartmentDialog, setShowAddDepartmentDialog] =
		useState(false);
	const [departmentFormData, setDepartmentFormData] = useState({
		name: ""
	});
	const [overviewData, setOverviewData] = useState({
		totalDepartments: 0,
		totalEmployees: 0,
		totalRoles: 0,
		totalPermissions: 0
	});

	useEffect(() => {
		if (!userOrgId) return;

		let active = true;
		const fetchDepartments = async () => {
			try {
				const orgId = parseInt(userOrgId);
				const data = await getDeptOverview(orgId);
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

		const fetchOverviewData = async () => {
			try {
				const orgId = parseInt(userOrgId);
				const overview = await getAllDeptOverview(orgId);
				if (!active) return;
				if (overview) {
					setOverviewData(overview);
				}
			} catch (error) {
				console.error("Failed to fetch overview data:", error);
			}
		};

		fetchDepartments();
		fetchOverviewData();
		return () => {
			active = false;
		};
	}, [userOrgId]);

	// Handle add department
	const handleAddDepartment = async () => {
		if (!departmentFormData.name.trim()) {
			toast.error("Please enter a department name");
			return;
		}

		try {
			const orgId = userOrgId ? parseInt(userOrgId) : 1;
			const response = await createDepartment(orgId, departmentFormData.name);

			// Check if departmentId is present and status indicates success
			if (response.departmentId) {
				const newDepartment: Department = {
					departmentId: response.departmentId,
					departmentName: response.departmentName,
					members: response.members.length,
					roles: response.roles.length,
					departmentHead: "TBD"
				};
				setDepartments([...departments, newDepartment]);
				toast.success("Department created successfully");
				setDepartmentFormData({ name: "" });
				setShowAddDepartmentDialog(false);
			} else {
				toast.error("Failed to create department: No department ID returned");
			}
		} catch (error: unknown) {
			toast.error(`Failed to create department: ${(error as Error).message}`);
		}
	};

	return (
		<div className="space-y-8">
			{/* Organization Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{departmentsLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<Card key={i} className="p-4 gap-2">
							<CardHeader className="p-0">
								<Skeleton className="h-4 w-3/4" />
							</CardHeader>
							<CardContent className="p-0">
								<div className="flex items-center justify-between">
									<Skeleton className="h-8 w-1/4" />
									<Skeleton className="h-8 w-8 rounded-full" />
								</div>
							</CardContent>
						</Card>
					))
				) : (
					<>
						<Card className="p-4 gap-2">
							<CardHeader className="p-0">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Departments
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<div className="flex items-center justify-between">
									<p className="text-3xl font-bold">
										{overviewData.totalDepartments}
									</p>
									<Briefcase className="w-8 h-8 text-blue-500 opacity-50" />
								</div>
							</CardContent>
						</Card>

						<Card className="p-4 gap-2">
							<CardHeader className="p-0">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Employees
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<div className="flex items-center justify-between">
									<p className="text-3xl font-bold">
										{overviewData.totalEmployees}
									</p>
									<Users className="w-8 h-8 text-green-500 opacity-50" />
								</div>
							</CardContent>
						</Card>

						<Card className="p-4 gap-2">
							<CardHeader className="p-0">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Roles
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<div className="flex items-center justify-between">
									<p className="text-3xl font-bold">{overviewData.totalRoles}</p>
									<Briefcase className="w-8 h-8 text-purple-500 opacity-50" />
								</div>
							</CardContent>
						</Card>

						<Card className="p-4 gap-2">
							<CardHeader className="p-0">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Permissions
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<div className="flex items-center justify-between">
									<p className="text-3xl font-bold">
										{overviewData.totalPermissions}
									</p>
									<Badge className="bg-green-500">Active</Badge>
								</div>
							</CardContent>
						</Card>
					</>
				)}
			</div>

			{/* Department Cards */}
			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold">Departments Overview</h2>
					<Dialog
						open={showAddDepartmentDialog}
						onOpenChange={setShowAddDepartmentDialog}
					>
						<DialogTrigger asChild>
							<Button>
								<Plus className="w-4 h-4 mr-2" /> Add Department
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg">
							<DialogHeader>
								<DialogTitle>Add New Department</DialogTitle>
								<DialogDescription>
									Create a new department in your organization
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="dept-name">Department Name *</Label>
									<Input
										id="dept-name"
										placeholder="e.g., Engineering, Sales, HR"
										value={departmentFormData.name}
										onChange={(e) =>
											setDepartmentFormData({ name: e.target.value })
										}
										onKeyPress={(e) => {
											if (e.key === "Enter") {
												handleAddDepartment();
											}
										}}
									/>
								</div>
								<div className="flex justify-end gap-2 pt-4">
									<Button
										variant="outline"
										onClick={() => setShowAddDepartmentDialog(false)}
									>
										Cancel
									</Button>
									<Button onClick={handleAddDepartment}>Add Department</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
				{departmentsLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i} className="p-4 gap-2">
								<CardHeader className="p-0">
									<Skeleton className="h-5 w-1/2" />
									<Skeleton className="h-4 w-3/4" />
								</CardHeader>
								<CardContent className="p-0 space-y-2">
									<div className="flex justify-between items-center">
										<Skeleton className="h-4 w-1/3" />
										<Skeleton className="h-5 w-1/4" />
									</div>
									<div className="flex justify-between items-center">
										<Skeleton className="h-4 w-1/4" />
										<Skeleton className="h-5 w-1/4" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{departments.map((dept) => (
							<Card key={dept.departmentId} className="p-4 gap-2">
								<CardHeader className="p-0">
									<CardTitle className="text-lg">{dept.departmentName}</CardTitle>
									<CardDescription>
										Head: {dept.departmentHead ? dept.departmentHead : "TBA"}
									</CardDescription>
								</CardHeader>
								<CardContent className="p-0 space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Employees
										</span>
										<Badge>{dept.members}</Badge>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">Roles</span>
										<Badge>{dept.roles}</Badge>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
