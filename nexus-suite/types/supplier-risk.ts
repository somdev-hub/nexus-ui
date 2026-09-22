import { PaginatedResponse } from "./paginated-response";

export type RiskCategory = "FINANCIAL" | "OPERATIONAL" | "COMPLIANCE" | "REPUTATIONAL" | "GEOPOLITICAL" | "CYBER";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskStatus = "OPEN" | "IN_PROGRESS" | "MITIGATED" | "CLOSED" | "ESCALATED";

export interface SupplierRisk {
  riskId: number;
  supplierId: number;
  supplierName?: string;
  partnershipId?: number;
  riskCategory: RiskCategory;
  riskLevel: RiskLevel;
  riskStatus: RiskStatus;
  riskScore: number;
  probability: number;
  impact: number;
  mitigationPlan?: string;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRiskFilter {
  supplierId?: number;
  partnershipId?: number;
  riskLevel?: RiskLevel;
  riskCategory?: RiskCategory;
  pageNo?: number;
  pageOffset?: number;
}

export type SupplierRiskPaginatedResponse = PaginatedResponse<SupplierRisk>;
