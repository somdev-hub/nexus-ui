export interface SupplierCatalog {
  catalogId: number;
  name: string;
  code: string;
  description?: string;
  category?: string;
  family?: string;
  sku?: string;
  attributes?: string;
  specifications?: string;
  basePrice?: number;
  currency?: string;
  status?: string;
  accessLevel?: string;
  isPublished?: boolean;
  publishedAt?: string;
  supplierOrgId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  variantId: number;
  catalogId: number;
  catalogName?: string;
  variantType: string;
  variantValue: string;
  skuSuffix?: string;
  priceAdjustment?: number;
  bomMaterialId?: number;
  bomMaterialName?: string;
  quantityAvailable?: number;
  isActive?: boolean;
}

export interface SupplierPriceTier {
  tierId: number;
  catalogId: number;
  catalogName?: string;
  tierName?: string;
  minQuantity?: number;
  maxQuantity?: number;
  unitPrice: number;
  customerSegment?: string;
  contractId?: number;
  validFrom?: string;
  validTo?: string;
  currency?: string;
}

export interface SupplierDigitalAsset {
  assetId: number;
  catalogId: number;
  catalogName?: string;
  assetType: string;
  fileName?: string;
  dmsDocumentId?: string;
  dmsDocumentUrl?: string;
  version?: number;
}

export interface ProductionCapacity {
  capacityId: number;
  productLine?: string;
  periodStart: string;
  periodEnd: string;
  shift?: string;
  availableCapacity?: number;
  allocatedCapacity?: number;
  remainingCapacity?: number;
  unit?: string;
  notes?: string;
}

export interface SupplierOrder {
  purchaseOrderId: number;
  poNumber: string;
  buyerOrg?: { accountId: number; name?: string };
  buyerOrgId?: number;
  status: string;
  totalAmount?: number;
  currency?: string;
  requestedDeliveryDate?: string;
  expectedDeliveryDate?: string;
  confirmedDeliveryDate?: string;
  supplierNotes?: string;
  lineItems?: Array<{ quantityOrdered?: number; unitPrice?: number; totalPrice?: number; description?: string }>;
  createdAt?: string;
}

export interface SupplierQuotation {
  quotationId: number;
  quotationNumber: string;
  buyerOrgId?: number;
  buyerOrgName?: string;
  status: string;
  validFrom?: string;
  validTo?: string;
  terms?: string;
  currency?: string;
  totalAmount?: number;
  versionNumber?: number;
  lineItems?: Array<{ catalogId?: number; quantity?: number; unitPrice?: number; totalPrice?: number; description?: string }>;
  createdAt?: string;
}

export interface CollaborativeForecast {
  forecastId: number;
  retailerOrgId?: number;
  retailerOrgName?: string;
  catalogId?: number;
  catalogName?: string;
  periodStart: string;
  periodEnd: string;
  forecastQuantity: number;
  confidencePct?: number;
  status: string;
  notes?: string;
}

export interface ConsignmentStock {
  consignmentId: number;
  retailerOrgId?: number;
  retailerOrgName?: string;
  warehouseId?: number;
  warehouseCode?: string;
  materialId: number;
  materialName?: string;
  quantityOnHand?: number;
  quantityAvailable?: number;
  consignmentNumber?: string;
}

export interface VmiConfig {
  vmiId: number;
  retailerOrgId?: number;
  retailerOrgName?: string;
  warehouseId?: number;
  warehouseCode?: string;
  materialId: number;
  materialName?: string;
  minLevel?: number;
  maxLevel?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  autoReplenish?: boolean;
  lastReplenishedAt?: string;
  isActive?: boolean;
}

export interface SupplierDashboard {
  totalCatalogProducts: number;
  publishedCatalog: number;
  totalOrders: number;
  pendingAcknowledgement: number;
  acknowledgedOrders: number;
  totalQuotations: number;
  totalCapacity: number;
  allocatedCapacity: number;
  remainingCapacity: number;
}

