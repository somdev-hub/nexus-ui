"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatScrollerProps {
    className?: string;
    children: React.ReactNode;
    autoScroll?: boolean;
}

export function ChatScroller({
    className,
    children,
    autoScroll = true,
}: ChatScrollerProps) {
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = React.useState(true);

    const scrollToBottom = React.useCallback(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, []);

    React.useEffect(() => {
        if (autoScroll && isAtBottom) {
            scrollToBottom();
        }
    }, [children, autoScroll, isAtBottom, scrollToBottom]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
        setIsAtBottom(isBottom);
    };

    return (
        <ScrollArea
            ref={scrollAreaRef}
            className={cn("h-full w-full min-h-0", className)}
        >
            <div className="flex flex-col" onScroll={handleScroll}>{children}</div>
        </ScrollArea>
    );
}