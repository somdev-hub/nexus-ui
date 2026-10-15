import apiClient from '@/lib/api-client';
import type {
    MockPayInitiateInput,
    MockPayment,
    MockReceipt,
    SuiteIntent,
    SuitePayInput,
} from '@/types/payments';

const BASE = '/iam/pms/mock-payments';
const SUITE = '/iam/pms/suite-payments';

function orgId(): string | undefined {
    try {
        const raw = localStorage.getItem('auth_user');
        if (!raw) return undefined;
        const u = JSON.parse(raw) as {
            organizationId?: string;
            orgId?: string;
        };
        return u.organizationId || u.orgId;
    } catch {
        return undefined;
    }
}

export async function initiateMockPayment(
    input: MockPayInitiateInput,
    payerRole: string,
    idempotencyKey?: string
): Promise<MockPayment> {
    const res = await apiClient.post<MockPayment>(
        `${BASE}/initiate`,
        {
            ...input,
            currency: input.currency ?? 'INR',
            orgId: input.orgId ?? orgId(),
            payerRole,
        },
        idempotencyKey
            ? { headers: { 'Idempotency-Key': idempotencyKey } }
            : undefined
    );
    return res.data;
}

export async function getMockPayment(id: number): Promise<MockPayment> {
    const res = await apiClient.get<MockPayment>(`${BASE}/${id}`);
    return res.data;
}

export async function listMockPayments(params: {
    status?: string;
    invoiceId?: number;
    page?: number;
    size?: number;
}): Promise<{ content: MockPayment[]; totalElements: number }> {
    const q = new URLSearchParams();
    const oid = orgId();
    if (oid) q.append('orgId', oid);
    if (params.status) q.append('status', params.status);
    if (params.invoiceId !== undefined)
        q.append('invoiceId', String(params.invoiceId));
    q.append('page', String(params.page ?? 0));
    q.append('size', String(params.size ?? 20));
    const res = await apiClient.get(`${BASE}?${q.toString()}`);
    return res.data;
}

export async function getMockReceipt(id: number): Promise<MockReceipt> {
    const res = await apiClient.get<MockReceipt>(`${BASE}/${id}/receipt`);
    return res.data;
}

export function newIdempotencyKey(invoiceId: number | string): string {
    const rand =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return `inv-${invoiceId}-${rand}`;
}

// ── Suite intents (dedicated /payments checkout) ─────────────────

/** Deterministic key per invoice so double-clicks / retries reuse one intent row. */
export function suiteIdempotencyKey(invoiceId: number | string): string {
    return `suite-inv-${invoiceId}`;
}

export async function createSuiteIntent(input: {
    amount: number;
    currency?: string;
    description?: string;
    invoiceId?: number;
    invoiceNumber?: string;
    purchaseOrderId?: number;
    payerRole: string;
    idempotencyKey?: string;
    quoteRef?: string;
    partnershipId?: number;
}): Promise<SuiteIntent> {
    const key =
        input.idempotencyKey ??
        (input.quoteRef
            ? `suite-quote-${input.quoteRef}`
            : suiteIdempotencyKey(input.invoiceId ?? 'adhoc'));
    const res = await apiClient.post<SuiteIntent>(
        `${SUITE}/intents`,
        {
            amount: input.amount,
            currency: input.currency ?? 'INR',
            description: input.description,
            invoiceId: input.invoiceId,
            invoiceNumber: input.invoiceNumber,
            purchaseOrderId: input.purchaseOrderId,
            orgId: orgId(),
            payerRole: input.payerRole,
            quoteRef: input.quoteRef,
            partnershipId: input.partnershipId,
        },
        { headers: { 'Idempotency-Key': key } }
    );
    return res.data;
}

export async function getSuiteIntentByRef(ref: string): Promise<SuiteIntent> {
    const res = await apiClient.get<SuiteIntent>(
        `${SUITE}/intents/by-ref?ref=${encodeURIComponent(ref)}`
    );
    return res.data;
}

export async function paySuiteIntent(
    input: SuitePayInput
): Promise<SuiteIntent> {
    const res = await apiClient.post<SuiteIntent>(
        `${SUITE}/intents/pay-by-ref`,
        input
    );
    return res.data;
}

export async function cancelSuiteIntent(ref: string): Promise<SuiteIntent> {
    const res = await apiClient.post<SuiteIntent>(
        `${SUITE}/intents/by-ref/cancel`,
        { ref }
    );
    return res.data;
}

export async function listSuiteIntents(params: {
    status?: string;
    page?: number;
    size?: number;
}): Promise<{ content: SuiteIntent[]; totalElements: number }> {
    const q = new URLSearchParams();
    const oid = orgId();
    if (oid) q.append('orgId', oid);
    if (params.status) q.append('status', params.status);
    q.append('page', String(params.page ?? 0));
    q.append('size', String(params.size ?? 20));
    const res = await apiClient.get(`${SUITE}/intents?${q.toString()}`);
    return res.data;
}
