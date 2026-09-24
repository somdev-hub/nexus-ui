import apiClient from "@/lib/api-client";
import type { SupplierDashboard } from "@/types/supplier";

const BASE = "/iam/core/supplier/analytics";

export async function getSupplierDashboard(): Promise<SupplierDashboard> {
  const res = await apiClient.get<SupplierDashboard>(`${BASE}/dashboard`);
  return res.data;
}

export async function getSupplierOrderAnalytics(): Promise<SupplierDashboard> {
  const res = await apiClient.get<SupplierDashboard>(`${BASE}/dashboard`);
  return res.data;
}

export async function getSupplierAnalytics(): Promise<SupplierDashboard> {
  const res = await apiClient.get<SupplierDashboard>(`${BASE}/dashboard`);
  return res.data;
}
