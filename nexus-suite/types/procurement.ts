import { PaginatedResponse } from './paginated-response';

export type GoodsReceiptStatus =
    'DRAFT' | 'RECEIVED' | 'RETURNED' | 'CANCELLED';
export type InvoiceStatus =
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'PAID'
    | 'CANCELLED';

export interface GoodsReceiptLineItem {
    grLineItemId?: number;
    poLineItemId?: number;
    lineNumber?: number;
    quantityReceived?: number;
    quantityAccepted?: number;
    quantityRejected?: number;
    unitOfMeasure?: string;
    notes?: string;
    description?: string;
}

export interface GoodsReceipt {
    goodsReceiptId: number;
    grNumber: string;
    purchaseOrderId: number;
    poNumber?: string;
    supplierId: number;
    supplierName?: string;
    status: GoodsReceiptStatus;
    receivedDate?: string;
    deliveryNoteNumber?: string;
    carrier?: string;
    trackingNumber?: string;
    notes?: string;
    lineItems?: GoodsReceiptLineItem[];
    receivedAt?: string;
    returnedAt?: string;
    cancelledAt?: string;
    totalQuantity?: number;
    createdAt: string;
    updatedAt: string;
}

export interface GoodsReceiptFilter {
    status?: GoodsReceiptStatus;
    purchaseOrderId?: number;
    supplierId?: number;
    pageNo?: number;
    pageOffset?: number;
}

export interface InvoiceLineItem {
    invoiceLineItemId?: number;
    poLineItemId?: number;
    grLineItemId?: number;
    lineNumber?: number;
    quantityInvoiced?: number;
    unitPrice?: number;
    lineTotal?: number;
    unitOfMeasure?: string;
    notes?: string;
    description?: string;
}

export interface Invoice {
    invoiceId: number;
    invoiceNumber: string;
    purchaseOrderId: number;
    poNumber?: string;
    supplierId: number;
    supplierName?: string;
    status: InvoiceStatus;
    invoiceDate?: string;
    dueDate?: string;
    totalAmount: number;
    taxAmount?: number;
    otherCharges?: number;
    currency: string;
    paymentTerms?: string;
    supplierInvoiceNumber?: string;
    notes?: string;
    lineItems?: InvoiceLineItem[];
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    submittedAt?: string;
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceFilter {
    status?: InvoiceStatus;
    purchaseOrderId?: number;
    supplierId?: number;
    pageNo?: number;
    pageOffset?: number;
}

export interface ThreeWayMatchResult {
    purchaseOrderId: number;
    poNumber: string;
    goodsReceiptId?: number;
    invoiceId?: number;
    status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'MISMATCHED' | 'BLOCKED';
    quantityMatched: boolean;
    amountMatched: boolean;
    discrepancies?: string[];
    canReleasePayment: boolean;
}

export type GoodsReceiptPaginatedResponse = PaginatedResponse<GoodsReceipt>;
export type InvoicePaginatedResponse = PaginatedResponse<Invoice>;
