import apiClient from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/paginated-response';
import type { PartnershipInvitationCreateRequest } from '@/types/partnership-invitations';

// ─────────────────────────────────────────────────────────────
// Supplier-owned delivery: logistics marketplace + shipment handover.
//
// Backend: Core SupplierLogisticsMarketplaceController via IAM
// (/iam/core/supplier/logistics-marketplace/...).
// - Marketplace rows are routing capacities published by logistics orgs
//   (lane + period + availability).
// - Proposals are SUPPLIER_LOGISTICS invitations, SHORT_TERM (validity must
//   sit inside the linked routing-capacity period) or LONG_TERM (logistics
//   may extend its routing-capacity period for the partner).
// - Handover books a prepared (DRAFT) supplier shipment with a partnered
//   logistics org (DRAFT -> BOOKED).
// ─────────────────────────────────────────────────────────────

const BASE = '/iam/core/supplier/logistics-marketplace';

export interface LogisticsCapacityRow {
    forecastId: number;
    logisticsOrgId?: number;
    logisticsOrgName?: string | null;
    originLane?: string;
    destinationLane?: string;
    equipmentType?: string;
    periodStart?: string;
    periodEnd?: string;
    availableCapacity?: number;
    bookedCapacity?: number;
    capacityUnit?: string;
    unitLength?: number;
    unitWidth?: number;
    unitHeight?: number;
    dimensionUom?: string;
    unitVolume?: number;
    volumeUom?: string;
    notes?: string;
    [key: string]: unknown;
}

export interface SupplierLogisticsPartnership {
    partnershipId: number;
    primaryOrgId?: number;
    secondaryOrgId?: number;
    primaryOrgName?: string;
    secondaryOrgName?: string;
    partnershipType?: string;
    partnershipTerm?: string;
    partnershipTermType?: string;
    validityStart?: string;
    validityEnd?: string;
    linkedCapacityForecastId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: unknown;
}

export interface SupplierShipment {
    shipmentId: number;
    shipmentNumber?: string;
    status?: string;
    logisticsOrg?: { accountId?: number; name?: string };
    partnership?: { partnershipId?: number };
    purchaseOrder?: { purchaseOrderId?: number; poNumber?: string };
    pickupLocation?: string;
    deliveryLocation?: string;
    trackingNumber?: string;
    [key: string]: unknown;
}

export interface HandoverRequest {
    logisticsOrgId?: number;
    partnershipId?: number;
    pickupLocation?: string;
    deliveryLocation?: string;
    pickupDate?: string;
    deliveryDate?: string;
    notes?: string;
}

export interface HandoverResponse {
    shipmentId: number;
    shipmentNumber?: string;
    status?: string;
    logisticsOrgId?: number;
    partnershipId?: number;
    [key: string]: unknown;
}

function toQuery(params: Record<string, unknown> = {}): string {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const q = p.toString();
    return q ? `?${q}` : '';
}

export async function getAvailableLogisticsCapacities(
    filter: { search?: string; pageNo?: number; pageOffset?: number } = {}
): Promise<PaginatedResponse<LogisticsCapacityRow>> {
    const res = await apiClient.get<PaginatedResponse<LogisticsCapacityRow>>(
        `${BASE}/available${toQuery({ search: filter.search, page: filter.pageNo ?? 0, size: filter.pageOffset ?? 20 })}`
    );
    return res.data;
}

export async function getSupplierLogisticsPartnerships(): Promise<
    PaginatedResponse<SupplierLogisticsPartnership>
> {
    const res = await apiClient.get<
        PaginatedResponse<SupplierLogisticsPartnership>
    >(`${BASE}/partnerships?page=0&size=50`);
    return res.data;
}

export async function createLogisticsProposal(
    data: PartnershipInvitationCreateRequest
): Promise<unknown> {
    const { invitedOrgId, ...rest } = data;
    const res = await apiClient.post(
        `${BASE}/proposals`,
        { ...rest, invitedOrg: invitedOrgId, partnershipContext: 'SUPPLIER_LOGISTICS' }
    );
    return res.data;
}

export async function getSupplierShipments(
    status?: string
): Promise<PaginatedResponse<SupplierShipment>> {
    const res = await apiClient.get<PaginatedResponse<SupplierShipment>>(
        `${BASE}/shipments${toQuery({ status, page: 0, size: 50 })}`
    );
    return res.data;
}

export async function handoverShipment(
    shipmentId: number,
    data: HandoverRequest
): Promise<HandoverResponse> {
    const res = await apiClient.post<HandoverResponse>(
        `${BASE}/shipments/${shipmentId}/handover`,
        data
    );
    return res.data;
}

export async function extendCapacityForPartnership(
    forecastId: number,
    data: { partnershipId: number; newPeriodEnd: string; availableCapacity?: number }
): Promise<unknown> {
    const res = await apiClient.put(
        `/iam/core/logistics/operations/capacity/${forecastId}/extend-for-partnership`,
        data
    );
    return res.data;
}
