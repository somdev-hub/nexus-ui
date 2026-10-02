import { PaginatedResponse } from './paginated-response';

export interface LogisticsPartner {
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
    invitationId?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
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
    sortDirection?: 'asc' | 'desc';
}

export type LogisticsPartnerPaginatedResponse =
    PaginatedResponse<LogisticsPartner>;
