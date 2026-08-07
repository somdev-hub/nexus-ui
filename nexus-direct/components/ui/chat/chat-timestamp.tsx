"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatTimestampProps extends React.HTMLAttributes<HTMLTimeElement> {
    timestamp: Date;
    showTime?: boolean;
}

export function ChatTimestamp({
    timestamp,
    showTime = true,
    className,
    ...props
}: ChatTimestampProps) {
    const timeString = timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <time
            className={cn(
                "flex items-center gap-1 text-xs text-muted-foreground",
                className,
            )}
            dateTime={timestamp.toISOString()}
            {...props}
        >
            {showTime && <span>{timeString}</span>}
        </time>
    );
}