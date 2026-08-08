"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ChatBubble,
    ChatBubbleGroup,
    ChatInput,
    ChatMessages,
    ChatScroller,
    ChatStatus,
    ChatTimestamp,
} from "@/components/ui/chat";
import { Toaster } from "@/components/ui/sonner";
import { useNexusBuddy } from "@/hooks/use-nexus-buddy";
import { cn } from "@/lib/utils";
import { Bug, Check, Copy, Loader2, MessageCircle, Sparkles, Terminal, Trash2, X } from "lucide-react";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface Message {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: Date
    status?: "sending" | "sent" | "delivered" | "read" | "error"
    isStreaming?: boolean
}

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2">
            <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "-0.3s" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "-0.15s" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
            </div>
        </div>
    )
}

function MessageBubble({ message, onCopy }: { message: Message; onCopy: (content: string) => void }) {
    const isUser = message.role === "user"
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        onCopy(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Debug logging
    console.log("[MessageBubble] Rendering message:", message.id, "role:", message.role, "content length:", message.content.length, "content preview:", message.content.slice(0, 50));

    const renderContent = () => {
        if (isUser) {
            return <div className="prose prose-xs max-w-none text-sm wrap-break-word text-primary-foreground">{message.content}</div>
        }
        return (
            <div className="prose prose-xs max-w-none text-sm wrap-break-word">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                >
                    {message.content}
                </ReactMarkdown>
            </div>
        )
    }

    return (
        <ChatBubbleGroup className={cn("w-full", isUser && "items-end")}>
            <ChatBubble variant={message.role}>
                <div className="relative">
                    <div>{renderContent()}</div>
                    {!isUser && (
                        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleCopy}
                                aria-label={copied ? "Copied" : "Copy to clipboard"}
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    )}
                </div>
            </ChatBubble>
            <div className={cn("flex items-center gap-1 px-1 text-[10px] text-muted-foreground", isUser && "justify-end")}>
                <ChatTimestamp timestamp={message.timestamp} showTime />
                {!isUser && message.status && <ChatStatus status={message.status} />}
            </div>
        </ChatBubbleGroup>
    )
}

export function NexusBuddy() {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [testMode, setTestMode] = React.useState(false)

    // Get the current domain for domain-based tool loading
    // In production, this would be the actual domain (e.g., "app.example.com")
    // In development, it's "localhost:3001" for nexus-direct
    const currentDomain = typeof window !== "undefined" ? window.location.host : "localhost:3001"

    const {
        messages,
        sendMessage,
        isStreaming,
        error,
        clearConversation,
        retryLastMessage,
    } = useNexusBuddy({ domain: currentDomain, useTestMode: testMode })

    const handleSend = async (content: string) => {
        await sendMessage(content)
        setInputValue("")
    }

    const handleRetry = () => {
        retryLastMessage()
    }

    const handleClear = () => {
        clearConversation()
    }

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat window */}
            <Card
                className={cn(
                    "flex w-[22rem] origin-bottom-right flex-col overflow-hidden border shadow-2xl transition-all duration-200 ease-out sm:w-96 gap-2",
                    open
                        ? "pointer-events-auto h-[30rem] scale-100 opacity-100"
                        : "pointer-events-none h-0 scale-95 opacity-0"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold leading-none">NexusBuddy</p>
                            <p className="mt-1 text-xs text-primary-foreground/80">
                                {isStreaming ? "Thinking..." : testMode ? "Test Mode (Dummy Logs)" : "Ready to help"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant={testMode ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15"
                            onClick={() => setTestMode((prev) => !prev)}
                            aria-label={testMode ? "Disable test mode" : "Enable test mode (dummy logs)"}
                            title={testMode ? "Test Mode: ON - Streaming dummy logs" : "Test Mode: OFF - Normal AI chat"}
                        >
                            {testMode ? <Terminal className="h-4 w-4" /> : <Bug className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15"
                            onClick={handleClear}
                            aria-label="Clear conversation"
                            disabled={messages.length === 0}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15"
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <ChatScroller className="flex-1 min-h-0 bg-background overflow-hidden">
                    <ChatMessages className="p-4">
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} onCopy={handleCopy} />
                        ))}
                        {isStreaming && <TypingIndicator />}
                    </ChatMessages>
                </ChatScroller>

                {/* Error display */}
                {error && (
                    <div className="border-t bg-destructive/10 p-3">
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <span className="flex-1">{error}</span>
                            <Button variant="ghost" size="icon" onClick={handleRetry} aria-label="Retry">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="border-t bg-background p-3">
                    <ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSend}
                        placeholder="Ask NexusBuddy..."
                        disabled={isStreaming}
                    />
                </div>
            </Card>

            {/* Floating toggle button */}
            <Button
                size="icon"
                onClick={() => setOpen((prev) => !prev)}
                className="h-14 w-14 rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
                aria-label={open ? "Close chat" : "Open chat"}
            >
                <span className="relative flex h-6 w-6 items-center justify-center">
                    <MessageCircle
                        className={cn(
                            "absolute h-6 w-6 transition-all duration-200",
                            open ? "scale-0 opacity-0" : "scale-100 opacity-100"
                        )}
                    />
                    <X
                        className={cn(
                            "absolute h-6 w-6 transition-all duration-200",
                            open ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                    />
                </span>
            </Button>

            <Toaster position="bottom-right" />
        </div>
    )
}