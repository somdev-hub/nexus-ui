import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  SupplierContract,
  SupplierContractCreateRequest,
  SupplierContractUpdateRequest,
  SupplierContractStatusUpdateRequest,
  SupplierContractApprovalRequest,
  SupplierContractDocumentResponse,
  SupplierContractSummary,
  SupplierContractFilter,
  SupplierContractPaginatedResponse,
} from "@/types/supplier-contracts";

// ─────────────────────────────────────────────────────────────
// Supplier Contracts API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/api/core/supplier-contracts";

export async function getSupplierContracts(
  filter: SupplierContractFilter = {},
): Promise<PaginatedResponse<SupplierContract>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<PaginatedResponse<SupplierContract>>(
    `${BASE_PATH}?${params.toString()}`,
  );
  return response.data;
}

export async function getSupplierContractById(
  contractId: number,
): Promise<SupplierContract> {
  const response = await apiClient.get<SupplierContract>(
    `${BASE_PATH}/${contractId}`,
  );
  return response.data;
}

export async function getSupplierContractByNumber(
  contractNumber: string,
): Promise<SupplierContract> {
  const response = await apiClient.get<SupplierContract>(
    `${BASE_PATH}/number/${contractNumber}`,
  );
  return response.data;
}

export async function createSupplierContract(
  data: SupplierContractCreateRequest,
): Promise<SupplierContract> {
  const response = await apiClient.post<SupplierContract>(BASE_PATH, data);
  return response.data;
}

export async function updateSupplierContract(
  contractId: number,
  data: SupplierContractUpdateRequest,
): Promise<SupplierContract> {
  const response = await apiClient.put<SupplierContract>(
    `${BASE_PATH}/${contractId}`,
    data,
  );
  return response.data;
}

export async function updateSupplierContractStatus(
  contractId: number,
  data: SupplierContractStatusUpdateRequest,
): Promise<SupplierContract> {
  const response = await apiClient.put<SupplierContract>(
    `${BASE_PATH}/${contractId}/status`,
    data,
  );
  return response.data;
}

export async function approveSupplierContract(
  contractId: number,
  data: SupplierContractApprovalRequest,
): Promise<SupplierContract> {
  const response = await apiClient.post<SupplierContract>(
    `${BASE_PATH}/${contractId}/approve`,
    data,
  );
  return response.data;
}

export async function rejectSupplierContract(
  contractId: number,
  data: SupplierContractApprovalRequest,
): Promise<SupplierContract> {
  const response = await apiClient.post<SupplierContract>(
    `${BASE_PATH}/${contractId}/reject`,
    data,
  );
  return response.data;
}

export async function getExpiringContracts(
  days: number = 30,
): Promise<SupplierContract[]> {
  const response = await apiClient.get<SupplierContract[]>(
    `${BASE_PATH}/expiring?days=${days}`,
  );
  return response.data;
}

export async function getAutoRenewalContracts(): Promise<SupplierContract[]> {
  const response = await apiClient.get<SupplierContract[]>(
    `${BASE_PATH}/auto-renewal`,
  );
  return response.data;
}

export async function getActiveContractsBySupplier(
  supplierId: number,
): Promise<SupplierContract[]> {
  const response = await apiClient.get<SupplierContract[]>(
    `${BASE_PATH}/active-by-supplier/${supplierId}`,
  );
  return response.data;
}

export async function getSupplierContractSummary(): Promise<SupplierContractSummary> {
  const response = await apiClient.get<SupplierContractSummary>(
    `${BASE_PATH}/summary`,
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Document Management
// ─────────────────────────────────────────────────────────────

export async function uploadContractDocument(
  contractId: number,
  file: File,
): Promise<SupplierContractDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<SupplierContractDocumentResponse>(
    `${BASE_PATH}/${contractId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function getContractDocuments(
  contractId: number,
): Promise<SupplierContractDocumentResponse[]> {
  const response = await apiClient.get<SupplierContractDocumentResponse[]>(
    `${BASE_PATH}/${contractId}/documents`,
  );
  return response.data;
}

export async function deleteContractDocument(
  contractId: number,
  documentId: number,
): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${contractId}/documents/${documentId}`);
}
