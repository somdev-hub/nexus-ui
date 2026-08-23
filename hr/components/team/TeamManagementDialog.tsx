"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Building2 } from "lucide-react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import {
	getAllDepartments,
	getEligibleLeads,
	getAllTeamsByDepartment,
	createTeam,
	updateTeam
} from "@/lib/auth-service";
import type { Team, CreateTeamRequest, UpdateTeamRequest, TeamMember, TeamRole, User, AddTeamMemberRequest } from "@/types";
import { Card, CardContent } from "../ui/card";

type ManagementMode = "team" | "member";

interface TeamManagementDialogProps {
	// Mode selection
	mode: ManagementMode;

	// Common props
	smallButton?: boolean;
	onSuccess?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
	isLoading?: boolean;

	// Team mode props
	editTeamData?: Team;

	// Member mode props
	teamMembers?: TeamMember[];
	availableUsers?: User[];
	editingMember?: TeamMember | null;
	onMemberSubmit?: (data: AddTeamMemberRequest) => Promise<void>;
	onMemberClose?: () => void;
}

type TeamFormData = {
	teamName: string;
	description: string;
	departmentId: number;
	teamLeadId: number;
	parentTeamId?: number;
};

type MemberFormData = {
	userId: number;
	managerId: number | undefined;
	teamPosition: string;
	role: TeamRole;
};

function getRoleLabel(role: TeamRole) {
	return role.replace("_", " ");
}

