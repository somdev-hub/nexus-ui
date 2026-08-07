import { 
  DashboardSummaryResponse,
  ClientHealthResponse,
  RequestTrendsResponse,
  ToolUsageResponse,
  PerformanceResponse,
  ConfigInsightsResponse,
  DashboardQueryParams
} from "@/types/nexus-buddy-dashboard";

// Use the IAM proxy path which goes through IAM -> NexusBuddy
const API_BASE = "/api/proxy?path=/nexusbuddy/admin/dashboard";

async function fetchApi<T>(endpoint: string, params?: DashboardQueryParams): Promise<T> {
  const searchParams = new URLSearchParams();
  
  if (params?.range) searchParams.set("range", params.range);
  if (params?.start) searchParams.set("start", params.start);
  if (params?.end) searchParams.set("end", params.end);
  if (params?.clientIds?.length) {
    params.clientIds.forEach(id => searchParams.append("clientIds", id.toString()));
  }

  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const dashboardApi = {
  /**
   * Get executive summary metrics for the dashboard.
   */
  getSummary: (params?: DashboardQueryParams) => 
    fetchApi<DashboardSummaryResponse>("/summary", params),

  /**
   * Get client health matrix data.
   */
  getClientHealth: (params?: DashboardQueryParams) => 
    fetchApi<ClientHealthResponse[]>("/client-health", params),

  /**
   * Get request volume trends over time.
   */
  getRequestTrends: (params?: DashboardQueryParams) => 
    fetchApi<RequestTrendsResponse>("/requests/trends", params),

  /**
   * Get tool usage analytics.
   */
  getToolUsage: (params?: DashboardQueryParams) => 
    fetchApi<ToolUsageResponse>("/tools/usage", params),

  /**
   * Get performance and reliability metrics.
   */
  getPerformance: (params?: DashboardQueryParams) => 
    fetchApi<PerformanceResponse>("/performance", params),

  /**
   * Get configuration insights (static analysis).
   */
  getConfigInsights: () => 
    fetchApi<ConfigInsightsResponse>("/config-insights"),
};

export interface DashboardData {
  executiveSummary: DashboardSummaryResponse;
  clientHealth: ClientHealthResponse[];
  requestTrends: RequestTrendsResponse;
  toolUsage: ToolUsageResponse;
  performance: PerformanceResponse;
  configInsights: ConfigInsightsResponse;
}

export async function fetchDashboardData(from: Date, to: Date): Promise<DashboardData> {
  const params = {
    start: from.toISOString(),
    end: to.toISOString(),
  };

  const [
    executiveSummary,
    clientHealth,
    requestTrends,
    toolUsage,
    performance,
    configInsights,
  ] = await Promise.all([
    dashboardApi.getSummary(params),
    dashboardApi.getClientHealth(params),
    dashboardApi.getRequestTrends(params),
    dashboardApi.getToolUsage(params),
    dashboardApi.getPerformance(params),
    dashboardApi.getConfigInsights(),
  ]);

  return {
    executiveSummary,
    clientHealth,
    requestTrends,
    toolUsage,
    performance,
    configInsights,
  };
}