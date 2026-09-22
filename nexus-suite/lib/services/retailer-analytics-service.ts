import apiClient from "@/lib/api-client";
import type { DashboardData, SpendAnalytics, SupplyChainVisibility } from "@/types/retailer-analytics";

const BASE = "/iam/core/retailer/analytics";

export async function getRetailerDashboard(): Promise<DashboardData> {
  const res = await apiClient.get<DashboardData>(`${BASE}/dashboard`);
  return res.data;
}

export async function getSpendAnalytics(groupBy?: string, period?: string): Promise<SpendAnalytics> {
  const p = new URLSearchParams();
  if (groupBy) p.append("groupBy", groupBy);
  if (period) p.append("period", period);
  const q = p.toString();
  const url = q ? `${BASE}/spend?${q}` : `${BASE}/spend`;
  const res = await apiClient.get<SpendAnalytics>(url);
  return res.data;
}

export async function getSupplyChainVisibility(purchaseOrderId: number): Promise<SupplyChainVisibility> {
  const res = await apiClient.get<SupplyChainVisibility>(`${BASE}/visibility/${purchaseOrderId}`);
  return res.data;
}
