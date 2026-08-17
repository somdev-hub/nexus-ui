"use client";

import React, { useMemo, useCallback } from "react";
import {
	ReactFlow,
	Node,
	Edge,
	addEdge,
	Connection,
	NodeTypes,
	EdgeTypes,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	Handle,
	Position,
	MarkerType,
	ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { TeamHierarchyNode, TeamMemberSummary, TeamRole } from "@/types";
import { UserCheck, UserCog, User, Users, ChevronDown, ChevronRight } from "lucide-react";

interface TeamHierarchyCanvasProps {
	root: TeamHierarchyNode;
	onMemberClick?: (member: TeamMemberSummary) => void;
	onMemberAction?: (member: TeamMemberSummary, action: "edit" | "remove" | "change-manager") => void;
	selectedMemberId?: number;
	className?: string;
}

interface CustomNodeData {
	member: TeamMemberSummary;
	onClick?: () => void;
	onAction?: (member: TeamMemberSummary, action: "edit" | "remove" | "change-manager") => void;
	isSelected?: boolean;
	hasChildren?: boolean;
	isExpanded?: boolean;
	onToggleExpand?: () => void;
}

const initialNodes: Node<CustomNodeData>[] = [];
const initialEdges: Edge[] = [];

function TeamNode({ data }: { data: CustomNodeData }) {
	const { member, onClick, onAction, isSelected, hasChildren, isExpanded, onToggleExpand } = data;

	console.log(`[DEBUG TeamNode] Rendering: ${member.userName} (id: ${member.id}), isSelected: ${isSelected}, hasChildren: ${hasChildren}, isExpanded: ${isExpanded}`);

	const getRoleIcon = (role: TeamRole) => {
		switch (role) {
			case "TEAM_LEAD":
				return <UserCheck className="w-4 h-4 text-amber-500" aria-label="Team Lead" />;
			case "MANAGER":
				return <UserCog className="w-4 h-4 text-blue-500" aria-label="Manager" />;
			case "EMPLOYEE":
				return <User className="w-4 h-4 text-green-500" aria-label="Employee" />;
		}
	};

	const getRoleBadge = (role: TeamRole) => {
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
	};

	return (
		<div
			className={`group flex flex-col items-center p-3 rounded-lg border-2 transition-all ${isSelected
				? "border-blue-500 bg-blue-50 shadow-lg"
				: "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
				}`}
			onClick={onClick}
			style={{ minWidth: "200px", maxWidth: "240px" }}
		>
			{/* Expand/Collapse Button */}
			{hasChildren && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onToggleExpand?.();
					}}
					className="absolute -top-2 -right-2 p-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors z-10"
					aria-label={isExpanded ? "Collapse" : "Expand"}
				>
					{isExpanded ? (
						<ChevronDown className="w-4 h-4 text-gray-500" />
					) : (
						<ChevronRight className="w-4 h-4 text-gray-500" />
					)}
				</button>
			)}

			{/* Role Icon */}
			<div className="mb-2">{getRoleIcon(member.role)}</div>

			{/* Member Info */}
			<div className="text-center w-full">
				<div className="flex items-center justify-center gap-2 mb-1">
					<span className="font-medium text-gray-900 truncate">{member.userName}</span>
					{getRoleBadge(member.role)}
				</div>
				<div className="flex items-center justify-center gap-2 text-sm text-gray-500">
					<span className="truncate max-w-[150px]">{member.userEmail}</span>
					{member.teamPosition && (
						<>
							<span className="text-gray-300">•</span>
							<span className="truncate max-w-[100px]">{member.teamPosition}</span>
						</>
					)}
				</div>
			</div>

			{/* Actions - visible on hover */}
			<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
				<button
					onClick={(e) => {
						e.stopPropagation();
						onAction?.(member, "edit");
					}}
					className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
					aria-label="Edit"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onAction?.(member, "change-manager");
					}}
					className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
					aria-label="Change Manager"
				>
					<Users className="w-4 h-4" />
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onAction?.(member, "remove");
					}}
					className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
					aria-label="Remove"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			</div>

			{/* Connection handles */}
			<Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-300 border-2 border-white" />
			<Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-300 border-2 border-white" />
		</div>
	);
}

const nodeTypes: NodeTypes = {
	teamNode: TeamNode,
};

const edgeTypes: EdgeTypes = {
	// Custom edge type if needed
};

