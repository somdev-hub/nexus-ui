import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  SupplierOrder,
  SupplierOrderFilter,
  SupplierQualityCertificate,
  QualityCertFilter,
  OrderSummary,
  PartialShipmentRequest,
  PartialShipmentResponse,
  OrderFulfillmentUpdate,
} from "@/types/supplier";

const BASE = "/iam/core/supplier/orders";
const QC_BASE = "/iam/core/supplier/quality-certificates";

export async function getSupplierOrders(
  filter: SupplierOrderFilter = {},
): Promise<PaginatedResponse<SupplierOrder>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${BASE}/all?${q}` : `${BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<SupplierOrder>>(url);
  return res.data;
}
export async function getSupplierOrderById(id: number): Promise<SupplierOrder> {
  const res = await apiClient.get<SupplierOrder>(`${BASE}/${id}`);
  return res.data;
}
export async function acknowledgeOrder(
  id: number,
  confirmedDeliveryDate?: string,
  notes?: string,
): Promise<SupplierOrder> {
  const p = new URLSearchParams();
  if (confirmedDeliveryDate) p.append("confirmedDeliveryDate", confirmedDeliveryDate);
  if (notes) p.append("notes", notes);
  const q = p.toString();
  const url = q ? `${BASE}/${id}/acknowledge?${q}` : `${BASE}/${id}/acknowledge`;
  const res = await apiClient.put<SupplierOrder>(url, {});
  return res.data;
}
export async function updateOrderFulfillment(
  id: number,
  data: OrderFulfillmentUpdate,
): Promise<SupplierOrder> {
  const res = await apiClient.put<SupplierOrder>(`${BASE}/${id}/fulfillment`, data);
  return res.data;
}
export async function createPartialShipment(
  purchaseOrderId: number,
  data: PartialShipmentRequest,
): Promise<PartialShipmentResponse> {
  const res = await apiClient.post<PartialShipmentResponse>(
    `${BASE}/${purchaseOrderId}/partial-shipment`,
    data,
  );
  return res.data;
}
export async function getOrderSummary(): Promise<OrderSummary> {
  const res = await apiClient.get<OrderSummary>(`${BASE}/summary`);
  return res.data;
}

// Quality certs
export async function getQualityCerts(
  filter: QualityCertFilter = {},
): Promise<PaginatedResponse<SupplierQualityCertificate>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${QC_BASE}/all?${q}` : `${QC_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<SupplierQualityCertificate>>(url);
  return res.data;
}
export async function createQualityCert(
  data: Partial<SupplierQualityCertificate>,
): Promise<SupplierQualityCertificate> {
  const res = await apiClient.post<SupplierQualityCertificate>(`${QC_BASE}/create`, data);
  return res.data;
}
export async function deleteQualityCert(id: number): Promise<void> {
  await apiClient.delete(`${QC_BASE}/${id}`);
}
