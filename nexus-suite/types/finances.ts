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
    /** Currency of the logistics settlement KPIs (lane currency). */
    logisticsCurrency?: string;
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
    /** Currency of the revenue/receivable/trend figures (dominant trip currency). */
    currency?: string;
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
    /** detail-dialog extras (logistics ledger rows) */
    shipmentId?: number;
    shipmentNumber?: string;
    lane?: string;
    paidAmount?: number;
    freightCost?: number;
    fuelSurcharge?: number;
    accessorialCharges?: number;
    taxAmount?: number;
    pmsStatus?: string;
    pmsReferenceId?: string;
    notes?: string;
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
    /** Denomination of the amounts on this row (lane currency when capacity-priced). */
    currency?: string;
    /** Itemized what-is-being-charged breakdown for this trip. */
    pricing?: TripPricing;
}

export interface TripPricing {
    /** Where the fare came from: the matched lane, the shipment's own cost, or nothing. */
    source: 'CAPACITY' | 'SHIPMENT' | 'UNPRICED';
    total: number;
    currency?: string;
    lane?: string;
    transportMode?: string;
    equipmentType?: string;
    capacityUnit?: string;
    unitPrice?: number;
    billedQuantity?: number;
    basePrice?: number;
    fuelSurcharge?: number;
    driverFees?: number;
    miscPrice?: number;
    subtotal?: number;
    discountRate?: number;
    discount?: number;
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
    /** Denomination of the statement's amounts. */
    currency?: string;
}

export interface QuoteLine {
    lineId?: number | null;
    shipmentId?: number | null;
    kind: PayableLineKind | string;
    due?: string;
    quoted: number;
}

/** Trip facts attached to a quote (pickup/delivery addresses, dates, logistics org). */
export interface QuoteShipment {
    shipmentId: number;
    shipmentNumber?: string;
    lane?: string;
    pickupLocation?: string;
    pickupAddress?: string;
    pickupDate?: string;
    deliveryLocation?: string;
    deliveryAddress?: string;
    deliveryDate?: string;
    deliveredAt?: string;
    status?: string;
    logisticsOrg?: string;
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
    /** Shipment facts keyed by shipmentId (enriched backend response). */
    shipments?: Record<string, QuoteShipment>;
}

export interface MarkPaidResult {
    quoteRef: string;
    amountPaid: number;
    allocation: { lineId?: number; kind: string; shipmentId?: number; applied: number; lineStatus?: string }[];
    fullyCovered: boolean;
    quoteStatus: string;
}
