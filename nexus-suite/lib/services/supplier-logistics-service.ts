import apiClient from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/paginated-response';
import type { PartnershipInvitationCreateRequest } from '@/types/partnership-invitations';
import type { ShipmentEta, ShipmentPosition } from '@/types/logistics-ops';

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
    transportMode?: string;
    periodStart?: string;
    periodEnd?: string;
    availableCapacity?: number;
    bookedCapacity?: number;
    capacityUnit?: string;
    unitPrice?: number;
    currency?: string;
    totalFuelRequired?: number;
    fuelPrice?: number;
    fuelSurcharge?: number;
    driverFees?: number;
    miscPrice?: number;
    totalDistance?: number;
    averageDeliveryTime?: number;
    deliveryTimeUom?: string;
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
    desiredRoutesJson?: string;
    desiredCapacity?: number;
    desiredCapacityUnit?: string;
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
    orderedQuantity?: number;
    pickupLocation?: string;
    pickupAddress?: string;
    deliveryLocation?: string;
    deliveryAddress?: string;
    pickupDate?: string;
    deliveryDate?: string;
    trackingNumber?: string;
    carrierName?: string;
    carrierReference?: string;
    shipmentMode?: string;
    incoterms?: string;
    totalPackages?: number;
    packageWeight?: number;
    packageLength?: number;
    packageWidth?: number;
    packageHeight?: number;
    packageDimensionUom?: string;
    totalWeight?: number;
    totalVolume?: number;
    freightCost?: number;
    actualFreightCost?: number;
    currency?: string;
    freightTerms?: string;
    notes?: string;
    // Pricing of the matched logistics route capacity (the freight cost
    // lives on the lane, not on the shipment).
    laneCost?: {
        forecastId?: number;
        originLane?: string;
        destinationLane?: string;
        unitPrice?: number;
        currency?: string;
        capacityUnit?: string;
        fuelSurcharge?: number;
        driverFees?: number;
        miscPrice?: number;
        totalDistance?: number;
    };
    backorderedQuantity?: number;
    isPartialShipment?: boolean;
    estimatedDeparture?: string;
    actualDeparture?: string;
    estimatedArrival?: string;
    actualArrival?: string;
    createdAt?: string;
    updatedAt?: string;
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
    const res = await apiClient.post(`${BASE}/proposals`, {
        ...rest,
        invitedOrg: invitedOrgId,
        partnershipContext: 'SUPPLIER_LOGISTICS',
    });
    return res.data;
}

export async function getSupplierShipments(
    filter: { status?: string; page?: number; size?: number } = {}
): Promise<PaginatedResponse<SupplierShipment>> {
    const res = await apiClient.get<PaginatedResponse<SupplierShipment>>(
        `${BASE}/shipments${toQuery({ status: filter.status, page: filter.page ?? 0, size: filter.size ?? 10 })}`
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

// Live tracking for a supplier-owned shipment (same simulation as the
// logistics board, supplier-scoped on the backend).
export async function getSupplierShipmentPosition(
    shipmentId: number
): Promise<ShipmentPosition> {
    const res = await apiClient.get<ShipmentPosition>(
        `${BASE}/shipments/${shipmentId}/position`
    );
    return res.data;
}

export async function getSupplierShipmentEta(
    shipmentId: number
): Promise<ShipmentEta> {
    const res = await apiClient.get<ShipmentEta>(
        `${BASE}/shipments/${shipmentId}/eta`
    );
    return res.data;
}

export async function extendCapacityForPartnership(
    forecastId: number,
    data: {
        partnershipId: number;
        newPeriodEnd: string;
        availableCapacity?: number;
    }
): Promise<unknown> {
    const res = await apiClient.put(
        `/iam/core/logistics/operations/capacity/${forecastId}/extend-for-partnership`,
        data
    );
    return res.data;
}

// ─────────────────────────────────────────────────────────────
// Long-term counter-quotations (raised by logistics, reviewed by
// supplier) + private routes + termination.
// ─────────────────────────────────────────────────────────────

export interface QuotationRouteLine {
    fromLane?: string;
    from?: string;
    toLane?: string;
    to?: string;
    capacity?: number;
    capacityUnit?: string;
    unitPrice?: number;
    currency?: string;
    periodStart?: string;
    periodEnd?: string;
    [key: string]: unknown;
}

export interface LogisticsPartnershipQuotation {
    quotationId: number;
    quotationNumber?: string;
    invitationId?: number;
    supplierOrgId?: number;
    supplierOrgName?: string;
    logisticsOrgId?: number;
    logisticsOrgName?: string;
    partnershipId?: number;
    status?: string;
    routeLinesJson?: string;
    totalAmount?: number;
    currency?: string;
    validityStart?: string;
    validityEnd?: string;
    terms?: string;
    [key: string]: unknown;
}

export interface PrivateRouteRow extends LogisticsCapacityRow {
    partnershipId?: number;
}

export async function getSupplierQuotations(
    status?: string
): Promise<PaginatedResponse<LogisticsPartnershipQuotation>> {
    const res = await apiClient.get<
        PaginatedResponse<LogisticsPartnershipQuotation>
    >(`${BASE}/quotations${toQuery({ status, page: 0, size: 50 })}`);
    return res.data;
}

export async function respondToLogisticsQuotation(
    quotationId: number,
    action: 'ACCEPT' | 'REJECT'
): Promise<LogisticsPartnershipQuotation> {
    const res = await apiClient.post<LogisticsPartnershipQuotation>(
        `${BASE}/quotations/${quotationId}/respond`,
        { action }
    );
    return res.data;
}

export async function getMyPrivateRoutes(): Promise<
    PaginatedResponse<PrivateRouteRow>
> {
    const res = await apiClient.get<PaginatedResponse<PrivateRouteRow>>(
        `${BASE}/my-routes?page=0&size=100`
    );
    return res.data;
}

export async function terminateLogisticsPartnership(
    partnershipId: number
): Promise<{ status?: string; [key: string]: unknown }> {
    const res = await apiClient.post(
        `${BASE}/partnerships/${partnershipId}/terminate`,
        {}
    );
    return res.data;
}
