// ============================================================================
// CLIENT INSIGHTS TYPES
// ============================================================================

export interface ClientInsightsSummary {
  totalHits: number;
  successPercentage: number;
  failurePercentage: number;
  averageResponseTime: number; // in milliseconds
}

export interface ResponseTimeDataPoint {
  timestamp: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}

export interface HourlyHitsDataPoint {
  hour: string; // ISO string or formatted hour
  totalHits: number;
  successHits: number;
  failureHits: number;
}

export interface FailureGraphDataPoint {
  timestamp: string;
  failureCount: number;
  failureRate: number;
}

export interface ToolInsightsData {
  toolName: string;
  totalHits: number;
  successHits: number;
  failureHits: number;
  mostFailureCode: string | null;
  successRatio: number; // percentage
}

export interface LogEntry {
  id: string;
  toolName: string;
  request: string;
  response: string;
  statusCode: number;
  httpMethod: string;
  createdAt: string;
}

export interface ClientInsightsFilters {
  toolName?: string;
  success?: boolean; // true for success, false for failure, undefined for all
  statusCode?: number;
  httpMethod?: string;
  fromDate?: string;
  toDate?: string;
  page: number; // 0-based page number (matches Spring Page)
  pageSize: number;
}

// Spring Page response format (matches backend)
export interface SpringPageResponse<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number; // 0-based page number
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

// Frontend pagination format (1-based for UI)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number; // 1-based page number for UI
  pageSize: number;
  totalPages: number;
}

export interface ClientInsightsResponse {
  summary: ClientInsightsSummary;
  responseTimeData: ResponseTimeDataPoint[];
  hourlyHitsData: HourlyHitsDataPoint[];
  failureGraphData: FailureGraphDataPoint[];
  tools: ToolInsightsData[];
}