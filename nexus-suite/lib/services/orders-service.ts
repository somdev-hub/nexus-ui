import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  Order,
  OrderCreateRequest,
  OrderItemCreateRequest,
  OrderUpdateRequest,
  OrderStatusUpdateRequest,
  OrderFilter,
  OrderPaginatedResponse,
} from "@/types/orders";

// ─────────────────────────────────────────────────────────────
// Orders API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/core/orders";

export async function getOrders(
  filter: OrderFilter = {},
): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  const url = query ? `${BASE_PATH}?${query}` : BASE_PATH;

  const response = await apiClient.get<PaginatedResponse<Order>>(url);
  return response.data;
}

export async function getOrderById(orderId: number): Promise<Order> {
  const response = await apiClient.get<Order>(`${BASE_PATH}/${orderId}`);
  return response.data;
}

export async function createOrder(data: OrderCreateRequest): Promise<Order> {
  const response = await apiClient.post<Order>(BASE_PATH, data);
  return response.data;
}

export async function updateOrder(
  orderId: number,
  data: OrderUpdateRequest,
): Promise<Order> {
  const response = await apiClient.put<Order>(`${BASE_PATH}/${orderId}`, data);
  return response.data;
}

export async function updateOrderStatus(
  orderId: number,
  data: OrderStatusUpdateRequest,
): Promise<Order> {
  const response = await apiClient.put<Order>(
    `${BASE_PATH}/${orderId}/status`,
    data,
  );
  return response.data;
}

export async function cancelOrder(orderId: number): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${orderId}`);
}
