// ============================================================================
// NEXUS BUDDY TYPES FOR NEXUS-SUITE
// ============================================================================

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
    status: "pending" | "in_progress" | "completed" | "failed";
    result?: unknown;
    error?: string;
}

/**
 * Request to chat with Nexus Buddy
 */
export interface NexusBuddyChatRequest {
    message: string;
    history?: Array<{
        role: "user" | "assistant" | "system" | "tool";
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
        context?: string;  // e.g., "product-123", "order-456", "dashboard"
        permissions?: string[];  // User's actual permissions
        allowedTools?: string[];  // Explicit allowlist of tools this session can use
        page?: string;  // Current page context
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
    finishReason?: "tool_calls" | "stop" | "length" | "error";
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
 * Client configuration for tool access
 */
export interface NexusBuddyClientConfig {
    clientConfigId: number;
    clientName: string;
    connectionUrl: string;
    healthCheckPath: string;
    isActive: boolean;
    createdOn: string;
    updatedOn: string;
    allowedUsersList?: string[];
}

/**
 * Tool configuration
 */
export interface NexusBuddyToolsConfig {
    toolsConfigId: number;
    toolName: string;
    toolDescription?: string;
    endpoint: string;
    httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    isActive: boolean;
    clientConfigId: number;
    paramConfigs?: NexusBuddyToolsParamConfig[];
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Tool parameter configuration
 */
export interface NexusBuddyToolsParamConfig {
    toolsParamConfigId: number;
    paramName: string;
    paramType: "QUERY" | "PATH" | "HEADER" | "BODY";
    dataType: "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT" | "ARRAY";
    isRequired: boolean;
    defaultValue?: unknown;
    requestBodyJson?: unknown;
    description?: string;
    isActive: boolean;
    toolsConfigId: number;
    clientConfigId: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Tool execution request
 */
export interface NexusBuddyToolExecutionRequest {
    toolName: string;
    arguments: Record<string, unknown>;
    userId?: string;
    orgId?: string;
    context?: string;
    permissions?: string[];
}

/**
 * Chat message for UI display
 */
export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp: Date;
    conversationId?: string;
    isStreaming?: boolean;
    toolCall?: NexusBuddyToolCall;
    status?: "sending" | "sent" | "delivered" | "read" | "error";
}