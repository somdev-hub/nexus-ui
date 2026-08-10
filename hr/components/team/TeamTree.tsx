"use client";

import { useState } from "react";
import { TeamHierarchyNode, TeamMemberSummary, TeamRole } from "@/types";
import { ChevronRight, ChevronDown, Users, User, UserCheck, UserCog } from "lucide-react";

interface TeamTreeProps {
	root: TeamHierarchyNode;
	onMemberClick?: (member: TeamMemberSummary) => void;
	onMemberAction?: (member: TeamMemberSummary, action: "edit" | "remove" | "change-manager") => void;
	selectedMemberId?: number;
	maxDepth?: number;
}

function getRoleIcon(role: TeamRole) {
	switch (role) {
		case "TEAM_LEAD":
			return <UserCheck className="w-4 h-4 text-amber-500" aria-label="Team Lead" />;
		case "MANAGER":
			return <UserCog className="w-4 h-4 text-blue-500" aria-label="Manager" />;
		case "EMPLOYEE":
			return <User className="w-4 h-4 text-green-500" aria-label="Employee" />;
	}
}

function getRoleBadge(role: TeamRole) {
	const styles = {
		TEAM_LEAD: "bg-amber-100 text-amber-800",
		MANAGER: "bg-blue-100 text-blue-800",
		EMPLOYEE: "bg-green-100 text-green-800",
	};
	return (
		<span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[role]}`}>
			{role.replace("_", " ")}
		</span>
	);
}

interface TreeNodeProps {
	node: TeamHierarchyNode;
	depth: number;
	maxDepth?: number;
	onMemberClick?: (member: TeamMemberSummary) => void;
	onMemberAction?: (member: TeamMemberSummary, action: "edit" | "remove" | "change-manager") => void;
	expandedNodes: Set<number>;
	onToggleExpand?: (memberId: number) => void;
	selectedMemberId?: number;
	isLastChild?: boolean;
	parentConnectors?: boolean[];
}

export function TeamTree({
	root,
	onMemberClick,
	onMemberAction,
	selectedMemberId,
	maxDepth = 10,
}: TeamTreeProps) {
	const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

	const handleToggleExpand = (memberId: number) => {
		setExpandedNodes((prev) => {
			const next = new Set(prev);
			if (next.has(memberId)) {
				next.delete(memberId);
			} else {
				next.add(memberId);
			}
			return next;
		});
	};

	const isExpanded = expandedNodes.has(root.member.id);
	const hasChildren = root.children.length > 0;
	const isSelected = selectedMemberId === root.member.id;
	const depth = 0; // Root node is at depth 0

	const handleToggle = () => {
		if (hasChildren) {
			handleToggleExpand(root.member.id);
		}
	};

	const handleClick = () => {
		if (onMemberClick) {
			onMemberClick(root.member);
		}
	};

	const handleAction = (action: "edit" | "remove" | "change-manager", e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMemberAction) {
			onMemberAction(root.member, action);
		}
	};

	if (depth >= (maxDepth || 10)) {
		return null;
	}

	return (
		<div className="relative">
			{/* Current node */}
			<div
				className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${isSelected
					? "bg-blue-50 border border-blue-200"
					: "hover:bg-gray-50"
					}`}
				onClick={handleClick}
				style={{ marginLeft: `${depth * 24}px` }}
			>
				{/* Expand/collapse indicator */}
				{hasChildren ? (
					<button
						onClick={handleToggle}
						className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
						aria-label={isExpanded ? "Collapse" : "Expand"}
					>
						{isExpanded ? (
							<ChevronDown className="w-4 h-4 text-gray-500" />
						) : (
							<ChevronRight className="w-4 h-4 text-gray-500" />
						)}
					</button>
				) : (
					<div className="w-8 flex-shrink-0" />
				)}

				{/* Role icon */}
				<div className="flex-shrink-0">{getRoleIcon(root.member.role)}</div>

				{/* Member info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-900 truncate">
							{root.member.userName}
						</span>
						{getRoleBadge(root.member.role)}
					</div>
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<span className="truncate">{root.member.userEmail}</span>
						{root.member.teamPosition && (
							<>
								<span className="text-gray-300">•</span>
								<span className="truncate">{root.member.teamPosition}</span>
							</>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						onClick={(e) => handleAction("edit", e)}
						className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
						aria-label="Edit"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>
					<button
						onClick={(e) => handleAction("change-manager", e)}
						className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
						aria-label="Change Manager"
					>
						<Users className="w-4 h-4" />
					</button>
					<button
						onClick={(e) => handleAction("remove", e)}
						className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
						aria-label="Remove"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			</div>

			{/* Children */}
			{isExpanded && hasChildren && (
				<div className="pl-4">
					{root.children.map((child, index) => (
						<TreeNode
							key={child.member.id}
							node={child}
							depth={depth + 1}
							maxDepth={maxDepth}
							onMemberClick={onMemberClick}
							onMemberAction={onMemberAction}
							expandedNodes={expandedNodes}
							onToggleExpand={handleToggleExpand}
							selectedMemberId={selectedMemberId}
							isLastChild={index === root.children.length - 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function TreeNode({
	node,
	depth,
	maxDepth,
	onMemberClick,
	onMemberAction,
	expandedNodes,
	onToggleExpand,
	selectedMemberId,
	isLastChild,
}: TreeNodeProps) {
	const isExpanded = expandedNodes.has(node.member.id);
	const hasChildren = node.children.length > 0;
	const isSelected = selectedMemberId === node.member.id;

	const handleToggle = () => {
		if (hasChildren && onToggleExpand) {
			onToggleExpand(node.member.id);
		}
	};

	const handleClick = () => {
		if (onMemberClick) {
			onMemberClick(node.member);
		}
	};

	const handleAction = (action: "edit" | "remove" | "change-manager", e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMemberAction) {
			onMemberAction(node.member, action);
		}
	};

	if (depth >= (maxDepth || 10)) {
		return null;
	}

	return (
		<div className="relative">
			{/* Connector line from parent */}
			<div
				className="absolute left-[14px] top-0 bottom-0 w-0.5 bg-gray-200"
				style={{ height: "100%" }}
			/>

			{/* Current node */}
			<div
				className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${isSelected
					? "bg-blue-50 border border-blue-200"
					: "hover:bg-gray-50"
					}`}
				onClick={handleClick}
				style={{ marginLeft: `${depth * 24}px` }}
			>
				{/* Expand/collapse indicator */}
				{hasChildren ? (
					<button
						onClick={handleToggle}
						className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
						aria-label={isExpanded ? "Collapse" : "Expand"}
					>
						{isExpanded ? (
							<ChevronDown className="w-4 h-4 text-gray-500" />
						) : (
							<ChevronRight className="w-4 h-4 text-gray-500" />
						)}
					</button>
				) : (
					<div className="w-8 flex-shrink-0" />
				)}

				{/* Role icon */}
				<div className="flex-shrink-0">{getRoleIcon(node.member.role)}</div>

				{/* Member info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-900 truncate">
							{node.member.userName}
						</span>
						{getRoleBadge(node.member.role)}
					</div>
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<span className="truncate">{node.member.userEmail}</span>
						{node.member.teamPosition && (
							<>
								<span className="text-gray-300">•</span>
								<span className="truncate">{node.member.teamPosition}</span>
							</>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						onClick={(e) => handleAction("edit", e)}
						className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
						aria-label="Edit"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>
					<button
						onClick={(e) => handleAction("change-manager", e)}
						className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
						aria-label="Change Manager"
					>
						<Users className="w-4 h-4" />
					</button>
					<button
						onClick={(e) => handleAction("remove", e)}
						className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
						aria-label="Remove"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			</div>

			{/* Children */}
			{isExpanded && hasChildren && (
				<div className="pl-4">
					{node.children.map((child, index) => (
						<TreeNode
							key={child.member.id}
							node={child}
							depth={depth + 1}
							maxDepth={maxDepth}
							onMemberClick={onMemberClick}
							onMemberAction={onMemberAction}
							expandedNodes={expandedNodes}
							onToggleExpand={onToggleExpand}
							selectedMemberId={selectedMemberId}
							isLastChild={index === node.children.length - 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default TeamTree;