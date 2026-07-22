// ============================================================================
// NEXUS BUDDY TYPES
// ============================================================================

export interface NexusBuddyClientConfig {
  clientConfigId: number;
  clientName: string;
  connectionUrl: string;
  healthCheckPath: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NexusBuddyClientConfigRequest {
  clientName: string;
  connectionUrl?: string;
  healthCheckPath?: string;
  isActive: boolean;
}

// Backend returns List<ClientConfigResponse> directly, not a paginated wrapper
export type NexusBuddyClientConfigResponse = NexusBuddyClientConfig[];

export interface NexusBuddyToolsConfig {
  toolsConfigId: number;
  toolName: string;
  toolDescription?: string;
  endpoint: string;
  httpMethod: string;
  isActive: boolean;
  clientConfigId: number;
  clientConfig?: NexusBuddyClientConfig;
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

// Backend returns List<ToolsConfigResponse> directly, not a paginated wrapper
export type NexusBuddyToolsConfigResponse = NexusBuddyToolsConfig[];

export interface NexusBuddyToolsParamConfig {
  toolsParamConfigId: number;
  paramName: string;
  paramType: string;
  dataType: string;
  isRequired: boolean;
  defaultValue?: string;
  requestBodyJson?: string;
  isActive: boolean;
  toolsConfigId: number;
  toolsConfig?: NexusBuddyToolsConfig;
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
  isActive: boolean;
  toolsConfigId: number;
  clientConfigId?: number;
}

// Backend returns List<ToolsParamConfigResponse> directly, not a paginated wrapper
export type NexusBuddyToolsParamConfigResponse = NexusBuddyToolsParamConfig[];