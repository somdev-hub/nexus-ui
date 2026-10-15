import type { PaginatedResponse } from './paginated-response';

export type PartnershipInvitationContext =
    'RETAILER_SUPPLIER' | 'RETAILER_LOGISTICS' | 'SUPPLIER_LOGISTICS';

export type PartnershipInvitationStatus =
    'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';

export interface PartnershipInvitation {
    id: number;
    invitationId?: number;
    inviterOrgId?: number;
    inviterOrgName?: string;
    invitedOrgId?: number;
    invitedOrgName?: string;
    // Raw backend field names (Core PartnershipInvitationDto)
    invitedOrg?: number;
    invitingOrg?: number;
    partnershipContext?: PartnershipInvitationContext;
    partnershipTermType?: 'SHORT_TERM' | 'LONG_TERM' | string;
    proposedTerms?: string;
    validityStart?: string;
    validityEnd?: string;
    linkedCapacityForecastId?: number;
    desiredRoutesJson?: string;
    desiredCapacity?: number;
    desiredCapacityUnit?: string;
    retailerSupplierId?: number;
    partnershipId?: number;
    // LONG_TERM settlement frequency (trip-wise SHORT_TERM leaves it empty).
    paymentFrequency?: 'WEEKLY' | 'MONTHLY' | string;
    status?: PartnershipInvitationStatus | string;
    invitedAt?: string;
    expiresAt?: string;
    createdAt?: string;
    updatedAt?: string;
    // Flexible for backend shape variations
    [key: string]: unknown;
}

export interface PartnershipInvitationCreateRequest {
    invitedOrgId: number;
    partnershipContext:
        'RETAILER_SUPPLIER' | 'RETAILER_LOGISTICS' | 'SUPPLIER_LOGISTICS';
    proposedTerms?: string;
    retailerSupplierId?: number;
    // Supplier-logistics proposal term model.
    partnershipTermType?: 'SHORT_TERM' | 'LONG_TERM';
    validityStart?: string;
    validityEnd?: string;
    linkedCapacityForecastId?: number;
    // LONG_TERM wish list defined by the supplier.
    desiredRoutesJson?: string;
    desiredCapacity?: number;
    desiredCapacityUnit?: string;
    // LONG_TERM settlement frequency chosen by the supplier.
    // Omitted → backend defaults MONTHLY for multi-month validity.
    paymentFrequency?: 'WEEKLY' | 'MONTHLY';
}

export interface PartnershipInvitationRespondRequest {
    action: 'ACCEPT' | 'REJECT';
}

export interface PartnershipInvitationFilter {
    pageNo?: number;
    pageOffset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export type PartnershipInvitationPaginatedResponse =
    PaginatedResponse<PartnershipInvitation>;
