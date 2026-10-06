import { PaginatedResponse } from './paginated-response';

export interface PurchaseOrder {
    purchaseOrderId: number;
    purchaseOrderNumber: string;
    retailerOrgId: number;
    retailerOrgName: string;
    supplierOrgId?: number;
    supplierOrgName?: string;
    supplierName?: string;
    buyerOrgName?: string;
    orderDate: string;
    expectedDeliveryDate: string;
    status:
        | 'DRAFT'
        | 'PENDING_APPROVAL'
        | 'APPROVED'
        | 'REJECTED'
        | 'CONFIRMED'
        | 'SHIPPED'
        | 'DELIVERED'
        | 'CANCELLED'
        | 'PARTIALLY_DELIVERED'
        | 'SENT_TO_SUPPLIER'
        | 'ACKNOWLEDGED'
        | 'PARTIALLY_RECEIVED'
        | 'RECEIVED'
        | 'INVOICED'
        | 'PAID'
        | 'CLOSED';
    totalAmount: number;
    currency: string;
    paymentTerms: string;
    shippingAddress: string;
    billingAddress: string;
    notes?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    // Extended detail fields (Core PurchaseOrderDto)
    supplierId?: number;
    partnershipId?: number;
    revisionNumber?: number;
    parentPoId?: number;
    incoterms?: string;
    requestedDeliveryDate?: string;
    isBlanketOrder?: boolean;
    blanketStartDate?: string;
    blanketEndDate?: string;
    releaseSchedule?: string;
    approvalLevel?: string;
    requiredApproverLevel?: string;
    currentApprover?: string;
    approvalDelegatedTo?: string;
    sentToSupplierAt?: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
    supplierNotes?: string;
    confirmedDeliveryDate?: string;
    sourceQuotationId?: number;
    sourceQuotationNumber?: string;
    lineItems?: PurchaseOrderLineItem[];
}

export interface PurchaseOrderLineItem {
    lineItemId?: number;
    lineNumber?: number;
    materialId?: number;
    productId?: number;
    catalogId?: number;
    description?: string;
    quantityOrdered?: number;
    quantityReceived?: number;
    quantityInvoiced?: number;
    unitPrice?: number;
    totalPrice?: number;
    unitOfMeasure?: string;
    incoterms?: string;
    deliveryLocation?: string;
}

// Backend contract: Core PurchaseOrderDto / PurchaseOrderLineItemDto
// (nexus/core/.../payload). Field names must match the backend — the IAM
// gateway forwards this payload to Core as-is.
export interface PurchaseOrderCreateRequest {
    poNumber: string;
    buyerOrgId: number;
    supplierId: number;
    partnershipId?: number;
    paymentTerms: string;
    currency?: string;
    incoterms?: string;
    /** yyyy-mm-dd */
    requestedDeliveryDate: string;
    /** yyyy-mm-dd */
    expectedDeliveryDate?: string;
    notes?: string;
    isBlanketOrder?: boolean;
    /** yyyy-mm-dd */
    blanketStartDate?: string;
    /** yyyy-mm-dd */
    blanketEndDate?: string;
    releaseSchedule?: string;
    lineItems: PurchaseOrderItemCreateRequest[];
    /** Accepted quotation this PO is converted from (marks it CONVERTED) */
    sourceQuotationId?: number;
    shippingAddress?: string;
    billingAddress?: string;
}

export interface PurchaseOrderItemCreateRequest {
    lineNumber: number;
    description: string;
    quantityOrdered: number;
    unitPrice: number;
    /** Supplier catalog item this line is ordered from */
    catalogId?: number;
    materialId?: number;
    unitOfMeasure?: string;
    incoterms?: string;
    deliveryLocation?: string;
}

export interface PurchaseOrderUpdateRequest {
    expectedDeliveryDate?: string;
    paymentTerms?: string;
    shippingAddress?: string;
    billingAddress?: string;
    notes?: string;
}

export interface PurchaseOrderStatusUpdateRequest {
    status:
        | 'DRAFT'
        | 'PENDING_APPROVAL'
        | 'APPROVED'
        | 'REJECTED'
        | 'CONFIRMED'
        | 'SHIPPED'
        | 'DELIVERED'
        | 'CANCELLED'
        | 'PARTIALLY_DELIVERED';
}

export interface PurchaseOrderApprovalRequest {
    approved: boolean;
    remarks?: string;
}

export interface PurchaseOrderFilter {
    status?: string;
    retailerOrgId?: number;
    supplierOrgId?: number;
    orderDateFrom?: string;
    orderDateTo?: string;
    pageNo?: number;
    pageOffset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export type PurchaseOrderPaginatedResponse = PaginatedResponse<PurchaseOrder>;
