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
    term?: string;
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
        term: raw.partnershipTerm ?? raw.term ?? raw.title ?? '',
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
