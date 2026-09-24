import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  AccountHealth,
  AccountHealthSummary,
  CollaborativeForecast,
  CustomerSummary,
  ForecastFilter,
  QuotationFilter,
  QuotationSummary,
  QuotationTransitionParams,
  SupplierOrder,
  SupplierOrderFilter,
  SupplierQuotation,
} from "@/types/supplier";

const QUO_BASE = "/iam/core/supplier/quotations";
const FOR_BASE = "/iam/core/supplier/forecasts";
const PORTAL_BASE = "/iam/core/supplier/customer-portal";
const HEALTH_BASE = "/iam/core/supplier/account-health";

export async function getQuotations(
  filter: QuotationFilter = {},
): Promise<PaginatedResponse<SupplierQuotation>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${QUO_BASE}/all?${q}` : `${QUO_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<SupplierQuotation>>(url);
  return res.data;
}
export async function getQuotationById(id: number): Promise<SupplierQuotation> {
  const res = await apiClient.get<SupplierQuotation>(`${QUO_BASE}/${id}`);
  return res.data;
}
export async function createQuotation(
  data: Partial<SupplierQuotation>,
): Promise<SupplierQuotation> {
  const res = await apiClient.post<SupplierQuotation>(
    `${QUO_BASE}/create`,
    data,
  );
  return res.data;
}
export async function transitionQuotation(
  id: number,
  newStatus: string,
  params?: QuotationTransitionParams,
): Promise<SupplierQuotation> {
  const res = await apiClient.put<SupplierQuotation>(
    `${QUO_BASE}/${id}/status?newStatus=${newStatus}`,
    params || {},
  );
  return res.data;
}
export async function convertQuotation(
  id: number,
): Promise<{ quotationId: number; purchaseOrderId: number; poNumber: string }> {
  const res = await apiClient.post<{
    quotationId: number;
    purchaseOrderId: number;
    poNumber: string;
  }>(`${QUO_BASE}/${id}/convert-to-order`, {});
  return res.data;
}
export async function getQuotationSummary(): Promise<QuotationSummary> {
  const res = await apiClient.get<QuotationSummary>(`${QUO_BASE}/summary`);
  return res.data;
}
export async function deleteQuotation(id: number): Promise<void> {
  await apiClient.delete(`${QUO_BASE}/${id}`);
}

// Forecasts
export async function getForecasts(
  filter: ForecastFilter = {},
): Promise<PaginatedResponse<CollaborativeForecast>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${FOR_BASE}/all?${q}` : `${FOR_BASE}/all`;
  const res =
    await apiClient.get<PaginatedResponse<CollaborativeForecast>>(url);
  return res.data;
}
export async function createForecast(
  data: Partial<CollaborativeForecast>,
): Promise<CollaborativeForecast> {
  const res = await apiClient.post<CollaborativeForecast>(
    `${FOR_BASE}/create`,
    data,
  );
  return res.data;
}
export async function updateForecast(
  id: number,
  data: Partial<CollaborativeForecast>,
): Promise<CollaborativeForecast> {
  const res = await apiClient.put<CollaborativeForecast>(
    `${FOR_BASE}/${id}/update`,
    data,
  );
  return res.data;
}
export async function deleteForecast(id: number): Promise<void> {
  await apiClient.delete(`${FOR_BASE}/${id}`);
}
export async function transitionForecast(
  id: number,
  newStatus: string,
): Promise<CollaborativeForecast> {
  const res = await apiClient.put<CollaborativeForecast>(
    `${FOR_BASE}/${id}/status?newStatus=${newStatus}`,
    {},
  );
  return res.data;
}

// Customer portal
export async function getCustomerOrders(
  buyerOrgId?: number,
  filter: SupplierOrderFilter = {},
): Promise<PaginatedResponse<SupplierOrder>> {
  const p = new URLSearchParams();
  if (buyerOrgId) p.append("buyerOrgId", String(buyerOrgId));
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null) p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${PORTAL_BASE}/orders?${q}` : `${PORTAL_BASE}/orders`;
  const res = await apiClient.get<PaginatedResponse<SupplierOrder>>(url);
  return res.data;
}
export async function getCustomerSummary(
  buyerOrgId?: number,
): Promise<CustomerSummary> {
  const q = buyerOrgId ? `?buyerOrgId=${buyerOrgId}` : "";
  const res = await apiClient.get<CustomerSummary>(
    `${PORTAL_BASE}/summary${q}`,
  );
  return res.data;
}

// Health
export async function getAccountHealth(
  buyerOrgId: number,
): Promise<AccountHealth> {
  const res = await apiClient.get<AccountHealth>(
    `${HEALTH_BASE}/${buyerOrgId}`,
  );
  return res.data;
}
export async function getAllAccountHealth(): Promise<AccountHealth[]> {
  const res = await apiClient.get<AccountHealth[]>(`${HEALTH_BASE}/all`);
  return res.data;
}
export async function getHealthSummary(): Promise<AccountHealthSummary> {
  const res = await apiClient.get<AccountHealthSummary>(
    `${HEALTH_BASE}/summary`,
  );
  return res.data;
}
