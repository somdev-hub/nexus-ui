// ============================================================================
// TEAM MANAGEMENT TYPES
// ============================================================================

export type TeamRole = "TEAM_LEAD" | "MANAGER" | "EMPLOYEE";

export interface Team {
  teamId: number;
  teamName: string;
  description: string;
  departmentId: number;
  departmentName: string;
  teamLead: TeamMemberSummary;
  memberCount: number;
  parentTeamId?: number;
  parentTeamName?: string;
  subTeams?: TeamSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamSummary {
  teamId: number;
  teamName: string;
  memberCount: number;
}

export interface TeamMember {
  id: number;
  teamId: number;
  user: UserSummary;
  manager?: TeamMemberSummary;
  subordinates: TeamMemberSummary[];
  role: TeamRole;
  hierarchyLevel: number;
  teamPosition: string;
  assignedAt: string;
  isActive: boolean;
}

export interface TeamMemberSummary {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: TeamRole;
  hierarchyLevel: number;
  teamPosition: string;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  profilePhoto?: string;
}

export interface TeamHierarchyNode {
  member: TeamMemberSummary;
  children: TeamHierarchyNode[];
}

export interface TeamHierarchyResponse {
  teamId: number;
  teamName: string;
  root: TeamHierarchyNode;
}

// Request Types
export interface CreateTeamRequest {
  teamName: string;
  description: string;
  departmentId: number;
  teamLeadId: number;
  parentTeamId?: number;
}

export interface UpdateTeamRequest {
  teamName: string;
  description: string;
  teamLeadId?: number;
  parentTeamId?: number;
}

export interface AddTeamMemberRequest {
  userId: number;
  managerId?: number;
  teamPosition: string;
  role: TeamRole;
}

export interface UpdateTeamMemberRequest {
  teamPosition?: string;
  role?: TeamRole;
}

export interface ChangeManagerRequest {
  newManagerId?: number;
}

// API Response Types
export interface TeamResponse {
  teamId: number;
  teamName: string;
  description: string;
  departmentId: number;
  departmentName: string;
  teamLead: TeamMemberSummary;
  memberCount: number;
  parentTeamId?: number;
  parentTeamName?: string;
  subTeams?: TeamSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberResponse {
  id: number;
  teamId: number;
  user: UserSummary;
  manager?: TeamMemberSummary;
  subordinates: TeamMemberSummary[];
  role: TeamRole;
  hierarchyLevel: number;
  teamPosition: string;
  assignedAt: string;
  isActive: boolean;
}
