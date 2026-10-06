"use client";

import { useState, useEffect } from "react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type {
	Department,
	ApiDepartment,
	User,
	UserRole
} from "@/types";
import {
	getDeptOverview,
	getEmployeeDirectory
} from "@/lib/auth-service";
import DepartmentTab from "@/components/department-tab";

export default function OrganizationTeamsPage() {
	const userOrgId = useOrgId();

	const [departments, setDepartments] = useState<Department[]>([]);
	const [availableUsers, setAvailableUsers] = useState<User[]>([]);
	const [departmentsLoading, setDepartmentsLoading] = useState(true);

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

		const fetchAvailableUsers = async () => {
			try {
				const orgId = userOrgId;
				const data = await getEmployeeDirectory(orgId, 0, 100);
				if (!active) return;
				if (data && data.content) {
					// Map EmployeeDirectoryItem to User type
					const users: User[] = data.content.map((emp) => ({
						id: emp.empId.toString(),
						email: emp.empEmail,
						name: emp.empName,
						phone: "",
						role: "ROLE_CLERK" as UserRole,
						orgId: userOrgId
					}));
					setAvailableUsers(users);
				}
			} catch (error) {
				console.error("Failed to fetch available users:", error);
			}
		};

		fetchDepartments();
		fetchAvailableUsers();
		return () => {
			active = false;
		};
	}, [userOrgId]);

	return (
		<div className="space-y-8">
			{/* Department & Teams Tab */}
			{departmentsLoading ? (
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i} className="p-4">
							<div className="flex items-center justify-between mb-4">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-8 w-24" />
							</div>
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, j) => (
									<div key={j} className="flex items-center justify-between p-3 border rounded-lg">
										<div className="flex items-center space-x-3">
											<Skeleton className="h-8 w-8 rounded-full" />
											<div className="space-y-1">
												<Skeleton className="h-4 w-32" />
												<Skeleton className="h-3 w-24" />
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Skeleton className="h-6 w-20 rounded" />
											<Skeleton className="h-6 w-20 rounded" />
											<Skeleton className="h-6 w-20 rounded" />
										</div>
									</div>
								))}
							</div>
						</Card>
					))}
				</div>
			) : (
				<DepartmentTab
					departments={departments.map((dept): ApiDepartment => {
						// Handle both Department (initial) and ApiDepartment (from API) formats
						if ('deptId' in dept && typeof (dept as any).deptId === 'number') {
							// Already ApiDepartment format
							const apiDept = dept as unknown as ApiDepartment;
							return { deptId: apiDept.deptId, deptName: apiDept.deptName };
						} else {
							// Department format - departmentId is already a number
							const deptObj = dept as Department;
							return {
								deptId: deptObj.departmentId,
								deptName: deptObj.departmentName
							};
						}
					})}
					availableUsers={availableUsers}
					onRefresh={() => {
						// Trigger a refresh of departments and users
						if (userOrgId) {
							const orgId = parseInt(userOrgId);
							setDepartmentsLoading(true);
							getDeptOverview(orgId).then((data) => {
								if (data) setDepartments(data);
								setDepartmentsLoading(false);
							}).catch(() => setDepartmentsLoading(false));
							getEmployeeDirectory(orgId.toString(), 0, 100).then((data) => {
								if (data && data.content) {
									// Map EmployeeDirectoryItem to User type
									const users: User[] = data.content.map((emp) => ({
										id: emp.empId.toString(),
										email: emp.empEmail,
										name: emp.empName,
										phone: "",
										role: "ROLE_CLERK" as UserRole,
										orgId: userOrgId
									}));
									setAvailableUsers(users);
								}
							});
						}
					}}
				/>
			)}
		</div>
	);
}
