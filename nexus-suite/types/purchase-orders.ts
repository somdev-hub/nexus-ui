import { PaginatedResponse } from './paginated-response';

export interface PurchaseOrder {
    purchaseOrderId: number;
    purchaseOrderNumber: string;
    retailerOrgId: number;
    retailerOrgName: string;
    supplierOrgId: number;
    supplierOrgName: string;
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
        | 'PARTIALLY_DELIVERED';
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
}

export interface PurchaseOrderItemCreateRequest {
    lineNumber: number;
    description: string;
    quantityOrdered: number;
    unitPrice: number;
    productId?: number;
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
