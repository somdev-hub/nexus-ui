import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  Supplier,
  SupplierCreateRequest,
  SupplierUpdateRequest,
  SupplierDiscoveryRequest,
  SupplierFilter,
  SupplierPaginatedResponse,
} from "@/types/suppliers";

// ─────────────────────────────────────────────────────────────
// Suppliers API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/core/suppliers";

export async function getSuppliers(
  filter: SupplierFilter = {},
): Promise<PaginatedResponse<Supplier>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<PaginatedResponse<Supplier>>(
    `${BASE_PATH}/all?${params.toString()}`,
  );
  return response.data;
}

export async function getSupplierById(supplierId: number): Promise<Supplier> {
  const response = await apiClient.get<Supplier>(`${BASE_PATH}/${supplierId}`);
  return response.data;
}

export async function createSupplier(
  data: SupplierCreateRequest,
): Promise<Supplier> {
  const response = await apiClient.post<Supplier>(`${BASE_PATH}/add`, data);
  return response.data;
}

export async function updateSupplier(
  supplierId: number,
  data: SupplierUpdateRequest,
): Promise<Supplier> {
  const response = await apiClient.put<Supplier>(
    `${BASE_PATH}/${supplierId}`,
    data,
  );
  return response.data;
}

export async function discoverSuppliers(
  discovery: SupplierDiscoveryRequest,
): Promise<PaginatedResponse<Supplier>> {
  const response = await apiClient.post<PaginatedResponse<Supplier>>(
    `${BASE_PATH}/discover`,
    discovery,
  );
  return response.data;
}
