"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Building2 } from "lucide-react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import {
	getAllDepartments,
	getEligibleLeads,
	getAllTeamsByDepartment,
	createTeam,
	updateTeam
} from "@/lib/auth-service";
import type { Team, CreateTeamRequest, UpdateTeamRequest } from "@/types";

type CreateTeamForm = {
	teamName: string;
	description: string;
	departmentId: number;
	teamLeadId: number;
	parentTeamId?: number;
};

export function CreateTeamDialog({
	smallButton = false,
	editData,
	onSuccess,
	open: externalOpen,
	onOpenChange: externalOnOpenChange,
	children
}: {
	smallButton?: boolean;
	editData?: Team;
	onSuccess?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}) {
	const orgId = useOrgId();
	const { toast } = useToast();

	const [open, setOpen] = useState(false);
	const isControlledByParent = externalOpen !== undefined;
	const dialogOpen = isControlledByParent ? externalOpen : open;

	const handleOpenChange = (newOpen: boolean) => {
		if (isControlledByParent && externalOnOpenChange) {
			externalOnOpenChange(newOpen);
		} else {
			setOpen(newOpen);
		}
	};

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
	const [isLoadingLeads, setIsLoadingLeads] = useState(false);
	const [isLoadingParentTeams, setIsLoadingParentTeams] = useState(false);

	const [form, setForm] = useState<CreateTeamForm>(() => {
		if (editData) {
			return {
				teamName: editData.teamName,
				description: editData.description || "",
				departmentId: editData.departmentId,
				teamLeadId: editData.teamLead?.id || 0,
				parentTeamId: editData.parentTeamId
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

	const [departments, setDepartments] = useState<
		Array<{ deptId: number; deptName: string }>
	>([]);
	const [eligibleLeads, setEligibleLeads] = useState<
		Array<{ id: number; name: string; email: string }>
	>([]);
	const [parentTeams, setParentTeams] = useState<
		Array<{ teamId: number; teamName: string }>
	>([]);

	// Fetch departments when dialog opens
	useEffect(() => {
		if (!dialogOpen || !orgId) return;

		const fetchDepartments = async () => {
			setIsLoadingDepartments(true);
			try {
				const parsedOrgId = parseInt(orgId);
				const deptData = await getAllDepartments(parsedOrgId);
				setDepartments(deptData || []);
			} catch (error) {
				toast({
					title: "Failed to load departments",
					description:
						error instanceof Error ? error.message : "Please try again later.",
					variant: "destructive"
				});
				setDepartments([]);
			} finally {
				setIsLoadingDepartments(false);
			}
		};

		fetchDepartments();
	}, [dialogOpen, orgId, toast]);

	// Fetch eligible leads and parent teams when department changes
	useEffect(() => {
		if (!dialogOpen || form.departmentId <= 0) {
			setEligibleLeads([]);
			setParentTeams([]);
			return;
		}

		const fetchLeadsAndTeams = async () => {
			setIsLoadingLeads(true);
			setIsLoadingParentTeams(true);
			try {
				const [leadsData, teamsData] = await Promise.all([
					getEligibleLeads(form.departmentId),
					getAllTeamsByDepartment(form.departmentId)
				]);
				setEligibleLeads(leadsData || []);
				// For edit mode, exclude the current team from parent teams
				if (editData) {
					setParentTeams(
						(teamsData || []).filter(t => t.teamId !== editData.teamId)
					);
				} else {
					setParentTeams(teamsData || []);
				}
			} catch (error) {
				toast({
					title: "Failed to load team data",
					description:
						error instanceof Error ? error.message : "Please try again later.",
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
	}, [dialogOpen, form.departmentId, editData, toast]);

	const handleDepartmentChange = (deptId: string) => {
		const selectedDept = departments.find((d) => d.deptId === parseInt(deptId));
		setForm((prev) => ({
			...prev,
			departmentId: parseInt(deptId),
			teamLeadId: 0,
			parentTeamId: undefined
		}));
	};

	const handleLeadChange = (leadId: string) => {
		setForm((prev) => ({
			...prev,
			teamLeadId: parseInt(leadId)
		}));
	};

	const handleParentTeamChange = (teamId: string) => {
		setForm((prev) => ({
			...prev,
			parentTeamId: teamId === "none" ? undefined : parseInt(teamId)
		}));
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!form.teamName ||
			!form.departmentId ||
			!form.teamLeadId
		) {
			toast({
				title: "Missing required fields",
				description:
					"Please fill in all required fields to " +
					(editData ? "update" : "create") +
					" a team.",
				variant: "destructive"
			});
			return;
		}

		setIsSubmitting(true);
		try {
			if (editData) {
				// Update mode - use UpdateTeamRequest (no departmentId)
				const payload: UpdateTeamRequest = {
					teamName: form.teamName,
					description: form.description,
					teamLeadId: form.teamLeadId,
					parentTeamId: form.parentTeamId
				};
				await updateTeam(editData.teamId, payload);
				toast({
					title: "Team updated successfully",
					description: `Team "${form.teamName}" has been updated.`
				});
			} else {
				// Create mode - use CreateTeamRequest
				const payload: CreateTeamRequest = {
					teamName: form.teamName,
					description: form.description,
					departmentId: form.departmentId,
					teamLeadId: form.teamLeadId,
					parentTeamId: form.parentTeamId
				};
				await createTeam(payload);
				toast({
					title: "Team created successfully",
					description: `Team "${form.teamName}" has been created.`
				});
			}

			handleOpenChange(false);
			onSuccess?.();
			setForm({
				teamName: "",
				description: "",
				departmentId: 0,
				teamLeadId: 0,
				parentTeamId: undefined
			});
		} catch (error) {
			console.error(
				(editData ? "Update" : "Create") + " team error:",
				error
			);
			toast({
				title:
					(editData ? "Failed to update" : "Failed to create") + " team",
				description:
					error instanceof Error ? error.message : "Please try again later.",
				variant: "destructive"
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			{smallButton && (
				<DialogTrigger asChild>
					{children ? (
						children
					) : smallButton ? (
						<Button size="sm" className="cursor-pointer">
							<Plus className="h-4 w-4 mr-2" />
							Create Team
						</Button>
					) : (
						<Card className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
							<CardContent className="p-0 flex flex-col items-center justify-center gap-2">
								<Building2 className="h-5 w-5 text-blue-600" />
								<p className="font-medium">Create Team</p>
							</CardContent>
						</Card>
					)}
				</DialogTrigger>

			)}
			<DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
				<DialogHeader>
					<DialogTitle>
						{editData ? "Edit Team" : "Create Team"}
					</DialogTitle>
					<DialogDescription>
						{editData
							? "Update the team details"
							: "Create a new team within a department"}
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-5 p-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="teamName">Team Name *</Label>
						<Input
							id="teamName"
							name="teamName"
							placeholder="e.g., Frontend Development Team"
							value={form.teamName}
							onChange={handleInputChange}
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							name="description"
							placeholder="Brief description of the team's purpose"
							value={form.description}
							onChange={handleInputChange}
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="departmentId">Department *</Label>
						<Select
							value={form.departmentId.toString()}
							onValueChange={handleDepartmentChange}
							disabled={isSubmitting || isLoadingDepartments || !!editData}
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
							value={form.teamLeadId.toString()}
							onValueChange={handleLeadChange}
							disabled={isSubmitting || isLoadingLeads || form.departmentId <= 0}
						>
							<SelectTrigger id="teamLeadId" className="w-full">
								<SelectValue placeholder={isLoadingLeads ? "Loading leads..." : form.departmentId <= 0 ? "Select department first" : "Select team lead"} />
							</SelectTrigger>
							<SelectContent>
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
							value={form.parentTeamId?.toString() || "none"}
							onValueChange={handleParentTeamChange}
							disabled={isSubmitting || isLoadingParentTeams || form.departmentId <= 0}
						>
							<SelectTrigger id="parentTeamId" className="w-full">
								<SelectValue placeholder={isLoadingParentTeams ? "Loading teams..." : form.departmentId <= 0 ? "Select department first" : "No parent team (top-level)"} />
							</SelectTrigger>
							<SelectContent>
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
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									{editData ? "Updating..." : "Creating..."}
								</>
							) : (
								editData ? "Update Team" : "Create Team"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default CreateTeamDialog;