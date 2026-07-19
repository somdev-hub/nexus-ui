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

export interface NexusBuddyClientConfigResponse {
  content: NexusBuddyClientConfig[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

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

export interface NexusBuddyToolsConfigResponse {
  content: NexusBuddyToolsConfig[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

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
}

export interface NexusBuddyToolsParamConfigResponse {
  content: NexusBuddyToolsParamConfig[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}