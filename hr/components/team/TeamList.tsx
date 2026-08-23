"use client";

import { TeamManagementDialog } from "./TeamManagementDialog";
import { Team } from "@/types";
import { Building2, Loader2, Search, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface TeamListProps {
	teams: Team[];
	onSelectTeam: (team: Team) => void;
	onDeleteTeam: (teamId: number) => Promise<void>;
	onRefresh: () => void;
	isLoading?: boolean;
	selectedTeamId?: number;
}

export function TeamList({
	teams,
	onSelectTeam,
	onDeleteTeam,
	onRefresh,
	isLoading = false,
	selectedTeamId,
}: TeamListProps) {
	const { toast } = useToast();
	const [searchQuery, setSearchQuery] = useState("");
	const [editingTeam, setEditingTeam] = useState<Team | undefined>(undefined);
	const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);

	const filteredTeams = teams.filter((team) => {
		const matchesSearch =
			team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			team.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesSearch;
	});

	const handleEditClick = (team: Team, e: React.MouseEvent) => {
		e.stopPropagation();
		setEditingTeam(team);
	};

	const handleDeleteTeam = async (teamId: number) => {
		setDeleteTeamId(teamId);
	};

	const confirmDeleteTeam = async () => {
		if (!deleteTeamId) return;
		try {
			await onDeleteTeam(deleteTeamId);
			toast({
				title: "Team Deleted",
				description: "The team has been successfully deleted.",
				variant: "success",
			});
			onRefresh();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete team";
			toast({
				title: "Failed to Delete Team",
				description: message,
				variant: "destructive",
			});
			console.error("Error deleting team:", err);
		} finally {
			setDeleteTeamId(null);
		}
	};

	return (
		<Card className="p-4 gap-2">
			<CardHeader className="p-0 flex flex-row items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<Building2 className="w-6 h-6 text-blue-600" />
					<div>
						<CardTitle className="text-lg">Teams</CardTitle>
						<CardDescription>
							{filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""} found
						</CardDescription>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{/* Search */}
					<div className="relative hidden sm:block">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							type="text"
							placeholder="Search teams..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-64 pl-10 pr-4 py-2"
						/>
					</div>

					{/* Create Team Button - uses TeamManagementDialog */}
					<TeamManagementDialog
						mode="team"
						smallButton={true}
						editTeamData={editingTeam}
						onSuccess={() => {
							setEditingTeam(undefined);
							onRefresh();
						}}
					/>
				</div>
			</CardHeader>
			<CardContent className="p-0 space-y-4">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="flex items-center justify-center gap-2 text-gray-500">
							<Loader2 className="w-5 h-5 animate-spin" />
							<span>Loading teams...</span>
						</div>
					</div>
				) : filteredTeams.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500">
						<Users className="w-10 h-10 text-gray-300" />
						<span className="text-lg">No teams found</span>
						<p className="text-sm">
							{searchQuery
								? "Try adjusting your search"
								: "Create your first team to get started"}
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{filteredTeams.map((team) => (
							<div
								key={team.teamId}
								className={`p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer ${selectedTeamId === team.teamId ? "border-blue-500 bg-blue-50" : ""
									}`}
								onClick={() => onSelectTeam(team)}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3">
											<p className="font-medium text-gray-900">{team.teamName}</p>
											<Badge variant="outline" className="text-xs">
												{team.parentTeamId ? "Sub-team" : "Top-level"}
											</Badge>
										</div>
										{team.description && (
											<p className="text-sm text-gray-500 truncate mt-1 max-w-xs">
												{team.description}
											</p>
										)}
										<div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
											<span className="flex items-center gap-1">
												<Building2 className="w-3.5 h-3.5" />
												{team.departmentName}
											</span>
											{team.teamLead && (
												<span className="flex items-center gap-1">
													<Users className="w-3.5 h-3.5" />
													Lead: {team.teamLead.userName}
												</span>
											)}
											<span className="flex items-center gap-1">
												<Users className="w-3.5 h-3.5" />
												{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => handleEditClick(team, e)}
											className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
											title="Edit team"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTeam(team.teamId);
											}}
											className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
											title="Delete team"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<AlertDialog open={deleteTeamId !== null} onOpenChange={(open) => !open && setDeleteTeamId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Team</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this team? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDeleteTeam} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
							{isLoading ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}

export default TeamList;