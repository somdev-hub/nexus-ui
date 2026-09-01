import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  PurchaseOrder,
  PurchaseOrderCreateRequest,
  PurchaseOrderItemCreateRequest,
  PurchaseOrderUpdateRequest,
  PurchaseOrderStatusUpdateRequest,
  PurchaseOrderApprovalRequest,
  PurchaseOrderFilter,
  PurchaseOrderPaginatedResponse,
} from "@/types/purchase-orders";

// ─────────────────────────────────────────────────────────────
// Purchase Orders API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/core/purchase-orders";

export async function getPurchaseOrders(
  filter: PurchaseOrderFilter = {},
): Promise<PaginatedResponse<PurchaseOrder>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<PaginatedResponse<PurchaseOrder>>(
    `${BASE_PATH}?${params.toString()}`,
  );
  return response.data;
}

export async function getPurchaseOrderById(
  purchaseOrderId: number,
): Promise<PurchaseOrder> {
  const response = await apiClient.get<PurchaseOrder>(
    `${BASE_PATH}/${purchaseOrderId}`,
  );
  return response.data;
}

export async function createPurchaseOrder(
  data: PurchaseOrderCreateRequest,
): Promise<PurchaseOrder> {
  const response = await apiClient.post<PurchaseOrder>(BASE_PATH, data);
  return response.data;
}

export async function updatePurchaseOrder(
  purchaseOrderId: number,
  data: PurchaseOrderUpdateRequest,
): Promise<PurchaseOrder> {
  const response = await apiClient.put<PurchaseOrder>(
    `${BASE_PATH}/${purchaseOrderId}`,
    data,
  );
  return response.data;
}

export async function updatePurchaseOrderStatus(
  purchaseOrderId: number,
  data: PurchaseOrderStatusUpdateRequest,
): Promise<PurchaseOrder> {
  const response = await apiClient.put<PurchaseOrder>(
    `${BASE_PATH}/${purchaseOrderId}/status`,
    data,
  );
  return response.data;
}

export async function transitionPurchaseOrder(
  purchaseOrderId: number,
  targetStatus: string,
): Promise<PurchaseOrder> {
  const response = await apiClient.put<PurchaseOrder>(
    `${BASE_PATH}/${purchaseOrderId}/transition?targetStatus=${targetStatus}`,
  );
  return response.data;
}

export async function approvePurchaseOrder(
  purchaseOrderId: number,
  data: PurchaseOrderApprovalRequest,
): Promise<PurchaseOrder> {
  const response = await apiClient.post<PurchaseOrder>(
    `${BASE_PATH}/${purchaseOrderId}/approve`,
    data,
  );
  return response.data;
}

export async function rejectPurchaseOrder(
  purchaseOrderId: number,
  data: PurchaseOrderApprovalRequest,
): Promise<PurchaseOrder> {
  const response = await apiClient.post<PurchaseOrder>(
    `${BASE_PATH}/${purchaseOrderId}/reject`,
    data,
  );
  return response.data;
}

export async function cancelPurchaseOrder(
  purchaseOrderId: number,
): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${purchaseOrderId}`);
}
