import { PaginatedResponse } from "./paginated-response";

export interface Product {
  productId: number;
  productCode: string;
  productName: string;
  description: string;
  category: string;
  subCategory?: string;
  brand?: string;
  unitOfMeasure: string;
  unitPrice: number;
  currency: string;
  taxRate: number;
  isActive: boolean;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  leadTimeDays: number;
  weight?: number;
  dimensions?: string;
  barcode?: string;
  sku?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface ProductCreateRequest {
  productCode: string;
  productName: string;
  description: string;
  category: string;
  subCategory?: string;
  brand?: string;
  unitOfMeasure: string;
  unitPrice: number;
  currency: string;
  taxRate: number;
  isActive: boolean;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  leadTimeDays: number;
  weight?: number;
  dimensions?: string;
  barcode?: string;
  sku?: string;
  tags?: string[];
}

export interface ProductUpdateRequest {
  productName?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  unitOfMeasure?: string;
  unitPrice?: number;
  currency?: string;
  taxRate?: number;
  isActive?: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  leadTimeDays?: number;
  weight?: number;
  dimensions?: string;
  barcode?: string;
  sku?: string;
  tags?: string[];
}

export interface ProductFilter {
  category?: string;
  subCategory?: string;
  brand?: string;
  isActive?: boolean;
  search?: string;
  pageNo?: number;
  pageOffset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export type ProductPaginatedResponse = PaginatedResponse<Product>;
