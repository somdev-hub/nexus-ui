"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Team,
  TeamMember,
  TeamHierarchyResponse,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  ChangeManagerRequest,
} from "@/types";
import {
  createTeam,
  getTeam,
  getTeamsByDepartment,
  updateTeam,
  deleteTeam,
  addTeamMember,
  getTeamMembers,
  getTeamHierarchy,
  updateTeamMember,
  changeManager,
  removeTeamMember,
  getSubordinates,
  getUserManagedTeams,
  getTeamLead,
  getManagers,
} from "@/lib/auth-service";

interface UseTeamsState {
  teams: Team[];
  selectedTeam: Team | null;
  teamMembers: TeamMember[];
  hierarchy: TeamHierarchyResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseTeamsActions {
  // Team operations
  fetchTeamsByDepartment: (departmentId: number) => Promise<void>;
  fetchTeam: (teamId: number) => Promise<void>;
  createTeam: (request: CreateTeamRequest) => Promise<Team | null>;
  updateTeam: (
    teamId: number,
    request: UpdateTeamRequest,
  ) => Promise<Team | null>;
  deleteTeam: (teamId: number) => Promise<boolean>;
  selectTeam: (team: Team | null) => void;

  // Member operations
  fetchTeamMembers: (teamId: number) => Promise<void>;
  fetchTeamHierarchy: (teamId: number) => Promise<void>;
  addMember: (
    teamId: number,
    request: AddTeamMemberRequest,
  ) => Promise<TeamMember | null>;
  updateMember: (
    teamId: number,
    memberId: number,
    request: UpdateTeamMemberRequest,
  ) => Promise<TeamMember | null>;
  changeMemberManager: (
    teamId: number,
    memberId: number,
    request: ChangeManagerRequest,
  ) => Promise<TeamMember | null>;
  removeMember: (teamId: number, memberId: number) => Promise<boolean>;
  fetchSubordinates: (
    teamId: number,
    managerId: number,
  ) => Promise<TeamMember[]>;

  // Utility operations
  fetchUserManagedTeams: (userId: number) => Promise<Team[]>;
  fetchTeamLead: (teamId: number) => Promise<TeamMember | null>;
  fetchManagers: (teamId: number) => Promise<TeamMember[]>;

  // State management
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export function useTeams(): UseTeamsState & UseTeamsActions {
  const [state, setState] = useState<UseTeamsState>({
    teams: [],
    selectedTeam: null,
    teamMembers: [],
    hierarchy: null,
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  // Team operations
  const fetchTeamsByDepartment = useCallback(
    async (departmentId: number) => {
      setLoading(true);
      clearError();
      try {
        const teams = await getTeamsByDepartment(departmentId);
        setState((prev) => ({ ...prev, teams, loading: false }));
      } catch (error) {
        setError(`Failed to fetch teams: ${(error as Error).message}`);
      }
    },
    [setLoading, clearError, setError],
  );

  const fetchTeam = useCallback(
    async (teamId: number) => {
      setLoading(true);
      clearError();
      try {
        const team = await getTeam(teamId);
        setState((prev) => ({ ...prev, selectedTeam: team, loading: false }));
      } catch (error) {
        setError(`Failed to fetch team: ${(error as Error).message}`);
      }
    },
    [setLoading, clearError, setError],
  );

  const createTeamAction = useCallback(
    async (request: CreateTeamRequest): Promise<Team | null> => {
      setLoading(true);
      clearError();
      try {
        const team = await createTeam(request);
        setState((prev) => ({
          ...prev,
          teams: [...prev.teams, team],
          loading: false,
        }));
        return team;
      } catch (error) {
        setError(`Failed to create team: ${(error as Error).message}`);
        return null;
      }
    },
    [setLoading, clearError, setError],
  );

  const updateTeamAction = useCallback(
    async (
      teamId: number,
      request: UpdateTeamRequest,
    ): Promise<Team | null> => {
      setLoading(true);
      clearError();
      try {
        const team = await updateTeam(teamId, request);
        setState((prev) => ({
          ...prev,
          teams: prev.teams.map((t) => (t.teamId === teamId ? team : t)),
          selectedTeam:
            prev.selectedTeam?.teamId === teamId ? team : prev.selectedTeam,
          loading: false,
        }));
        return team;
      } catch (error) {
        setError(`Failed to update team: ${(error as Error).message}`);
        return null;
      }
    },
    [setLoading, clearError, setError],
  );

  const deleteTeamAction = useCallback(
    async (teamId: number): Promise<boolean> => {
      setLoading(true);
      clearError();
      try {
        await deleteTeam(teamId);
        setState((prev) => ({
          ...prev,
          teams: prev.teams.filter((t) => t.teamId !== teamId),
          selectedTeam:
            prev.selectedTeam?.teamId === teamId ? null : prev.selectedTeam,
          loading: false,
        }));
        return true;
      } catch (error) {
        setError(`Failed to delete team: ${(error as Error).message}`);
        return false;
      }
    },
    [setLoading, clearError, setError],
  );

  const selectTeam = useCallback((team: Team | null) => {
    setState((prev) => ({ ...prev, selectedTeam: team }));
  }, []);

  // Member operations
  const fetchTeamMembers = useCallback(
    async (teamId: number) => {
      setLoading(true);
      clearError();
      try {
        const members = await getTeamMembers(teamId);
        setState((prev) => ({ ...prev, teamMembers: members, loading: false }));
      } catch (error) {
        setError(`Failed to fetch team members: ${(error as Error).message}`);
      }
    },
    [setLoading, clearError, setError],
  );

  const fetchTeamHierarchy = useCallback(
    async (teamId: number) => {
      console.log(
        `[DEBUG useTeams] fetchTeamHierarchy called for teamId: ${teamId}`,
      );
      setLoading(true);
      clearError();
      try {
        const hierarchy = await getTeamHierarchy(teamId);
        console.log(`[DEBUG useTeams] fetchTeamHierarchy result:`, {
          teamId: hierarchy?.teamId,
          teamName: hierarchy?.teamName,
          root: hierarchy?.root
            ? {
                member: hierarchy.root.member,
                childrenCount: hierarchy.root.children?.length || 0,
              }
            : null,
        });
        setState((prev) => ({ ...prev, hierarchy, loading: false }));
      } catch (error) {
        console.error(`[DEBUG useTeams] fetchTeamHierarchy error:`, error);
        setError(`Failed to fetch team hierarchy: ${(error as Error).message}`);
      }
    },
    [setLoading, clearError, setError],
  );

  const addMember = useCallback(
    async (
      teamId: number,
      request: AddTeamMemberRequest,
    ): Promise<TeamMember | null> => {
      setLoading(true);
      clearError();
      try {
        const member = await addTeamMember(teamId, request);
        setState((prev) => ({
          ...prev,
          teamMembers: [...prev.teamMembers, member],
          loading: false,
        }));
        return member;
      } catch (error) {
        setError(`Failed to add team member: ${(error as Error).message}`);
        return null;
      }
    },
    [setLoading, clearError, setError],
  );

  const updateMember = useCallback(
    async (
      teamId: number,
      memberId: number,
      request: UpdateTeamMemberRequest,
    ): Promise<TeamMember | null> => {
      setLoading(true);
      clearError();
      try {
        const member = await updateTeamMember(memberId, request);
        setState((prev) => ({
          ...prev,
          teamMembers: prev.teamMembers.map((m) =>
            m.id === memberId ? member : m,
          ),
          loading: false,
        }));
        return member;
      } catch (error) {
        setError(`Failed to update team member: ${(error as Error).message}`);
        return null;
      }
    },
    [setLoading, clearError, setError],
  );

  const changeMemberManager = useCallback(
    async (
      teamId: number,
      memberId: number,
      request: ChangeManagerRequest,
    ): Promise<TeamMember | null> => {
      setLoading(true);
      clearError();
      try {
        const member = await changeManager(memberId, request);
        setState((prev) => ({
          ...prev,
          teamMembers: prev.teamMembers.map((m) =>
            m.id === memberId ? member : m,
          ),
          loading: false,
        }));
        return member;
      } catch (error) {
        setError(`Failed to change manager: ${(error as Error).message}`);
        return null;
      }
    },
    [setLoading, clearError, setError],
  );

  const removeMember = useCallback(
    async (teamId: number, memberId: number): Promise<boolean> => {
      setLoading(true);
      clearError();
      try {
        await removeTeamMember(memberId);
        setState((prev) => ({
          ...prev,
          teamMembers: prev.teamMembers.filter((m) => m.id !== memberId),
          loading: false,
        }));
        return true;
      } catch (error) {
        setError(`Failed to remove team member: ${(error as Error).message}`);
        return false;
      }
    },
    [setLoading, clearError, setError],
  );

  const fetchSubordinates = useCallback(
    async (teamId: number, managerId: number): Promise<TeamMember[]> => {
      try {
        return await getSubordinates(teamId, managerId);
      } catch (error) {
        setError(`Failed to fetch subordinates: ${(error as Error).message}`);
        return [];
      }
    },
    [setError],
  );

  // Utility operations
  const fetchUserManagedTeams = useCallback(
    async (userId: number): Promise<Team[]> => {
      try {
        return await getUserManagedTeams(userId);
      } catch (error) {
        setError(
          `Failed to fetch user managed teams: ${(error as Error).message}`,
        );
        return [];
      }
    },
    [setError],
  );

  const fetchTeamLead = useCallback(
    async (teamId: number): Promise<TeamMember | null> => {
      try {
        return await getTeamLead(teamId);
      } catch (error) {
        setError(`Failed to fetch team lead: ${(error as Error).message}`);
        return null;
      }
    },
    [setError],
  );

  const fetchManagers = useCallback(
    async (teamId: number): Promise<TeamMember[]> => {
      try {
        return await getManagers(teamId);
      } catch (error) {
        setError(`Failed to fetch managers: ${(error as Error).message}`);
        return [];
      }
    },
    [setError],
  );

  return {
    ...state,
    fetchTeamsByDepartment,
    fetchTeam,
    createTeam: createTeamAction,
    updateTeam: updateTeamAction,
    deleteTeam: deleteTeamAction,
    selectTeam,
    fetchTeamMembers,
    fetchTeamHierarchy,
    addMember,
    updateMember,
    changeMemberManager,
    removeMember,
    fetchSubordinates,
    fetchUserManagedTeams,
    fetchTeamLead,
    fetchManagers,
    clearError,
    setLoading,
  };
}
