import { PaginatedResponse } from "./paginated-response";

export interface Partnership {
  partnershipId: number;
  partnershipNumber: string;
  retailerOrgId: number;
  retailerOrgName: string;
  supplierOrgId: number;
  supplierOrgName: string;
  partnershipType: "SUPPLIER" | "LOGISTICS" | "DISTRIBUTOR" | "STRATEGIC";
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

export interface PartnershipCreateRequest {
  retailerOrgId: number;
  supplierOrgId: number;
  partnershipType: "SUPPLIER" | "LOGISTICS" | "DISTRIBUTOR" | "STRATEGIC";
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  termsAndConditions: string;
  autoRenewal: boolean;
  renewalPeriodDays: number;
}

export interface PartnershipUpdateRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  termsAndConditions?: string;
  autoRenewal?: boolean;
  renewalPeriodDays?: number;
}

export interface PartnershipStatusUpdateRequest {
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "REJECTED";
}

export interface PartnershipAgreementResponse {
  documentId: number;
  partnershipId: number;
  documentName: string;
  documentUrl: string;
  documentType: string;
  documentSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface PartnershipFilter {
  status?: string;
  partnershipType?: string;
  retailerOrgId?: number;
  supplierOrgId?: number;
  pageNo?: number;
  pageOffset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export type PartnershipPaginatedResponse = PaginatedResponse<Partnership>;
