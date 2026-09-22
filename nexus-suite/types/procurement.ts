import { PaginatedResponse } from "./paginated-response";

export type GoodsReceiptStatus = "DRAFT" | "RECEIVED" | "RETURNED" | "CANCELLED";
export type InvoiceStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";

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
  notes?: string;
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
  currency: string;
  paymentTerms?: string;
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
  status: "MATCHED" | "PARTIALLY_MATCHED" | "MISMATCHED" | "BLOCKED";
  quantityMatched: boolean;
  amountMatched: boolean;
  discrepancies?: string[];
  canReleasePayment: boolean;
}

export type GoodsReceiptPaginatedResponse = PaginatedResponse<GoodsReceipt>;
export type InvoicePaginatedResponse = PaginatedResponse<Invoice>;
