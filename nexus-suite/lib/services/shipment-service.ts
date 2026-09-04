import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  Shipment,
  ShipmentCreateRequest,
  ShipmentUpdateRequest,
  ShipmentFilter,
  ShipmentStop,
  ShipmentStopCreateRequest,
  ShipmentStopUpdateRequest,
  TrackingEvent,
  TrackingEventCreateRequest,
  ShipmentDocument,
  ShipmentDocumentCreateRequest,
  FreightCostUpdateRequest,
  ShipmentPaginatedResponse,
  ShipmentStopPaginatedResponse,
  TrackingEventPaginatedResponse,
  ShipmentDocumentPaginatedResponse,
  ShipmentStatus,
  ShipmentMode,
  StopType,
  StopStatus,
  TrackingEventType,
  ShipmentDocumentType,
} from "@/types/shipment";

// Re-export types for consumers
export type {
  Shipment,
  ShipmentCreateRequest,
  ShipmentUpdateRequest,
  ShipmentFilter,
  ShipmentStop,
  ShipmentStopCreateRequest,
  ShipmentStopUpdateRequest,
  TrackingEvent,
  TrackingEventCreateRequest,
  ShipmentDocument,
  ShipmentDocumentCreateRequest,
  FreightCostUpdateRequest,
  ShipmentPaginatedResponse,
  ShipmentStopPaginatedResponse,
  TrackingEventPaginatedResponse,
  ShipmentDocumentPaginatedResponse,
  ShipmentStatus,
  ShipmentMode,
  StopType,
  StopStatus,
  TrackingEventType,
  ShipmentDocumentType,
};

// ─────────────────────────────────────────────────────────────
// Shipment API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/iam/retailer/shipments";

function buildQueryParams(filter: ShipmentFilter = {}): string {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

export async function getShipments(
  filter: ShipmentFilter = {},
): Promise<ShipmentPaginatedResponse> {
  const query = buildQueryParams(filter);
  const url = query ? `${BASE_PATH}?${query}` : BASE_PATH;
  const response = await apiClient.get<ShipmentPaginatedResponse>(url);
  return response.data;
}

export async function getShipmentById(shipmentId: number): Promise<Shipment> {
  const response = await apiClient.get<Shipment>(`${BASE_PATH}/${shipmentId}`);
  return response.data;
}

export async function createShipment(
  data: ShipmentCreateRequest,
): Promise<Shipment> {
  const response = await apiClient.post<Shipment>(BASE_PATH, data);
  return response.data;
}

export async function updateShipment(
  shipmentId: number,
  data: ShipmentUpdateRequest,
): Promise<Shipment> {
  const response = await apiClient.put<Shipment>(
    `${BASE_PATH}/${shipmentId}`,
    data,
  );
  return response.data;
}

export async function deleteShipment(shipmentId: number): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${shipmentId}`);
}

export async function transitionShipmentStatus(
  shipmentId: number,
  newStatus: string,
  params?: Record<string, unknown>,
): Promise<Shipment> {
  const queryParams = new URLSearchParams();
  queryParams.append("newStatus", newStatus);
  const url = `${BASE_PATH}/${shipmentId}/status?${queryParams.toString()}`;
  const response = await apiClient.post<Shipment>(url, params || {});
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Shipment Stops API Service
// ─────────────────────────────────────────────────────────────

export async function getShipmentStops(
  shipmentId: number,
): Promise<ShipmentStop[]> {
  const response = await apiClient.get<ShipmentStop[]>(
    `${BASE_PATH}/${shipmentId}/stops`,
  );
  return response.data;
}

export async function addShipmentStop(
  shipmentId: number,
  data: ShipmentStopCreateRequest,
): Promise<ShipmentStop> {
  const response = await apiClient.post<ShipmentStop>(
    `${BASE_PATH}/${shipmentId}/stops`,
    data,
  );
  return response.data;
}

export async function updateShipmentStop(
  shipmentId: number,
  stopId: number,
  data: ShipmentStopUpdateRequest,
): Promise<ShipmentStop> {
  const response = await apiClient.put<ShipmentStop>(
    `${BASE_PATH}/${shipmentId}/stops/${stopId}`,
    data,
  );
  return response.data;
}

export async function deleteShipmentStop(
  shipmentId: number,
  stopId: number,
): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${shipmentId}/stops/${stopId}`);
}

