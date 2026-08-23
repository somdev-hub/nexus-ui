"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatBubbleGroupProps extends React.HTMLAttributes<HTMLDivElement> { }

const ChatBubbleGroup = React.forwardRef<HTMLDivElement, ChatBubbleGroupProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("flex flex-col gap-1", className)}
                {...props}
            >
                {children}
            </div>
        );
    },
);
ChatBubbleGroup.displayName = "ChatBubbleGroup";

export { ChatBubbleGroup };