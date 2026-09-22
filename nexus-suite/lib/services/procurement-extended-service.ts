import apiClient from "@/lib/api-client";
import type { GoodsReceipt, GoodsReceiptFilter, Invoice, InvoiceFilter, ThreeWayMatchResult, GoodsReceiptPaginatedResponse, InvoicePaginatedResponse } from "@/types/procurement";

const BASE = "/iam/core/retailer";
const GR_BASE = `${BASE}/goods-receipts`;
const INV_BASE = `${BASE}/invoices`;
const TWM_BASE = `${BASE}/three-way-match`;

function q(filter: Record<string, unknown>) {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, String(v)); });
  return p.toString();
}

export async function getGoodsReceipts(filter: GoodsReceiptFilter = {}): Promise<GoodsReceiptPaginatedResponse> {
  const query = q(filter as Record<string, unknown>);
  const url = query ? `${GR_BASE}/all?${query}` : `${GR_BASE}/all`;
  const res = await apiClient.get<GoodsReceiptPaginatedResponse>(url);
  return res.data;
}

export async function getGoodsReceiptById(id: number): Promise<GoodsReceipt> {
  const res = await apiClient.get<GoodsReceipt>(`${GR_BASE}/${id}`);
  return res.data;
}

export async function createGoodsReceipt(data: Record<string, unknown>): Promise<GoodsReceipt> {
  const res = await apiClient.post<GoodsReceipt>(`${GR_BASE}/add`, data);
  return res.data;
}

export async function getInvoices(filter: InvoiceFilter = {}): Promise<InvoicePaginatedResponse> {
  const query = q(filter as Record<string, unknown>);
  const url = query ? `${INV_BASE}/all?${query}` : `${INV_BASE}/all`;
  const res = await apiClient.get<InvoicePaginatedResponse>(url);
  return res.data;
}

export async function getInvoiceById(id: number): Promise<Invoice> {
  const res = await apiClient.get<Invoice>(`${INV_BASE}/${id}`);
  return res.data;
}

export async function createInvoice(data: Record<string, unknown>): Promise<Invoice> {
  const res = await apiClient.post<Invoice>(`${INV_BASE}/add`, data);
  return res.data;
}

export async function performThreeWayMatch(purchaseOrderId: number): Promise<ThreeWayMatchResult> {
  const res = await apiClient.get<ThreeWayMatchResult>(`${TWM_BASE}/match/${purchaseOrderId}`);
  return res.data;
}

export async function getMatchingSummary(purchaseOrderId: number): Promise<ThreeWayMatchResult> {
  const res = await apiClient.get<ThreeWayMatchResult>(`${TWM_BASE}/summary/${purchaseOrderId}`);
  return res.data;
}

export async function canInvoice(purchaseOrderId: number): Promise<{ canInvoice: boolean }> {
  const res = await apiClient.get<{ canInvoice: boolean }>(`${TWM_BASE}/can-invoice/${purchaseOrderId}`);
  return res.data;
}
