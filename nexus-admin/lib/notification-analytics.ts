// Notification analytics data layer.
//
// Fetches aggregated notification statistics from IAM, which proxies
// to the CMS backend (which owns the notification data). All calls go
// through IAM only — the admin frontend never talks to CMS directly.

import type {
  NotificationAnalyticsData,
  NotificationOverview,
  NotificationTrendPoint,
  OrgNotificationStats,
  EventTypeStats,
  SeverityStats,
  AddressingStats,
  DeliveryStats,
  NotificationTimelineEntry,
  OutboxSummary,
  OutboxEventTypeStats,
  OutboxTrendPoint,
  OutboxRetriedRow,
  OutboxFailedRow,
} from "@/types/notification-analytics";

const API_PATH = "/api/notifications/analytics";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `/api/proxy?path=${encodeURIComponent(`${API_PATH}${endpoint}`)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  } catch (networkError) {
    throw new Error(
      "Cannot reach the backend. Is IAM running on port 8080? " +
        (networkError instanceof Error ? networkError.message : String(networkError))
    );
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || body.error || detail;
      if (body.path) detail += ` (${body.path})`;
    } catch {
      // response body wasn't JSON
    }
    throw new Error(detail);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Invalid response from backend (expected JSON)");
  }
}

// ---------------------------------------------------------------------------
// Data access functions
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export async function fetchNotificationAnalytics(
  _from: Date,
  _to: Date
): Promise<NotificationAnalyticsData> {
  const [
    overviewRaw,
    trendsRaw,
    orgsRaw,
    eventsRaw,
    severitiesRaw,
    addressingRaw,
    deliveryRaw,
    timelineRaw,
    outboxSummaryRaw,
    outboxEventsRaw,
    outboxTrendRaw,
    outboxRetriedRaw,
    outboxFailedRaw,
  ] = await Promise.all([
    fetchApi<any>("/overview"),
    fetchApi<any>("/trends?days=30"),
    fetchApi<any>("/by-org"),
    fetchApi<any>("/by-event-type"),
    fetchApi<any>("/by-severity"),
    fetchApi<any>("/by-addressing"),
    fetchApi<any>("/delivery"),
    fetchApi<any>("/timeline?limit=50"),
    fetchApi<any>("/outbox/summary"),
    fetchApi<any>("/outbox/by-event-type"),
    fetchApi<any>("/outbox/trend?days=30"),
    fetchApi<any>("/outbox/retried?limit=50"),
    fetchApi<any>("/outbox/failed?limit=50"),
  ]);

  const overview: NotificationOverview = {
    totalNotifications: overviewRaw.totalNotifications ?? 0,
    totalOrgs: overviewRaw.totalOrgs ?? 0,
    totalUsers: overviewRaw.totalUsers ?? 0,
    unreadCount: overviewRaw.unreadCount ?? 0,
    readCount: overviewRaw.readCount ?? 0,
    readRate: overviewRaw.readRate ?? 0,
    avgDeliveryLagMs: overviewRaw.avgDeliveryLagMs ?? 0,
    realtimeDeliveryRate: overviewRaw.realtimeDeliveryRate ?? 0,
    failureCount: overviewRaw.failureCount ?? 0,
    retentionDays: overviewRaw.retentionDays ?? 7,
  };

  const trendsContent = Array.isArray(trendsRaw) ? trendsRaw : (trendsRaw?.content ?? []);
  const trends: NotificationTrendPoint[] = (trendsContent || []).map((t: any) => ({
    date: t.date,
    count: t.count ?? 0,
    read: t.read ?? 0,
    unread: t.unread ?? 0,
  }));

  const orgContent = orgsRaw?.content ?? orgsRaw ?? [];
  const orgStats: OrgNotificationStats[] = (orgContent || []).map((o: any) => ({
    orgId: o.orgId,
    orgName: o.orgName ?? `Org ${o.orgId}`,
    totalNotifications: o.totalNotifications ?? 0,
    unreadCount: o.unreadCount ?? 0,
    readRate: o.readRate ?? 0,
    lastNotificationAt: o.lastNotificationAt ?? new Date().toISOString(),
    avgDeliveryLagMs: o.avgDeliveryLagMs ?? 0,
  }));

  const eventsContent = Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw?.content ?? []);
  const eventTypeStats: EventTypeStats[] = (eventsContent || []).map((e: any) => ({
    eventType: e.eventType,
    displayName: e.displayName ?? e.eventType?.replace(/_/g, " "),
    count: e.count ?? 0,
    percentage: e.percentage ?? 0,
    avgDeliveryLagMs: e.avgDeliveryLagMs ?? 0,
    severity: e.severity ?? "INFO",
  }));

  const severitiesContent = Array.isArray(severitiesRaw) ? severitiesRaw : (severitiesRaw?.content ?? []);
  const severityStats: SeverityStats[] = (severitiesContent || []).map((s: any) => ({
    severity: s.severity,
    count: s.count ?? 0,
    percentage: s.percentage ?? 0,
  }));

  const addressingContent = Array.isArray(addressingRaw) ? addressingRaw : (addressingRaw?.content ?? []);
  const addressingStats: AddressingStats[] = (addressingContent || []).map((a: any) => ({
    addressing: a.addressing,
    count: a.count ?? 0,
    percentage: a.percentage ?? 0,
  }));

  const delivery: DeliveryStats = {
    totalDelivered: deliveryRaw.totalDelivered ?? 0,
    totalPending: deliveryRaw.totalPending ?? 0,
    totalFailed: deliveryRaw.totalFailed ?? 0,
    deliveryRate: deliveryRaw.deliveryRate ?? 0,
    avgDeliveryLagMs: deliveryRaw.avgDeliveryLagMs ?? 0,
    p95DeliveryLagMs: deliveryRaw.p95DeliveryLagMs ?? 0,
    p99DeliveryLagMs: deliveryRaw.p99DeliveryLagMs ?? 0,
  };

  const timelineContent = timelineRaw?.content ?? timelineRaw ?? [];
  const recentNotifications: NotificationTimelineEntry[] = (timelineContent || []).map((n: any) => ({
    notificationId: n.notificationId,
    eventId: n.eventId,
    eventType: n.eventType,
    entityType: n.entityType,
    entityRef: n.entityRef,
    title: n.title,
    severity: n.severity,
    targetOrgId: n.targetOrgId,
    targetOrgName: n.targetOrgName ?? `Org ${n.targetOrgId}`,
    addressing: n.addressing,
    createdAt: n.createdAt,
    readCount: n.readCount ?? 0,
    totalRecipients: n.totalRecipients ?? 0,
    deliveryStatus: n.deliveryStatus ?? "DELIVERED",
    deliveryLagMs: n.deliveryLagMs ?? 0,
  }));

  const outboxSummary: OutboxSummary = {
    directKafka: outboxSummaryRaw?.directKafka ?? 0,
    retriedLookup: outboxSummaryRaw?.retriedLookup ?? 0,
    gaveUp: outboxSummaryRaw?.gaveUp ?? 0,
    pending: outboxSummaryRaw?.pending ?? 0,
    total: outboxSummaryRaw?.total ?? 0,
  };

  const outboxByEventType: OutboxEventTypeStats[] = (outboxEventsRaw || []).map((e: any) => ({
    eventType: e.eventType,
    direct: e.direct ?? 0,
    retried: e.retried ?? 0,
    failed: e.failed ?? 0,
    total: e.total ?? 0,
    avgLagSec: e.avgLagSec ?? 0,
  }));

  const outboxTrend: OutboxTrendPoint[] = (outboxTrendRaw || []).map((t: any) => ({
    date: t.date,
    direct: t.direct ?? 0,
    retried: t.retried ?? 0,
    failed: t.failed ?? 0,
    total: t.total ?? 0,
  }));

  const outboxRetriedContent = outboxRetriedRaw?.content ?? outboxRetriedRaw ?? [];
  const outboxRetried: OutboxRetriedRow[] = (outboxRetriedContent || []).map((r: any) => ({
    outbox_id: r.outbox_id,
    event_type: r.event_type,
    event_id: r.event_id,
    attempts: r.attempts,
    created_at: r.created_at,
    published_at: r.published_at,
    last_error: r.last_error,
  }));

  const outboxFailedContent = outboxFailedRaw?.content ?? outboxFailedRaw ?? [];
  const outboxFailed: OutboxFailedRow[] = (outboxFailedContent || []).map((r: any) => ({
    outbox_id: r.outbox_id,
    event_type: r.event_type,
    event_id: r.event_id,
    attempts: r.attempts,
    created_at: r.created_at,
    failed_at: r.failed_at,
    last_error: r.last_error,
  }));

  return {
    overview,
    trends,
    orgStats,
    eventTypeStats,
    severityStats,
    addressingStats,
    delivery,
    recentNotifications,
    outboxSummary,
    outboxByEventType,
    outboxTrend,
    outboxRetried,
    outboxFailed,
  };
}

export const notificationAnalyticsApi = {
  getOverview: () => fetchNotificationAnalytics(new Date(), new Date()),
};

// ---------------------------------------------------------------------------
// Paginated fetch functions for individual tables
// ---------------------------------------------------------------------------

export async function fetchOrgStats(page = 0, size = 20): Promise<PaginatedResponse<OrgNotificationStats>> {
  const raw = await fetchApi<any>(`/by-org?page=${page}&size=${size}`);
  const content = (raw?.content ?? raw ?? []).map((o: any) => ({
    orgId: o.orgId,
    orgName: o.orgName ?? `Org ${o.orgId}`,
    totalNotifications: o.totalNotifications ?? 0,
    unreadCount: o.unreadCount ?? 0,
    readRate: o.readRate ?? 0,
    lastNotificationAt: o.lastNotificationAt ?? new Date().toISOString(),
    avgDeliveryLagMs: o.avgDeliveryLagMs ?? 0,
  }));
  return {
    content,
    totalElements: raw?.totalElements ?? content.length,
    totalPages: raw?.totalPages ?? 1,
    page: raw?.page ?? page,
    size: raw?.size ?? size,
  };
}

export async function fetchTimeline(page = 0, size = 20): Promise<PaginatedResponse<NotificationTimelineEntry>> {
  const raw = await fetchApi<any>(`/timeline?page=${page}&size=${size}`);
  const content = (raw?.content ?? raw ?? []).map((n: any) => ({
    notificationId: n.notificationId,
    eventId: n.eventId,
    eventType: n.eventType,
    entityType: n.entityType,
    entityRef: n.entityRef,
    title: n.title,
    severity: n.severity,
    targetOrgId: n.targetOrgId,
    targetOrgName: n.targetOrgName ?? `Org ${n.targetOrgId}`,
    addressing: n.addressing,
    createdAt: n.createdAt,
    readCount: n.readCount ?? 0,
    totalRecipients: n.totalRecipients ?? 0,
    deliveryStatus: n.deliveryStatus ?? "DELIVERED",
    deliveryLagMs: n.deliveryLagMs ?? 0,
  }));
  return {
    content,
    totalElements: raw?.totalElements ?? content.length,
    totalPages: raw?.totalPages ?? 1,
    page: raw?.page ?? page,
    size: raw?.size ?? size,
  };
}

export async function fetchOutboxRetried(page = 0, size = 20): Promise<PaginatedResponse<OutboxRetriedRow>> {
  const raw = await fetchApi<any>(`/outbox/retried?page=${page}&size=${size}`);
  const content = (raw?.content ?? raw ?? []).map((r: any) => ({
    outbox_id: r.outbox_id,
    event_type: r.event_type,
    event_id: r.event_id,
    attempts: r.attempts,
    created_at: r.created_at,
    published_at: r.published_at,
    last_error: r.last_error,
  }));
  return {
    content,
    totalElements: raw?.totalElements ?? content.length,
    totalPages: raw?.totalPages ?? 1,
    page: raw?.page ?? page,
    size: raw?.size ?? size,
  };
}

export async function fetchOutboxFailed(page = 0, size = 20): Promise<PaginatedResponse<OutboxFailedRow>> {
  const raw = await fetchApi<any>(`/outbox/failed?page=${page}&size=${size}`);
  const content = (raw?.content ?? raw ?? []).map((r: any) => ({
    outbox_id: r.outbox_id,
    event_type: r.event_type,
    event_id: r.event_id,
    attempts: r.attempts,
    created_at: r.created_at,
    failed_at: r.failed_at,
    last_error: r.last_error,
  }));
  return {
    content,
    totalElements: raw?.totalElements ?? content.length,
    totalPages: raw?.totalPages ?? 1,
    page: raw?.page ?? page,
    size: raw?.size ?? size,
  };
}