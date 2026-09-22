import { PaginatedResponse } from "./paginated-response";

export type PerformanceTier = "EXCELLENT" | "GOOD" | "AVERAGE" | "BELOW_AVERAGE" | "POOR";

export interface SupplierPerformance {
  performanceId: number;
  supplierId: number;
  supplierName?: string;
  accountId: number;
  evaluationPeriodStart: string;
  evaluationPeriodEnd: string;
  otifScore: number;
  qualityDefectRate: number;
  avgLeadTimeDays: number;
  responsivenessScore: number;
  overallScore: number;
  performanceTier: PerformanceTier;
  totalOrdersEvaluated: number;
  onTimeDeliveries: number;
  inFullDeliveries: number;
  totalDefects: number;
  calculatedBy?: string;
  calculatedAt: string;
  createdAt: string;
}

export interface SupplierPerformanceFilter {
  supplierId?: number;
  tier?: PerformanceTier;
  startDate?: string;
  endDate?: string;
  pageNo?: number;
  pageOffset?: number;
}

export type SupplierPerformancePaginatedResponse = PaginatedResponse<SupplierPerformance>;
