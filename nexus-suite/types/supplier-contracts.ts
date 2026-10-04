import { PaginatedResponse } from './paginated-response';

export type SupplierContractType =
    | 'STANDARD'
    | 'BLANKET'
    | 'FRAMEWORK'
    | 'CONSIGNMENT'
    | 'VMI';

export type SupplierDecisionStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'AMENDMENTS_REQUESTED';

export type SupplierContractStatus =
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'ACTIVE'
    | 'EXPIRED'
    | 'TERMINATED'
    | 'SUSPENDED'
    | 'RENEWAL_PENDING';

export interface SupplierContract {
    contractId: number;
    accountId?: number;
    supplierId: number;
    supplierName?: string;
    contractNumber: string;
    contractName: string;
    description?: string;
    contractType: SupplierContractType;
    status: SupplierContractStatus;
    effectiveDate: string;
    expiryDate?: string;
    autoRenewal?: boolean;
    renewalNoticeDays?: number;
    baseCurrency?: string;
    paymentTermsDays?: number;
    incoterms?: string;
    contractAmount?: number;
    retailerOrgName?: string;
    slaLeadTimeDays?: number;
    slaOnTimeDeliveryPct?: number;
    slaQualityDefectRatePct?: number;
    slaResponseTimeHours?: number;
    volumeDiscountTier1Qty?: number;
    volumeDiscountTier1Pct?: number;
    volumeDiscountTier2Qty?: number;
    volumeDiscountTier2Pct?: number;
    volumeDiscountTier3Qty?: number;
    volumeDiscountTier3Pct?: number;
    dmsDocumentId?: string;
    dmsDocumentName?: string;
    dmsDocumentVersion?: number;
    documentId?: number;
    documentUrl?: string;
    documentName?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    supplierStatus?: SupplierDecisionStatus;
    supplierComments?: string;
    supplierDecidedAt?: string;
    supplierDecidedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    [key: string]: unknown;
}

export interface SupplierContractCreateRequest {
    accountId: number;
    supplierId: number;
    contractNumber: string;
    contractName: string;
    description?: string;
    contractType: SupplierContractType;
    status: SupplierContractStatus;
    effectiveDate: string;
    expiryDate?: string;
    autoRenewal?: boolean;
    renewalNoticeDays?: number;
    baseCurrency?: string;
    paymentTermsDays?: number;
    incoterms?: string;
    contractAmount?: number;
}

export interface SupplierContractUpdateRequest {
    supplierId?: number;
    contractNumber?: string;
    contractName?: string;
    description?: string;
    contractType?: SupplierContractType;
    status?: SupplierContractStatus;
    effectiveDate?: string;
    expiryDate?: string;
    autoRenewal?: boolean;
    renewalNoticeDays?: number;
    baseCurrency?: string;
    paymentTermsDays?: number;
    incoterms?: string;
}

export interface SupplierContractStatusUpdateRequest {
    status: SupplierContractStatus;
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
    accountId?: number;
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
    pageNo?: number;
    pageOffset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export type SupplierContractPaginatedResponse =
    PaginatedResponse<SupplierContract>;
