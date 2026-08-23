"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatMessagesProps extends React.HTMLAttributes<HTMLDivElement> { }

export function ChatMessages({ className, children, ...props }: ChatMessagesProps) {
    return (
        <div
            className={cn("flex flex-col gap-4", className)}
            {...props}
        >
            {children}
        </div>
    );
}