import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  ConsignmentStock,
  VmiConfig,
  ConsignmentFilter,
  VmiFilter,
  ConsignmentSummary,
  VmiSuggestion,
} from "@/types/supplier";

const CONS_BASE = "/iam/core/supplier/consignment";
const VMI_BASE = "/iam/core/supplier/vmi";

export async function getConsignments(
  filter: ConsignmentFilter = {},
): Promise<PaginatedResponse<ConsignmentStock>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${CONS_BASE}/all?${q}` : `${CONS_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<ConsignmentStock>>(url);
  return res.data;
}
export async function getConsignmentById(id: number): Promise<ConsignmentStock> {
  const res = await apiClient.get<ConsignmentStock>(`${CONS_BASE}/${id}`);
  return res.data;
}
export async function createConsignment(
  data: Partial<ConsignmentStock>,
): Promise<ConsignmentStock> {
  const res = await apiClient.post<ConsignmentStock>(`${CONS_BASE}/create`, data);
  return res.data;
}
export async function deleteConsignment(id: number): Promise<void> {
  await apiClient.delete(`${CONS_BASE}/${id}`);
}
export async function getConsignmentSummary(): Promise<ConsignmentSummary> {
  const res = await apiClient.get<ConsignmentSummary>(`${CONS_BASE}/summary`);
  return res.data;
}

export async function getVmis(
  filter: VmiFilter = {},
): Promise<PaginatedResponse<VmiConfig>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${VMI_BASE}/all?${q}` : `${VMI_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<VmiConfig>>(url);
  return res.data;
}
export async function getVmiById(id: number): Promise<VmiConfig> {
  const res = await apiClient.get<VmiConfig>(`${VMI_BASE}/${id}`);
  return res.data;
}
export async function createVmi(data: Partial<VmiConfig>): Promise<VmiConfig> {
  const res = await apiClient.post<VmiConfig>(`${VMI_BASE}/create`, data);
  return res.data;
}
export async function deleteVmi(id: number): Promise<void> {
  await apiClient.delete(`${VMI_BASE}/${id}`);
}
export async function getVmiSuggestions(): Promise<VmiSuggestion[]> {
  const res = await apiClient.get<VmiSuggestion[]>(`${VMI_BASE}/replenishment-suggestions`);
  return res.data;
}
export async function triggerVmiReplenish(
  id: number,
): Promise<{ vmiId: number; lastReplenishedAt: string; message: string }> {
  const res = await apiClient.post<{ vmiId: number; lastReplenishedAt: string; message: string }>(
    `${VMI_BASE}/${id}/replenish`,
    {},
  );
  return res.data;
}
