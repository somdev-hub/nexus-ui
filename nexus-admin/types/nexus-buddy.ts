// ============================================================================
// NEXUS BUDDY TYPES
// ============================================================================

export interface NexusBuddyClientConfig {
    clientConfigId: number;
    clientName: string;
    connectionUrl: string;
    healthCheckPath: string;
    isActive: boolean;
    createdOn: string;
    updatedOn: string;
}

export interface NexusBuddyClientConfigRequest {
    clientName: string;
    connectionUrl?: string;
    healthCheckPath?: string;
    isActive: boolean;
}

export interface NexusBuddyPageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        offset: number;
        paged: boolean;
        unpaged: boolean;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    numberOfElements: number;
    empty: boolean;
}

export type NexusBuddyClientConfigResponse = NexusBuddyPageResponse<NexusBuddyClientConfig>;

export interface NexusBuddyToolsConfig {
    toolsConfigId: number;
    toolName: string;
    toolDescription?: string;
    endpoint: string;
    httpMethod: string;
    isActive: boolean;
    clientConfigId: number;
    createdAt: string;
    updatedAt: string;
    paramConfigs?: NexusBuddyToolsParamConfig[];
}

export interface NexusBuddyToolsConfigRequest {
    toolName: string;
    toolDescription?: string;
    endpoint: string;
    httpMethod: string;
    isActive: boolean;
    clientConfigId: number;
    paramConfigs?: NexusBuddyToolsParamConfigRequest[];
}

export type NexusBuddyToolsConfigResponse = NexusBuddyPageResponse<NexusBuddyToolsConfig>;

export interface NexusBuddyToolsParamConfig {
    toolsParamConfigId: number;
    paramName: string;
    paramType: string;
    dataType: string;
    isRequired: boolean;
    defaultValue?: string;
    requestBodyJson?: string;
    description?: string;
    isActive: boolean;
    toolsConfigId: number;
    clientConfigId: number;
    createdAt: string;
    updatedAt: string;
}

export interface NexusBuddyToolsParamConfigRequest {
    paramName: string;
    paramType: string;
    dataType: string;
    isRequired: boolean;
    defaultValue?: string;
    requestBodyJson?: string;
    description?: string;
    isActive: boolean;
    toolsConfigId: number;
    clientConfigId?: number;
}

export type NexusBuddyToolsParamConfigResponse = NexusBuddyPageResponse<NexusBuddyToolsParamConfig>;