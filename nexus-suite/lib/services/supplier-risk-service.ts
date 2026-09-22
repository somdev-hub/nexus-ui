import apiClient from "@/lib/api-client";
import type { SupplierRisk, SupplierRiskFilter, SupplierRiskPaginatedResponse } from "@/types/supplier-risk";

const BASE = "/iam/core/retailer/supplier-risk-monitoring";
function q(filter: Record<string, unknown>) {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, String(v)); });
  return p.toString();
}

export async function getSupplierRisks(filter: SupplierRiskFilter = {}): Promise<SupplierRiskPaginatedResponse> {
  const query = q(filter as Record<string, unknown>);
  const url = query ? `${BASE}/all?${query}` : `${BASE}/all`;
  const res = await apiClient.get<SupplierRiskPaginatedResponse>(url);
  return res.data;
}

export async function getSupplierRiskById(id: number): Promise<SupplierRisk> {
  const res = await apiClient.get<SupplierRisk>(`${BASE}/${id}`);
  return res.data;
}

export async function createSupplierRisk(data: Record<string, unknown>): Promise<SupplierRisk> {
  const res = await apiClient.post<SupplierRisk>(`${BASE}/create`, data);
  return res.data;
}

export async function getRiskSummary(supplierId: number): Promise<Record<string, unknown>> {
  const res = await apiClient.get<Record<string, unknown>>(`${BASE}/supplier/${supplierId}/summary`);
  return res.data;
}
