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
    proposedTerms?: string;
    retailerSupplierId?: number;
    partnershipId?: number;
    status?: PartnershipInvitationStatus | string;
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
