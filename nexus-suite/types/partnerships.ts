import { PaginatedResponse } from './paginated-response';

export interface Partnership {
    partnershipId: number;
    primaryOrg?: number;
    secondaryOrg?: number;
    primaryOrgName?: string;
    secondaryOrgName?: string;
    partnershipType?: string;
    partnershipTerm?: string;
    discountRate?: number;
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'REJECTED';
    startDate?: string;
    endDate?: string;
    revivedDate?: string;
    agreementDocumentId?: number;
    agreementDocumentUrl?: string;
    invitationId?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface PartnershipCreateRequest {
    retailerOrgId: number;
    supplierOrgId: number;
    partnershipType: 'SUPPLIER' | 'LOGISTICS' | 'DISTRIBUTOR' | 'STRATEGIC';
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
    discountRate?: number;
}

export interface PartnershipStatusUpdateRequest {
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'REJECTED';
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
    sortDirection?: 'asc' | 'desc';
}

export type PartnershipPaginatedResponse = PaginatedResponse<Partnership>;
