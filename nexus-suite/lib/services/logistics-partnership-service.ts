import apiClient from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/paginated-response';
import type {
    LogisticsPartnershipQuotation,
    PrivateRouteRow,
    QuotationRouteLine,
} from '@/lib/services/supplier-logistics-service';

// ─────────────────────────────────────────────────────────────
// Logistics side: raise counter-quotations on long-term proposals,
// maintain private partnership routes, activate & terminate.
// Backend: Core LogisticsPartnershipController via IAM.
// ─────────────────────────────────────────────────────────────

const BASE = '/iam/core/logistics/partnerships';

function toQuery(params: Record<string, unknown> = {}): string {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const q = p.toString();
    return q ? `?${q}` : '';
}

export interface QuotationCreateRequest {
    invitationId: number;
    routeLines: QuotationRouteLine[];
    totalAmount?: number;
    currency?: string;
    validityStart?: string;
    validityEnd?: string;
    terms?: string;
}

export async function createPartnershipQuotation(
    data: QuotationCreateRequest
): Promise<LogisticsPartnershipQuotation> {
    const { routeLines, ...rest } = data;
    const res = await apiClient.post<LogisticsPartnershipQuotation>(
        `${BASE}/quotations`,
        { ...rest, routeLinesJson: JSON.stringify(routeLines) }
    );
    return res.data;
}

export async function getPartnershipQuotations(
    status?: string
): Promise<PaginatedResponse<LogisticsPartnershipQuotation>> {
    const res = await apiClient.get<
        PaginatedResponse<LogisticsPartnershipQuotation>
    >(`${BASE}/quotations${toQuery({ status, page: 0, size: 50 })}`);
    return res.data;
}

export async function getPartnershipRoutes(
    partnershipId: number
): Promise<PaginatedResponse<PrivateRouteRow>> {
    const res = await apiClient.get<PaginatedResponse<PrivateRouteRow>>(
        `${BASE}/${partnershipId}/routes?page=0&size=100`
    );
    return res.data;
}

export async function activateLogisticsPartnership(
    partnershipId: number
): Promise<{ status?: string; routesAdded?: number; [key: string]: unknown }> {
    const res = await apiClient.post(`${BASE}/${partnershipId}/activate`, {});
    return res.data;
}

export async function terminateLogisticsPartnership(
    partnershipId: number
): Promise<{
    status?: string;
    releasedShipments?: string[];
    [key: string]: unknown;
}> {
    const res = await apiClient.post(`${BASE}/${partnershipId}/terminate`, {});
    return res.data;
}
