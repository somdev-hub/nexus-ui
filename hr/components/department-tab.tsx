"use client";

import {
	addTeamMember,
	changeManager,
	deleteTeam,
	getTeamHierarchy,
	getTeamMembers,
	getTeamsByDepartment,
	removeTeamMember,
	updateTeam,
	updateTeamMember
} from "@/lib/auth-service";
import { ApiDepartment, TeamHierarchyResponse, TeamMember, User } from "@/types";
import { Team } from "@/types/team";
import { Building2, ChevronLeft, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TeamDetail, TeamList } from "./team";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

interface DepartmentTabProps {
	departments: ApiDepartment[];
	availableUsers: User[];
	onRefresh?: () => void;
}

const DepartmentTab = ({
	departments,
	availableUsers,
	onRefresh,
}: DepartmentTabProps) => {
	const [teams, setTeams] = useState<Team[]>([]);
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [hierarchy, setHierarchy] = useState<TeamHierarchyResponse | null>(null);
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load teams when departments change
	const loadTeams = useCallback(async () => {
		console.log('[DepartmentTab] loadTeams called with departments:', departments);
		setLoading(true);
		setError(null);
		try {
			// Fetch teams from all departments
			const allTeams: Team[] = [];
			for (const dept of departments) {
				try {
					console.log(`[DepartmentTab] Fetching teams for department ${dept.deptId} (${dept.deptName})`);
					const deptTeams = await getTeamsByDepartment(dept.deptId);
					// Ensure deptTeams is an array before spreading
					if (Array.isArray(deptTeams)) {
						console.log(`[DepartmentTab] Got ${deptTeams.length} teams for department ${dept.deptId}`);
						allTeams.push(...deptTeams);
					} else {
						console.log(`[DepartmentTab] No teams array returned for department ${dept.deptId}`);
					}
				} catch (err) {
					console.error(`[DepartmentTab] Failed to load teams for department ${dept.deptId}:`, err);
				}
			}
			console.log('[DepartmentTab] Total teams loaded:', allTeams.length);
			setTeams(allTeams);
		} catch (err) {
			setError("Failed to load teams");
			console.error("[DepartmentTab] Error loading teams:", err);
		} finally {
			setLoading(false);
		}
	}, [departments]);

	useEffect(() => {
		console.log('[DepartmentTab] useEffect triggered, departments:', departments);
		loadTeams();
	}, [loadTeams]);

	const handleSelectTeam = async (team: Team) => {
		console.log(`[DEBUG DepartmentTab] handleSelectTeam called for team: ${team.teamName} (id: ${team.teamId})`);
		setSelectedTeam(team);

		// Fetch hierarchy and members for the selected team
		try {
			console.log(`[DEBUG DepartmentTab] Fetching hierarchy and members for teamId: ${team.teamId}`);
			const [hierarchyData, membersData] = await Promise.all([
				getTeamHierarchy(team.teamId),
				getTeamMembers(team.teamId),
			]);
			console.log(`[DEBUG DepartmentTab] Hierarchy data received:`, {
				teamId: hierarchyData?.teamId,
				teamName: hierarchyData?.teamName,
				root: hierarchyData?.root ? {
					member: hierarchyData.root.member,
					childrenCount: hierarchyData.root.children?.length || 0
				} : null
			});
			console.log(`[DEBUG DepartmentTab] Members data received: ${membersData?.length || 0} members`);
			setHierarchy(hierarchyData);
			setMembers(membersData);
		} catch (err) {
			console.error("[DEBUG DepartmentTab] Failed to load team hierarchy/members:", err);
			setHierarchy(null);
			setMembers([]);
		}
	};

	const handleBackToTeams = () => {
		setSelectedTeam(null);
		setHierarchy(null);
		setMembers([]);
	};

	const handleUpdateTeam = async (teamId: number, data: any) => {
		setLoading(true);
		try {
			const updatedTeam = await updateTeam(teamId, data);
			setTeams((prev) => prev.map((t) => (t.teamId === teamId ? updatedTeam : t)));
			if (selectedTeam?.teamId === teamId) {
				setSelectedTeam(updatedTeam);
			}
			onRefresh?.();
		} catch (err) {
			setError("Failed to update team");
			console.error("Error updating team:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteTeam = async (teamId: number) => {
		if (!window.confirm("Are you sure you want to delete this team?")) return;

		setLoading(true);
		try {
			await deleteTeam(teamId);
			setTeams((prev) => prev.filter((t) => t.teamId !== teamId));
			if (selectedTeam?.teamId === teamId) {
				setSelectedTeam(null);
				setHierarchy(null);
				setMembers([]);
			}
			onRefresh?.();
		} catch (err) {
			setError("Failed to delete team");
			console.error("Error deleting team:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleAddMember = async (teamId: number, data: any) => {
		setLoading(true);
		try {
			await addTeamMember(teamId, data);
			onRefresh?.();
		} catch (err) {
			setError("Failed to add member");
			console.error("Error adding member:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateMember = async (teamId: number, memberId: number, data: any) => {
		setLoading(true);
		try {
			await updateTeamMember(memberId, data);
			onRefresh?.();
		} catch (err) {
			setError("Failed to update member");
			console.error("Error updating member:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveMember = async (teamId: number, memberId: number) => {
		setLoading(true);
		try {
			await removeTeamMember(memberId);
			onRefresh?.();
		} catch (err) {
			setError("Failed to remove member");
			console.error("Error removing member:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleChangeManager = async (teamId: number, memberId: number, data: any) => {
		setLoading(true);
		try {
			await changeManager(memberId, data);
			onRefresh?.();
		} catch (err) {
			setError("Failed to change manager");
			console.error("Error changing manager:", err);
		} finally {
			setLoading(false);
		}
	};

	// Calculate total teams and members
	const totalTeams = teams.length;
	const totalMembers = teams.reduce((sum, team) => sum + (team.memberCount || 0), 0);

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Departments & Teams
				</h1>
				<p className="text-muted-foreground mt-2">
					Manage teams and hierarchy within departments
				</p>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Teams
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="flex items-center justify-between">
							<p className="text-3xl font-bold">{totalTeams}</p>
							<Building2 className="w-8 h-8 text-blue-500 opacity-50" />
						</div>
					</CardContent>
				</Card>

				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Members
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="flex items-center justify-between">
							<p className="text-3xl font-bold">{totalMembers}</p>
							<Users className="w-8 h-8 text-green-500 opacity-50" />
						</div>
					</CardContent>
				</Card>

				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Departments
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="flex items-center justify-between">
							<p className="text-3xl font-bold">{departments.length}</p>
							<Building2 className="w-8 h-8 text-purple-500 opacity-50" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Teams List & Detail */}
			<Card className="p-4 gap-2">
				<CardHeader className="p-0 flex flex-row items-center justify-between mb-4">
					<div>
						<CardTitle>Teams Management</CardTitle>
						<CardDescription>
							View, create, and manage teams across departments
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="p-0 space-y-4">
					{error && (
						<div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between rounded-lg">
							<span>{error}</span>
							<Button variant="ghost" size="sm" onClick={() => setError(null)}>
								Dismiss
							</Button>
						</div>
					)}

					{selectedTeam ? (
						<div className="flex flex-col h-full">
							{/* Back button and team header */}
							<div className="mb-4 flex items-center justify-between">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleBackToTeams}
									className="flex items-center gap-2"
								>
									<ChevronLeft className="w-4 h-4" />
									Back to Teams
								</Button>
								<div className="flex items-center gap-2">
									<Building2 className="w-5 h-5 text-blue-600" />
									<span className="text-lg font-semibold">{selectedTeam.teamName}</span>
									<Badge variant="outline" className="text-xs">
										{selectedTeam.memberCount || 0} members
									</Badge>
								</div>
							</div>
							<TeamDetail
								team={selectedTeam}
								hierarchy={hierarchy}
								members={members}
								departments={departments}
								availableUsers={availableUsers}
								onBack={handleBackToTeams}
								onUpdateTeam={handleUpdateTeam}
								onDeleteTeam={handleDeleteTeam}
								onAddMember={handleAddMember}
								onUpdateMember={handleUpdateMember}
								onRemoveMember={handleRemoveMember}
								onChangeManager={handleChangeManager}
								onRefresh={loadTeams}
								isLoading={loading}
							/>
						</div>
					) : (
						<TeamList
							teams={teams}
							onSelectTeam={handleSelectTeam}
							onDeleteTeam={handleDeleteTeam}
							onRefresh={loadTeams}
							isLoading={loading}
							selectedTeamId={undefined}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default DepartmentTab;