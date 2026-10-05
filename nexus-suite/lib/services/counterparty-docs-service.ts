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
    shipmentNumber?: string;
    status?: string;
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

export async function getRetailerAsnByPo(poId: number): Promise<AsnDocument[]> {
    const res = await apiClient.get<AsnDocument[] | AsnDocument>(
        `/iam/core/retailer/asn/purchase-order/${poId}`
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
