'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { resolveNotificationRoute } from '@/lib/notification-routes';
import { notificationWebSocketService } from '@/lib/notification-websocket';
import { NotificationMessage, NotificationPush } from '@/types/notifications';

export interface UseNotificationsOptions {
    /** Called when a new notification arrives. */
    onNotification?: (push: NotificationPush) => void;
}

export interface NotificationState {
    /** Unread count. */
    unreadCount: number;
    /** The notifications currently in the inbox. */
    items: NotificationMessage[];
    /** Whether the socket is connected. */
    isConnected: boolean;
    /** Connection error, if any. */
    error: string | null;
    /** Mark one notification as read. */
    markRead: (notificationId: number) => void;
    /** Mark every notification as read. */
    markAllRead: () => void;
    /** Ask the server for a fresh snapshot. */
    sync: () => void;
}

/**
 * Hook for managing the notification WebSocket connection.
 *
 * There is no REST fallback and no polling: the server pushes. On every
 * reconnect the hook re-subscribes and re-issues `sync`, so nothing is
 * missed.
 */
export function useNotifications(options: UseNotificationsOptions = {}): NotificationState {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState<NotificationMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    const orgId = user?.orgId;

    // Keep the latest callback in a ref so the effect doesn't re-run on
    // every render (which would disconnect and reconnect the socket).
    const onNotificationRef = useRef(options.onNotification);
    useEffect(() => {
        onNotificationRef.current = options.onNotification;
    }, [options.onNotification]);

    const handlePush = useCallback(
        (push: NotificationPush) => {
            console.log('[NOTIFICATIONS] handlePush called:', push.type, push);
            switch (push.type) {
                case 'MESSAGE':
                    if (push.message) {
                        console.log('[NOTIFICATIONS] New message notification:', push.message.title);
                        onNotificationRef.current?.(push);
                        setItems((prev) => {
                            // Dedupe by notificationId.
                            if (prev.some((i) => i.notificationId === push.message!.notificationId)) {
                                return prev;
                            }
                            return [push.message!, ...prev];
                        });
                        setUnreadCount((c) => c + 1);
                    }
                    break;
                case 'SNAPSHOT':
                    if (push.snapshot) {
                        setItems(push.snapshot.items);
                        setUnreadCount(push.snapshot.unreadCount);
                    }
                    break;
                case 'ACK':
                    if (push.ack) {
                        setUnreadCount(push.ack.unreadCount);
                    }
                    break;
                default:
                    console.warn('[NOTIFICATIONS] Unknown push type:', push.type);
            }
        },
        []
    );

    useEffect(() => {
        mountedRef.current = true;

        console.log('[NOTIFICATIONS] Effect running. user:', user?.id, 'orgId:', orgId);

        if (!user || !orgId) {
            console.log('[NOTIFICATIONS] No user or orgId, skipping connection');
            return;
        }

        const connect = async () => {
            try {
                await notificationWebSocketService.connect({
                    organizationId: orgId,
                    onConnect: () => {
                        console.log('[NOTIFICATIONS] onConnect fired, orgId:', orgId);
                        if (!mountedRef.current) return;
                        setIsConnected(true);
                        setError(null);

                        // Subscribe to live notifications for this organisation.
                        const orgTopic = `/topic/nexus/notifications/org/${orgId}`;
                        console.log('[NOTIFICATIONS] Subscribing to:', orgTopic);
                        notificationWebSocketService.subscribe(
                            orgTopic,
                            (data: any) => {
                                console.log('[NOTIFICATIONS] Received on org topic:', data);
                                handlePush({ type: 'MESSAGE', message: data });
                            }
                        );

                        // Subscribe to the private queue (snapshot + acks).
                        console.log('[NOTIFICATIONS] Subscribing to private queue');
                        notificationWebSocketService.subscribe(
                            '/user/queue/nexus/notifications',
                            (data: any) => {
                                console.log('[NOTIFICATIONS] Received on private queue:', data);
                                handlePush(data as NotificationPush);
                            }
                        );

                        // Ask for the current state.
                        console.log('[NOTIFICATIONS] Sending sync');
                        notificationWebSocketService.send(
                            '/app/nexus/notifications/ws/sync',
                            {}
                        );
                    },
                    onDisconnect: () => {
                        if (mountedRef.current) setIsConnected(false);
                    },
                    onError: (err: string) => {
                        if (mountedRef.current) setError(err);
                    },
                    onPush: handlePush,
                });
            } catch (err) {
                if (mountedRef.current) {
                    setError(
                        err instanceof Error ? err.message : 'Connection failed'
                    );
                }
            }
        };

        void connect();

        return () => {
            mountedRef.current = false;
            notificationWebSocketService.disconnect();
        };
    }, [user, orgId, handlePush]);

    const markRead = useCallback((notificationId: number) => {
        notificationWebSocketService.send(
            '/app/nexus/notifications/ws/mark-read',
            { notificationId }
        );
        setItems((prev) =>
            prev.map((it) =>
                it.notificationId === notificationId
                    ? { ...it }
                    : it
            )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
    }, []);

    const markAllRead = useCallback(() => {
        notificationWebSocketService.send(
            '/app/nexus/notifications/ws/mark-all-read',
            {}
        );
        setUnreadCount(0);
    }, []);

    const sync = useCallback(() => {
        notificationWebSocketService.send(
            '/app/nexus/notifications/ws/sync',
            {}
        );
    }, []);

    return {
        unreadCount,
        items,
        isConnected,
        error,
        markRead,
        markAllRead,
        sync,
    };
}