export async function transitionShipmentStopStatus(
  shipmentId: number,
  stopId: number,
  newStatus: string,
  params?: Record<string, unknown>,
): Promise<ShipmentStop> {
  const queryParams = new URLSearchParams();
  queryParams.append("newStatus", newStatus);
  const url = `${BASE_PATH}/${shipmentId}/stops/${stopId}/status?${queryParams.toString()}`;
  const response = await apiClient.post<ShipmentStop>(url, params || {});
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Tracking Events API Service
// ─────────────────────────────────────────────────────────────

export async function getTrackingEvents(
  shipmentId: number,
  pageNo = 0,
  pageOffset = 20,
): Promise<TrackingEventPaginatedResponse> {
  const response = await apiClient.get<TrackingEventPaginatedResponse>(
    `${BASE_PATH}/${shipmentId}/tracking?pageNo=${pageNo}&pageOffset=${pageOffset}`,
  );
  return response.data;
}

export async function getLatestTrackingEvent(
  shipmentId: number,
): Promise<TrackingEvent> {
  const response = await apiClient.get<TrackingEvent>(
    `${BASE_PATH}/${shipmentId}/tracking/latest`,
  );
  return response.data;
}

export async function addTrackingEvent(
  shipmentId: number,
  data: TrackingEventCreateRequest,
): Promise<TrackingEvent> {
  const response = await apiClient.post<TrackingEvent>(
    `${BASE_PATH}/${shipmentId}/tracking`,
    data,
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Shipment Documents API Service
// ─────────────────────────────────────────────────────────────

export async function getShipmentDocuments(
  shipmentId: number,
): Promise<ShipmentDocument[]> {
  const response = await apiClient.get<ShipmentDocument[]>(
    `${BASE_PATH}/${shipmentId}/documents`,
  );
  return response.data;
}

export async function uploadShipmentDocument(
  shipmentId: number,
  file: File,
  documentType?: string,
  documentName?: string,
  remarks?: string,
): Promise<ShipmentDocument> {
  const formData = new FormData();
  formData.append("file", file);
  if (documentType) formData.append("documentType", documentType);
  if (documentName) formData.append("documentName", documentName);
  if (remarks) formData.append("remarks", remarks);

  const response = await apiClient.post<ShipmentDocument>(
    `${BASE_PATH}/${shipmentId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function deleteShipmentDocument(
  shipmentId: number,
  documentId: number,
): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${shipmentId}/documents/${documentId}`);
}

// ─────────────────────────────────────────────────────────────
// Freight Cost API Service
// ─────────────────────────────────────────────────────────────

export async function updateFreightCost(
  shipmentId: number,
  data: FreightCostUpdateRequest,
): Promise<Shipment> {
  const queryParams = new URLSearchParams();
  if (data.estimatedCost !== undefined)
    queryParams.append("estimatedCost", String(data.estimatedCost));
  if (data.actualCost !== undefined)
    queryParams.append("actualCost", String(data.actualCost));
  queryParams.append("currency", data.currency);

  const response = await apiClient.post<Shipment>(
    `${BASE_PATH}/${shipmentId}/freight-cost?${queryParams.toString()}`,
    {},
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Search & Utility API Service
// ─────────────────────────────────────────────────────────────

export async function searchShipments(
  searchDto: Record<string, unknown>,
  pageNo = 0,
  pageOffset = 20,
): Promise<ShipmentPaginatedResponse> {
  const response = await apiClient.post<ShipmentPaginatedResponse>(
    `${BASE_PATH}/search?pageNo=${pageNo}&pageOffset=${pageOffset}`,
    searchDto,
  );
  return response.data;
}

export async function getShipmentsRequiringAttention(
  pageNo = 0,
  pageOffset = 20,
): Promise<ShipmentPaginatedResponse> {
  const response = await apiClient.get<ShipmentPaginatedResponse>(
    `${BASE_PATH}/attention?pageNo=${pageNo}&pageOffset=${pageOffset}`,
  );
  return response.data;
}

export async function getOverdueShipments(
  pageNo = 0,
  pageOffset = 20,
): Promise<ShipmentPaginatedResponse> {
  const response = await apiClient.get<ShipmentPaginatedResponse>(
    `${BASE_PATH}/overdue?pageNo=${pageNo}&pageOffset=${pageOffset}`,
  );
  return response.data;
}

export async function getShipmentsByDateRange(
  startDate: string,
  endDate: string,
  pageNo = 0,
  pageOffset = 20,
): Promise<ShipmentPaginatedResponse> {
  const response = await apiClient.get<ShipmentPaginatedResponse>(
    `${BASE_PATH}/date-range?startDate=${startDate}&endDate=${endDate}&pageNo=${pageNo}&pageOffset=${pageOffset}`,
  );
  return response.data;
}
