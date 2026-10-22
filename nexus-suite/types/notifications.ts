// Notification domain types.
//
// These mirror the backend (com.nexus.cms.notification.model) on the wire.
// The backend is the source of truth for the shape; if a field is added or
// renamed there, it must be added or renamed here too.

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'ACTION_REQUIRED';

export interface NotificationMessage {
    notificationId: number;
    eventId: string;
    eventType: string;
    entityType: string;
    entityId: number;
    entityRef: string;
    title: string;
    body: string;
    severity: NotificationSeverity;
    targetOrgId: number;
    facts: Record<string, unknown>;
    createdAt: string; // ISO-8601 instant
}

export interface NotificationSnapshot {
    items: NotificationMessage[];
    unreadCount: number;
    serverTime: string;
}

export interface NotificationAck {
    notificationId: number | null;
    unreadCount: number;
}

export type NotificationPushType = 'MESSAGE' | 'SNAPSHOT' | 'ACK';

export interface NotificationPush {
    type: NotificationPushType;
    message?: NotificationMessage;
    snapshot?: NotificationSnapshot;
    ack?: NotificationAck;
}

export type NotificationRouteResolver = (entityType: string, entityId: number) => string;
