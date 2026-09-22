import { PaginatedResponse } from "./paginated-response";

export type FreightInvoiceStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT_TO_PMS" | "PAID" | "DISPUTED" | "CANCELLED";

export interface FreightInvoice {
  freightInvoiceId: number;
  invoiceNumber: string;
  shipmentId: number;
  shipmentNumber?: string;
  retailerOrgId: number;
  logisticsOrgId?: number;
  status: FreightInvoiceStatus;
  freightCost: number;
  accessorialCharges: number;
  fuelSurcharge: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issuedDate?: string;
  dueDate?: string;
  paidDate?: string;
  pmsReferenceId?: string;
  pmsStatus?: string;
  discrepancyReason?: string;
  discrepancyAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FreightInvoiceFilter {
  status?: FreightInvoiceStatus;
  shipmentId?: number;
  logisticsOrgId?: number;
  issuedStart?: string;
  issuedEnd?: string;
  dueStart?: string;
  dueEnd?: string;
  pmsStatus?: string;
  pageNo?: number;
  pageOffset?: number;
}

export type FreightInvoicePaginatedResponse = PaginatedResponse<FreightInvoice>;
