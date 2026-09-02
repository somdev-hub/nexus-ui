import { PaginatedResponse } from "./paginated-response";

export interface LogisticsPartner {
  partnershipId: number;
  partnershipNumber: string;
  retailerOrgId: number;
  retailerOrgName: string;
  logisticsOrgId: number;
  logisticsOrgName: string;
  partnershipType: "LOGISTICS";
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "REJECTED";
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  agreementDocumentId?: number;
  agreementDocumentUrl?: string;
  agreementDocumentName?: string;
  termsAndConditions: string;
  autoRenewal: boolean;
  renewalPeriodDays: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface LogisticsPartnerCreateRequest {
  retailerOrgId: number;
  logisticsOrgId: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  termsAndConditions: string;
  autoRenewal: boolean;
  renewalPeriodDays: number;
}

export interface LogisticsPartnerUpdateRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  termsAndConditions?: string;
  autoRenewal?: boolean;
  renewalPeriodDays?: number;
}

export interface LogisticsPartnerFilter {
  status?: string;
  retailerOrgId?: number;
  logisticsOrgId?: number;
  pageNo?: number;
  pageOffset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export type LogisticsPartnerPaginatedResponse =
  PaginatedResponse<LogisticsPartner>;
