"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export function ChatInput({
    value,
    onChange,
    onSubmit,
    placeholder = "Type a message...",
    disabled = false,
    className,
    children,
}: ChatInputProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !disabled) {
            onSubmit(value.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
                onSubmit(value.trim());
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    return (
        <form onSubmit={handleSubmit} className={cn("flex items-end gap-2", className)}>
            <Textarea
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none pr-8"
                rows={1}
            />
            {children || (
                <Button
                    type="submit"
                    size="icon"
                    disabled={!value.trim() || disabled}
                    className="shrink-0 h-[44px]"
                    aria-label="Send message"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1={22} y1={2} x2={11} y2={13} />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </Button>
            )}
        </form>
    );
}