export function TeamManagementDialog({
	mode,
	smallButton = false,
	editTeamData,
	onSuccess,
	open: externalOpen,
	onOpenChange: externalOnOpenChange,
	children,
	isLoading = false,
	teamMembers = [],
	availableUsers = [],
	editingMember = null,
	onMemberSubmit,
	onMemberClose,
}: TeamManagementDialogProps) {
	const orgId = useOrgId();
	const { toast } = useToast();

	const [open, setOpen] = useState(false);
	const isControlledByParent = externalOpen !== undefined;
	const dialogOpen = isControlledByParent ? externalOpen : open;

	const handleOpenChange = useCallback((newOpen: boolean) => {
		if (isControlledByParent && externalOnOpenChange) {
			externalOnOpenChange(newOpen);
		} else {
			setOpen(newOpen);
		}
	}, [isControlledByParent, externalOnOpenChange]);

	const [isSubmitting, setIsSubmitting] = useState(false);

	// Team mode state
	const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
	const [isLoadingLeads, setIsLoadingLeads] = useState(false);
	const [isLoadingParentTeams, setIsLoadingParentTeams] = useState(false);
	const [departments, setDepartments] = useState<Array<{ deptId: number; deptName: string }>>([]);
	const [eligibleLeads, setEligibleLeads] = useState<Array<{ id: number; name: string; email: string }>>([]);
	const [parentTeams, setParentTeams] = useState<Array<{ teamId: number; teamName: string }>>([]);

	// Member mode state
	const [eligibleManagers, setEligibleManagers] = useState<TeamMember[]>([]);
	const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});

	// Team form state
	const [teamForm, setTeamForm] = useState<TeamFormData>(() => {
		if (editTeamData) {
			return {
				teamName: editTeamData.teamName,
				description: editTeamData.description || "",
				departmentId: editTeamData.departmentId,
				teamLeadId: editTeamData.teamLead?.id || 0,
				parentTeamId: editTeamData.parentTeamId
			};
		}
		return {
			teamName: "",
			description: "",
			departmentId: 0,
			teamLeadId: 0,
			parentTeamId: undefined
		};
	});

	// Member form state
	const isEditingMember = !!editingMember;
	const [memberForm, setMemberForm] = useState<MemberFormData>({
		userId: 0,
		managerId: undefined,
		teamPosition: "",
		role: "EMPLOYEE",
	});

	// Fetch departments when dialog opens (team mode)
	useEffect(() => {
		if (mode !== "team" || !dialogOpen || !orgId) return;

		const fetchDepartments = async () => {
			setIsLoadingDepartments(true);
			try {
				const parsedOrgId = parseInt(orgId);
				const deptData = await getAllDepartments(parsedOrgId);
				setDepartments(deptData || []);
			} catch (error) {
				toast({
					title: "Failed to load departments",
					description: error instanceof Error ? error.message : "Please try again later.",
					variant: "destructive"
				});
				setDepartments([]);
			} finally {
				setIsLoadingDepartments(false);
			}
		};

		fetchDepartments();
	}, [mode, dialogOpen, orgId, toast]);

	// Fetch eligible leads and parent teams when department changes (team mode)
	useEffect(() => {
		if (mode !== "team" || !dialogOpen || teamForm.departmentId <= 0) {
			setEligibleLeads([]);
			setParentTeams([]);
			return;
		}

		const fetchLeadsAndTeams = async () => {
			setIsLoadingLeads(true);
			setIsLoadingParentTeams(true);
			try {
				const [leadsData, teamsData] = await Promise.all([
					getEligibleLeads(teamForm.departmentId),
					getAllTeamsByDepartment(teamForm.departmentId)
				]);
				setEligibleLeads(leadsData || []);
				if (editTeamData) {
					setParentTeams((teamsData || []).filter(t => t.teamId !== editTeamData.teamId));
				} else {
					setParentTeams(teamsData || []);
				}
			} catch (error) {
				toast({
					title: "Failed to load team data",
					description: error instanceof Error ? error.message : "Please try again later.",
					variant: "destructive"
				});
				setEligibleLeads([]);
				setParentTeams([]);
			} finally {
				setIsLoadingLeads(false);
				setIsLoadingParentTeams(false);
			}
		};

		fetchLeadsAndTeams();
	}, [mode, dialogOpen, teamForm.departmentId, editTeamData, toast]);

	// Setup member form data when editing member changes
	useEffect(() => {
		if (mode !== "member") return;

		if (isEditingMember && editingMember) {
			setMemberForm({
				userId: editingMember.user.id,
				managerId: editingMember.manager?.id,
				teamPosition: editingMember.teamPosition,
				role: editingMember.role
			});
		} else {
			setMemberForm({
				userId: 0,
				managerId: undefined,
				teamPosition: "",
				role: "EMPLOYEE"
			});
		}
	}, [mode, editingMember, isEditingMember]);

	// Filter eligible managers (member mode)
	useEffect(() => {
		if (mode !== "member") return;

		const filteredManagers = teamMembers.filter((m) => {
			if (isEditingMember && m.user.id === editingMember?.user.id) return false;
			if (m.role === "EMPLOYEE") return false;
			return true;
		});
		setEligibleManagers(filteredManagers);
	}, [mode, teamMembers, editingMember, isEditingMember]);

	// Team form handlers
	const handleDepartmentChange = useCallback((deptId: string) => {
		setTeamForm((prev) => ({
			...prev,
			departmentId: parseInt(deptId),
			teamLeadId: 0,
			parentTeamId: undefined
		}));
	}, []);

	const handleLeadChange = useCallback((leadId: string) => {
		setTeamForm((prev) => ({ ...prev, teamLeadId: parseInt(leadId) }));
	}, []);

	const handleParentTeamChange = useCallback((teamId: string) => {
		setTeamForm((prev) => ({
			...prev,
			parentTeamId: teamId === "none" ? undefined : parseInt(teamId)
		}));
	}, []);

	const handleTeamInputChange = useCallback((
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setTeamForm((prev) => ({ ...prev, [name]: value }));
	}, []);

	// Member form handlers
	const handleMemberChange = useCallback((
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setMemberForm((prev) => ({
			...prev,
			[name]: name === "userId" || name === "managerId"
				? parseInt(value) || undefined
				: value,
		}));

		if (memberErrors[name]) {
			setMemberErrors((prev) => ({ ...prev, [name]: "" }));
		}
	}, [memberErrors]);

	const validateMemberForm = useCallback((): boolean => {
		const newErrors: Record<string, string> = {};

		if (!memberForm.userId) {
			newErrors.userId = "User is required";
		} else if (!isEditingMember && teamMembers.some((m) => m.user.id === memberForm.userId)) {
			newErrors.userId = "This user is already a member of this team";
		}

		if (!memberForm.teamPosition.trim()) {
			newErrors.teamPosition = "Team position is required";
		}

		if (!memberForm.role) {
			newErrors.role = "Role is required";
		}

		if (memberForm.role === "TEAM_LEAD" && memberForm.managerId) {
			newErrors.managerId = "Team lead cannot have a manager";
		}

		if (memberForm.role !== "TEAM_LEAD" && !memberForm.managerId) {
			newErrors.managerId = "Manager is required for this role";
		}

		if (memberForm.managerId === memberForm.userId) {
			newErrors.managerId = "A member cannot be their own manager";
		}

		setMemberErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [memberForm, isEditingMember, teamMembers]);

	// Submit handlers
	const handleTeamSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!teamForm.teamName || !teamForm.departmentId || !teamForm.teamLeadId) {
			toast({
				title: "Missing required fields",
				description: "Please fill in all required fields to " + (editTeamData ? "update" : "create") + " a team.",
				variant: "destructive"
			});
			return;
		}

		setIsSubmitting(true);
		try {
			if (editTeamData) {
				const payload: UpdateTeamRequest = {
					teamName: teamForm.teamName,
					description: teamForm.description,
					teamLeadId: teamForm.teamLeadId,
					parentTeamId: teamForm.parentTeamId
				};
				await updateTeam(editTeamData.teamId, payload);
				toast({ title: "Team updated successfully", description: `Team "${teamForm.teamName}" has been updated.` });
			} else {
				const payload: CreateTeamRequest = {
					teamName: teamForm.teamName,
					description: teamForm.description,
					departmentId: teamForm.departmentId,
					teamLeadId: teamForm.teamLeadId,
					parentTeamId: teamForm.parentTeamId
				};
				await createTeam(payload);
				toast({ title: "Team created successfully", description: `Team "${teamForm.teamName}" has been created.` });
			}

			handleOpenChange(false);
			onSuccess?.();
			setTeamForm({ teamName: "", description: "", departmentId: 0, teamLeadId: 0, parentTeamId: undefined });
		} catch (error) {
			console.error((editTeamData ? "Update" : "Create") + " team error:", error);
			toast({
				title: (editTeamData ? "Failed to update" : "Failed to create") + " team",
				description: error instanceof Error ? error.message : "Please try again later.",
				variant: "destructive"
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleMemberSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateMemberForm()) return;

		try {
			await onMemberSubmit?.(memberForm);
			onMemberClose?.();
		} catch (error) {
			console.error("Member form submission error:", error);
		}
	};

	// Filter available users for member mode
	const filteredUsers = availableUsers.filter((user) => {
		const isExistingMember = teamMembers.some((m) => Number(m.user.id) === Number(user.id));
		const isEditingThisMember = isEditingMember && editingMember && Number(editingMember.user.id) === Number(user.id);
		return !isExistingMember || isEditingThisMember;
	});

	// Render trigger button
	const renderTrigger = () => {
		// When controlled by parent, don't render trigger - parent controls dialog visibility
		if (isControlledByParent) {
			return null;
		}

		if (smallButton) {
			return (
				<DialogTrigger asChild>
					{children ? (
						children
					) : (
						<Button size="sm" className="cursor-pointer" disabled={isLoading}>
							<Plus className="h-4 w-4 mr-2" />
							{mode === "team" ? (editTeamData ? "Edit Team" : "Create Team") : (isEditingMember ? "Edit Member" : "Add Member")}
						</Button>
					)}
				</DialogTrigger>
			);
		}
		// When smallButton is false and no children provided, render a Card (for backward compatibility with CreateTeamDialog)
		if (!children) {
			return (
				<DialogTrigger asChild>
					<Card className={`p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
						<CardContent className="p-0 flex flex-col items-center justify-center gap-2">
							<Building2 className="h-5 w-5 text-blue-600" />
							<p className="font-medium">{mode === "team" ? (editTeamData ? "Edit Team" : "Create Team") : (isEditingMember ? "Edit Member" : "Add Member")}</p>
						</CardContent>
					</Card>
				</DialogTrigger>
			);
		}
		// When smallButton is false but children provided, let parent control via children
		return null;
	};

	// Render team form
	const renderTeamForm = () => (
		<form className="space-y-5 " onSubmit={handleTeamSubmit}>
			<div className="space-y-2">
				<Label htmlFor="teamName">Team Name *</Label>
				<Input
					id="teamName"
					name="teamName"
					placeholder="e.g., Frontend Development Team"
					value={teamForm.teamName}
					onChange={handleTeamInputChange}
					disabled={isSubmitting || isLoading}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Input
					id="description"
					name="description"
					placeholder="Brief description of the team's purpose"
					value={teamForm.description}
					onChange={handleTeamInputChange}
					disabled={isSubmitting || isLoading}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="departmentId">Department *</Label>
				<Select
					value={teamForm.departmentId.toString()}
					onValueChange={handleDepartmentChange}
					disabled={isSubmitting || isLoadingDepartments || isLoading || !!editTeamData}
				>
					<SelectTrigger id="departmentId" className="w-full">
						<SelectValue placeholder={isLoadingDepartments ? "Loading departments..." : "Select department"} />
					</SelectTrigger>
					<SelectContent>
						{departments.map((dept) => (
							<SelectItem key={dept.deptId} value={dept.deptId.toString()}>
								{dept.deptName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="teamLeadId">Team Lead *</Label>
				<Select
					value={teamForm.teamLeadId.toString()}
					onValueChange={handleLeadChange}
					disabled={isSubmitting || isLoadingLeads || isLoading || teamForm.departmentId <= 0}
				>
					<SelectTrigger id="teamLeadId" className="w-full">
						<SelectValue placeholder={isLoadingLeads ? "Loading leads..." : teamForm.departmentId <= 0 ? "Select department first" : "Select team lead"} />
					</SelectTrigger>
					<SelectContent className="w-full">
						{eligibleLeads.map((lead) => (
							<SelectItem key={lead.id} value={lead.id.toString()}>
								{lead.name} ({lead.email})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="parentTeamId">Parent Team (Optional)</Label>
				<Select
					value={teamForm.parentTeamId?.toString() || "none"}
					onValueChange={handleParentTeamChange}
					disabled={isSubmitting || isLoadingParentTeams || isLoading || teamForm.departmentId <= 0}
				>
					<SelectTrigger id="parentTeamId" className="w-full">
						<SelectValue placeholder={isLoadingParentTeams ? "Loading teams..." : teamForm.departmentId <= 0 ? "Select department first" : "No parent team (top-level)"} />
					</SelectTrigger>
					<SelectContent className="w-full">
						<SelectItem value="none">No parent team (top-level)</SelectItem>
						{parentTeams.map((team) => (
							<SelectItem key={team.teamId} value={team.teamId.toString()}>
								{team.teamName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<DialogFooter className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting || isLoading}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting || isLoading}>
					{isSubmitting ? (
						<><span className="animate-spin mr-2">⏳</span>{editTeamData ? "Updating..." : "Creating..."}</>
					) : (
						editTeamData ? "Update Team" : "Create Team"
					)}
				</Button>
			</DialogFooter>
		</form>
	);

	// Render member form
	const renderMemberForm = () => (
		<form onSubmit={handleMemberSubmit} className=" space-y-6">
			{/* User Selection */}
			<div className="space-y-2 w-full">
				<Label htmlFor="userId">User <span className="text-red-500">*</span></Label>
				<Select
					value={memberForm.userId?.toString() || ""}
					onValueChange={(value) => handleMemberChange({ target: { name: "userId", value } } as any)}
					disabled={isLoading || isSubmitting || isEditingMember}
				>
					<SelectTrigger id="userId" className={memberErrors.userId ? "border-red-500 w-full" : "w-full"}>
						<SelectValue placeholder="Select user" />
					</SelectTrigger>
					<SelectContent className="w-full">
						{filteredUsers.map((user) => (
							<SelectItem key={user.id} value={user.id.toString()}>
								{user.name} ({user.email})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{memberErrors.userId && <p className="mt-1 text-sm text-red-500">{memberErrors.userId}</p>}
				{isEditingMember && <p className="mt-1 text-sm text-gray-500">User cannot be changed when editing</p>}
				{filteredUsers.length === 0 && !isEditingMember && (
					<p className="mt-1 text-sm text-amber-600">All available users are already team members</p>
				)}
			</div>

			<div className="flex justify-baseline w-full gap-4">
				{/* Role */}
				<div className="space-y-2 w-full">
					<Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
					<Select
						value={memberForm.role}
						onValueChange={(value) => handleMemberChange({ target: { name: "role", value } } as any)}
						disabled={isLoading || isSubmitting}
					>
						<SelectTrigger id="role" className={memberErrors.role ? "border-red-500 w-full" : "w-full"}>
							<SelectValue placeholder="Select role" />
						</SelectTrigger>
						<SelectContent className="w-full">
							<SelectItem value="EMPLOYEE">Employee</SelectItem>
							<SelectItem value="MANAGER">Manager</SelectItem>
							<SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
						</SelectContent>
					</Select>
					{memberErrors.role && <p className="mt-1 text-sm text-red-500">{memberErrors.role}</p>}
				</div>

				{/* Manager (conditional) */}
				{(memberForm.role !== "TEAM_LEAD" || isEditingMember) && (
					<div className="space-y-2 w-full">
						<Label htmlFor="managerId">Manager <span className="text-red-500">*</span></Label>
						<Select
							value={memberForm.managerId?.toString() || ""}
							onValueChange={(value) => handleMemberChange({ target: { name: "managerId", value } } as any)}
							disabled={isLoading || isSubmitting || memberForm.role === "TEAM_LEAD"}
						>
							<SelectTrigger id="managerId" className={memberErrors.managerId ? "border-red-500 w-full" : "w-full"}>
								<SelectValue placeholder="Select manager" />
							</SelectTrigger>
							<SelectContent className="w-full">
								{eligibleManagers.map((manager) => (
									<SelectItem key={manager.id} value={manager.id.toString()}>
										{manager.user.name} ({getRoleLabel(manager.role)})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{memberErrors.managerId && <p className="mt-1 text-sm text-red-500">{memberErrors.managerId}</p>}
						{memberForm.role === "TEAM_LEAD" && <p className="mt-1 text-sm text-gray-500">Team lead does not have a manager</p>}
						{eligibleManagers.length === 0 && memberForm.role !== "TEAM_LEAD" && (
							<p className="mt-1 text-sm text-amber-600">No eligible managers available. Add a team lead or manager first.</p>
						)}
					</div>
				)}

			</div>

			{/* Team Position */}
			<div className="space-y-2">
				<Label htmlFor="teamPosition">Team Position <span className="text-red-500">*</span></Label>
				<Input
					id="teamPosition"
					name="teamPosition"
					value={memberForm.teamPosition}
					onChange={handleMemberChange}
					className={memberErrors.teamPosition ? "border-red-500" : ""}
					placeholder="e.g., Senior Developer, QA Lead, etc."
					disabled={isLoading || isSubmitting}
				/>
				{memberErrors.teamPosition && <p className="mt-1 text-sm text-red-500">{memberErrors.teamPosition}</p>}
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
				<Button type="button" variant="outline" onClick={onMemberClose} disabled={isLoading || isSubmitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading || isSubmitting} className="flex items-center gap-2">
					{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
					{isEditingMember ? "Update Member" : "Add Member"}
				</Button>
			</div>
		</form>
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			{renderTrigger()}
			<DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
				<DialogHeader>
					<DialogTitle>
						{mode === "team" ? (editTeamData ? "Edit Team" : "Create Team") : (isEditingMember ? "Edit Team Member" : "Add Team Member")}
					</DialogTitle>
					<DialogDescription>
						{mode === "team"
							? (editTeamData ? "Update the team details" : "Create a new team within a department")
							: (isEditingMember ? "Update the team member details" : "Add a new member to the team")}
					</DialogDescription>
				</DialogHeader>

				{mode === "team" ? renderTeamForm() : renderMemberForm()}
			</DialogContent>
		</Dialog>
	);
}

export default TeamManagementDialog;