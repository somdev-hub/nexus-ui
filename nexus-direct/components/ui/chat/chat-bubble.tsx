"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "user" | "assistant" | "system";
}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
    ({ className, variant = "assistant", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative rounded-2xl px-4 py-2 max-w-[85%] text-sm break-words",
                    variant === "user" &&
                    "bg-primary text-primary-foreground rounded-br-md self-end ml-auto",
                    variant === "assistant" &&
                    "bg-muted text-muted-foreground rounded-bl-md self-start",
                    variant === "system" &&
                    "bg-accent text-accent-foreground rounded-md self-center mx-auto text-sm",
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        );
    },
);
ChatBubble.displayName = "ChatBubble";

export { ChatBubble };