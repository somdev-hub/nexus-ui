import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  Material,
  MaterialCreateRequest,
  MaterialUpdateRequest,
  MaterialFilter,
  MaterialPaginatedResponse,
} from "@/types/materials";

// ─────────────────────────────────────────────────────────────
// Materials API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/core/materials";

export async function getMaterials(
  filter: MaterialFilter = {},
): Promise<PaginatedResponse<Material>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  const url = query ? `${BASE_PATH}?${query}` : BASE_PATH;

  const response = await apiClient.get<PaginatedResponse<Material>>(url);
  return response.data;
}

export async function getMaterialById(materialId: number): Promise<Material> {
  const response = await apiClient.get<Material>(`${BASE_PATH}/${materialId}`);
  return response.data;
}

export async function createMaterial(
  data: MaterialCreateRequest,
): Promise<Material> {
  const response = await apiClient.post<Material>(BASE_PATH, data);
  return response.data;
}

export async function updateMaterial(
  materialId: number,
  data: MaterialUpdateRequest,
): Promise<Material> {
  const response = await apiClient.put<Material>(
    `${BASE_PATH}/${materialId}`,
    data,
  );
  return response.data;
}

export async function deleteMaterial(materialId: number): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${materialId}`);
}

export async function getMaterialCategories(): Promise<string[]> {
  const response = await apiClient.get<string[]>(`${BASE_PATH}/categories`);
  return response.data;
}
