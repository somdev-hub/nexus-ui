import { PaginatedResponse } from "./paginated-response";

export interface Material {
  materialId: number;
  materialCode: string;
  materialName: string;
  description: string;
  category: string;
  subCategory?: string;
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

export interface MaterialCreateRequest {
  materialCode: string;
  materialName: string;
  description: string;
  category: string;
  subCategory?: string;
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

export interface MaterialUpdateRequest {
  materialName?: string;
  description?: string;
  category?: string;
  subCategory?: string;
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

export interface MaterialFilter {
  category?: string;
  subCategory?: string;
  isActive?: boolean;
  search?: string;
  pageNo?: number;
  pageOffset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export type MaterialPaginatedResponse = PaginatedResponse<Material>;
