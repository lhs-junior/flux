import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SessionManager } from './session-manager.js';
import { ToolLoader } from './tool-loader.js';
import { QueryProcessor } from '../search/query-processor.js';
import { MetadataStore } from '../storage/metadata-store.js';
import { FeatureCoordinator } from './feature-coordinator.js';
import { MCPServerManager } from './mcp-server-manager.js';
import { ToolSearchEngine } from './tool-search-engine.js';
import logger from '../utils/logger.js';
import type { MCPServerConfig, ToolMetadata, GatewayOptions } from './types.js';

export type { MCPServerConfig, ToolMetadata, GatewayOptions } from './types.js';

export class AwesomePluginGateway {
  private server: Server;
  private sessionManager: SessionManager;
  private toolLoader: ToolLoader;
  private queryProcessor: QueryProcessor;
  private metadataStore: MetadataStore;
  private featureCoordinator: FeatureCoordinator;
  private mcpServerManager: MCPServerManager;
  private toolSearchEngine: ToolSearchEngine;
  private availableTools: Map<string, ToolMetadata>;
  private enableToolSearch: boolean;
  private maxLayer2Tools: number;

  // Expose individual managers for backward compatibility with tests
  // These are getters that proxy to the FeatureCoordinator
  get memoryManager() {
    return this.featureCoordinator.getMemoryManager();
  }

  get agentOrchestrator() {
    return this.featureCoordinator.getAgentOrchestrator();
  }

  get planningManager() {
    return this.featureCoordinator.getPlanningManager();
  }

  get tddManager() {
    return this.featureCoordinator.getTddManager();
  }

  get guideManager() {
    return this.featureCoordinator.getGuideManager();
  }

  get scienceManager() {
    return this.featureCoordinator.getScienceManager();
  }

  constructor(options: GatewayOptions = {}) {
    this.server = new Server(
      {
        name: 'awesome-plugin',
        version: '1.2.0',
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

    // Initialize FeatureCoordinator (manages all internal features)
    this.featureCoordinator = new FeatureCoordinator({
      dbPath: options.dbPath || ':memory:',
    });

    this.availableTools = new Map();
    this.enableToolSearch = options.enableToolSearch ?? true;
    this.maxLayer2Tools = options.maxLayer2Tools ?? 15;

    // Initialize MCPServerManager (manages external MCP servers)
    this.mcpServerManager = new MCPServerManager({
      metadataStore: this.metadataStore,
      toolLoader: this.toolLoader,
      availableTools: this.availableTools,
    });

    // Initialize ToolSearchEngine (manages tool search with BM25)
    this.toolSearchEngine = new ToolSearchEngine(
      this.queryProcessor,
      this.toolLoader,
      this.availableTools,
      {
        maxResults: this.maxLayer2Tools,
        enableToolSearch: this.enableToolSearch,
      }
    );

    // Register internal tools (memory, agents, planning, tdd, guide, science)
    this.registerInternalTools();

    this.setupHandlers();
  }

  /**
   * Register internal feature tools (memory, agents, planning, tdd, guide)
   */
  private registerInternalTools(): void {
    // Register the internal plugins in metadata store
    const pluginRegistrations = this.featureCoordinator.getInternalPluginRegistrations();
    for (const plugin of pluginRegistrations) {
      this.metadataStore.addPlugin({
        id: plugin.id,
        name: plugin.name,
        command: 'internal',
        qualityScore: 100,
      });
    }

    // Get all tool definitions from feature coordinator
    const allTools = this.featureCoordinator.getAllToolDefinitions();

    // Register in available tools
    for (const tool of allTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register in ToolLoader for BM25 search
    this.toolLoader.registerTools(allTools);

    // Save to metadata store
    this.metadataStore.addTools(allTools);
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

      const startTime = performance.now();
      let success = true;
      let result;

      try {
        // Route to internal features first
        if (this.featureCoordinator.isInternalFeature(toolMetadata.serverId)) {
          const internalResult = this.featureCoordinator.routeToolCall(
            toolMetadata.serverId,
            toolName,
            (request.params.arguments || {}) as Record<string, unknown>
          );
          if (internalResult !== null) {
            result = await internalResult;
          } else {
            throw new Error(`Unknown internal feature: ${toolMetadata.serverId}`);
          }
        } else {
          // Forward to external MCP server
          const client = this.mcpServerManager.getClient(toolMetadata.serverId);
          if (!client) {
            throw new Error(`MCP server not connected: ${toolMetadata.serverId}`);
          }
          result = await client.callTool(toolName, request.params.arguments || {});
        }
      } catch (error: unknown) {
        success = false;
        logger.error(`Tool call failed (${toolName}):`, error);
        throw error;
      } finally {
        const responseTime = performance.now() - startTime;

        // Log usage
        this.metadataStore.addUsageLog({
          timestamp: Date.now(),
          toolName,
          query: JSON.stringify(request.params.arguments),
          success,
          responseTime,
        });
      }

      return result;
    });
  }

  /**
   * Connect to an MCP server and register its tools
   */
  async connectToServer(config: MCPServerConfig): Promise<void> {
    return this.mcpServerManager.connectToServer(config);
  }


  /**
   * Disconnect from an MCP server and remove its tools
   */
  async disconnectServer(serverId: string): Promise<void> {
    return this.mcpServerManager.disconnectServer(serverId);
  }

  /**
   * Search for tools using BM25 and query processing
   */
  async searchTools(query: string, options?: { limit?: number }): Promise<ToolMetadata[]> {
    return this.toolSearchEngine.search(query, options);
  }

  /**
   * Get statistics about the gateway
   */
  getStatistics() {
    const toolLoaderStats = this.toolLoader.getStatistics();
    const dbStats = this.metadataStore.getStatistics();

    return {
      connectedServers: this.mcpServerManager.getConnectedServerCount(),
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
    logger.info('Awesome Plugin Gateway started');
    logger.info('Statistics:', this.getStatistics());
  }

  /**
   * Stop the gateway server
   */
  async stop(): Promise<void> {
    // Disconnect all MCP servers
    await this.mcpServerManager.disconnectAll();

    // Close internal features via coordinator
    this.featureCoordinator.close();

    // Close database
    try {
      this.metadataStore.close();
    } catch (error) {
      logger.error('Failed to close metadata store:', error);
    }

    // Close server
    try {
      await this.server.close();
    } catch (error) {
      logger.error('Failed to close server:', error);
    }

    logger.info('Awesome Plugin Gateway stopped');
  }
}
