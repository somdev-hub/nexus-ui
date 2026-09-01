import { PaginatedResponse } from "./paginated-response";

export interface SupplierContract {
  contractId: number;
  contractNumber: string;
  supplierId: number;
  supplierName: string;
  retailerOrgId: number;
  retailerOrgName: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING_APPROVAL";
  autoRenewal: boolean;
  renewalPeriodDays: number;
  paymentTerms: string;
  currency: string;
  totalValue: number;
  documentId?: number;
  documentUrl?: string;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SupplierContractCreateRequest {
  supplierId: number;
  retailerOrgId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  autoRenewal: boolean;
  renewalPeriodDays: number;
  paymentTerms: string;
  currency: string;
  totalValue: number;
}

export interface SupplierContractUpdateRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  autoRenewal?: boolean;
  renewalPeriodDays?: number;
  paymentTerms?: string;
  currency?: string;
  totalValue?: number;
}

export interface SupplierContractStatusUpdateRequest {
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING_APPROVAL";
}

export interface SupplierContractApprovalRequest {
  approved: boolean;
  remarks?: string;
}

export interface SupplierContractDocumentResponse {
  documentId: number;
  contractId: number;
  documentName: string;
  documentUrl: string;
  documentType: string;
  documentSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SupplierContractSummary {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  draftContracts: number;
  totalValue: number;
}

export interface SupplierContractFilter {
  status?: string;
  supplierId?: number;
  retailerOrgId?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  pageNo?: number;
  pageOffset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export type SupplierContractPaginatedResponse =
  PaginatedResponse<SupplierContract>;