// --- Supplier Quality Certificate ---
export interface SupplierQualityCertificate {
  certificateId: number;
  purchaseOrderId?: number;
  poNumber?: string;
  shipmentId?: number;
  shipmentNumber?: string;
  catalogId?: number;
  catalogName?: string;
  certificateType: "COA" | "COC" | "TEST_REPORT" | string;
  certificateNumber?: string;
  dmsDocumentId?: string;
  dmsDocumentUrl?: string;
  issuedDate?: string;
  expiryDate?: string;
  notes?: string;
  supplierOrgId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// --- ATP ---
export interface AtpCatalogResponse {
  catalogId: number;
  catalogName: string;
  inventoryAvailable: number;
  capacityAvailable: number;
  atpQuantity: number;
  requestedQuantity: number;
  canFulfill: boolean;
  shortage: number;
}

export interface AtpProductLineResponse {
  productLine: string;
  date: string;
  capacityAtp: number;
  inventoryAvailable: number;
  totalAtp: number;
}

// --- Summaries ---
export interface CatalogSummary {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

export interface CapacitySummary {
  totalAvailable: number;
  totalAllocated: number;
  totalRemaining: number;
  periodCount: number;
}

export interface OrderSummary {
  total: number;
  pendingAck: number;
  acknowledged: number;
  partiallyReceived: number;
  received: number;
}

export interface QuotationSummary {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  converted: number;
}

export interface ConsignmentSummary {
  totalConsignments: number;
  totalOnHand: number;
  totalAvailable: number;
}

export interface AccountHealth {
  buyerOrgId: number;
  totalOrders: number;
  totalOrderValue: number;
  avgOrderValue: number;
  recentOrdersLast30Days: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paymentBehaviorScore: number;
  creditUtilization: "LOW" | "MEDIUM" | "HIGH" | string;
}

export interface AccountHealthSummary {
  totalCustomers: number;
  avgPaymentScore: number;
}

export interface CustomerSummary {
  totalOrders: number;
  totalOrderValue: number;
  openOrders: number;
  totalInvoices: number;
  totalShipments: number;
  buyerOrgId: number | string;
}

export interface VmiSuggestion {
  vmiId: number;
  materialId: number;
  available: number;
  reorderPoint: number;
  needsReplenish: boolean;
  suggestedQuantity: number;
}

export interface PartialShipmentRequest {
  shippedQuantity: number;
  trackingNumber?: string;
  carrierName?: string;
  notes?: string;
}

export interface PartialShipmentResponse {
  shipmentId: number;
  shipmentNumber: string;
  purchaseOrderId: number;
  backorderedQuantity: number;
  status: string;
}

export interface QuotationConvertResponse {
  quotationId: number;
  purchaseOrderId: number;
  poNumber: string;
}

// --- Filter Types ---
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface SupplierCatalogFilter extends PaginationParams {
  search?: string;
  status?: string;
  category?: string;
  family?: string;
  accessLevel?: string;
  isPublished?: boolean;
}

export interface VariantFilter extends PaginationParams {
  catalogId?: number;
  variantType?: string;
  bomMaterialId?: number;
}

export interface PriceTierFilter extends PaginationParams {
  catalogId?: number;
  customerSegment?: string;
  contractId?: number;
  validFrom?: string;
  validTo?: string;
}

export interface DigitalAssetFilter extends PaginationParams {
  catalogId?: number;
  assetType?: string;
}

export interface CapacityFilter extends PaginationParams {
  productLine?: string;
  shift?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface SupplierOrderFilter extends PaginationParams {
  status?: string;
  poNumber?: string;
  buyerOrgId?: number;
}

export interface QualityCertFilter extends PaginationParams {
  purchaseOrderId?: number;
  shipmentId?: number;
  catalogId?: number;
  certificateType?: string;
}

export interface QuotationFilter extends PaginationParams {
  status?: string;
  buyerOrgId?: number;
  quotationNumber?: string;
  validFrom?: string;
  validTo?: string;
}

export interface ForecastFilter extends PaginationParams {
  retailerOrgId?: number;
  catalogId?: number;
  status?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface ConsignmentFilter extends PaginationParams {
  retailerOrgId?: number;
  warehouseId?: number;
  materialId?: number;
}

export interface VmiFilter extends PaginationParams {
  retailerOrgId?: number;
  warehouseId?: number;
  materialId?: number;
  autoReplenish?: boolean;
}

export type CatalogTransitionParams = {
  accessLevel?: string;
  reason?: string;
};

export type OrderFulfillmentUpdate = {
  confirmedDeliveryDate?: string;
  supplierNotes?: string;
  expectedDeliveryDate?: string;
  status?: string;
};

export type QuotationTransitionParams = Record<string, string | number | boolean>;
