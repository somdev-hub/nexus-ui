import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type {
    Partnership,
    PartnershipCreateRequest,
    PartnershipUpdateRequest,
    PartnershipStatusUpdateRequest,
    PartnershipAgreementResponse,
    PartnershipFilter,
    PartnershipPaginatedResponse,
} from '@/types/partnerships';

// ─────────────────────────────────────────────────────────────
// Partnerships API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = '/iam/core/retailer/partnerships';

export async function getPartnerships(
    filter: PartnershipFilter = {}
): Promise<PaginatedResponse<Partnership>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    });

    const query = params.toString();
    const url = query ? `${BASE_PATH}/all?${query}` : `${BASE_PATH}/all`;

    const response = await apiClient.get<PaginatedResponse<Partnership>>(url);
    return response.data;
}

export async function getPartnershipById(
    partnershipId: number
): Promise<Partnership> {
    const response = await apiClient.get<Partnership>(
        `${BASE_PATH}/${partnershipId}`
    );
    return response.data;
}

export async function createPartnership(
    data: PartnershipCreateRequest
): Promise<Partnership> {
    const response = await apiClient.post<Partnership>(
        `${BASE_PATH}/add`,
        data
    );
    return response.data;
}

export async function updatePartnership(
    partnershipId: number,
    data: PartnershipUpdateRequest
): Promise<Partnership> {
    // NOTE: PUT /{id} does not exist on the gateway; the update route is
    // PUT /{id}/update (previously this 404'd). Backend contract (Core
    // PartnershipDto) uses partnershipTerm/discountRate — translate here.
    const payload: Record<string, unknown> = {};
    if (data.termsAndConditions !== undefined)
        payload.partnershipTerm = data.termsAndConditions;
    if (data.description !== undefined && payload.partnershipTerm === undefined)
        payload.partnershipTerm = data.description;
    if (data.discountRate !== undefined)
        payload.discountRate = data.discountRate;
    if (data.startDate !== undefined) payload.startDate = data.startDate;
    if (data.endDate !== undefined) payload.endDate = data.endDate;
    const response = await apiClient.put<Partnership>(
        `${BASE_PATH}/${partnershipId}/update`,
        payload
    );
    return response.data;
}

export async function updatePartnershipStatus(
    partnershipId: number,
    data: PartnershipStatusUpdateRequest
): Promise<Partnership> {
    const response = await apiClient.post<Partnership>(
        `${BASE_PATH}/${partnershipId}/status`,
        data
    );
    return response.data;
}

export async function getActivePartnerships(): Promise<Partnership[]> {
    const response = await apiClient.get<Partnership[]>(`${BASE_PATH}/active`);
    return response.data;
}

export async function getPartnershipsByStatus(
    status: string
): Promise<Partnership[]> {
    const response = await apiClient.get<Partnership[]>(
        `${BASE_PATH}/status/${status}`
    );
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Agreement Document Management
// ─────────────────────────────────────────────────────────────

export async function uploadPartnershipAgreement(
    partnershipId: number,
    file: File
): Promise<PartnershipAgreementResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<PartnershipAgreementResponse>(
        `${BASE_PATH}/${partnershipId}/agreement`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return response.data;
}

export async function getPartnershipAgreement(
    partnershipId: number
): Promise<PartnershipAgreementResponse> {
    const response = await apiClient.get<PartnershipAgreementResponse>(
        `${BASE_PATH}/${partnershipId}/agreement`
    );
    return response.data;
}

export async function deletePartnershipAgreement(
    partnershipId: number
): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${partnershipId}/agreement`);
}
