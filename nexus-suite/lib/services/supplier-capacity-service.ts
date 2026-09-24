import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  ProductionCapacity,
  CapacityFilter,
  CapacitySummary,
  AtpCatalogResponse,
  AtpProductLineResponse,
} from "@/types/supplier";

const CAP_BASE = "/iam/core/supplier/capacity";
const ATP_CATALOG = "/iam/core/supplier/atp/catalog";
const ATP_PL = "/iam/core/supplier/atp/product-line";

export async function getCapacities(
  filter: CapacityFilter = {},
): Promise<PaginatedResponse<ProductionCapacity>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${CAP_BASE}/all?${q}` : `${CAP_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<ProductionCapacity>>(url);
  return res.data;
}
export async function getCapacityById(id: number): Promise<ProductionCapacity> {
  const res = await apiClient.get<ProductionCapacity>(`${CAP_BASE}/${id}`);
  return res.data;
}
export async function createCapacity(
  data: Partial<ProductionCapacity>,
): Promise<ProductionCapacity> {
  const res = await apiClient.post<ProductionCapacity>(`${CAP_BASE}/create`, data);
  return res.data;
}
export async function updateCapacity(
  id: number,
  data: Partial<ProductionCapacity>,
): Promise<ProductionCapacity> {
  const res = await apiClient.put<ProductionCapacity>(`${CAP_BASE}/${id}/update`, data);
  return res.data;
}
export async function deleteCapacity(id: number): Promise<void> {
  await apiClient.delete(`${CAP_BASE}/${id}`);
}
export async function getCapacitySummary(): Promise<CapacitySummary> {
  const res = await apiClient.get<CapacitySummary>(`${CAP_BASE}/summary`);
  return res.data;
}

export async function getAtpForCatalog(
  catalogId: number,
  quantity?: number,
): Promise<AtpCatalogResponse> {
  const q = quantity ? `?requestedQuantity=${quantity}` : "";
  const res = await apiClient.get<AtpCatalogResponse>(`${ATP_CATALOG}/${catalogId}${q}`);
  return res.data;
}
export async function getAtpForProductLine(productLine?: string): Promise<AtpProductLineResponse> {
  const q = productLine ? `?productLine=${productLine}` : "";
  const res = await apiClient.get<AtpProductLineResponse>(`${ATP_PL}${q}`);
  return res.data;
}
