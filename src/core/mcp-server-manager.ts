import { MCPClient } from './mcp-client.js';
import { MetadataStore } from '../storage/metadata-store.js';
import { ToolLoader } from './tool-loader.js';
import logger from '../utils/logger.js';
import type { MCPServerConfig, ToolMetadata } from './types.js';

export interface MCPServerManagerDependencies {
  metadataStore: MetadataStore;
  toolLoader: ToolLoader;
  availableTools: Map<string, ToolMetadata>;
}

/**
 * Manages MCP server connections and tool registration
 */
export class MCPServerManager {
  private metadataStore: MetadataStore;
  private toolLoader: ToolLoader;
  private availableTools: Map<string, ToolMetadata>;
  private connectedServers: Map<string, MCPServerConfig>;
  private mcpClients: Map<string, MCPClient>;

  constructor(deps: MCPServerManagerDependencies) {
    this.metadataStore = deps.metadataStore;
    this.toolLoader = deps.toolLoader;
    this.availableTools = deps.availableTools;
    this.connectedServers = new Map();
    this.mcpClients = new Map();
  }

  /**
   * Connect to an MCP server and register its tools
   */
  async connectToServer(config: MCPServerConfig): Promise<void> {
    try {
      // Store server configuration
      this.connectedServers.set(config.id, config);

      // Save to metadata store
      this.metadataStore.addPlugin({
        id: config.id,
        name: config.name,
        command: config.command,
        args: config.args?.join(' '),
        env: config.env ? JSON.stringify(config.env) : undefined,
        qualityScore: 0, // Will be updated later
      });

      // Create and connect MCP client
      const client = new MCPClient(config, {
        onError: (error) => {
          logger.error(`MCP client error (${config.id}):`, error);
        },
        onDisconnect: () => {
          logger.info(`MCP client disconnected (${config.id})`);
          this.mcpClients.delete(config.id);
        },
      });

      await client.connect();
      this.mcpClients.set(config.id, client);

      // Register tools from this server
      await this.registerServerTools(config.id);
    } catch (error) {
      // Connection failed - clean up
      this.connectedServers.delete(config.id);
      this.mcpClients.delete(config.id);
      logger.error(`Failed to connect to server ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Register tools from a connected MCP server
   */
  private async registerServerTools(serverId: string): Promise<void> {
    const client = this.mcpClients.get(serverId);
    if (!client) {
      throw new Error(`MCP client not found for server: ${serverId}`);
    }

    try {
      // Get tools from the MCP server
      const tools = await client.listTools();

      // Register tools in memory
      for (const tool of tools) {
        this.availableTools.set(tool.name, tool);
      }

      // Register tools in ToolLoader (for BM25 search)
      this.toolLoader.registerTools(tools);

      // Save tools to metadata store
      this.metadataStore.addTools(tools);

      logger.info(`Registered ${tools.length} tools from server: ${serverId}`);
    } catch (error) {
      logger.error(`Failed to register tools from server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from an MCP server and remove its tools
   */
  async disconnectServer(serverId: string): Promise<void> {
    // Disconnect MCP client
    const client = this.mcpClients.get(serverId);
    if (client) {
      await client.disconnect();
      this.mcpClients.delete(serverId);
    }

    // Remove all tools from this server
    const removedTools: string[] = [];
    for (const [toolName, metadata] of this.availableTools.entries()) {
      if (metadata.serverId === serverId) {
        this.availableTools.delete(toolName);
        this.toolLoader.unregisterTool(toolName);
        removedTools.push(toolName);
      }
    }

    // Remove from metadata store
    this.metadataStore.removeToolsByServer(serverId);
    this.metadataStore.removePlugin(serverId);

    this.connectedServers.delete(serverId);
    logger.info(`Disconnected server: ${serverId}, removed ${removedTools.length} tools`);
  }

  /**
   * Disconnect all MCP servers
   */
  async disconnectAll(): Promise<void> {
    // Disconnect all MCP clients
    try {
      for (const client of this.mcpClients.values()) {
        try {
          await client.disconnect();
        } catch (error) {
          logger.error('Failed to disconnect MCP client:', error);
        }
      }
      this.mcpClients.clear();
    } catch (error) {
      logger.error('Failed to clear MCP clients:', error);
    }

    // Disconnect all servers
    try {
      for (const serverId of this.connectedServers.keys()) {
        try {
          await this.disconnectServer(serverId);
        } catch (error) {
          logger.error(`Failed to disconnect server ${serverId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to disconnect servers:', error);
    }
  }

  /**
   * Get an MCP client by server ID
   */
  getClient(serverId: string): MCPClient | undefined {
    return this.mcpClients.get(serverId);
  }

  /**
   * Get the number of connected servers
   */
  getConnectedServerCount(): number {
    return this.connectedServers.size;
  }
}
