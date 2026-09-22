import apiClient from "@/lib/api-client";
import type { FreightInvoice, FreightInvoiceFilter, FreightInvoicePaginatedResponse } from "@/types/freight-invoice";

const BASE = "/iam/core/retailer/freight-invoices";
function q(filter: Record<string, unknown>) {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, String(v)); });
  return p.toString();
}

export async function getFreightInvoices(filter: FreightInvoiceFilter = {}): Promise<FreightInvoicePaginatedResponse> {
  const query = q(filter as Record<string, unknown>);
  const url = query ? `${BASE}?${query}` : `${BASE}`;
  const res = await apiClient.get<FreightInvoicePaginatedResponse>(url);
  return res.data;
}

export async function getFreightInvoiceById(id: number): Promise<FreightInvoice> {
  const res = await apiClient.get<FreightInvoice>(`${BASE}/${id}`);
  return res.data;
}

export async function createFreightInvoice(data: Record<string, unknown>): Promise<FreightInvoice> {
  const res = await apiClient.post<FreightInvoice>(`${BASE}`, data);
  return res.data;
}

export async function transitionFreightInvoice(id: number, newStatus: string, params?: Record<string, unknown>): Promise<FreightInvoice> {
  const res = await apiClient.post<FreightInvoice>(`${BASE}/${id}/status?newStatus=${newStatus}`, params || {});
  return res.data;
}

export async function handoffToPms(id: number): Promise<FreightInvoice> {
  const res = await apiClient.post<FreightInvoice>(`${BASE}/${id}/handoff-pms`, {});
  return res.data;
}

export async function getFreightInvoiceSummary(): Promise<Record<string, unknown>> {
  const res = await apiClient.get<Record<string, unknown>>(`${BASE}/summary`);
  return res.data;
}