function buildNodesAndEdges(
	node: TeamHierarchyNode,
	expandedNodes: Set<number>,
	onMemberClick?: (member: TeamMemberSummary) => void,
	onMemberAction?: (member: TeamMemberSummary, action: "edit" | "remove" | "change-manager") => void,
	selectedMemberId?: number,
	parentId?: string,
	xPos = 0,
	yPos = 50,
	depth = 0
): { nodes: Node<CustomNodeData>[]; edges: Edge[] } {
	const nodes: Node<CustomNodeData>[] = [];
	const edges: Edge[] = [];
	const nodeId = `node-${node.member.id}`;
	const isExpanded = expandedNodes.has(node.member.id);
	const hasChildren = node.children.length > 0;

	console.log(`[DEBUG buildNodesAndEdges] Node: ${node.member.userName} (id: ${node.member.id}), depth: ${depth}, isExpanded: ${isExpanded}, hasChildren: ${hasChildren}, childrenCount: ${node.children.length}, position: (${xPos}, ${yPos}), expandedNodes: ${Array.from(expandedNodes).join(',')}`);

	// Use absolute positions passed in
	const x = xPos;
	const y = yPos;

	nodes.push({
		id: nodeId,
		type: "teamNode",
		position: { x, y },
		data: {
			member: node.member,
			onClick: () => onMemberClick?.(node.member),
			onAction: onMemberAction,
			isSelected: selectedMemberId === node.member.id,
			hasChildren,
			isExpanded,
			onToggleExpand: () => { }, // Will be set by parent
		},
	});

	if (parentId) {
		edges.push({
			id: `edge-${parentId}-${nodeId}`,
			source: parentId,
			target: nodeId,
			type: "smoothstep",
			animated: true,
			style: { stroke: "#9ca3af", strokeWidth: 2 },
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: "#9ca3af",
			},
		});
	}

	if (isExpanded && hasChildren) {
		console.log(`[DEBUG buildNodesAndEdges] Processing ${node.children.length} children for ${node.member.userName}`);
		const childrenCount = node.children.length;
		const horizontalSpacing = 280;
		const verticalSpacing = 160;
		const startX = x - ((childrenCount - 1) * horizontalSpacing) / 2;
		const childY = y + verticalSpacing; // Children should be below parent

		node.children.forEach((child, index) => {
			const childX = startX + index * horizontalSpacing;
			console.log(`[DEBUG buildNodesAndEdges] Child ${index}: ${child.member.userName} will be at (${childX}, ${childY})`);
			const result = buildNodesAndEdges(
				child,
				expandedNodes,
				onMemberClick,
				onMemberAction,
				selectedMemberId,
				nodeId,
				childX,
				childY, // Pass the correct absolute Y position for children
				depth + 1
			);
			nodes.push(...result.nodes);
			edges.push(...result.edges);
		});
	} else if (hasChildren && !isExpanded) {
		console.log(`[DEBUG buildNodesAndEdges] Node ${node.member.userName} has children but is NOT expanded`);
	}

	return { nodes, edges };
}

