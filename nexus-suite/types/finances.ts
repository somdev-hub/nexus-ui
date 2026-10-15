export interface AgingBucket {
    bucket: string;
    count: number;
    amount: number;
}

export interface TrendPoint {
    period: string;
    amount: number;
}

export interface NameAmount {
    name: string;
    amount: number;
}

export interface RetailerFinanceSummary {
    totalSpend: number;
    paid: number;
    outstanding: number;
    overdue: number;
    openPoCount: number;
    aging: AgingBucket[];
    trend: TrendPoint[];
    topSuppliers: NameAmount[];
    funnel: { ordered: number; received: number; invoiced: number; paid: number };
}

export interface SupplierFinanceSummary {
    totalSales: number;
    received: number;
    outstanding: number;
    overdue: number;
    logisticsOpen: number;
    logisticsOverdue: number;
    openOrderCount: number;
    aging: AgingBucket[];
    trend: TrendPoint[];
    topBuyers: NameAmount[];
}

export interface LogisticsFinanceSummary {
    totalRevenue: number;
    deliveredShipments: number;
    totalShipments: number;
    revenuePerLane: Record<string, number>;
    revenuePerCustomer: Record<string, number>;
    openPayables: number;
    disputes: number;
    receivableOpen: number;
    receivableOverdue: number;
    penaltiesLevied: number;
    trend: TrendPoint[];
}

export interface FinanceTxn {
    kind: string;
    id: number;
    number?: string;
    party?: string | null;
    amount: number;
    currency?: string;
    status: string;
    date?: string;
    dueDate?: string;
    paidAt?: string | null;
    partnershipId?: number;
}

export interface FinanceTxnPage {
    content: FinanceTxn[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// ── logistics settlement ──────────────────────────────────

export type PayableLineKind = 'BASE_TRIP' | 'LATE_FEE' | 'CYCLE_PENALTY';

export interface OpenTrip {
    lineId: number;
    shipmentId: number;
    shipmentNumber?: string;
    lane?: string;
    deliveredAt?: string;
    baseAmount: number;
    paidAmount: number;
    outstandingBase: number;
    lateFeeAccrued: number;
    status: string;
}

export interface BillingStatement {
    cycleId: string;
    frequency: string;
    cycleStart?: string;
    cycleEnd?: string;
    status: string;
    baseTotal: number;
    basePaid: number;
    penaltyTotal: number;
    penaltyPaid: number;
    lateFeesAccrued: number;
    lineCount: number;
}

export interface QuoteLine {
    lineId?: number | null;
    shipmentId?: number | null;
    kind: PayableLineKind | string;
    due?: string;
    quoted: number;
}

export interface PayQuote {
    quoteRef: string;
    idempotencyKey: string;
    partnershipId: number;
    kind: string;
    baseTotal: number;
    feeTotal: number;
    penaltyTotal: number;
    grandTotal: number;
    status: string;
    expiresAt?: string;
    lines: QuoteLine[];
}

export interface MarkPaidResult {
    quoteRef: string;
    amountPaid: number;
    allocation: { lineId?: number; kind: string; shipmentId?: number; applied: number; lineStatus?: string }[];
    fullyCovered: boolean;
    quoteStatus: string;
}
