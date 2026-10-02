import apiClient from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/paginated-response';

// ─────────────────────────────────────────────────────────────
// Org partnerships (supplier/logistics view): partnerships where the
// caller's org is on EITHER side (primary or secondary).
// Backend: Core GET /core/partnerships/mine via IAM passthroughs.
// Response shape is Core PartnershipDto (primaryOrg/secondaryOrg ids,
// partnershipTerm, status, dates) — NOT the retailer Partnership type.
// ─────────────────────────────────────────────────────────────

export interface OrgPartnership {
    partnershipId: number;
    primaryOrgId?: number;
    secondaryOrgId?: number;
    primaryOrgName?: string;
    secondaryOrgName?: string;
    term?: string;
    discountRate?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    agreementDocumentId?: number;
    invitationId?: number;
    [key: string]: unknown;
}

function toOrgPartnership(raw: any): OrgPartnership {
    return {
        partnershipId: raw.partnershipId ?? raw.id ?? 0,
        primaryOrgId: raw.primaryOrg ?? raw.primaryOrgId,
        secondaryOrgId: raw.secondaryOrg ?? raw.secondaryOrgId,
        primaryOrgName: raw.primaryOrgName,
        secondaryOrgName: raw.secondaryOrgName,
        term: raw.partnershipTerm ?? raw.term ?? raw.title ?? '',
        discountRate: raw.discountRate,
        status: raw.status ?? '',
        startDate: raw.startDate ?? '',
        endDate: raw.endDate,
        agreementDocumentId: raw.agreementDocumentId,
        invitationId: raw.invitationId,
        ...raw,
    };
}

/** Counterparty org id relative to `ownOrgId`. */
export function counterpartyOf(
    partnership: OrgPartnership,
    ownOrgId?: number | string | null
): number | undefined {
    const own = Number(ownOrgId);
    if (Number.isFinite(own)) {
        if (
            partnership.primaryOrgId !== undefined &&
            Number(partnership.primaryOrgId) !== own
        )
            return Number(partnership.primaryOrgId);
        if (
            partnership.secondaryOrgId !== undefined &&
            Number(partnership.secondaryOrgId) !== own
        )
            return Number(partnership.secondaryOrgId);
    }
    return partnership.secondaryOrgId ?? partnership.primaryOrgId ?? undefined;
}

/** Display label for the counterparty: name when known, else Org #id. */
export function counterpartyLabelOf(
    partnership: OrgPartnership,
    ownOrgId?: number | string | null
): string {
    const own = Number(ownOrgId);
    let id = counterpartyOf(partnership, ownOrgId);
    let name: string | undefined;
    if (
        Number.isFinite(own) &&
        partnership.primaryOrgId !== undefined &&
        Number(partnership.primaryOrgId) !== own
    ) {
        name = partnership.primaryOrgName;
    } else if (
        Number.isFinite(own) &&
        partnership.secondaryOrgId !== undefined &&
        Number(partnership.secondaryOrgId) !== own
    ) {
        name = partnership.secondaryOrgName;
    } else {
        name = partnership.secondaryOrgName ?? partnership.primaryOrgName;
        id =
            id ??
            partnership.secondaryOrgId ??
            partnership.primaryOrgId ??
            undefined;
    }
    if (name) return id !== undefined ? `${name} (#${id})` : name;
    return id !== undefined ? `Org #${id}` : '—';
}

async function getOrgPartnerships(
    basePath: string
): Promise<PaginatedResponse<OrgPartnership>> {
    const response = await apiClient.get<unknown>(
        `${basePath}/all?pageNo=0&pageOffset=20`
    );
    const data = response.data as Partial<PaginatedResponse<any>>;
    const content = Array.isArray(data) ? data : (data.content ?? []);
    return {
        content: (content as any[]).map(toOrgPartnership),
        pageNo: 0,
        pageOffset: content.length,
        totalElements: Array.isArray(data)
            ? content.length
            : (data.totalElements ?? content.length),
        totalPages: 1,
        last: true,
        first: true,
        empty: content.length === 0,
        numberOfElements: content.length,
        size: content.length,
        sort: { sorted: false, unsorted: true, empty: true },
    };
}

export function getSupplierPartnerships(): Promise<
    PaginatedResponse<OrgPartnership>
> {
    return getOrgPartnerships('/iam/core/supplier/partnerships');
}

export function getLogisticsPartnerships(): Promise<
    PaginatedResponse<OrgPartnership>
> {
    return getOrgPartnerships('/iam/core/logistics/partnerships');
}

export interface PartnershipEditPayload {
    partnershipTerm?: string;
    discountRate?: number;
    endDate?: string;
}

async function updateOrgPartnership(
    basePath: string,
    partnershipId: number,
    data: PartnershipEditPayload
): Promise<OrgPartnership> {
    const response = await apiClient.put<any>(
        `${basePath}/${partnershipId}/update`,
        data
    );
    return toOrgPartnership(response.data);
}

export function updateSupplierPartnership(
    partnershipId: number,
    data: PartnershipEditPayload
): Promise<OrgPartnership> {
    return updateOrgPartnership(
        '/iam/core/supplier/partnerships',
        partnershipId,
        data
    );
}

export function updateLogisticsPartnership(
    partnershipId: number,
    data: PartnershipEditPayload
): Promise<OrgPartnership> {
    return updateOrgPartnership(
        '/iam/core/logistics/partnerships',
        partnershipId,
        data
    );
}

async function updateOrgPartnershipStatus(
    basePath: string,
    partnershipId: number,
    status: string
): Promise<OrgPartnership> {
    const response = await apiClient.post<any>(
        `${basePath}/${partnershipId}/status`,
        { status }
    );
    return toOrgPartnership(response.data);
}

export function updateSupplierPartnershipStatus(
    partnershipId: number,
    status: string
): Promise<OrgPartnership> {
    return updateOrgPartnershipStatus(
        '/iam/core/supplier/partnerships',
        partnershipId,
        status
    );
}

export function updateLogisticsPartnershipStatus(
    partnershipId: number,
    status: string
): Promise<OrgPartnership> {
    return updateOrgPartnershipStatus(
        '/iam/core/logistics/partnerships',
        partnershipId,
        status
    );
}

