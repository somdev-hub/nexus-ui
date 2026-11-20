// ============================================================================
// NEXUS BUDDY SERVICE - MCP + Tool Calling Support for Nexus-Suite
// ============================================================================

import apiClient from "@/lib/api-client";
import type {
    NexusBuddyChatRequest,
    NexusBuddyChatResponse,
    NexusBuddyToolResult,
    NexusBuddyAvailableToolsResponse,
    NexusBuddyClientConfig,
    NexusBuddyToolsConfig,
    NexusBuddyToolsParamConfig,
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
// CLIENT CONFIG APIs (for admin/management)
// ============================================================================

/**
 * Get all client configurations
 */
export async function getNexusBuddyClientConfigs(
    page = 0,
    size = 20,
    sortBy = "clientConfigId",
    sortDir: "asc" | "desc" = "asc"
): Promise<{
    content: NexusBuddyClientConfig[];
    totalPages: number;
    totalElements: number;
}> {
    try {
        const response = await apiClient.get<{
            content: NexusBuddyClientConfig[];
            totalPages: number;
            totalElements: number;
        }>(
            `/nexusbuddy/admin/client-configs?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to fetch client configs";
        console.error("Fetch client configs error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Get active client configurations (for tool authorization)
 */
export async function getNexusBuddyActiveClientConfigs(
    page = 0,
    size = 100,
    sortBy = "clientConfigId",
    sortDir: "asc" | "desc" = "asc"
): Promise<{
    content: NexusBuddyClientConfig[];
    totalPages: number;
    totalElements: number;
}> {
    try {
        const response = await apiClient.get<{
            content: NexusBuddyClientConfig[];
            totalPages: number;
            totalElements: number;
        }>(
            `/nexusbuddy/admin/client-configs/active?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to fetch active client configs";
        console.error("Fetch active client configs error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Create a new client configuration
 */
export async function createNexusBuddyClientConfig(
    payload: Omit<NexusBuddyClientConfig, "clientConfigId" | "createdOn" | "updatedOn">
): Promise<NexusBuddyClientConfig> {
    try {
        const response = await apiClient.post<NexusBuddyClientConfig>(
            "/nexusbuddy/admin/client-configs",
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to create client config";
        console.error("Create client config error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Update a client configuration
 */
export async function updateNexusBuddyClientConfig(
    clientConfigId: number,
    payload: Partial<NexusBuddyClientConfig>
): Promise<NexusBuddyClientConfig> {
    try {
        const response = await apiClient.put<NexusBuddyClientConfig>(
            `/nexusbuddy/admin/client-configs/${clientConfigId}`,
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to update client config";
        console.error("Update client config error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Deactivate a client configuration
 */
export async function deactivateNexusBuddyClientConfig(
    clientConfigId: number
): Promise<string> {
    try {
        const response = await apiClient.delete<string | { message: string }>(
            `/nexusbuddy/admin/client-configs/${clientConfigId}`
        );
        if (typeof response.data === "string") {
            return response.data;
        }
        return response.data?.message || "Client config deactivated successfully";
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to deactivate client config";
        console.error("Deactivate client config error:", error);
        throw new Error(errorMsg);
    }
}

// ============================================================================
// TOOLS CONFIG APIs
// ============================================================================

/**
 * Get tools configurations
 */
export async function getNexusBuddyToolsConfigs(
    page = 0,
    size = 20,
    sortBy = "toolsConfigId",
    sortDir: "asc" | "desc" = "asc"
): Promise<{
    content: NexusBuddyToolsConfig[];
    totalPages: number;
    totalElements: number;
}> {
    try {
        const response = await apiClient.get<{
            content: NexusBuddyToolsConfig[];
            totalPages: number;
            totalElements: number;
        }>(
            `/nexusbuddy/admin/tools-configs?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to fetch tools configs";
        console.error("Fetch tools configs error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Get tools configs by client config ID
 */
export async function getNexusBuddyToolsConfigsByClientConfigId(
    clientConfigId: number,
    page = 0,
    size = 20,
    sortBy = "toolsConfigId",
    sortDir: "asc" | "desc" = "asc"
): Promise<{
    content: NexusBuddyToolsConfig[];
    totalPages: number;
    totalElements: number;
}> {
    try {
        const response = await apiClient.get<{
            content: NexusBuddyToolsConfig[];
            totalPages: number;
            totalElements: number;
        }>(
            `/nexusbuddy/admin/tools-configs/client/${clientConfigId}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to fetch tools configs by client";
        console.error("Fetch tools by client error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Create a tools configuration
 */
export async function createNexusBuddyToolsConfig(
    payload: Omit<NexusBuddyToolsConfig, "toolsConfigId" | "createdAt" | "updatedAt">
): Promise<NexusBuddyToolsConfig> {
    try {
        const response = await apiClient.post<NexusBuddyToolsConfig>(
            "/nexusbuddy/admin/tools-configs",
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to create tools config";
        console.error("Create tools config error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Update a tools configuration
 */
export async function updateNexusBuddyToolsConfig(
    toolsConfigId: number,
    payload: Partial<NexusBuddyToolsConfig>
): Promise<NexusBuddyToolsConfig> {
    try {
        const response = await apiClient.put<NexusBuddyToolsConfig>(
            `/nexusbuddy/admin/tools-configs/${toolsConfigId}`,
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to update tools config";
        console.error("Update tools config error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Deactivate a tools configuration
 */
export async function deactivateNexusBuddyToolsConfig(
    toolsConfigId: number
): Promise<string> {
    try {
        const response = await apiClient.delete<string | { message: string }>(
            `/nexusbuddy/admin/tools-configs/${toolsConfigId}`
        );
        if (typeof response.data === "string") {
            return response.data;
        }
        return response.data?.message || "Tools config deactivated successfully";
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to deactivate tools config";
        console.error("Deactivate tools config error:", error);
        throw new Error(errorMsg);
    }
}

// ============================================================================
// TOOLS PARAM CONFIG APIs
// ============================================================================

/**
 * Get tools param configurations by tools config ID
 */
export async function getNexusBuddyToolsParamConfigsByToolsConfigId(
    toolsConfigId: number,
    page = 0,
    size = 20,
    sortBy = "toolsParamConfigId",
    sortDir: "asc" | "desc" = "asc"
): Promise<{
    content: NexusBuddyToolsParamConfig[];
    totalPages: number;
    totalElements: number;
}> {
    try {
        const response = await apiClient.get<{
            content: NexusBuddyToolsParamConfig[];
            totalPages: number;
            totalElements: number;
        }>(
            `/nexusbuddy/admin/tools-param-configs/${toolsConfigId}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to fetch param configs";
        console.error("Fetch param configs error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Create a param configuration
 */
export async function createNexusBuddyToolsParamConfig(
    payload: Omit<NexusBuddyToolsParamConfig, "toolsParamConfigId" | "createdAt" | "updatedAt">
): Promise<NexusBuddyToolsParamConfig> {
    try {
        const response = await apiClient.post<NexusBuddyToolsParamConfig>(
            "/nexusbuddy/admin/tools-param-configs",
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to create param config";
        console.error("Create param config error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Update a param configuration
 */
export async function updateNexusBuddyToolsParamConfig(
    toolsParamConfigId: number,
    payload: Partial<NexusBuddyToolsParamConfig>
): Promise<NexusBuddyToolsParamConfig> {
    try {
        const response = await apiClient.put<NexusBuddyToolsParamConfig>(
            `/nexusbuddy/admin/tools-param-configs/${toolsParamConfigId}`,
            payload
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to update param config";
        console.error("Update param config error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Deactivate a param configuration
 */
export async function deactivateNexusBuddyToolsParamConfig(
    toolsParamConfigId: number
): Promise<string> {
    try {
        const response = await apiClient.delete<string | { message: string }>(
            `/nexusbuddy/admin/tools-param-configs/${toolsParamConfigId}`
        );
        if (typeof response.data === "string") {
            return response.data;
        }
        return response.data?.message || "Param config deactivated successfully";
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to deactivate param config";
        console.error("Deactivate param config error:", error);
        throw new Error(errorMsg);
    }
}

// ============================================================================
// SEEDER APIs
// ============================================================================

/**
 * Seed Nexus Core AI Tools into NexusBuddy.
 * Creates client config and tools/params if they don't exist.
 * Idempotent - skips tools that already exist.
 */
export async function seedNexusCoreAiTools(): Promise<{
    clientConfigId: number;
    clientName: string;
    toolsCreated: number;
    paramsCreated: number;
    toolsSkipped: number;
    createdTools: string[];
    skippedTools: string[];
}> {
    try {
        const response = await apiClient.post<{
            clientConfigId: number;
            clientName: string;
            toolsCreated: number;
            paramsCreated: number;
            toolsSkipped: number;
            createdTools: string[];
            skippedTools: string[];
        }>("/nexusbuddy/admin/seeder/nexus-core-ai-tools");
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to seed Nexus Core AI Tools";
        console.error("Seed Nexus Core AI Tools error:", error);
        throw new Error(errorMsg);
    }
}

/**
 * Check seeding status.
 */
export async function getSeedStatus(): Promise<{ message: string; customEndpoint: string; note: string }> {
    try {
        const response = await apiClient.get<{ message: string; customEndpoint: string; note: string }>(
            "/nexusbuddy/admin/seeder/nexus-core-ai-tools/status"
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error 
            ? error.message 
            : "Failed to get seed status";
        console.error("Get seed status error:", error);
        throw new Error(errorMsg);
    }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

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