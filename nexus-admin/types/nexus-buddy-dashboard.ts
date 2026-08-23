// ============================================================================
// NEXUS BUDDY DASHBOARD TYPES
// ============================================================================

export interface DashboardSummaryResponse {
  totalClients: number;
  activeClients: number;
  totalTools: number;
  activeTools: number;
  requestsLast24h: number;
  successRateLast24h: number;
  errorRateLast24h: number;
  avgResponseTimeMs: number;
  requestsTrend: TrendDataPoint[];
  successRateTrend: TrendDataPoint[];
  errorRateTrend: TrendDataPoint[];
}

export interface TrendDataPoint {
  timestamp: string;
  value: number;
}

export interface ClientHealthResponse {
  clientConfigId: number;
  clientName: string;
  isActive: boolean;
  toolCount: number;
  activeToolCount: number;
  requestsLast24h: number;
  errorsLast24h: number;
  errorRateLast24h: number;
  lastRequestTime: string | null;
  healthCheckStatus: boolean | null;
  connectionUrl: string;
  healthCheckPath: string;
}

export interface RequestTrendsResponse {
  totalRequests: TimeSeriesDataPoint[];
  successfulRequests: TimeSeriesDataPoint[];
  clientErrors: TimeSeriesDataPoint[];
  serverErrors: TimeSeriesDataPoint[];
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

export interface ToolUsageResponse {
  httpMethodDistribution: Record<string, number>;
  topToolsByVolume: ToolUsageDataPoint[];
}

export interface ToolUsageDataPoint {
  toolName: string;
  requestCount: number;
  successRate: number;
}

export interface PerformanceResponse {
  latencyPercentiles: Record<string, number>;
  errorRateTrend: TimeSeriesDataPoint[];
  availabilityPercentage: number;
  toolSuccessRates: ToolPerformanceDataPoint[];
}

export interface ToolPerformanceDataPoint {
  toolName: string;
  requestCount: number;
  successRate: number;
  avgLatencyMs: number;
}

export interface ConfigInsightsResponse {
  toolsPerClient: Record<string, number>;
  paramsPerTool: Record<string, number>;
  requiredVsOptionalParams: Record<string, number>;
  dataTypeDistribution: Record<string, number>;
  paramTypeDistribution: Record<string, number>;
  clientsWithoutTools: string[];
  toolsWithoutParams: string[];
}

export type TimeRange = '24h' | '7d' | '30d' | 'custom';

export interface DashboardQueryParams {
  range?: TimeRange;
  start?: string;
  end?: string;
  clientIds?: number[];
}