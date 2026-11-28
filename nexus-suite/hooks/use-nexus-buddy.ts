'use client';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import {
    createConversation,
    deleteServerConversation,
    executeNexusBuddyTool,
    getConversations,
    nexusBuddyChat,
    updateConversation,
} from '@/lib/nexus-buddy-service';
import type {
    ChatMessage,
    NexusBuddyChatRequest,
    NexusBuddyToolCall,
} from '@/types/nexus-buddy';
import { useCallback, useEffect, useState } from 'react';

interface UseNexusBuddyOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    context?: string;
    allowedTools?: string[];
    onError?: (error: Error) => void;
}

export interface StoredConversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    context?: string;
    conversationId?: string;
    serverId?: number;
}

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

function generateTitle(content: string): string {
    const cleaned = content.replace(/\n/g, ' ').trim();
    if (cleaned.length <= 40) return cleaned;
    return cleaned.substring(0, 40) + '...';
}

export function useNexusBuddy(options: UseNexusBuddyOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<StoredConversation[]>(
        []
    );
    const [activeConversationId, setActiveConversationId] = useState<
        string | null
    >(null);
    const [activeServerId, setActiveServerId] = useState<number | null>(null);
    const { toast } = useToast();

    const { user } = useAuth();
    const userId = user?.id;
    const orgId = user?.orgId;

    const { model, temperature, maxTokens, context, allowedTools, onError } =
        options;

    // Load conversations from server on mount
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        const load = async () => {
            try {
                const serverConvs = await getConversations(userId);
                if (cancelled) return;
                const converted: StoredConversation[] = serverConvs.map(
                    (sc) => ({
                        id: String(sc.id),
                        title: sc.title || 'New Conversation',
                        messages: sc.messagesJson
                            ? JSON.parse(sc.messagesJson).map(
                                  (m: ChatMessage) => ({
                                      ...m,
                                      timestamp:
                                          m.timestamp instanceof Date
                                              ? m.timestamp
                                              : new Date(m.timestamp),
                                  })
                              )
                            : [],
                        createdAt: sc.createdAt,
                        updatedAt: sc.updatedAt,
                        context: sc.context,
                        conversationId: sc.backendConversationId,
                        serverId: sc.id,
                    })
                );
                setConversations(converted);
            } catch (e) {
                if (!cancelled)
                    console.error(
                        'Failed to load conversations from server:',
                        e
                    );
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const buildChatRequest = useCallback(
        (
            userMessage: string,
            conversationHistory: Array<{
                role: 'user' | 'assistant' | 'system' | 'tool';
                content: string;
                toolCalls?: NexusBuddyToolCall[];
            }>
        ): NexusBuddyChatRequest => {
            const storedUser =
                typeof window !== 'undefined'
                    ? localStorage.getItem('auth_user')
                    : null;
            let userPermissions: string[] = [];
            try {
                if (storedUser) {
                    const parsed = JSON.parse(storedUser) as {
                        permissions?: string[];
                    };
                    userPermissions = parsed.permissions || [];
                }
            } catch {
                // ignore parsing errors
            }

            return {
                message: userMessage,
                history: conversationHistory,
                clientIds: undefined,
                model,
                temperature,
                maxTokens,
                metadata: {
                    userId: userId,
                    orgId: orgId,
                    context: context,
                    permissions: userPermissions,
                    allowedTools: allowedTools,
                },
            };
        },
        [userId, orgId, model, temperature, maxTokens, context, allowedTools]
    );

    const canUserUseTool = useCallback(
        (toolName: string): boolean => {
            if (allowedTools && allowedTools.length > 0) {
                return allowedTools.includes(toolName);
            }
            return true;
        },
        [allowedTools]
    );

    const resolveToolCall = useCallback(
        async (toolCall: NexusBuddyToolCall) => {
            if (!canUserUseTool(toolCall.name)) {
                throw new Error(
                    `Tool '${toolCall.name}' is not allowed in this context`
                );
            }

            const toolMessageId = `tool-${crypto.randomUUID()}`;
            const toolMessage: ChatMessage = {
                id: toolMessageId,
                role: 'assistant',
                content: `\n\n[Calling tool: ${toolCall.name}...]`,
                timestamp: new Date(),
                toolCall: { ...toolCall, status: 'in_progress' },
            };
            setMessages((prev) => [...prev, toolMessage]);

            try {
                const storedUser =
                    typeof window !== 'undefined'
                        ? localStorage.getItem('auth_user')
                        : null;
                let userPermissions: string[] = [];
                try {
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser) as {
                            permissions?: string[];
                        };
                        userPermissions = parsed.permissions || [];
                    }
                } catch {
                    // ignore parsing errors
                }

                const result = await executeNexusBuddyTool({
                    toolName: toolCall.name,
                    arguments: toolCall.arguments,
                    userId: userId,
                    orgId: orgId,
                    context: context,
                    permissions: userPermissions,
                });

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === toolMessageId
                            ? {
                                  ...m,
                                  content: `\n\nResult: ${formatToolResult(result)}`,
                                  toolCall: {
                                      ...toolCall,
                                      status: 'completed',
                                      result,
                                  },
                              }
                            : m
                    )
                );

                const resultMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: formatToolResult(result),
                    timestamp: new Date(),
                };

                return { success: true, result, resultMessage };
            } catch (error) {
                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : 'Tool execution failed';

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === toolMessageId
                            ? {
                                  ...m,
                                  content: `\n\nError: ${errorMsg}`,
                                  toolCall: {
                                      ...toolCall,
                                      status: 'failed',
                                      error: errorMsg,
                                  },
                              }
                            : m
                    )
                );

                return { success: false, error: errorMsg };
            }
        },
        [canUserUseTool, context, userId, orgId]
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (isLoading) return;

            setIsLoading(true);
            setError(null);

            const user_msg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'user',
                content,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, user_msg]);

            try {
                const request = buildChatRequest(content, messages);

                const response = await nexusBuddyChat(request);

                if (response.toolCalls && response.toolCalls.length > 0) {
                    for (const toolCall of response.toolCalls) {
                        const fullToolCall: NexusBuddyToolCall = {
                            ...toolCall,
                            status: 'pending',
                        };
                        const {
                            success,
                            resultMessage,
                            error: toolError,
                        } = await resolveToolCall(fullToolCall);

                        if (success && resultMessage) {
                            setMessages((prev) => [...prev, resultMessage]);
                        } else if (toolError) {
                            toast({
                                title: 'Tool Error',
                                description: toolError,
                                variant: 'destructive',
                            });
                        }
                    }

                    const followUpMessages = messages.filter(
                        (m) => m.toolCall?.status === 'completed'
                    );
                    if (followUpMessages.length > 0) {
                        const allMessagesForFollowup = [
                            ...messages,
                            user_msg,
                            ...followUpMessages,
                        ];

                        const followUpRequest = buildChatRequest(
                            '',
                            allMessagesForFollowup.map((m) => ({
                                role: m.role,
                                content: m.content,
                            }))
                        );

                        const followUpResponse =
                            await nexusBuddyChat(followUpRequest);

                        const assistantMessage: ChatMessage = {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: followUpResponse.message,
                            timestamp: new Date(),
                            conversationId: followUpResponse.conversationId,
                        };
                        setMessages((prev) => [...prev, assistantMessage]);
                        setConversationId(followUpResponse.conversationId);
                    }
                } else {
                    const assistantMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: response.message,
                        timestamp: new Date(),
                        conversationId: response.conversationId,
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    setConversationId(response.conversationId);
                }
            } catch (err) {
                const errorMsg =
                    err instanceof Error
                        ? err.message
                        : 'Error processing message';

                setError(errorMsg);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: `Error: ${errorMsg}`,
                        timestamp: new Date(),
                    },
                ]);

                toast({
                    title: 'Error',
                    description: errorMsg,
                    variant: 'destructive',
                });

                onError?.(err as Error);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, buildChatRequest, messages, resolveToolCall, toast, onError]
    );

    // Save conversation to server when messages change
    useEffect(() => {
        if (messages.length === 0 || !userId) return;

        const messagesJson = JSON.stringify(messages);

        const save = async () => {
            try {
                if (activeServerId) {
                    // Update existing
                    await updateConversation(activeServerId, {
                        userId,
                        title: generateTitle(messages[0].content),
                        messagesJson,
                        backendConversationId: conversationId || undefined,
                        context,
                    });
                } else {
                    // Create new
                    const created = await createConversation({
                        userId,
                        orgId: orgId,
                        title: generateTitle(messages[0].content),
                        context,
                        messagesJson,
                        backendConversationId: conversationId || undefined,
                    });
                    setActiveServerId(created.id);
                    // Update conversations list
                    const newConv: StoredConversation = {
                        id: String(created.id),
                        title: created.title || 'New Conversation',
                        messages,
                        createdAt: created.createdAt,
                        updatedAt: created.updatedAt,
                        context,
                        conversationId: created.backendConversationId,
                        serverId: created.id,
                    };
                    setConversations((prev) => [newConv, ...prev]);
                }
            } catch (e) {
                console.error('Failed to save conversation to server:', e);
            }
        };

        // Debounce save
        const timer = setTimeout(save, 1000);
        return () => clearTimeout(timer);
    }, [messages, activeServerId, userId, orgId, conversationId, context]);

    const loadConversation = useCallback(
        (convId: string) => {
            const conv = conversations.find((c) => c.id === convId);
            if (conv) {
                const messagesWithDates = conv.messages.map((m) => ({
                    ...m,
                    timestamp:
                        m.timestamp instanceof Date
                            ? m.timestamp
                            : new Date(m.timestamp),
                }));
                setMessages(messagesWithDates);
                setConversationId(conv.conversationId || null);
                setActiveConversationId(conv.id);
                setActiveServerId(conv.serverId || null);
                setError(null);
            }
        },
        [conversations]
    );

    const newConversation = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setError(null);
        setActiveConversationId(null);
        setActiveServerId(null);
    }, []);

    const deleteConversation = useCallback(
        async (convId: string) => {
            const conv = conversations.find((c) => c.id === convId);
            if (!conv || !userId) return;

            try {
                if (conv.serverId) {
                    await deleteServerConversation(conv.serverId, userId);
                }
                setConversations((prev) => prev.filter((c) => c.id !== convId));
                if (activeConversationId === convId) {
                    newConversation();
                }
            } catch (e) {
                console.error('Failed to delete conversation:', e);
                toast({
                    title: 'Error',
                    description: 'Failed to delete conversation',
                    variant: 'destructive',
                });
            }
        },
        [conversations, userId, activeConversationId, newConversation, toast]
    );

    const retryLastMessage = useCallback(() => {
        const lastUserMessage = [...messages]
            .reverse()
            .find((m) => m.role === 'user');

        if (lastUserMessage) {
            setMessages((prev) =>
                prev.filter(
                    (m) =>
                        m.role !== 'assistant' ||
                        m.timestamp > lastUserMessage.timestamp
                )
            );
            sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage]);

    const clearConversation = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setError(null);
        setActiveConversationId(null);
        setActiveServerId(null);
    }, []);

    const clearFailedMessages = useCallback(() => {
        setMessages((prev) =>
            prev.filter(
                (m) => !(m.role === 'assistant' && m.status === 'error')
            )
        );
    }, []);

    return {
        messages,
        isLoading,
        error,
        conversationId,
        conversations,
        activeConversationId,
        sendMessage,
        clearConversation,
        retryLastMessage,
        clearFailedMessages,
        loadConversation,
        newConversation,
        deleteConversation,
    };
}
