import apiClient from "@/lib/api-client";
import type { SupplierPerformance, SupplierPerformanceFilter, SupplierPerformancePaginatedResponse } from "@/types/supplier-performance";

const BASE = "/iam/core/retailer/supplier-performance";
function q(filter: Record<string, unknown>) {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, String(v)); });
  return p.toString();
}

export async function getSupplierPerformances(filter: SupplierPerformanceFilter = {}): Promise<SupplierPerformancePaginatedResponse> {
  const query = q(filter as Record<string, unknown>);
  const url = query ? `${BASE}/all?${query}` : `${BASE}/all`;
  const res = await apiClient.get<SupplierPerformancePaginatedResponse>(url);
  return res.data;
}

export async function getSupplierPerformanceById(id: number): Promise<SupplierPerformance> {
  const res = await apiClient.get<SupplierPerformance>(`${BASE}/${id}`);
  return res.data;
}

export async function calculateSupplierPerformance(supplierId: number, startDate: string, endDate: string, calculatedBy: string): Promise<SupplierPerformance> {
  const res = await apiClient.post<SupplierPerformance>(`${BASE}/calculate?supplierId=${supplierId}&startDate=${startDate}&endDate=${endDate}&calculatedBy=${encodeURIComponent(calculatedBy)}`, {});
  return res.data;
}

export async function getPerformanceSummaryByAccount(): Promise<Record<string, unknown>> {
  const res = await apiClient.get<Record<string, unknown>>(`${BASE}/summary/account`);
  return res.data;
}
