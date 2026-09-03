import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  LogisticsPartner,
  LogisticsPartnerCreateRequest,
  LogisticsPartnerUpdateRequest,
  LogisticsPartnerFilter,
  LogisticsPartnerPaginatedResponse,
} from "@/types/logistics";

// ─────────────────────────────────────────────────────────────
// Logistics Partners API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/core/partnerships";

export async function getLogisticsPartners(
  filter: LogisticsPartnerFilter = {},
): Promise<PaginatedResponse<LogisticsPartner>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  // Filter by partnership type LOGISTICS
  params.append("partnershipType", "LOGISTICS");

  const query = params.toString();
  const url = query ? `${BASE_PATH}?${query}` : BASE_PATH;

  const response = await apiClient.get<PaginatedResponse<LogisticsPartner>>(url);
  return response.data;
}

export async function getLogisticsPartnerById(
  partnershipId: number,
): Promise<LogisticsPartner> {
  const response = await apiClient.get<LogisticsPartner>(
    `${BASE_PATH}/${partnershipId}`,
  );
  return response.data;
}

export async function createLogisticsPartner(
  data: LogisticsPartnerCreateRequest,
): Promise<LogisticsPartner> {
  const response = await apiClient.post<LogisticsPartner>(BASE_PATH, {
    ...data,
    partnershipType: "LOGISTICS",
  });
  return response.data;
}

export async function updateLogisticsPartner(
  partnershipId: number,
  data: LogisticsPartnerUpdateRequest,
): Promise<LogisticsPartner> {
  const response = await apiClient.put<LogisticsPartner>(
    `${BASE_PATH}/${partnershipId}`,
    data,
  );
  return response.data;
}

export async function getActiveLogisticsPartners(): Promise<
  LogisticsPartner[]
> {
  const response = await apiClient.get<LogisticsPartner[]>(
    `${BASE_PATH}/active?partnershipType=LOGISTICS`,
  );
  return response.data;
}

export async function getLogisticsPartnersByStatus(
  status: string,
): Promise<LogisticsPartner[]> {
  const response = await apiClient.get<LogisticsPartner[]>(
    `${BASE_PATH}/status/${status}?partnershipType=LOGISTICS`,
  );
  return response.data;
}
