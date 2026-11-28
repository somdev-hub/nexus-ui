// ============================================================================
// NEXUS BUDDY TYPES FOR NEXUS-SUITE
// ============================================================================
// This file contains only chat-related types.
// Admin/config types (ClientConfig, ToolsConfig, ToolsParamConfig, ToolExecutionRequest)
// are handled in nexus-admin and have been removed from nexus-suite.

/**
 * Represents a tool that can be called by Nexus Buddy
 */
export interface NexusBuddyTool {
    name: string;
    description: string;
    inputSchema: unknown;
    outputSchema?: unknown;
    isActive: boolean;
    clientConfigId?: number;
    requiredPermissions?: string[];
}

/**
 * Tool call request from Nexus Buddy
 */
export interface NexusBuddyToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: unknown;
    error?: string;
}

/**
 * Request to chat with Nexus Buddy
 */
export interface NexusBuddyChatRequest {
    message: string;
    history?: Array<{
        role: 'user' | 'assistant' | 'system' | 'tool';
        content: string;
        toolCalls?: NexusBuddyToolCall[];
        toolResults?: Record<string, unknown>;
    }>;
    clientIds?: number[];
    conversationId?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    // NEW: Context-aware metadata for guardrails
    metadata?: {
        userId?: string;
        orgId?: string;
        context?: string; // e.g., "product-123", "order-456", "dashboard"
        permissions?: string[]; // User's actual permissions
        allowedTools?: string[]; // Explicit allowlist of tools this session can use
        page?: string; // Current page context
    };
}

/**
 * Response from Nexus Buddy
 */
export interface NexusBuddyChatResponse {
    message: string;
    conversationId: string;
    timestamp: string;
    model?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
    }>;
    finishReason?: 'tool_calls' | 'stop' | 'length' | 'error';
}

/**
 * Result from executing a tool
 */
export interface NexusBuddyToolResult {
    success: boolean;
    result?: unknown;
    error?: string;
    executionTime: number;
}

/**
 * Available tools response (for tool discovery)
 */
export interface NexusBuddyAvailableToolsResponse {
    tools: Array<{
        name: string;
        description: string;
        inputSchema: unknown;
        permissions?: string[];
    }>;
    permissions: string[];
}

/**
 * Chat message for UI display
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: Date;
    conversationId?: string;
    isStreaming?: boolean;
    toolCall?: NexusBuddyToolCall;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}
