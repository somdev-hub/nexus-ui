import { PaginatedResponse } from "./paginated-response";

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
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "PARTIALLY_DELIVERED";
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

export interface PurchaseOrderCreateRequest {
  retailerOrgId: number;
  supplierOrgId: number;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  shippingAddress: string;
  billingAddress: string;
  notes?: string;
  items: PurchaseOrderItemCreateRequest[];
}

export interface PurchaseOrderItemCreateRequest {
  productId?: number;
  materialId?: number;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
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
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "PARTIALLY_DELIVERED";
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
  sortDirection?: "asc" | "desc";
}

export type PurchaseOrderPaginatedResponse = PaginatedResponse<PurchaseOrder>;
