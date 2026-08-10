"use client";

import { useState, useEffect, useCallback } from "react";
import { Team, CreateTeamRequest, UpdateTeamRequest, ApiDepartment } from "@/types";
import { X, Loader2 } from "lucide-react";
import { getEligibleLeads, getAllTeamsByDepartment } from "@/lib/auth-service";

interface TeamFormProps {
    initialData?: Team | null;
    departments: ApiDepartment[];
    onSubmit: (data: CreateTeamRequest | UpdateTeamRequest) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
    /** If true, renders the modal wrapper (for standalone use). If false, renders just the form content (for use inside Radix Dialog). */
    renderModal?: boolean;
}

interface TeamFormContentProps {
    isEditing: boolean;
    formData: CreateTeamRequest;
    errors: Record<string, string>;
    departments: ApiDepartment[];
    teamLeads: Array<{ id: number; name: string; email: string }>;
    parentTeams: Array<{ teamId: number; teamName: string }>;
    loadingLeads: boolean;
    loadingParentTeams: boolean;
    isLoading: boolean;
    onClose: () => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    initialData?: Team | null;
}

function TeamFormContent({
    isEditing,
    formData,
    errors,
    departments,
    teamLeads,
    parentTeams,
    loadingLeads,
    loadingParentTeams,
    isLoading,
    onClose,
    handleSubmit,
    handleChange,
    initialData,
}: TeamFormContentProps) {
    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                    {isEditing ? "Edit Team" : "Create New Team"}
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
                {/* Team Name */}
                <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="teamName"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.teamName ? "border-red-500" : "border-gray-300"
                            }`}
                        placeholder="Enter team name"
                        disabled={isLoading}
                    />
                    {errors.teamName && (
                        <p className="mt-1 text-sm text-red-500">{errors.teamName}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? "border-red-500" : "border-gray-300"
                            }`}
                        placeholder="Enter team description"
                        disabled={isLoading}
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                    )}
                </div>

                {/* Department - only show for create, not edit */}
                {!isEditing && (
                    <div>
                        <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                            Department <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="departmentId"
                            name="departmentId"
                            value={formData.departmentId || ""}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.departmentId ? "border-red-500" : "border-gray-300"
                                }`}
                            disabled={isLoading}
                        >
                            <option value="">Select department</option>
                            {departments.map((dept) => (
                                <option key={dept.deptId} value={dept.deptId}>
                                    {dept.deptName}
                                </option>
                            ))}
                        </select>
                        {errors.departmentId && (
                            <p className="mt-1 text-sm text-red-500">{errors.departmentId}</p>
                        )}
                    </div>
                )}

                {isEditing && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Department
                        </label>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-900">
                                {departments.find(d => d.deptId === initialData?.departmentId)?.deptName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Department cannot be changed after creation</p>
                        </div>
                    </div>
                )}

                {/* Team Lead */}
                <div>
                    <label htmlFor="teamLeadId" className="block text-sm font-medium text-gray-700 mb-1">
                        Team Lead <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="teamLeadId"
                        name="teamLeadId"
                        value={formData.teamLeadId || ""}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.teamLeadId ? "border-red-500" : "border-gray-300"
                            }`}
                        disabled={isLoading || loadingLeads}
                    >
                        <option value="">Select team lead</option>
                        {loadingLeads ? (
                            <option value="" disabled>
                                Loading...
                            </option>
                        ) : (
                            teamLeads.map((lead) => (
                                <option key={lead.id} value={lead.id}>
                                    {lead.name} ({lead.email})
                                </option>
                            ))
                        )}
                    </select>
                    {errors.teamLeadId && (
                        <p className="mt-1 text-sm text-red-500">{errors.teamLeadId}</p>
                    )}
                    {teamLeads.length === 0 && formData.departmentId && !loadingLeads && (
                        <p className="mt-1 text-sm text-amber-600">
                            No eligible team leads found in this department
                        </p>
                    )}
                </div>

                {/* Parent Team (for sub-teams) */}
                <div>
                    <label htmlFor="parentTeamId" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Team (Optional)
                    </label>
                    <select
                        id="parentTeamId"
                        name="parentTeamId"
                        value={formData.parentTeamId || ""}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.parentTeamId ? "border-red-500" : "border-gray-300"
                            }`}
                        disabled={isLoading || loadingParentTeams}
                    >
                        <option value="">No parent team (top-level team)</option>
                        {loadingParentTeams ? (
                            <option value="" disabled>
                                Loading...
                            </option>
                        ) : (
                            parentTeams.map((team) => (
                                <option key={team.teamId} value={team.teamId}>
                                    {team.teamName}
                                </option>
                            ))
                        )}
                    </select>
                    {errors.parentTeamId && (
                        <p className="mt-1 text-sm text-red-500">{errors.parentTeamId}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                        Select a parent team to create a sub-team hierarchy
                    </p>
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
                        {isEditing ? "Update Team" : "Create Team"}
                    </button>
                </div>
            </form>
        </>
    );
}

export function TeamForm({
    initialData,
    departments,
    onSubmit,
    onClose,
    isLoading = false,
    renderModal = true,
}: TeamFormProps) {
    const isEditing = !!initialData;

    // Use separate form state for create vs update
    const [formData, setFormData] = useState<CreateTeamRequest>({
        teamName: "",
        description: "",
        departmentId: 0,
        teamLeadId: 0,
        parentTeamId: undefined,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [teamLeads, setTeamLeads] = useState<Array<{ id: number; name: string; email: string }>>([]);
    const [parentTeams, setParentTeams] = useState<Array<{ teamId: number; teamName: string }>>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [loadingParentTeams, setLoadingParentTeams] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                teamName: initialData.teamName,
                description: initialData.description || "",
                departmentId: initialData.departmentId,
                teamLeadId: initialData.teamLead?.userId || 0,
                parentTeamId: initialData.parentTeamId,
            });
        }
    }, [initialData]);

    const fetchParentTeams = useCallback(async (deptId: number) => {
        setLoadingParentTeams(true);
        try {
            const data = await getAllTeamsByDepartment(deptId);
            // Filter out current team if editing
            const filtered = isEditing
                ? data.filter((t: { teamId: number }) => t.teamId !== initialData?.teamId)
                : data;
            setParentTeams(filtered);
        } catch (error) {
            console.error("Failed to fetch parent teams:", error);
        } finally {
            setLoadingParentTeams(false);
        }
    }, [initialData?.teamId, isEditing]);

    const fetchTeamLeads = useCallback(async (deptId: number) => {
        setLoadingLeads(true);
        try {
            const data = await getEligibleLeads(deptId);
            setTeamLeads(data);
        } catch (error) {
            console.error("Failed to fetch team leads:", error);
        } finally {
            setLoadingLeads(false);
        }
    }, []);
    useEffect(() => {
        if (formData.departmentId) {
            fetchTeamLeads(formData.departmentId);
            fetchParentTeams(formData.departmentId);
        } else {
            setTeamLeads([]);
            setParentTeams([]);
        }
    }, [fetchParentTeams, fetchTeamLeads, formData.departmentId]);



    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.teamName.trim()) {
            newErrors.teamName = "Team name is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!isEditing && !formData.departmentId) {
            newErrors.departmentId = "Department is required";
        }

        if (!formData.teamLeadId) {
            newErrors.teamLeadId = "Team lead is required";
        }

        if (isEditing && formData.parentTeamId === initialData?.teamId) {
            newErrors.parentTeamId = "A team cannot be its own parent";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            // Prepare the correct request type based on create vs edit
            const submitData = isEditing
                ? {
                    teamName: formData.teamName,
                    description: formData.description,
                    teamLeadId: formData.teamLeadId,
                    parentTeamId: formData.parentTeamId,
                } as UpdateTeamRequest
                : formData;

            await onSubmit(submitData);
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
            [name]: name === "departmentId" || name === "teamLeadId" || name === "parentTeamId"
                ? parseInt(value) || undefined
                : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    if (renderModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <TeamFormContent
                        isEditing={isEditing}
                        formData={formData}
                        errors={errors}
                        departments={departments}
                        teamLeads={teamLeads}
                        parentTeams={parentTeams}
                        loadingLeads={loadingLeads}
                        loadingParentTeams={loadingParentTeams}
                        isLoading={isLoading}
                        onClose={onClose}
                        handleSubmit={handleSubmit}
                        handleChange={handleChange}
                        initialData={initialData}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <TeamFormContent
                isEditing={isEditing}
                formData={formData}
                errors={errors}
                departments={departments}
                teamLeads={teamLeads}
                parentTeams={parentTeams}
                loadingLeads={loadingLeads}
                loadingParentTeams={loadingParentTeams}
                isLoading={isLoading}
                onClose={onClose}
                handleSubmit={handleSubmit}
                handleChange={handleChange}
                initialData={initialData}
            />
        </div>
    );
}

export default TeamForm;