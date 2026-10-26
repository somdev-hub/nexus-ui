'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/lib/auth-context';
import { resolveNotificationRoute } from '@/lib/notification-routes';
import { NotificationMessage } from '@/types/notifications';

export default function NotificationsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<NotificationMessage[]>([]);
    const { unreadCount, markRead, sync, isConnected } = useNotifications({
        onNotification: (push) => {
            if (push.message) {
                setItems((prev) => [push.message!, ...prev]);
            }
            if (push.snapshot) {
                setItems(push.snapshot.items);
            }
        },
    });

    useEffect(() => {
        sync();
    }, [sync]);

    return (
        <div className="space-y-4 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Notifications</h1>
                <span className="text-sm text-muted-foreground">
                    {isConnected ? 'Live' : 'Connecting…'}
                    {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
                </span>
            </div>

            {items.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No notifications yet.
                    </CardContent>
                </Card>
            )}

            {items.map((item) => (
                <Card
                    key={item.notificationId}
                    className={
                        'cursor-pointer transition hover:bg-accent/50 ' +
                        (item.severity === 'WARNING' ? 'border-amber-300' : '')
                    }
                    onClick={() => {
                        markRead(item.notificationId);
                        window.location.href = resolveNotificationRoute(
                            item.entityType,
                            item.entityId,
                            user?.orgType
                        );
                    }}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {item.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {item.body}
                        <div className="mt-1 text-xs opacity-70">
                            {new Date(item.createdAt).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
