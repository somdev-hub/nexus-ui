import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  Partnership,
  PartnershipCreateRequest,
  PartnershipUpdateRequest,
  PartnershipStatusUpdateRequest,
  PartnershipAgreementResponse,
  PartnershipFilter,
  PartnershipPaginatedResponse,
} from "@/types/partnerships";

// ─────────────────────────────────────────────────────────────
// Partnerships API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/core/partnerships";

export async function getPartnerships(
  filter: PartnershipFilter = {},
): Promise<PaginatedResponse<Partnership>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<PaginatedResponse<Partnership>>(
    `${BASE_PATH}?${params.toString()}`,
  );
  return response.data;
}

export async function getPartnershipById(
  partnershipId: number,
): Promise<Partnership> {
  const response = await apiClient.get<Partnership>(
    `${BASE_PATH}/${partnershipId}`,
  );
  return response.data;
}

export async function createPartnership(
  data: PartnershipCreateRequest,
): Promise<Partnership> {
  const response = await apiClient.post<Partnership>(BASE_PATH, data);
  return response.data;
}

export async function updatePartnership(
  partnershipId: number,
  data: PartnershipUpdateRequest,
): Promise<Partnership> {
  const response = await apiClient.put<Partnership>(
    `${BASE_PATH}/${partnershipId}`,
    data,
  );
  return response.data;
}

export async function updatePartnershipStatus(
  partnershipId: number,
  data: PartnershipStatusUpdateRequest,
): Promise<Partnership> {
  const response = await apiClient.post<Partnership>(
    `${BASE_PATH}/${partnershipId}/status`,
    data,
  );
  return response.data;
}

export async function getActivePartnerships(): Promise<Partnership[]> {
  const response = await apiClient.get<Partnership[]>(`${BASE_PATH}/active`);
  return response.data;
}

export async function getPartnershipsByStatus(
  status: string,
): Promise<Partnership[]> {
  const response = await apiClient.get<Partnership[]>(
    `${BASE_PATH}/status/${status}`,
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Agreement Document Management
// ─────────────────────────────────────────────────────────────

export async function uploadPartnershipAgreement(
  partnershipId: number,
  file: File,
): Promise<PartnershipAgreementResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<PartnershipAgreementResponse>(
    `${BASE_PATH}/${partnershipId}/agreement`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function getPartnershipAgreement(
  partnershipId: number,
): Promise<PartnershipAgreementResponse> {
  const response = await apiClient.get<PartnershipAgreementResponse>(
    `${BASE_PATH}/${partnershipId}/agreement`,
  );
  return response.data;
}

export async function deletePartnershipAgreement(
  partnershipId: number,
): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${partnershipId}/agreement`);
}
