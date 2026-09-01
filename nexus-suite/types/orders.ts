import { PaginatedResponse } from "./paginated-response";

export interface Order {
  orderId: number;
  orderNumber: string;
  retailerOrgId: number;
  retailerOrgName: string;
  supplierOrgId: number;
  supplierOrgName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status:
    | "DRAFT"
    | "PENDING"
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
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface OrderCreateRequest {
  retailerOrgId: number;
  supplierOrgId: number;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  shippingAddress: string;
  billingAddress: string;
  notes?: string;
  items: OrderItemCreateRequest[];
}

export interface OrderItemCreateRequest {
  productId?: number;
  materialId?: number;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
}

export interface OrderUpdateRequest {
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
}

export interface OrderStatusUpdateRequest {
  status:
    | "DRAFT"
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "PARTIALLY_DELIVERED";
}

export interface OrderFilter {
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

export type OrderPaginatedResponse = PaginatedResponse<Order>;
