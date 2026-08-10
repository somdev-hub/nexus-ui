"use client";

import { TeamMember, TeamMemberSummary, TeamRole } from "@/types";
import { UserCheck, UserCog, User, Users, Mail, Phone, MapPin, Settings, MoreVertical, Trash2, UserPlus, Edit2 } from "lucide-react";

interface TeamMemberCardProps {
    member: TeamMember | TeamMemberSummary;
    showActions?: boolean;
    onEdit?: (member: TeamMember) => void;
    onRemove?: (memberId: number) => void;
    onChangeManager?: (member: TeamMember) => void;
    onViewSubordinates?: (member: TeamMember) => void;
    compact?: boolean;
    showHierarchyLevel?: boolean;
}

function getRoleIcon(role: TeamRole, size: number = 16) {
    switch (role) {
        case "TEAM_LEAD":
            return <UserCheck className={`w-${size / 4} h-${size / 4} text-amber-500`} title="Team Lead" />;
        case "MANAGER":
            return <UserCog className={`w-${size / 4} h-${size / 4} text-blue-500`} title="Manager" />;
        case "EMPLOYEE":
            return <User className={`w-${size / 4} h-${size / 4} text-green-500`} title="Employee" />;
    }
}

function getRoleBadge(role: TeamRole, compact: boolean = false) {
    const styles = {
        TEAM_LEAD: "bg-amber-100 text-amber-800",
        MANAGER: "bg-blue-100 text-blue-800",
        EMPLOYEE: "bg-green-100 text-green-800",
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[role]} ${compact ? "text-[10px]" : ""}`}>
            {role.replace("_", " ")}
        </span>
    );
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function TeamMemberCard({
    member,
    showActions = true,
    onEdit,
    onRemove,
    onChangeManager,
    onViewSubordinates,
    compact = false,
    showHierarchyLevel = true,
}: TeamMemberCardProps) {
    const isFullMember = "subordinates" in member;
    const userName = "user" in member ? member.user.name : member.userName;
    const userEmail = "user" in member ? member.user.email : member.userEmail;
    const userId = "user" in member ? member.user.id : member.userId;
    const profilePhoto = "user" in member ? member.user.profilePhoto : undefined;

    const handleActionClick = (action: "edit" | "remove" | "change-manager" | "view-subordinates", e: React.MouseEvent) => {
        e.stopPropagation();
        // Only call callbacks if member is a full TeamMember (has subordinates property)
        const isFullMember = "subordinates" in member;
        const fullMember = isFullMember ? member : null;

        switch (action) {
            case "edit":
                if (fullMember) onEdit?.(fullMember);
                break;
            case "remove":
                onRemove?.(member.id);
                break;
            case "change-manager":
                if (fullMember) onChangeManager?.(fullMember);
                break;
            case "view-subordinates":
                if (fullMember) onViewSubordinates?.(fullMember);
                break;
        }
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="relative flex-shrink-0">
                    {profilePhoto ? (
                        <img
                            src={profilePhoto}
                            alt={userName}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                            {getInitials(userName)}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1">
                        {getRoleIcon(member.role, 12)}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{userName}</span>
                        {getRoleBadge(member.role, true)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="truncate">{userEmail}</span>
                        {showHierarchyLevel && member.hierarchyLevel !== undefined && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span>Level {member.hierarchyLevel}</span>
                            </>
                        )}
                    </div>
                </div>
                {showActions && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                onClick={(e) => handleActionClick("edit", e)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                title="Edit"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                        )}
                        {onChangeManager && (
                            <button
                                onClick={(e) => handleActionClick("change-manager", e)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                title="Change Manager"
                            >
                                <Users className="w-3 h-3" />
                            </button>
                        )}
                        {onRemove && (
                            <button
                                onClick={(e) => handleActionClick("remove", e)}
                                className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                                title="Remove"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    {profilePhoto ? (
                        <img
                            src={profilePhoto}
                            alt={userName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
                            {getInitials(userName)}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                        {getRoleIcon(member.role, 20)}
                    </div>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-900">{userName}</h3>
                            <p className="text-sm text-gray-500">{userEmail}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            {getRoleBadge(member.role)}
                            {showHierarchyLevel && member.hierarchyLevel !== undefined && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                    Level {member.hierarchyLevel}
                                </span>
                            )}
                        </div>
                    </div>

                    {member.teamPosition && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <Settings className="w-4 h-4 text-gray-400" />
                            <span>{member.teamPosition}</span>
                        </div>
                    )}

                    {isFullMember && member.subordinates.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{member.subordinates.length} direct report{member.subordinates.length !== 1 ? "s" : ""}</span>
                            {onViewSubordinates && (
                                <button
                                    onClick={(e) => handleActionClick("view-subordinates", e)}
                                    className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                    View all
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                onClick={(e) => handleActionClick("edit", e)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                title="Edit member"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        {onChangeManager && (
                            <button
                                onClick={(e) => handleActionClick("change-manager", e)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                title="Change manager"
                            >
                                <Users className="w-4 h-4" />
                            </button>
                        )}
                        {onViewSubordinates && isFullMember && member.subordinates.length > 0 && (
                            <button
                                onClick={(e) => handleActionClick("view-subordinates", e)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                title="View subordinates"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        )}
                        {onRemove && (
                            <button
                                onClick={(e) => handleActionClick("remove", e)}
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                                title="Remove member"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeamMemberCard;