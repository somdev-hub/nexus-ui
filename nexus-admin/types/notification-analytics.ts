// Notification analytics types.
//
// These mirror the backend notification data model. When real backend
// endpoints are wired up, these shapes should match the DTOs returned
// by the CMS notification analytics controller.

export interface NotificationOverview {
  totalNotifications: number;
  totalOrgs: number;
  totalUsers: number;
  unreadCount: number;
  readCount: number;
  readRate: number; // percentage
  avgDeliveryLagMs: number;
  realtimeDeliveryRate: number; // percentage delivered via STOMP on first attempt
  failureCount: number;
  retentionDays: number;
}

export interface NotificationTrendPoint {
  date: string; // ISO date
  count: number;
  read: number;
  unread: number;
}

export interface OrgNotificationStats {
  orgId: number;
  orgName: string;
  totalNotifications: number;
  unreadCount: number;
  readRate: number;
  lastNotificationAt: string;
  avgDeliveryLagMs: number;
}

export interface EventTypeStats {
  eventType: string;
  displayName: string;
  count: number;
  percentage: number;
  avgDeliveryLagMs: number;
  severity: string;
}

export interface SeverityStats {
  severity: string;
  count: number;
  percentage: number;
}

export interface AddressingStats {
  addressing: string;
  count: number;
  percentage: number;
}

export interface DeliveryStats {
  totalDelivered: number;
  totalPending: number;
  totalFailed: number;
  deliveryRate: number;
  avgDeliveryLagMs: number;
  p95DeliveryLagMs: number;
  p99DeliveryLagMs: number;
}

export interface NotificationTimelineEntry {
  notificationId: number;
  eventId: string;
  eventType: string;
  entityType: string;
  entityRef: string;
  title: string;
  severity: string;
  targetOrgId: number;
  targetOrgName: string;
  addressing: string;
  createdAt: string;
  readCount: number;
  totalRecipients: number;
  deliveryStatus: 'DELIVERED' | 'PENDING' | 'FAILED';
  deliveryLagMs: number;
}

export interface OutboxSummary {
  directKafka: number;
  retriedLookup: number;
  gaveUp: number;
  pending: number;
  total: number;
}

export interface OutboxEventTypeStats {
  eventType: string;
  direct: number;
  retried: number;
  failed: number;
  total: number;
  avgLagSec: number;
}

export interface OutboxTrendPoint {
  date: string;
  direct: number;
  retried: number;
  failed: number;
  total: number;
}

export interface OutboxRetriedRow {
  outbox_id: number;
  event_type: string;
  event_id: string;
  attempts: number;
  created_at: string;
  published_at: string;
  last_error: string;
}

export interface OutboxFailedRow {
  outbox_id: number;
  event_type: string;
  event_id: string;
  attempts: number;
  created_at: string;
  failed_at: string;
  last_error: string;
}

export interface NotificationAnalyticsData {
  overview: NotificationOverview;
  trends: NotificationTrendPoint[];
  orgStats: OrgNotificationStats[];
  eventTypeStats: EventTypeStats[];
  severityStats: SeverityStats[];
  addressingStats: AddressingStats[];
  delivery: DeliveryStats;
  recentNotifications: NotificationTimelineEntry[];
  outboxSummary: OutboxSummary;
  outboxByEventType: OutboxEventTypeStats[];
  outboxTrend: OutboxTrendPoint[];
  outboxRetried: OutboxRetriedRow[];
  outboxFailed: OutboxFailedRow[];
}