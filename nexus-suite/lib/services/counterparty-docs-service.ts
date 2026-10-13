import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type { SupplierQuotation } from '@/types/supplier';
import type { FreightInvoice } from '@/types/freight-invoice';
import type { ProofOfDelivery } from '@/types/logistics-ops';

// ─────────────────────────────────────────────────────────────
// Counterparty trade documents (retailer / supplier / logistics
// views of supplier- and carrier-created documents).
// Backend paths below are served via the IAM gateway; a parallel
// workstream adds the gateway routes + Core handlers.
// ─────────────────────────────────────────────────────────────

export interface AsnDocument {
    asnId?: number;
    asnNumber?: string;
    purchaseOrderId?: number;
    poNumber?: string;
    shipmentId?: number;
    status?: string;
    // Dispatch detail: what is physically on this truck (the ASN's own
    // purpose — the PO stays the commercial order: what was asked for).
    shipmentNumber?: string;
    shipmentStatus?: string;
    trackingNumber?: string;
    carrierName?: string;
    logisticsOrgName?: string;
    pickupLocation?: string;
    deliveryLocation?: string;
    pickupDate?: string;
    deliveryDate?: string;
    orderedQuantity?: number;
    shippedQuantity?: number;
    backorderedQuantity?: number;
    totalPackages?: number;
    totalWeight?: number;
    totalVolume?: number;
    estimatedArrival?: string;
    notes?: string;
    [key: string]: unknown;
}

export type CounterpartyPod = ProofOfDelivery & {
    receiverName?: string;
    receivedByName?: string;
    signatureUrl?: string;
    condition?: string;
    capturedAt?: string;
    createdAt?: string;
};

// ── Retailer ──

export async function getRetailerQuotations(
    filter: {
        page?: number;
        size?: number;
        status?: string;
    } = {}
): Promise<PaginatedResponse<SupplierQuotation>> {
    const p = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const q = p.toString();
    const url = q
        ? `/iam/core/retailer/quotations/all?${q}`
        : '/iam/core/retailer/quotations/all';
    const res = await apiClient.get<PaginatedResponse<SupplierQuotation>>(url);
    return res.data;
}

export async function acceptRetailerQuotation(
    id: number
): Promise<SupplierQuotation> {
    const res = await apiClient.put<SupplierQuotation>(
        `/iam/core/retailer/quotations/${id}/accept`,
        {}
    );
    return res.data;
}

export async function getRetailerQuotationById(
    id: number
): Promise<SupplierQuotation> {
    const res = await apiClient.get<SupplierQuotation>(
        `/iam/core/retailer/quotations/${id}`
    );
    return res.data;
}

export async function rejectRetailerQuotation(
    id: number
): Promise<SupplierQuotation> {
    const res = await apiClient.put<SupplierQuotation>(
        `/iam/core/retailer/quotations/${id}/reject`,
        {}
    );
    return res.data;
}

export interface AsnPage {
    content: AsnDocument[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

function toAsnArray(data: unknown): AsnDocument[] {
    if (Array.isArray(data)) return data as AsnDocument[];
    if (data && typeof data === 'object') {
        const rec = data as Record<string, unknown>;
        if (Array.isArray(rec.content)) return rec.content as AsnDocument[];
        if (Array.isArray(rec.data)) return rec.data as AsnDocument[];
        return [data as AsnDocument];
    }
    return [];
}

export async function getRetailerAsns(
    filter: {
        page?: number;
        size?: number;
        pageNo?: number;
        pageOffset?: number;
    } = {}
): Promise<AsnPage> {
    const page = filter.page ?? filter.pageNo ?? 0;
    const size = filter.size ?? filter.pageOffset ?? 20;
    const res = await apiClient.get<unknown>(
        `/iam/core/retailer/asn/all?page=${page}&size=${size}`
    );
    const data = res.data as Record<string, unknown> & {
        content?: unknown;
        totalElements?: number;
        totalPages?: number;
        first?: boolean;
        last?: boolean;
        empty?: boolean;
        number?: number;
    };
    const content = toAsnArray(data);
    const totalElements =
        typeof data?.totalElements === 'number'
            ? data.totalElements
            : content.length;
    const totalPages =
        typeof data?.totalPages === 'number' ? data.totalPages : 1;
    const currentPage = typeof data?.number === 'number' ? data.number : page;
    return {
        content,
        totalElements,
        totalPages,
        page: currentPage,
        size,
        first:
            typeof data?.first === 'boolean' ? data.first : currentPage === 0,
        last:
            typeof data?.last === 'boolean'
                ? data.last
                : currentPage >= totalPages - 1,
        empty:
            typeof data?.empty === 'boolean'
                ? data.empty
                : content.length === 0,
    };
}

export async function getRetailerAsnByPo(poId: number): Promise<AsnDocument[]> {
    const res = await apiClient.get<AsnDocument[] | AsnDocument>(
        `/iam/core/retailer/asn/purchase-order/${poId}`
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data as AsnDocument];
    return [];
}

export async function getRetailerAsnByPoNumber(
    poNumber: string
): Promise<AsnDocument[]> {
    const res = await apiClient.get<AsnDocument[] | AsnDocument>(
        `/iam/core/retailer/asn/purchase-order-number/${encodeURIComponent(poNumber)}`
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data as AsnDocument];
    return [];
}

export async function getRetailerPod(
    shipmentId: number
): Promise<CounterpartyPod | null> {
    const res = await apiClient.get<CounterpartyPod>(
        `/iam/core/retailer/shipments/${shipmentId}/pod`
    );
    return res.data ?? null;
}

// ── Supplier ──

export async function getSupplierAsnByPo(poId: number): Promise<AsnDocument[]> {
    const res = await apiClient.get<AsnDocument[] | AsnDocument>(
        `/iam/core/supplier/asn/purchase-order/${poId}`
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data as AsnDocument];
    return [];
}

export async function getSupplierAsnByPoNumber(
    poNumber: string
): Promise<AsnDocument[]> {
    const res = await apiClient.get<AsnDocument[] | AsnDocument>(
        `/iam/core/supplier/asn/purchase-order-number/${encodeURIComponent(poNumber)}`
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data as AsnDocument];
    return [];
}

export async function getSupplierPod(
    shipmentId: number
): Promise<CounterpartyPod | null> {
    const res = await apiClient.get<CounterpartyPod>(
        `/iam/core/supplier/shipments/${shipmentId}/pod`
    );
    return res.data ?? null;
}

// ── Logistics (freight invoices issued against shipments) ──

export async function getLogisticsFreightInvoices(
    filter: { page?: number; size?: number; status?: string } = {}
): Promise<PaginatedResponse<FreightInvoice>> {
    const p = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const q = p.toString();
    const url = q
        ? `/iam/core/logistics/freight-invoices/all?${q}`
        : '/iam/core/logistics/freight-invoices/all';
    const res = await apiClient.get<PaginatedResponse<FreightInvoice>>(url);
    return res.data;
}

export async function getLogisticsFreightByShipment(
    shipmentId: number
): Promise<FreightInvoice[]> {
    const res = await apiClient.get<FreightInvoice[] | FreightInvoice>(
        `/iam/core/logistics/freight-invoices/shipment/${shipmentId}`
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data as FreightInvoice];
    return [];
}
