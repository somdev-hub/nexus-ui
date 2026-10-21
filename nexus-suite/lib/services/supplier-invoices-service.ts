import apiClient from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/paginated-response';
import type { GoodsReceipt } from '@/types/procurement';

// ─────────────────────────────────────────────────────────────
// Supplier-raised invoicing: the supplier validates the shared
// goods receipt, builds the invoice (lines + tax + charges) and
// submits it. The retailer only reviews, approves/rejects and pays.
// Backend: Core SupplierInvoiceController / SupplierOrderController
// via the IAM supplier gateway (supplier-org scoping enforced).
// ─────────────────────────────────────────────────────────────

const BASE = '/iam/core/supplier';

export interface SupplierInvoiceLine {
    invoiceLineItemId?: number;
    poLineItemId?: number;
    grLineItemId?: number;
    lineNumber?: number;
    quantityInvoiced?: number;
    unitPrice?: number;
    lineTotal?: number;
    unitOfMeasure?: string;
    notes?: string;
    description?: string;
}

export interface SupplierInvoice {
    invoiceId: number;
    invoiceNumber: string;
    purchaseOrderId: number;
    poNumber?: string;
    supplierId: number;
    supplierName?: string;
    status: string;
    invoiceDate?: string;
    dueDate?: string;
    totalAmount: number;
    taxAmount?: number;
    otherCharges?: number;
    otherChargesBreakdown?: string;
    currency: string;
    paymentTerms?: string;
    supplierInvoiceNumber?: string;
    notes?: string;
    lineItems?: SupplierInvoiceLine[];
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    submittedAt?: string;
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OtherCharge {
    amount: string;
    description: string;
}

export function parseChargesBreakdown(value?: string | null): OtherCharge[] {
    if (!value) return [];
    try {
        const parsed: unknown = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(
                (r): r is { amount?: unknown; description?: unknown } =>
                    typeof r === 'object' && r !== null
            )
            .map((r) => ({
                amount:
                    typeof r.amount === 'number'
                        ? String(r.amount)
                        : typeof r.amount === 'string'
                          ? r.amount
                          : '',
                description:
                    typeof r.description === 'string' ? r.description : '',
            }))
            .filter(
                (r) => r.amount.trim() !== '' || r.description.trim() !== ''
            );
    } catch {
        return [];
    }
}

function toQuery(params: Record<string, unknown> = {}): string {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : '';
}

export async function getSupplierGoodsReceipts(
    filter: { status?: string; page?: number; size?: number } = {}
): Promise<PaginatedResponse<GoodsReceipt>> {
    const res = await apiClient.get<PaginatedResponse<GoodsReceipt>>(
        `${BASE}/orders/goods-receipts/all${toQuery({ status: filter.status, page: filter.page ?? 0, size: filter.size ?? 10 })}`
    );
    return res.data;
}

export async function getSupplierGoodsReceipt(
    id: number
): Promise<GoodsReceipt> {
    const res = await apiClient.get<GoodsReceipt>(
        `${BASE}/orders/goods-receipts/${id}`
    );
    return res.data;
}

export async function getSupplierInvoices(
    filter: {
        status?: string;
        purchaseOrderId?: number;
        page?: number;
        size?: number;
    } = {}
): Promise<PaginatedResponse<SupplierInvoice>> {
    const res = await apiClient.get<PaginatedResponse<SupplierInvoice>>(
        `${BASE}/invoices/all${toQuery({ status: filter.status, purchaseOrderId: filter.purchaseOrderId, page: filter.page ?? 0, size: filter.size ?? 10 })}`
    );
    return res.data;
}

export async function getSupplierInvoice(id: number): Promise<SupplierInvoice> {
    const res = await apiClient.get<SupplierInvoice>(`${BASE}/invoices/${id}`);
    return res.data;
}

export async function createSupplierInvoice(
    data: Record<string, unknown>
): Promise<SupplierInvoice> {
    const res = await apiClient.post<SupplierInvoice>(
        `${BASE}/invoices/add`,
        data
    );
    return res.data;
}

export async function updateSupplierInvoice(
    id: number,
    data: Record<string, unknown>
): Promise<SupplierInvoice> {
    const res = await apiClient.put<SupplierInvoice>(
        `${BASE}/invoices/${id}/update`,
        data
    );
    return res.data;
}

export async function transitionSupplierInvoice(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<SupplierInvoice> {
    const res = await apiClient.put<SupplierInvoice>(
        `${BASE}/invoices/${id}/transition?newStatus=${encodeURIComponent(newStatus)}`,
        params ?? {}
    );
    return res.data;
}
