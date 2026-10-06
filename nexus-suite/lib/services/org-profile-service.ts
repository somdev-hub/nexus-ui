import apiClient from '@/lib/api-client';

// ─────────────────────────────────────────────────────────────
// Organization profile (org bank/account details + addresses).
// Served by the HR module via the IAM gateway; the buyer org's
// addresses feed PO shipping/billing selection.
// ─────────────────────────────────────────────────────────────

export interface OrgAddress {
    orgAddressId?: number;
    orgId?: number;
    label?: string;
    addressType?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    contactName?: string;
    contactPhone?: string;
    isDefaultBilling?: boolean;
    isDefaultShipping?: boolean;
    isActive?: boolean;
}

function toAddressList(data: unknown): OrgAddress[] {
    if (Array.isArray(data)) return data as OrgAddress[];
    if (data && typeof data === 'object') {
        const content = (data as { content?: unknown }).content;
        if (Array.isArray(content)) return content as OrgAddress[];
    }
    return [];
}

export async function getOrgAddresses(
    orgId: number | string
): Promise<OrgAddress[]> {
    const res = await apiClient.get<unknown>(
        `/iam/hr/orgs/${orgId}/addresses`
    );
    return toAddressList(res.data);
}

/** Single-line display text for an org address (also stored on the PO). */
export function formatOrgAddress(a: OrgAddress): string {
    const parts: string[] = [];
    const push = (v?: string | null) => {
        const t = (v ?? '').trim();
        if (t) parts.push(t);
    };
    push(a.label);
    push(a.addressLine1);
    push(a.addressLine2);
    const cityLine = [a.city, a.state, a.pincode]
        .map((v) => (v ?? '').trim())
        .filter(Boolean)
        .join(', ');
    push(cityLine || undefined);
    push(a.country);
    const contact = [a.contactName, a.contactPhone]
        .map((v) => (v ?? '').trim())
        .filter(Boolean)
        .join(' ');
    const joined = parts.join(', ');
    if (!contact) return joined;
    return joined ? `${joined} (Contact: ${contact})` : `Contact: ${contact}`;
}

/** Short label for dropdown options. */
export function orgAddressOptionLabel(a: OrgAddress): string {
    const main = (a.label ?? '').trim() || `Address #${a.orgAddressId ?? ''}`;
    const city = [a.city, a.pincode].map((v) => (v ?? '').trim()).filter(Boolean).join(', ');
    const kind = (a.addressType ?? '').trim();
    return [main, city, kind].filter(Boolean).join(' · ');
}
