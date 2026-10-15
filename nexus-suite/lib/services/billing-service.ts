import apiClient from '@/lib/api-client';
import type {
    MarkPaidResult,
    OpenTrip,
    BillingStatement,
    PayQuote,
} from '@/types/finances';

const BASE = '/iam/core/supplier';

// ── open trips + statements (supplier + logistics share core) ──
export async function getOpenTrips(
    partnershipId: number,
    scope: 'supplier' | 'logistics' = 'supplier'
): Promise<{ partnershipId: number; termType?: string; trips: OpenTrip[] }> {
    const base =
        scope === 'supplier' ? BASE : '/iam/core/logistics';
    const res = await apiClient.get(
        `${base}/billing/open-trips?partnershipId=${partnershipId}`
    );
    return res.data;
}

export async function getStatements(
    partnershipId: number,
    scope: 'supplier' | 'logistics' = 'supplier'
): Promise<{
    partnershipId: number;
    frequency?: string;
    statements: BillingStatement[];
}> {
    const base =
        scope === 'supplier' ? BASE : '/iam/core/logistics';
    const res = await apiClient.get(
        `${base}/billing/statements?partnershipId=${partnershipId}`
    );
    return res.data;
}

// ── quotes (supplier initiates) ───────────────────────────
export async function createBillingQuote(input: {
    partnershipId: number;
    kind: 'TRIP_BATCH' | 'STATEMENT';
    shipmentIds?: number[];
    cycleId?: string;
    idempotencyKey?: string;
}): Promise<PayQuote> {
    const res = await apiClient.post<PayQuote>(
        `${BASE}/billing/quotes`,
        input
    );
    return res.data;
}

export async function getBillingQuote(quoteRef: string): Promise<PayQuote> {
    const res = await apiClient.get<PayQuote>(
        `${BASE}/billing/quotes/${encodeURIComponent(quoteRef)}`
    );
    return res.data;
}

export async function markBillingQuotePaid(input: {
    quoteRef: string;
    amountPaid: number;
    intentRef?: string;
}): Promise<MarkPaidResult> {
    const res = await apiClient.post<MarkPaidResult>(
        `${BASE}/billing/mark-paid`,
        input
    );
    return res.data;
}

export function billingIdempotencyKey(
    partnershipId: number | string,
    suffix: string
): string {
    const rand =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return `logi-${partnershipId}-${suffix}-${rand}`;
}