export function TeamHierarchyCanvas({
	root,
	onMemberClick,
	onMemberAction,
	selectedMemberId,
	className = "",
}: TeamHierarchyCanvasProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [expandedNodes, setExpandedNodes] = React.useState<Set<number>>(new Set([root.member.id])); // Root expanded by default
	const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
	const reactFlowInstance = React.useRef<ReactFlowInstance | null>(null);
	const isMounted = React.useRef(false);

	console.log(`[DEBUG TeamHierarchyCanvas] Root: ${root.member.userName} (id: ${root.member.id}), children: ${root.children.length}`);
	console.log(`[DEBUG TeamHierarchyCanvas] Expanded nodes: ${Array.from(expandedNodes).join(',')}`);

	const handleToggleExpand = useCallback((memberId: number) => {
		setExpandedNodes((prev) => {
			const next = new Set(prev);
			if (next.has(memberId)) {
				next.delete(memberId);
			} else {
				next.add(memberId);
			}
			console.log(`[DEBUG TeamHierarchyCanvas] Toggled expand for member: ${memberId}, New expanded set: ${Array.from(next).join(',')}`);
			return next;
		});
	}, []);

	const { nodes: computedNodes, edges: computedEdges } = useMemo(() => {
		console.log(`[DEBUG TeamHierarchyCanvas] useMemo triggered, expandedNodes: ${Array.from(expandedNodes).join(',')}`);
		// Start root node at a reasonable position (will be centered later)
		const initialX = 500; // Start near center
		const result = buildNodesAndEdges(
			root,
			expandedNodes,
			onMemberClick,
			onMemberAction,
			selectedMemberId,
			undefined, // parentId
			initialX, // xPos - start near center
			50, // yPos - start a bit lower for better visibility
			0 // depth
		);
		console.log(`[DEBUG TeamHierarchyCanvas] buildNodesAndEdges returned ${result.nodes.length} nodes and ${result.edges.length} edges`);
		// Update the onToggleExpand in node data
		const updatedNodes = result.nodes.map((node) => ({
			...node,
			data: {
				...node.data,
				onToggleExpand: () => handleToggleExpand(node.data.member.id),
			},
		}));

		// Center the root node horizontally if it's the only node or first render
		const rootNode = updatedNodes.find(n => n.id === `node-${root.member.id}`);
		if (rootNode && updatedNodes.length > 0) {
			// Calculate center offset based on container width (approximate)
			const containerWidth = 1200; // approximate container width
			const nodeWidth = 220; // approximate node width
			const centerX = (containerWidth - nodeWidth) / 2;
			const currentX = rootNode.position.x;
			const offsetX = centerX - currentX;

			// Apply offset to all nodes to center the tree
			updatedNodes.forEach(node => {
				node.position = {
					x: node.position.x + offsetX,
					y: node.position.y
				};
			});
		}

		console.log(`[DEBUG TeamHierarchyCanvas] Final computed nodes: ${updatedNodes.map(n => `${n.data.member.userName}@(${n.position.x},${n.position.y})`).join(', ')}`);
		return { nodes: updatedNodes, edges: result.edges };
	}, [root, expandedNodes, onMemberClick, onMemberAction, selectedMemberId, handleToggleExpand]);

	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((eds) => addEdge(connection, eds));
		},
		[setEdges]
	);

	const handleInit = useCallback((instance: ReactFlowInstance) => {
		reactFlowInstance.current = instance;
		isMounted.current = true;
		console.log(`[DEBUG TeamHierarchyCanvas] ReactFlow initialized, nodes: ${computedNodes.length}`);
		// Initial fitView after mount - use a timeout to ensure nodes are rendered
		setTimeout(() => {
			if (computedNodes.length > 0 && reactFlowInstance.current) {
				reactFlowInstance.current.fitView({ padding: 0.4, duration: 500, minZoom: 0.1, maxZoom: 0.85 });
			}
		}, 100);
	}, [computedNodes.length]);

	// Fit view when nodes/edges change (e.g., expand/collapse)
	React.useEffect(() => {
		if (isMounted.current && reactFlowInstance.current && computedNodes.length > 0) {
			reactFlowInstance.current.fitView({ padding: 0.4, duration: 300, minZoom: 0.1, maxZoom: 0.85 });
		}
	}, [computedNodes, computedEdges]);

	// Center on selected member when selectedMemberId changes
	React.useEffect(() => {
		if (isMounted.current && reactFlowInstance.current && selectedMemberId !== undefined) {
			const selectedNode = computedNodes.find(n => n.id === `node-${selectedMemberId}`);
			if (selectedNode) {
				reactFlowInstance.current.setCenter(selectedNode.position.x, selectedNode.position.y, { duration: 500 });
				// Also ensure the node is visible by expanding its ancestors
				// This would require traversing up the tree, but for now just center on it
			}
		}
	}, [selectedMemberId, computedNodes]);

	return (
		<div
			ref={reactFlowWrapper}
			className={`w-full h-[600px] rounded-lg border border-gray-200 bg-gray-50 ${className}`}
			style={{
				width: "100%",
				height: "600px",
			}}
		>
			<ReactFlow
				onInit={handleInit}
				nodes={computedNodes}
				edges={computedEdges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView={true}
				fitViewOptions={{ padding: 0.4, minZoom: 0.1, maxZoom: 0.85 }}
				minZoom={0.1}
				maxZoom={1.5}
				attributionPosition="bottom-right"
				proOptions={{ hideAttribution: true }}
				defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
			>
				<Background
					color="#d1d5db"
					gap={16}
					size={1}
				/>
				<Controls />
				<MiniMap
					nodeColor={(node) => (node.data.isSelected ? "#3b82f6" : "#6b7280")}
					maskColor="rgba(255, 255, 255, 0.8)"
				/>
			</ReactFlow>
		</div>
	);
}