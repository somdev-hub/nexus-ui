"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
    nexusBuddyChat,
    executeNexusBuddyTool,
} from "@/lib/nexus-buddy-service";
import type { 
    NexusBuddyChatRequest, 
    NexusBuddyChatResponse, 
    NexusBuddyToolCall,
    ChatMessage 
} from "@/types/nexus-buddy";

interface UseNexusBuddyOptions {
    useStreaming?: boolean;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    context?: string;  // Current page/context the chat is attached to
    allowedTools?: string[];  // Guardrail: only allow specific tools (frontend-enforced allowlist)
    onError?: (error: Error) => void;
}

export function useNexusBuddy(options: UseNexusBuddyOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();

    // Get user context for data guardrails (user ID and org for backend filtering)
    const { user } = useAuth();

    const {
        useStreaming = true,
        model,
        temperature,
        maxTokens,
        context,
        allowedTools,
        onError,
    } = options;

    // Format tool result for display (defined here to avoid closure issues)
    const formatToolResult = (result: unknown): string => {
        if (typeof result === 'string') {
            return result;
        }
        if (typeof result === 'object') {
            try {
                return JSON.stringify(result, null, 2);
            } catch {
                return String(result);
            }
        }
        return String(result);
    };

    // Build chat request with user context for guardrails
    // Backend will enforce data isolation based on userId, orgId, and context
    const buildChatRequest = useCallback((
        userMessage: string,
        conversationHistory: Array<{ role: "user" | "assistant" | "system" | "tool"; content: string; toolCalls?: any }>
    ): NexusBuddyChatRequest => {
        // Get permissions from localStorage if available (HR module pattern)
        const storedUser = typeof window !== 'undefined' 
            ? localStorage.getItem('auth_user') 
            : null;
        let userPermissions: string[] = [];
        try {
            if (storedUser) {
                const parsed = JSON.parse(storedUser) as { permissions?: string[] };
                userPermissions = parsed.permissions || [];
            }
        } catch {
            // ignore parsing errors
        }
        
        return {
            message: userMessage,
            history: conversationHistory,
            clientIds: undefined, // Let backend fetch all active client configs
            model,
            temperature,
            maxTokens,
            metadata: {
                userId: user?.id,
                orgId: user?.orgId,
                context: context,
                permissions: userPermissions,
                allowedTools: allowedTools
            }
        };
    }, [
        user?.id, 
        user?.orgId, 
        model, 
        temperature, 
        maxTokens, 
        context, 
        allowedTools
    ]);

    // GUARDRAIL CHECK: Verify user has permission for tool (frontend enforcement)
    // This is a defense-in-depth measure - backend is the source of truth
    const canUserUseTool = useCallback((toolName: string): boolean => {
        // If allowedTools is specified (context-specific allowlist), use it
        if (allowedTools && allowedTools.length > 0) {
            return allowedTools.includes(toolName);
        }
        
        // If no allowlist specified, allow the tool (backend will still check permissions)
        return true;
    }, [allowedTools]);

    // Execute tool with guardrails
    const resolveToolCall = useCallback(async (toolCall: NexusBuddyToolCall) => {
        // GUARDRAIL CHECK: Verify tool is in allowlist
        if (!canUserUseTool(toolCall.name)) {
            throw new Error(`Tool '${toolCall.name}' is not allowed in this context`);
        }

        // Add tool call to messages as pending
        const toolMessageId = `tool-${crypto.randomUUID()}`;
        const toolMessage: ChatMessage = {
            id: toolMessageId,
            role: "assistant",
            content: `\n\n[Calling tool: ${toolCall.name}...]`,
            timestamp: new Date(),
            toolCall: { ...toolCall, status: "in_progress" }
        };
        setMessages(prev => [...prev, toolMessage]);

        try {
            // Get permissions from localStorage
            const storedUser = typeof window !== 'undefined' 
                ? localStorage.getItem('auth_user') 
                : null;
            let userPermissions: string[] = [];
            try {
                if (storedUser) {
                    const parsed = JSON.parse(storedUser) as { permissions?: string[] };
                    userPermissions = parsed.permissions || [];
                }
            } catch {
                // ignore parsing errors
            }

            // Execute tool via backend API (NOT client-side!)
            // Backend validates user/org permissions and enforces data guardrails
            const result = await executeNexusBuddyTool({
                toolName: toolCall.name,
                arguments: toolCall.arguments,
                userId: user?.id,
                orgId: user?.orgId,
                context: context,
                permissions: userPermissions
            });

            // Update tool message with result
            setMessages(prev => prev.map(m => 
                m.id === toolMessageId 
                    ? { 
                        ...m, 
                        content: `\n\nResult: ${formatToolResult(result)}`, 
                        toolCall: { ...toolCall, status: "completed", result } 
                    }
                    : m
            ));

            // Add tool result as user message for context (per OpenAI semantics)
            const resultMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: formatToolResult(result),
                timestamp: new Date()
            };
            
            return { success: true, result, resultMessage };
        } catch (error) {
            const errorMsg = error instanceof Error 
                ? error.message 
                : "Tool execution failed";
            
            setMessages(prev => prev.map(m => 
                m.id === toolMessageId 
                    ? { 
                        ...m, 
                        content: `\n\nError: ${errorMsg}`, 
                        toolCall: { ...toolCall, status: "failed", error: errorMsg } 
                    }
                    : m
            ));
            
            return { success: false, error: errorMsg };
        }
    }, [allowedTools, canUserUseTool, context, formatToolResult, user?.orgId, user?.id]);

    // Main send function - handles message and tool calls
    const sendMessage = useCallback(async (content: string) => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        // Add user message
        const user_msg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content,
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, user_msg]);

        try {
            // Build request with user context
            const request = buildChatRequest(content, messages);

            // Send to Nexus Buddy
            const response = await nexusBuddyChat(request);

            // Handle tool calls in response
            if (response.toolCalls && response.toolCalls.length > 0) {
                // Process each tool call
                for (const toolCall of response.toolCalls) {
                    const fullToolCall: NexusBuddyToolCall = {
                        ...toolCall,
                        status: "pending",
                    };
                    const { success, resultMessage, error: toolError } = 
                        await resolveToolCall(fullToolCall);
                    
                    if (success && resultMessage) {
                        setMessages(prev => [...prev, resultMessage]);
                    } else if (toolError) {
                        toast({
                            title: "Tool Error",
                            description: toolError,
                            variant: "destructive"
                        });
                    }
                }

                // Send follow-up message with tool results context
                const followUpMessages = messages.filter(m => m.toolCall?.status === "completed");
                if (followUpMessages.length > 0) {
                    const allMessagesForFollowup = [
                        ...messages,
                        user_msg,
                        ...followUpMessages
                    ];
                    
                    const followUpRequest = buildChatRequest("", allMessagesForFollowup.map(m => ({
                        role: m.role,
                        content: m.content
                    })));
                    
                    const followUpResponse = await nexusBuddyChat(followUpRequest);
                    
                    const assistantMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: followUpResponse.message,
                        timestamp: new Date(),
                        conversationId: followUpResponse.conversationId
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    setConversationId(followUpResponse.conversationId);
                }
            } else {
                // No tool calls, just add assistant response
                const assistantMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: response.message,
                    timestamp: new Date(),
                    conversationId: response.conversationId
                };
                setMessages(prev => [...prev, assistantMessage]);
                setConversationId(response.conversationId);
            }
        } catch (err) {
            const errorMsg = err instanceof Error 
                ? err.message 
                : "Error processing message";
            
            setError(errorMsg);
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: "assistant",
                content: `Error: ${errorMsg}`,
                timestamp: new Date()
            }]);
            
            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive"
            });
            
            onError?.(err as Error);
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    }, [
        isLoading,
        messages,
        buildChatRequest,
        canUserUseTool,
        context,
        user?.orgId,
        user?.id,
        allowedTools,
        onError,
        setConversationId,
        toast,
        setError,
        setIsLoading,
        setIsStreaming
    ]);

    // Retry failed message
    const retryLastMessage = useCallback(() => {
        const lastUserMessage = [...messages]
            .reverse()
            .find((m) => m.role === "user");
        
        if (lastUserMessage) {
            // Remove any failed assistant response
            setMessages(prev =>
                prev.filter(
                    (m) =>
                        m.role !== "assistant" || 
                        m.timestamp > lastUserMessage.timestamp
                )
            );
            sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage]);

    // Clear conversation
    const clearConversation = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setError(null);
    }, []);

    // Clear only failed messages
    const clearFailedMessages = useCallback(() => {
        setMessages(prev => prev.filter(m => 
            !(m.role === "assistant" && m.status === "error")
        ));
    }, []);

    return {
        messages,
        isLoading,
        isStreaming,
        error,
        conversationId,
        sendMessage,
        clearConversation,
        retryLastMessage,
        clearFailedMessages,
    };
}