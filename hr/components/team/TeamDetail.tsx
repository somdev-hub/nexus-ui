"use client";

import { ApiDepartment, Team, TeamHierarchyResponse, TeamMember, TeamMemberSummary, User } from "@/types";
import {
	Building2,
	ChevronLeft,
	Edit2,
	Settings,
	Share2,
	Trash2,
	UserCheck,
	UserPlus,
	Users
} from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TeamForm } from "./TeamForm";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamHierarchyCanvas } from "./TeamHierarchyCanvas";
import { TeamManagementDialog } from "./TeamManagementDialog";

interface TeamDetailProps {
	team: Team | null;
	hierarchy?: TeamHierarchyResponse | null;
	members?: TeamMember[];
	departments: ApiDepartment[];
	availableUsers: User[];
	onBack: () => void;
	onUpdateTeam: (teamId: number, data: any) => Promise<void>;
	onDeleteTeam: (teamId: number) => Promise<void>;
	onAddMember: (teamId: number, data: any) => Promise<void>;
	onUpdateMember: (teamId: number, memberId: number, data: any) => Promise<void>;
	onRemoveMember: (teamId: number, memberId: number) => Promise<void>;
	onRefresh: () => void;
	isLoading?: boolean;
}

export function TeamDetail({
	team,
	hierarchy,
	members = [],
	departments,
	availableUsers,
	onBack,
	onUpdateTeam,
	onDeleteTeam,
	onAddMember,
	onUpdateMember,
	onRemoveMember,
	onRefresh,
	isLoading = false,
}: TeamDetailProps) {
	console.log(`[DEBUG TeamDetail] Props received:`, {
		team: team ? { teamId: team.teamId, teamName: team.teamName } : null,
		hierarchy: hierarchy ? {
			teamId: hierarchy.teamId,
			teamName: hierarchy.teamName,
			root: hierarchy.root ? {
				member: hierarchy.root.member,
				childrenCount: hierarchy.root.children?.length || 0
			} : null
		} : null,
		membersCount: members?.length || 0
	});
	const [activeTab, setActiveTab] = useState<"hierarchy" | "members" | "details">("hierarchy");
	const [showAddMemberForm, setShowAddMemberForm] = useState(false);
	const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
	const [showEditTeamForm, setShowEditTeamForm] = useState(false);
	const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<number | null>(null);
	const [isDeleteTeamDialogOpen, setIsDeleteTeamDialogOpen] = useState(false);
	const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

	const handleAddMember = async (data: any) => {
		if (!team) return;
		await onAddMember(team.teamId, data);
		setShowAddMemberForm(false);
		onRefresh();
	};

	const handleUpdateMember = async (data: any) => {
		if (!team || !editingMember) return;
		await onUpdateMember(team.teamId, editingMember.id, data);
		setEditingMember(null);
		onRefresh();
	};

	const handleRemoveMember = async (memberId: number) => {
		if (!team) return;
		setMemberToRemove(memberId);
		setIsRemoveMemberDialogOpen(true);
	};

	const handleViewSubordinates = (member: TeamMember) => {
		setActiveTab("hierarchy");
		setSelectedMemberId(member.id);
	};

	const confirmRemoveMember = async () => {
		if (!team || memberToRemove === null) return;
		await onRemoveMember(team.teamId, memberToRemove);
		setIsRemoveMemberDialogOpen(false);
		setMemberToRemove(null);
		onRefresh();
	};

	const handleEditTeam = async (data: any) => {
		if (!team) return;
		await onUpdateTeam(team.teamId, data);
		setShowEditTeamForm(false);
		onRefresh();
	};

	const handleDeleteTeam = async () => {
		setIsDeleteTeamDialogOpen(true);
	};

	const confirmDeleteTeam = async () => {
		if (!team) return;
		await onDeleteTeam(team.teamId);
		setIsDeleteTeamDialogOpen(false);
		onBack();
	};

	const handleMemberAction = (member: TeamMemberSummary, action: "edit" | "remove" | "change-manager") => {
		// Find the full TeamMember from the members array
		const fullMember = members.find(m => m.id === member.id);
		switch (action) {
			case "edit":
				if (fullMember) setEditingMember(fullMember);
				break;
			case "remove":
				handleRemoveMember(member.id);
				break;
			case "change-manager":
				// For change manager, we'd need a separate modal
				// For now, we'll use the edit form with role change
				if (fullMember) setEditingMember(fullMember);
				break;
		}
	};

	if (!team) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center text-gray-500">
					<Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
					<p>No team selected</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center gap-4">
					<button
						onClick={onBack}
						className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
					>
						<ChevronLeft className="w-5 h-5" />
					</button>
					<div className="flex items-center gap-3">
						<Building2 className="w-8 h-8 text-blue-600" />
						<div>
							<h1 className="text-xl font-semibold text-gray-900">{team.teamName}</h1>
							<p className="text-sm text-gray-500">{team.departmentName}</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => setShowEditTeamForm(true)}
						className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
						disabled={isLoading}
					>
						<Edit2 className="w-4 h-4" />
						Edit
					</button>
					<button
						onClick={handleDeleteTeam}
						className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
						disabled={isLoading}
					>
						<Trash2 className="w-4 h-4" />
						Delete
					</button>
				</div>
			</div>

			{/* Team Info Bar */}
			<div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 text-sm">
				<div className="flex items-center gap-2 text-gray-600">
					<Users className="w-4 h-4" />
					<span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
				</div>
				<div className="flex items-center gap-2 text-gray-600">
					<UserCheck className="w-4 h-4 text-amber-500" />
					<span>Lead: {team.teamLead?.userName || "Not assigned"}</span>
				</div>
				{team.parentTeamId && (
					<div className="flex items-center gap-2 text-gray-600">
						<Share2 className="w-4 h-4 text-amber-500" />
						<span>Sub-team of: {team.parentTeamName}</span>
					</div>
				)}
				{team.subTeams && team.subTeams.length > 0 && (
					<div className="flex items-center gap-2 text-gray-600">
						<Users className="w-4 h-4 text-blue-500" />
						<span>{team.subTeams.length} sub-team{team.subTeams.length !== 1 ? "s" : ""}</span>
					</div>
				)}
			</div>

			{/* Tabs */}
			<div className="border-b border-gray-200">
				<nav className="flex -mb-px" aria-label="Tabs">
					<button
						onClick={() => setActiveTab("hierarchy")}
						className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "hierarchy"
							? "border-blue-500 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
					>
						<div className="flex items-center gap-2">
							<Share2 className="w-4 h-4" />
							Hierarchy
						</div>
					</button>
					<button
						onClick={() => setActiveTab("members")}
						className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "members"
							? "border-blue-500 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
					>
						<div className="flex items-center gap-2">
							<Users className="w-4 h-4" />
							Members ({team.memberCount})
						</div>
					</button>
					<button
						onClick={() => setActiveTab("details")}
						className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "details"
							? "border-blue-500 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
					>
						<div className="flex items-center gap-2">
							<Settings className="w-4 h-4" />
							Details
						</div>
					</button>
				</nav>
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-auto p-4">
				{activeTab === "hierarchy" && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-medium text-gray-900">Team Hierarchy</h2>
							<button
								onClick={() => setShowAddMemberForm(true)}
								className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
								disabled={isLoading}
							>
								<UserPlus className="w-4 h-4" />
								Add Member
							</button>
						</div>

						{hierarchy ? (
							<div className="bg-white rounded-lg border border-gray-200 p-2">
								{(() => {
									console.log(`[DEBUG TeamDetail] Rendering TeamHierarchyCanvas with hierarchy:`, {
										teamId: hierarchy.teamId,
										teamName: hierarchy.teamName,
										root: hierarchy.root ? {
											member: hierarchy.root.member,

											childrenCount: hierarchy.root.children?.length || 0
										} : null
									});
									return (
										<TeamHierarchyCanvas
											root={hierarchy.root}
											onMemberClick={(member) => console.log("Member clicked:", member)}
											onMemberAction={handleMemberAction}
											selectedMemberId={selectedMemberId ?? undefined}
										/>
									);
								})()}
							</div>
						) : (
							<div className="bg-gray-50 rounded-lg p-8 text-center">
								<Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
								<p className="text-gray-500">No hierarchy data available</p>
							</div>
						)}
					</div>
				)}

				{activeTab === "members" && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-medium text-gray-900">Team Members</h2>
							<button
								onClick={() => setShowAddMemberForm(true)}
								className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
								disabled={isLoading}
							>
								<UserPlus className="w-4 h-4" />
								Add Member
							</button>
						</div>

						{members.length > 0 ? (
							<div className="space-y-3">
								{members.map((member) => (
									<TeamMemberCard
										key={member.id}
										member={member}
										showActions={true}
										onEdit={setEditingMember}
										onRemove={handleRemoveMember}
										onViewSubordinates={handleViewSubordinates}
									/>
								))}
							</div>
						) : (
							<div className="bg-gray-50 rounded-lg p-8 text-center">
								<Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
								<p className="text-gray-500">No members in this team yet</p>
								<button
									onClick={() => setShowAddMemberForm(true)}
									className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
								>
									Add First Member
								</button>
							</div>
						)}
					</div>
				)}

				{activeTab === "details" && (
					<div className="space-y-6 max-w-full">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-medium text-gray-900 mb-4">Team Information</h3>
							<dl className="space-y-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<dt className="text-sm text-gray-500">Team Name</dt>
										<dd className="text-sm font-medium text-gray-900">{team.teamName}</dd>
									</div>
									<div>
										<dt className="text-sm text-gray-500">Department</dt>
										<dd className="text-sm font-medium text-gray-900">{team.departmentName}</dd>
									</div>
									<div>
										<dt className="text-sm text-gray-500">Team Type</dt>
										<dd className="text-sm font-medium text-gray-900">
											{team.parentTeamId ? "Sub-team" : "Top-level Team"}
										</dd>
									</div>
									<div>
										<dt className="text-sm text-gray-500">Member Count</dt>
										<dd className="text-sm font-medium text-gray-900">{team.memberCount}</dd>
									</div>
								</div>
								{team.description && (
									<div>
										<dt className="text-sm text-gray-500">Description</dt>
										<dd className="text-sm text-gray-900 mt-1">{team.description}</dd>
									</div>
								)}
								{team.parentTeamName && (
									<div>
										<dt className="text-sm text-gray-500">Parent Team</dt>
										<dd className="text-sm font-medium text-gray-900">{team.parentTeamName}</dd>
									</div>
								)}
								<div>
									<dt className="text-sm text-gray-500">Created</dt>
									<dd className="text-sm font-medium text-gray-900">
										{new Date(team.createdAt).toLocaleDateString()}
									</dd>
								</div>
								<div>
									<dt className="text-sm text-gray-500">Last Updated</dt>
									<dd className="text-sm font-medium text-gray-900">
										{new Date(team.updatedAt).toLocaleDateString()}
									</dd>
								</div>
							</dl>
						</div>

						{team.teamLead && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
									<UserCheck className="w-5 h-5 text-amber-500" />
									Team Lead
								</h3>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
										{team.teamLead.userName.charAt(0).toUpperCase()}
									</div>
									<div>
										<p className="font-medium text-gray-900">{team.teamLead.userName}</p>
										<p className="text-sm text-gray-500">{team.teamLead.userEmail}</p>
									</div>
								</div>
							</div>
						)}

						{team.subTeams && team.subTeams.length > 0 && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
									<Users className="w-5 h-5 text-blue-500" />
									Sub-teams ({team.subTeams.length})
								</h3>
								<ul className="space-y-2">
									{team.subTeams.map((subTeam) => (
										<li key={subTeam.teamId} className="flex items-center justify-between p-2 bg-white rounded-lg">
											<div className="flex items-center gap-3">
												<Building2 className="w-5 h-5 text-blue-500" />
												<span className="font-medium text-gray-900">{subTeam.teamName}</span>
											</div>
											<span className="text-sm text-gray-500">{subTeam.memberCount} members</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Modals */}
			{showAddMemberForm && (
				<TeamManagementDialog
					mode="member"
					teamMembers={members}
					availableUsers={availableUsers}
					onMemberSubmit={handleAddMember}
					onMemberClose={() => setShowAddMemberForm(false)}
					isLoading={isLoading}
					open={showAddMemberForm}
					onOpenChange={setShowAddMemberForm}
				/>
			)}

			{editingMember && (
				<TeamManagementDialog
					mode="member"
					teamMembers={members}
					availableUsers={availableUsers}
					onMemberSubmit={handleUpdateMember}
					onMemberClose={() => setEditingMember(null)}
					isLoading={isLoading}
					editingMember={editingMember}
					open={!!editingMember}
					onOpenChange={(open) => !open && setEditingMember(null)}
				/>
			)}

			{showEditTeamForm && (
				<TeamForm
					initialData={team}
					departments={departments}
					onSubmit={handleEditTeam}
					onClose={() => setShowEditTeamForm(false)}
					isLoading={isLoading}
				/>
			)}

			<AlertDialog open={isRemoveMemberDialogOpen} onOpenChange={setIsRemoveMemberDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Team Member</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to remove this member from the team? This action cannot be undone.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmRemoveMember} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={isDeleteTeamDialogOpen} onOpenChange={setIsDeleteTeamDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Team</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to delete this team? This action cannot be undone. All team members will be removed.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDeleteTeam} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default TeamDetail;