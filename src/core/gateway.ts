import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SessionManager } from './session-manager.js';
import { ToolLoader } from './tool-loader.js';
import { QueryProcessor } from '../search/query-processor.js';
import { MetadataStore } from '../storage/metadata-store.js';

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

export class AwesomePluginGateway {
  private server: Server;
  private sessionManager: SessionManager;
  private toolLoader: ToolLoader;
  private queryProcessor: QueryProcessor;
  private metadataStore: MetadataStore;
  private connectedServers: Map<string, MCPServerConfig>;
  private availableTools: Map<string, ToolMetadata>;
  private enableToolSearch: boolean;
  private maxLayer2Tools: number;

  constructor(options: GatewayOptions = {}) {
    this.server = new Server(
      {
        name: 'awesome-plugin',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.sessionManager = new SessionManager();
    this.toolLoader = new ToolLoader();
    this.queryProcessor = new QueryProcessor();
    this.metadataStore = new MetadataStore({
      filepath: options.dbPath || ':memory:',
    });
    this.connectedServers = new Map();
    this.availableTools = new Map();
    this.enableToolSearch = options.enableToolSearch ?? true;
    this.maxLayer2Tools = options.maxLayer2Tools ?? 15;

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handler: List available tools (with intelligent loading)
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      // Check if there's a context/query hint in the request
      // For now, return all tools (Phase 3 will add context-aware loading)

      if (this.enableToolSearch && request.params) {
        // Future: Extract query from request context
        // const query = extractQueryFromContext(request);
        // const result = await this.toolLoader.loadTools(query);
        // return { tools: [...result.essential, ...result.relevant] };
      }

      // Default: Return all tools
      const tools = Array.from(this.availableTools.values()).map(
        ({ serverId, category, keywords, ...tool }) => tool
      );

      return {
        tools,
      };
    });

    // Handler: Call a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const toolMetadata = this.availableTools.get(toolName);

      if (!toolMetadata) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      // Record usage for learning
      this.toolLoader.recordToolUsage(toolName);
      this.metadataStore.updateToolUsage(toolName);

      // Forward the tool call to the appropriate MCP server
      // TODO: Implement actual tool forwarding to connected servers
      const startTime = performance.now();

      // Simulated tool execution
      const result = {
        content: [
          {
            type: 'text' as const,
            text: `Tool ${toolName} called with arguments: ${JSON.stringify(request.params.arguments)}`,
          },
        ],
      };

      const responseTime = performance.now() - startTime;

      // Log usage
      this.metadataStore.addUsageLog({
        timestamp: Date.now(),
        toolName,
        query: JSON.stringify(request.params.arguments),
        success: true,
        responseTime,
      });

      return result;
    });
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

      // TODO: Implement actual server connection using child_process
      // For now, we'll simulate a connection
      console.log(`Connected to MCP server: ${config.name} (${config.id})`);

      // Register tools from this server
      await this.registerServerTools(config.id);
    } catch (error) {
      console.error(`Failed to connect to server ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Register tools from a connected MCP server
   */
  private async registerServerTools(serverId: string): Promise<void> {
    // TODO: Call tools/list on the connected server to get available tools
    // For now, we'll add some mock tools for demonstration
    const mockTools: ToolMetadata[] = [
      {
        name: `${serverId}_send_message`,
        description: `Send a message using ${serverId}`,
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message content',
            },
            channel: {
              type: 'string',
              description: 'Target channel',
            },
          },
          required: ['message'],
        },
        serverId,
        category: 'communication',
        keywords: ['send', 'message', 'chat'],
      },
      {
        name: `${serverId}_read_file`,
        description: `Read a file using ${serverId}`,
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path',
            },
          },
          required: ['path'],
        },
        serverId,
        category: 'filesystem',
        keywords: ['read', 'file', 'fs'],
      },
    ];

    // Register tools in memory
    for (const tool of mockTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register tools in ToolLoader (for BM25 search)
    this.toolLoader.registerTools(mockTools);

    // Save tools to metadata store
    this.metadataStore.addTools(mockTools);

    console.log(`Registered ${mockTools.length} tools from server: ${serverId}`);
  }

  /**
   * Disconnect from an MCP server and remove its tools
   */
  async disconnectServer(serverId: string): Promise<void> {
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
    console.log(`Disconnected server: ${serverId}, removed ${removedTools.length} tools`);
  }

  /**
   * Search for tools using BM25 and query processing
   */
  async searchTools(query: string, options?: { limit?: number }): Promise<ToolMetadata[]> {
    // Process query to extract intent
    const processedQuery = this.queryProcessor.processQuery(query);

    console.log('Query processed:', {
      original: processedQuery.originalQuery,
      intent: processedQuery.intent,
      keywords: processedQuery.keywords,
    });

    // Use enhanced query for better search results
    const result = await this.toolLoader.loadTools(processedQuery.enhancedQuery, {
      maxLayer2: options?.limit || this.maxLayer2Tools,
    });

    console.log('Tool search completed:', {
      searchMethod: result.strategy.searchMethod,
      searchTimeMs: result.strategy.searchTimeMs,
      foundTools: result.relevant.length,
    });

    return result.relevant;
  }

  /**
   * Get statistics about the gateway
   */
  getStatistics() {
    const toolLoaderStats = this.toolLoader.getStatistics();
    const dbStats = this.metadataStore.getStatistics();

    return {
      connectedServers: this.connectedServers.size,
      totalTools: this.availableTools.size,
      toolLoader: toolLoaderStats,
      database: dbStats,
      sessions: this.sessionManager.getSessionCount(),
    };
  }

  /**
   * Start the gateway server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Awesome Plugin Gateway started');
    console.log('Statistics:', this.getStatistics());
  }

  /**
   * Stop the gateway server
   */
  async stop(): Promise<void> {
    // Disconnect all servers
    for (const serverId of this.connectedServers.keys()) {
      await this.disconnectServer(serverId);
    }

    // Close database
    this.metadataStore.close();

    await this.server.close();
    console.log('Awesome Plugin Gateway stopped');
  }
}
