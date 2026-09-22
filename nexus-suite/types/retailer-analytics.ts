export interface DashboardData {
  totalSpend: number;
  openPoCount: number;
  inboundShipmentCount: number;
  otifPercentage: number;
  avgSupplierPerformance: number;
  totalSuppliers: number;
  activePartnerships: number;
  inventoryValue: number;
  spendTrend: { period: string; spend: number }[];
  bottleneckAlerts: { type: string; count: number; severity: string }[];
}

export interface SpendAnalytics {
  spendBySupplier: Record<string, number>;
  spendByCategory: Record<string, number>;
  spendByMonth: Record<string, number>;
  totalSpend: number;
  avgOrderValue: number;
  totalOrders: number;
}

export interface SupplyChainVisibility {
  purchaseOrderNumber: string;
  poStatus: string;
  shipmentNumber?: string;
  shipmentStatus?: string;
  trackingTimeline: { eventType: string; timestamp: string; location?: string; description?: string }[];
  milestones: { stage: string; timestamp: string; status?: string }[];
  bottlenecks: { stage: string; delay: string }[];
  totalLeadTimeDays: number;
  goodsReceiptNumber?: string;
  invoiceNumber?: string;
  invoiceStatus?: string;
  freightInvoiceNumber?: string;
}
