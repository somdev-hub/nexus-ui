'use client';

import { Bell } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { resolveNotificationRoute } from '@/lib/notification-routes';
import { NotificationMessage } from '@/types/notifications';

export function NotificationBell() {
    const {
        unreadCount,
        items,
        markRead,
        markAllRead,
        sync,
    } = useNotifications({
        onNotification: (push) => {
            if (push.message) {
                const m = push.message;
                toast(m.title, {
                    description: m.body,
                    action: {
                        label: 'Open',
                        onClick: () => {
                            window.location.href = resolveNotificationRoute(
                                m.entityType,
                                m.entityId
                            );
                        },
                    },
                });
            }
        },
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                >
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 p-0"
            >
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">
                        Notifications
                    </span>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="text-xs text-muted-foreground hover:underline"
                            onClick={() => {
                                markAllRead();
                            }}
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {items.length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    )}
                    {items.map((item: NotificationMessage) => (
                        <button
                            key={item.notificationId}
                            type="button"
                            className="flex w-full flex-col gap-1 border-b px-3 py-2 text-left transition hover:bg-accent/50 last:border-b-0"
                            onClick={() => {
                                markRead(item.notificationId);
                                window.location.href = resolveNotificationRoute(
                                    item.entityType,
                                    item.entityId
                                );
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">
                                    {item.title}
                                </span>
                                {item.severity === 'WARNING' && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                        Warning
                                    </span>
                                )}
                                {item.severity === 'CRITICAL' && (
                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                        Critical
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-2">
                                {item.body}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                                {new Date(item.createdAt).toLocaleString()}
                            </span>
                        </button>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
