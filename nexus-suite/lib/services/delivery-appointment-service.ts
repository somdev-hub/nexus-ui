import apiClient from "@/lib/api-client";
import type { DeliveryAppointment, DeliveryAppointmentFilter, DeliveryAppointmentPaginatedResponse } from "@/types/delivery-appointment";

const BASE = "/iam/core/retailer/delivery-appointments";
function q(filter: Record<string, unknown>) {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, String(v)); });
  return p.toString();
}

export async function getDeliveryAppointments(filter: DeliveryAppointmentFilter = {}): Promise<DeliveryAppointmentPaginatedResponse> {
  const query = q(filter as Record<string, unknown>);
  const url = query ? `${BASE}?${query}` : `${BASE}`;
  const res = await apiClient.get<DeliveryAppointmentPaginatedResponse>(url);
  return res.data;
}

export async function getDeliveryAppointmentById(id: number): Promise<DeliveryAppointment> {
  const res = await apiClient.get<DeliveryAppointment>(`${BASE}/${id}`);
  return res.data;
}

export async function createDeliveryAppointment(data: Record<string, unknown>): Promise<DeliveryAppointment> {
  const res = await apiClient.post<DeliveryAppointment>(`${BASE}`, data);
  return res.data;
}

export async function transitionDeliveryAppointment(id: number, newStatus: string, params?: Record<string, unknown>): Promise<DeliveryAppointment> {
  const res = await apiClient.post<DeliveryAppointment>(`${BASE}/${id}/status?newStatus=${newStatus}`, params || {});
  return res.data;
}

export async function getDeliveryAppointmentSummary(): Promise<Record<string, unknown>> {
  const res = await apiClient.get<Record<string, unknown>>(`${BASE}/summary`);
  return res.data;
}
