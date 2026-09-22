import { PaginatedResponse } from "./paginated-response";

export type DeliveryAppointmentStatus = "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "MISSED" | "RESCHEDULED";

export interface DeliveryAppointment {
  appointmentId: number;
  appointmentNumber: string;
  shipmentId?: number;
  shipmentNumber?: string;
  warehouseId: number;
  warehouseCode?: string;
  status: DeliveryAppointmentStatus;
  scheduledStart: string;
  scheduledEnd: string;
  actualArrival?: string;
  actualDeparture?: string;
  dockNumber?: string;
  contactName?: string;
  contactPhone?: string;
  specialInstructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAppointmentFilter {
  status?: DeliveryAppointmentStatus;
  warehouseId?: number;
  shipmentId?: number;
  fromDate?: string;
  toDate?: string;
  pageNo?: number;
  pageOffset?: number;
}

export type DeliveryAppointmentPaginatedResponse = PaginatedResponse<DeliveryAppointment>;
