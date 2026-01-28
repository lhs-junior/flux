import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ToolMetadata extends Tool {
  serverId: string;
  category?: string;
  keywords?: string[];
}

export interface GatewayOptions {
  dbPath?: string;
  enableToolSearch?: boolean;
  maxLayer2Tools?: number;
}
