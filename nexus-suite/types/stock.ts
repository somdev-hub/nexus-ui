import { PaginatedResponse } from "./paginated-response";

export type ValuationMethod = "FIFO" | "LIFO" | "WEIGHTED_AVERAGE" | "STANDARD_COST";

export interface Stock {
  stockId: number;
  materialId: number;
  materialCode: string;
  materialName: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseLocation: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  maxStockLevel?: number;
  minStockLevel?: number;
  valuationMethod: ValuationMethod;
  averageCost: number;
  lastCost: number;
  standardCost: number;
  belowReorderPoint: boolean;
  atOrBelowMinLevel: boolean;
  atOrAboveMaxLevel: boolean;
  totalValue: number;
  lastCountedAt?: string;
  lastCountedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockFilter {
  warehouseId?: number;
  materialId?: number;
  belowReorderPoint?: boolean;
  atOrBelowMinLevel?: boolean;
  pageNo?: number;
  pageOffset?: number;
}

export interface AbcItem {
  stockId: number;
  materialId: number;
  materialCode: string;
  materialName: string;
  warehouseId: number;
  quantityOnHand: number;
  unitCost: number;
  annualValue: number;
  cumulativePercentage: number;
  abcCategory: "A" | "B" | "C";
  velocityScore: number;
}

export interface AbcSummary {
  totalItems: number;
  categoryACount: number;
  categoryBCount: number;
  categoryCCount: number;
  totalInventoryValue: number;
  categoryAValue: number;
  categoryBValue: number;
  categoryCValue: number;
  categoryAPercentage: number;
  categoryBPercentage: number;
  categoryCPercentage: number;
}

export interface AbcAnalysis {
  items: AbcItem[];
  summary: AbcSummary;
}

export interface StockMovement {
  movementId: number;
  stockId: number;
  warehouseId: number;
  materialId: number;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: string;
  referenceId: number;
  batchNumber?: string;
  expiryDate?: string;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export type StockPaginatedResponse = PaginatedResponse<Stock>;
export type StockMovementPaginatedResponse = PaginatedResponse<StockMovement>;
