import apiClient from '@/lib/api-client';
import type {
    FinanceTxnPage,
    LogisticsFinanceSummary,
    RetailerFinanceSummary,
    SupplierFinanceSummary,
} from '@/types/finances';

export type FinancePeriod = '7d' | '30d' | '90d' | '12m' | 'all';

function periodQuery(period?: FinancePeriod): string {
    return period ? `?period=${encodeURIComponent(period)}` : '';
}

function txnQuery(params: {
    kind?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}): string {
    const q = new URLSearchParams();
    if (params.kind) q.append('kind', params.kind);
    if (params.status) q.append('status', params.status);
    if (params.search) q.append('search', params.search);
    if (params.from) q.append('from', params.from);
    if (params.to) q.append('to', params.to);
    q.append('page', String(params.page ?? 0));
    q.append('size', String(params.size ?? 10));
    return `?${q.toString()}`;
}

// ── retailer ──────────────────────────────────────────────
export async function getRetailerFinanceSummary(
    period?: FinancePeriod
): Promise<RetailerFinanceSummary> {
    const res = await apiClient.get<RetailerFinanceSummary>(
        `/iam/core/retailer/finance/summary${periodQuery(period)}`
    );
    return res.data;
}

export async function getRetailerTransactions(params: {
    kind?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}): Promise<FinanceTxnPage> {
    const res = await apiClient.get<FinanceTxnPage>(
        `/iam/core/retailer/finance/transactions${txnQuery(params)}`
    );
    return res.data;
}

// ── supplier ──────────────────────────────────────────────
export async function getSupplierFinanceSummary(
    period?: FinancePeriod
): Promise<SupplierFinanceSummary> {
    const res = await apiClient.get<SupplierFinanceSummary>(
        `/iam/core/supplier/finance/summary${periodQuery(period)}`
    );
    return res.data;
}

export async function getSupplierTransactions(params: {
    kind?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}): Promise<FinanceTxnPage> {
    const res = await apiClient.get<FinanceTxnPage>(
        `/iam/core/supplier/finance/transactions${txnQuery(params)}`
    );
    return res.data;
}

// ── logistics ─────────────────────────────────────────────
export async function getLogisticsFinanceSummary(
    period?: FinancePeriod
): Promise<LogisticsFinanceSummary> {
    const res = await apiClient.get<LogisticsFinanceSummary>(
        `/iam/core/logistics/finance/summary${periodQuery(period)}`
    );
    return res.data;
}

export async function getLogisticsTransactions(params: {
    kind?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}): Promise<FinanceTxnPage> {
    const res = await apiClient.get<FinanceTxnPage>(
        `/iam/core/logistics/finance/transactions${txnQuery(params)}`
    );
    return res.data;
}
