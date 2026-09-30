import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type {
    PartnershipInvitation,
    PartnershipInvitationCreateRequest,
    PartnershipInvitationFilter,
    PartnershipInvitationRespondRequest,
} from '@/types/partnership-invitations';

// ─────────────────────────────────────────────────────────────
// Partnership Invitations API Service
// Mirrors lib/services/partnerships-service.ts style.
// Role prefixes: retailer | supplier | logistics
// ─────────────────────────────────────────────────────────────

export type InvitationRole = 'retailer' | 'supplier' | 'logistics';

function basePath(role: InvitationRole): string {
    return `/iam/core/${role}/partnership-invitations`;
}

function buildQuery(filter: PartnershipInvitationFilter = {}): string {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    });
    const query = params.toString();
    return query ? `?${query}` : '';
}

async function getInvitationList(
    role: InvitationRole,
    box: 'received' | 'pending' | 'sent',
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    const response = await apiClient.get<
        PaginatedResponse<PartnershipInvitation>
    >(`${basePath(role)}/${box}${buildQuery(filter)}`);
    return response.data;
}

async function createInvitation(
    role: InvitationRole,
    data: PartnershipInvitationCreateRequest
): Promise<PartnershipInvitation> {
    // Backend contract (Core PartnershipInvitationDto) uses `invitedOrg`;
    // the UI type uses `invitedOrgId`. Translate at the boundary.
    const { invitedOrgId, ...rest } = data;
    const response = await apiClient.post<PartnershipInvitation>(
        `${basePath(role)}/create`,
        { ...rest, invitedOrg: invitedOrgId }
    );
    return response.data;
}

async function respondToInvitation(
    role: InvitationRole,
    invitationId: number,
    data: PartnershipInvitationRespondRequest
): Promise<PartnershipInvitation> {
    // Backend reads `status` (ACCEPTED/REJECTED); UI uses `action`.
    const status = data.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    const response = await apiClient.put<PartnershipInvitation>(
        `${basePath(role)}/${invitationId}/respond`,
        { status }
    );
    return response.data;
}

async function withdrawInvitation(
    role: InvitationRole,
    invitationId: number
): Promise<PartnershipInvitation> {
    const response = await apiClient.put<PartnershipInvitation>(
        `${basePath(role)}/${invitationId}/withdraw`
    );
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Retailer
// ─────────────────────────────────────────────────────────────

export async function createRetailerInvitation(
    data: PartnershipInvitationCreateRequest
): Promise<PartnershipInvitation> {
    return createInvitation('retailer', data);
}

export async function getRetailerReceivedInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('retailer', 'received', filter);
}

export async function getRetailerPendingInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('retailer', 'pending', filter);
}

export async function getRetailerSentInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('retailer', 'sent', filter);
}

export async function respondToRetailerInvitation(
    invitationId: number,
    data: PartnershipInvitationRespondRequest
): Promise<PartnershipInvitation> {
    return respondToInvitation('retailer', invitationId, data);
}

export async function withdrawRetailerInvitation(
    invitationId: number
): Promise<PartnershipInvitation> {
    return withdrawInvitation('retailer', invitationId);
}

// ─────────────────────────────────────────────────────────────
// Supplier
// ─────────────────────────────────────────────────────────────

export async function createSupplierInvitation(
    data: PartnershipInvitationCreateRequest
): Promise<PartnershipInvitation> {
    return createInvitation('supplier', data);
}

export async function getSupplierReceivedInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('supplier', 'received', filter);
}

export async function getSupplierPendingInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('supplier', 'pending', filter);
}

export async function getSupplierSentInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('supplier', 'sent', filter);
}

export async function respondToSupplierInvitation(
    invitationId: number,
    data: PartnershipInvitationRespondRequest
): Promise<PartnershipInvitation> {
    return respondToInvitation('supplier', invitationId, data);
}

export async function withdrawSupplierInvitation(
    invitationId: number
): Promise<PartnershipInvitation> {
    return withdrawInvitation('supplier', invitationId);
}

// ─────────────────────────────────────────────────────────────
// Logistics
// ─────────────────────────────────────────────────────────────

export async function createLogisticsInvitation(
    data: PartnershipInvitationCreateRequest
): Promise<PartnershipInvitation> {
    return createInvitation('logistics', data);
}

export async function getLogisticsReceivedInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('logistics', 'received', filter);
}

export async function getLogisticsPendingInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('logistics', 'pending', filter);
}

export async function getLogisticsSentInvitations(
    filter: PartnershipInvitationFilter = {}
): Promise<PaginatedResponse<PartnershipInvitation>> {
    return getInvitationList('logistics', 'sent', filter);
}

export async function respondToLogisticsInvitation(
    invitationId: number,
    data: PartnershipInvitationRespondRequest
): Promise<PartnershipInvitation> {
    return respondToInvitation('logistics', invitationId, data);
}

export async function withdrawLogisticsInvitation(
    invitationId: number
): Promise<PartnershipInvitation> {
    return withdrawInvitation('logistics', invitationId);
}
