export type MockPaymentMethod =
    'UPI' | 'CARD' | 'NET_BANKING' | 'BANK_TRANSFER' | 'WALLET';
export type MockPaymentStatus =
    'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PayerRole = 'RETAILER' | 'SUPPLIER' | 'LOGISTICS';

export interface MockPayInitiateInput {
    amount: number;
    currency?: string;
    description?: string;
    paymentMethod: MockPaymentMethod;
    methodDetail?: string;
    payerName?: string;
    invoiceId?: number;
    invoiceNumber?: string;
    purchaseOrderId?: number;
    orgId?: string;
    payerRole?: PayerRole;
}

export interface MockPayment {
    paymentId: number;
    idempotencyKey: string;
    transactionReference: string;
    receiptNo?: string | null;
    status: MockPaymentStatus;
    amount: number;
    currency: string;
    description?: string;
    paymentMethod: string;
    methodDetailMasked?: string;
    invoiceId?: number;
    invoiceNumber?: string;
    orgId?: string;
    payerRole?: string;
    failureCode?: string;
    failureReason?: string;
    isIdempotentRetry?: boolean;
    success?: boolean;
    createdAt?: string;
    updatedAt?: string;
    completedAt?: string;
}

export interface MockReceipt {
    receiptNo: string;
    paymentId: number;
    transactionReference: string;
    status: string;
    amount: number;
    currency: string;
    feeAmount: number;
    netAmount: number;
    paymentMethod: string;
    methodDetailMasked?: string;
    payerName?: string;
    description?: string;
    invoiceId?: number;
    invoiceNumber?: string;
    orgId?: string;
    payerRole?: string;
    idempotencyKey: string;
    paidAt?: string;
    createdAt?: string;
}

export type SuiteIntentStatus =
    | 'INITIATED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'EXPIRED';

export interface SuiteIntent {
    intentId: number;
    /** Encrypted opaque reference — pass as ?ref= param, never the raw id. */
    ref: string;
    idempotencyKey: string;
    status: SuiteIntentStatus;
    invoiceId?: number;
    invoiceNumber?: string;
    purchaseOrderId?: number;
    orgId?: string;
    payerRole?: string;
    amount: number;
    currency: string;
    description?: string;
    // Logistics settlement linkage (core LQ-* quote ref).
    quoteRef?: string;
    partnershipId?: number;
    intentKind?: string;
    mockPaymentId?: number | null;
    mockPayment?: MockPayment | null;
    receipt?: MockReceipt | null;
    failureReason?: string | null;
    isIdempotentRetry?: boolean;
    expiresAt?: string;
    createdAt?: string;
    completedAt?: string;
}

export interface SuitePayInput {
    ref: string;
    paymentMethod: MockPaymentMethod | 'BANK_TRANSFER';
    methodDetail?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankHolderName?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardHolderName?: string;
    payerName?: string;
}
