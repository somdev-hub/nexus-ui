"use client";

import { AddTeamMemberRequest, TeamMember, TeamRole, User } from "@/types";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AddMemberFormProps {
	teamMembers: TeamMember[];
	availableUsers: User[];
	onSubmit: (data: AddTeamMemberRequest) => Promise<void>;
	onClose: () => void;
	isLoading?: boolean;
	editingMember?: TeamMember | null;
}


function getRoleLabel(role: TeamRole) {
	return role.replace("_", " ");
}

export function AddMemberForm({
	teamMembers,
	availableUsers,
	onSubmit,
	onClose,
	isLoading = false,
	editingMember = null,
}: AddMemberFormProps) {
	const isEditing = !!editingMember;

	const [formData, setFormData] = useState<AddTeamMemberRequest>({
		userId: 0,
		managerId: undefined,
		teamPosition: "",
		role: "EMPLOYEE",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [eligibleManagers, setEligibleManagers] = useState<TeamMember[]>([]);

	useEffect(() => {
		const setupFormData = (userId: number, managerId: number | undefined, teamPosition: string, role: TeamRole) => {
			setFormData({
				userId,
				managerId,
				teamPosition,
				role,
			});
		};
		if (isEditing && editingMember) {
			setupFormData(
				editingMember.user.id,
				editingMember.manager?.id,
				editingMember.teamPosition,
				editingMember.role
			);
			// setFormData({
			// 	userId: editingMember.user.id,
			// 	managerId: editingMember.manager?.id,
			// 	teamPosition: editingMember.teamPosition,
			// 	role: editingMember.role,
			// });
		} else {
			setupFormData(
				0,
				undefined,
				"",
				"EMPLOYEE"
			);
			// setFormData({
			// 	userId: 0,
			// 	managerId: undefined,
			// 	teamPosition: "",
			// 	role: "EMPLOYEE",
			// });
		}
	}, [editingMember, isEditing]);

	useEffect(() => {
		// Filter eligible managers based on role and hierarchy
		const currentMemberIds = new Set(teamMembers.map((m) => m.user.id));
		const filteredManagers = teamMembers.filter((m) => {
			// Can't be own manager
			if (isEditing && m.user.id === editingMember?.user.id) return false;
			// Only managers and team leads can be assigned as managers
			if (m.role === "EMPLOYEE") return false;
			// Can't assign a subordinate as manager (would create cycle)
			// For simplicity, allow any member except the one being edited
			return true;
		});
		const handleSetEligibleManagers = () => {
			setEligibleManagers(filteredManagers);
		}
		handleSetEligibleManagers();
	}, [teamMembers, editingMember, isEditing]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.userId) {
			newErrors.userId = "User is required";
		} else if (!isEditing && teamMembers.some((m) => m.user.id === formData.userId)) {
			newErrors.userId = "This user is already a member of this team";
		}

		if (!formData.teamPosition.trim()) {
			newErrors.teamPosition = "Team position is required";
		}

		if (!formData.role) {
			newErrors.role = "Role is required";
		}

		// Validate manager selection based on role
		if (formData.role === "TEAM_LEAD" && formData.managerId) {
			newErrors.managerId = "Team lead cannot have a manager";
		}

		if (formData.role !== "TEAM_LEAD" && !formData.managerId) {
			newErrors.managerId = "Manager is required for this role";
		}

		// Prevent self-management
		if (formData.managerId === formData.userId) {
			newErrors.managerId = "A member cannot be their own manager";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		try {
			// For editing, we need to use updateTeamMember API instead
			// But this form is for adding, so we'll just call onSubmit
			await onSubmit(formData);
			onClose();
		} catch (error) {
			console.error("Form submission error:", error);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: name === "userId" || name === "managerId"
				? parseInt(value) || undefined
				: value,
		}));

		// Clear error when user starts typing
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	// Filter available users to exclude current team members (unless editing)
	const filteredUsers = availableUsers.filter((user) => {
		const isExistingMember = teamMembers.some(
			(m) => Number(m.user.id) === Number(user.id)
		);
		const isEditingThisMember =
			isEditing && editingMember && Number(editingMember.user.id) === Number(user.id);
		return !isExistingMember || isEditingThisMember;
	});

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
			<div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
					<h2 className="text-xl font-semibold text-gray-900">
						{isEditing ? "Edit Team Member" : "Add Team Member"}
					</h2>
					<button
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
						disabled={isLoading}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-4 space-y-6">
					{/* User Selection */}
					<div>
						<label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
							User <span className="text-red-500">*</span>
						</label>
						<select
							id="userId"
							name="userId"
							value={formData.userId || ""}
							onChange={handleChange}
							className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.userId ? "border-red-500" : "border-gray-300"
								}`}
							disabled={isLoading || isEditing}
						>
							<option value="">Select user</option>
							{filteredUsers.map((user) => (
								<option key={user.id} value={user.id}>
									{user.name} ({user.email})
								</option>
							))}
						</select>
						{errors.userId && (
							<p className="mt-1 text-sm text-red-500">{errors.userId}</p>
						)}
						{isEditing && (
							<p className="mt-1 text-sm text-gray-500">User cannot be changed when editing</p>
						)}
						{filteredUsers.length === 0 && !isEditing && (
							<p className="mt-1 text-sm text-amber-600">
								All available users are already team members
							</p>
						)}
					</div>

					{/* Role */}
					<div>
						<label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
							Role <span className="text-red-500">*</span>
						</label>
						<select
							id="role"
							name="role"
							value={formData.role}
							onChange={handleChange}
							className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.role ? "border-red-500" : "border-gray-300"
								}`}
							disabled={isLoading}
						>
							<option value="EMPLOYEE">Employee</option>
							<option value="MANAGER">Manager</option>
							<option value="TEAM_LEAD">Team Lead</option>
						</select>
						{errors.role && (
							<p className="mt-1 text-sm text-red-500">{errors.role}</p>
						)}
					</div>

					{/* Manager (conditional) */}
					{(formData.role !== "TEAM_LEAD" || isEditing) && (
						<div>
							<label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-1">
								Manager <span className="text-red-500">*</span>
							</label>
							<select
								id="managerId"
								name="managerId"
								value={formData.managerId || ""}
								onChange={handleChange}
								className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.managerId ? "border-red-500" : "border-gray-300"
									}`}
								disabled={isLoading || formData.role === "TEAM_LEAD"}
							>
								<option value="">Select manager</option>
								{eligibleManagers.map((manager) => (
									<option key={manager.id} value={manager.id}>
										{manager.user.name} ({getRoleLabel(manager.role)})
									</option>
								))}
							</select>
							{errors.managerId && (
								<p className="mt-1 text-sm text-red-500">{errors.managerId}</p>
							)}
							{formData.role === "TEAM_LEAD" && (
								<p className="mt-1 text-sm text-gray-500">Team lead does not have a manager</p>
							)}
							{eligibleManagers.length === 0 && formData.role !== "TEAM_LEAD" && (
								<p className="mt-1 text-sm text-amber-600">
									No eligible managers available. Add a team lead or manager first.
								</p>
							)}
						</div>
					)}

					{/* Team Position */}
					<div>
						<label htmlFor="teamPosition" className="block text-sm font-medium text-gray-700 mb-1">
							Team Position <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="teamPosition"
							name="teamPosition"
							value={formData.teamPosition}
							onChange={handleChange}
							className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.teamPosition ? "border-red-500" : "border-gray-300"
								}`}
							placeholder="e.g., Senior Developer, QA Lead, etc."
							disabled={isLoading}
						/>
						{errors.teamPosition && (
							<p className="mt-1 text-sm text-red-500">{errors.teamPosition}</p>
						)}
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
							disabled={isLoading}
						>
							{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
							{isEditing ? "Update Member" : "Add Member"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default AddMemberForm;