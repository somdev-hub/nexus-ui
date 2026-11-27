// ============================================================================
// NEXUS BUDDY SERVICE - MCP + Tool Calling Support for Nexus-Suite
// ============================================================================
// This file contains only chat/conversation/health APIs.
// All admin/config APIs (client configs, tools configs, param configs, seeder)
// are handled in nexus-admin and have been removed from nexus-suite.

import apiClient from "@/lib/api-client";
import type {
    NexusBuddyChatRequest,
    NexusBuddyChatResponse,
    NexusBuddyToolResult,
    NexusBuddyAvailableToolsResponse,
} from "@/types/nexus-buddy";

/**
 * Chat with Nexus Buddy - supports MCP tool calling
 */
export async function nexusBuddyChat(
    request: NexusBuddyChatRequest
): Promise<NexusBuddyChatResponse> {
    try {
        const response = await apiClient.post<NexusBuddyChatResponse>(
            "/nexusbuddy/api/chat",
            request
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : "Nexus Buddy chat failed";
        console.error("Nexus Buddy chat error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Stream chat with Nexus Buddy (SSE)
 */
export async function* nexusBuddyStreamChat(
    request: NexusBuddyChatRequest
): AsyncGenerator<string> {
    try {
        const response = await fetch(
            "/api/proxy?path=/nexusbuddy/api/chat/stream",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error(`Stream failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error("No reader available for streaming");
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield decoder.decode(value);
        }
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : "Stream failed";
        console.error("Nexus Buddy stream error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Execute a tool via MCP-style tool calling
 * Runs SERVER-SIDE where actual tool execution happens with full auth
 */
export async function executeNexusBuddyTool(params: {
    toolName: string;
    arguments: Record<string, unknown>;
    userId?: string;
    orgId?: string;
    context?: string;
    permissions?: string[];
}): Promise<unknown> {
    try {
        // Call backend Spring Boot endpoint directly
        // The backend validates user/org permissions and executes the tool
        const response = await apiClient.post<{ result: unknown }>(
            "/nexusbuddy/api/tools/execute",
            {
                toolName: params.toolName,
                arguments: params.arguments,
                metadata: {
                    userId: params.userId,
                    orgId: params.orgId,
                    context: params.context,
                    permissions: params.permissions,
                }
            }
        );
        return response.data.result;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : "Tool execution failed";
        console.error("Tool execution error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Get available tools for the current user/org (backend validates access)
 */
export async function getAvailableTools(): Promise<NexusBuddyAvailableToolsResponse> {
    try {
        const response = await apiClient.get<NexusBuddyAvailableToolsResponse>(
            "/nexusbuddy/api/tools/available"
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : "Failed to fetch available tools";
        console.error("Fetch available tools error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Get available tools for a specific context (with guardrails)
 */
export async function getToolsForContext(context: string): Promise<NexusBuddyAvailableToolsResponse> {
    try {
        const response = await apiClient.get<NexusBuddyAvailableToolsResponse>(
            `/nexusbuddy/api/tools/available?context=${encodeURIComponent(context)}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : "Failed to fetch available tools for context";
        console.error("Fetch context tools error:", error);
        throw new Error(errorMsg);
    }
}

// ============================================================================
// CONVERSATION HISTORY APIs
// ============================================================================

export interface ServerConversation {
    id: number;
    userId: string;
    orgId?: number;
    title: string;
    context?: string;
    messagesJson: string;
    backendConversationId?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

/**
 * Get all conversations for a user.
 */
export async function getConversations(userId: string): Promise<ServerConversation[]> {
    try {
        const response = await apiClient.get<ServerConversation[]>(
            `/nexusbuddy/api/conversations?userId=${encodeURIComponent(userId)}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Failed to get conversations";
        console.error("Get conversations error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Get a specific conversation by ID.
 */
export async function getConversation(id: number, userId: string): Promise<ServerConversation> {
    try {
        const response = await apiClient.get<ServerConversation>(
            `/nexusbuddy/api/conversations/${id}?userId=${encodeURIComponent(userId)}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Failed to get conversation";
        console.error("Get conversation error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Create a new conversation.
 */
export async function createConversation(payload: {
    userId: string;
    orgId?: string;
    title?: string;
    context?: string;
    messagesJson: string;
    backendConversationId?: string;
}): Promise<ServerConversation> {
    try {
        const response = await apiClient.post<ServerConversation>(
            "/nexusbuddy/api/conversations",
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Failed to create conversation";
        console.error("Create conversation error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Update a conversation.
 */
export async function updateConversation(id: number, payload: {
    userId: string;
    title?: string;
    messagesJson?: string;
    backendConversationId?: string;
    context?: string;
}): Promise<ServerConversation> {
    try {
        const response = await apiClient.put<ServerConversation>(
            `/nexusbuddy/api/conversations/${id}`,
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Failed to update conversation";
        console.error("Update conversation error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Delete a conversation.
 */
export async function deleteServerConversation(id: number, userId: string): Promise<void> {
    try {
        await apiClient.delete(`/nexusbuddy/api/conversations/${id}?userId=${encodeURIComponent(userId)}`);
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Failed to delete conversation";
        console.error("Delete conversation error:", error);
        throw new Error(errorMsg);
    }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if NexusBuddy service is online.
 */
export async function checkNexusBuddyHealth(): Promise<boolean> {
    try {
        const response = await apiClient.get<{ status: string }>(
            "/nexusbuddy/api/chat/health"
        );
        return response.status === 200;
    } catch {
        return false;
    }
}

/**
 * Check Nexus Buddy health status
 */
export async function nexusBuddyHealthCheck(): Promise<{ status: string }> {
    try {
        const response = await apiClient.get<{ status: string }>(
            "/nexusbuddy/api/chat/health"
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : "Health check failed";
        console.error("Health check error:", error);
        throw new Error(errorMsg);
    }
}