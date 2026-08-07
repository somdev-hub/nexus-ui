"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatStatusProps extends React.HTMLAttributes<HTMLDivElement> {
    status: "sending" | "sent" | "delivered" | "read" | "error";
    className?: string;
}

const statusConfig = {
    sending: {
        label: "Sending...",
        className: "text-muted-foreground",
        icon: (
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
        ),
    },
    sent: {
        label: "Sent",
        className: "text-muted-foreground",
        icon: (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
    },
    delivered: {
        label: "Delivered",
        className: "text-muted-foreground",
        icon: (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="18 6 9 17 4 12" />
                <polyline points="22 6 13 17 8 12" />
            </svg>
        ),
    },
    read: {
        label: "Read",
        className: "text-primary",
        icon: (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="18 6 9 17 4 12" />
                <polyline points="22 6 13 17 8 12" />
            </svg>
        ),
    },
    error: {
        label: "Failed",
        className: "text-destructive",
        icon: (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1={15} y1={9} x2={9} y2={15} />
                <line x1={9} y1={9} x2={15} y2={15} />
            </svg>
        ),
    },
};

export function ChatStatus({ status, className, ...props }: ChatStatusProps) {
    const config = statusConfig[status];

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                config.className,
                className,
            )}
            {...props}
        >
            {config.icon}
            <span>{config.label}</span>
        </span>
    );
}