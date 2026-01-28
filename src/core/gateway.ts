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
import { MCPClient } from './mcp-client.js';
import { MemoryManager } from '../features/memory/memory-manager.js';
import { AgentOrchestrator } from '../features/agents/agent-orchestrator.js';
import { PlanningManager } from '../features/planning/planning-manager.js';
import { TDDManager } from '../features/tdd/tdd-manager.js';
import { GuideManager } from '../features/guide/guide-manager.js';
import { initializeGuides } from '../features/guide/seed-guides.js';
import { ScienceManager } from '../features/science/index.js';
import logger from '../utils/logger.js';

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
  private memoryManager: MemoryManager;
  private agentOrchestrator: AgentOrchestrator;
  private planningManager: PlanningManager;
  private tddManager: TDDManager;
  private guideManager: GuideManager;
  private scienceManager: ScienceManager;
  private connectedServers: Map<string, MCPServerConfig>;
  private mcpClients: Map<string, MCPClient>;
  private availableTools: Map<string, ToolMetadata>;
  private enableToolSearch: boolean;
  private maxLayer2Tools: number;

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
    this.memoryManager = new MemoryManager(options.dbPath || ':memory:');
    this.planningManager = new PlanningManager(options.dbPath || ':memory:');
    this.tddManager = new TDDManager(options.dbPath || ':memory:');

    // Initialize AgentOrchestrator with full manager integration
    this.agentOrchestrator = new AgentOrchestrator(options.dbPath || ':memory:', {
      planningManager: this.planningManager,
      memoryManager: this.memoryManager,
      tddManager: this.tddManager,
    });

    // Initialize GuideManager with cross-feature integration
    this.guideManager = new GuideManager(options.dbPath || ':memory:', {
      memoryManager: this.memoryManager,
      planningManager: this.planningManager,
    });

    // Initialize ScienceManager with cross-feature integration
    this.scienceManager = new ScienceManager({
      memoryManager: this.memoryManager,
      planningManager: this.planningManager,
    });

    // Initialize guides from seed files if database is empty
    this.initializeGuidesIfNeeded();

    this.connectedServers = new Map();
    this.mcpClients = new Map();
    this.availableTools = new Map();
    this.enableToolSearch = options.enableToolSearch ?? true;
    this.maxLayer2Tools = options.maxLayer2Tools ?? 15;

    // Register internal tools (memory, agents, planning)
    this.registerInternalTools();

    this.setupHandlers();
  }

  /**
   * Initialize guides from seed files if database is empty
   */
  private async initializeGuidesIfNeeded(): Promise<void> {
    try {
      // Use the GuideManager's store and indexer via proper accessors
      const store = this.guideManager.getStore();
      const indexer = this.guideManager.getIndexer();
      await initializeGuides(store, indexer);
    } catch (error) {
      logger.error('Failed to initialize guides:', error);
    }
  }

  /**
   * Register internal feature tools (memory, agents, planning, tdd, guide)
   */
  private registerInternalTools(): void {
    // Register the internal plugins in metadata store
    this.metadataStore.addPlugin({
      id: 'internal:memory',
      name: 'Internal Memory Management',
      command: 'internal',
      qualityScore: 100,
    });

    this.metadataStore.addPlugin({
      id: 'internal:agents',
      name: 'Internal Agent Orchestration',
      command: 'internal',
      qualityScore: 100,
    });

    this.metadataStore.addPlugin({
      id: 'internal:planning',
      name: 'Internal Planning & TODO Tracking',
      command: 'internal',
      qualityScore: 100,
    });

    this.metadataStore.addPlugin({
      id: 'internal:tdd',
      name: 'Internal TDD Workflow',
      command: 'internal',
      qualityScore: 100,
    });

    this.metadataStore.addPlugin({
      id: 'internal:guide',
      name: 'Internal Guide System',
      command: 'internal',
      qualityScore: 100,
    });

    this.metadataStore.addPlugin({
      id: 'internal:science',
      name: 'Internal Science Tools',
      command: 'internal',
      qualityScore: 100,
    });

    // Register memory management tools
    const memoryTools = this.memoryManager.getToolDefinitions();
    for (const tool of memoryTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register agent orchestration tools
    const agentTools = this.agentOrchestrator.getToolDefinitions();
    for (const tool of agentTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register planning tools
    const planningTools = this.planningManager.getToolDefinitions();
    for (const tool of planningTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register TDD tools
    const tddTools = this.tddManager.getToolDefinitions();
    for (const tool of tddTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register guide tools
    const guideTools = this.guideManager.getToolDefinitions();
    for (const tool of guideTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register science tools
    const scienceTools = this.scienceManager.getToolDefinitions();
    for (const tool of scienceTools) {
      this.availableTools.set(tool.name, tool);
    }

    // Register in ToolLoader for BM25 search
    this.toolLoader.registerTools([...memoryTools, ...agentTools, ...planningTools, ...tddTools, ...guideTools, ...scienceTools]);

    // Save to metadata store
    this.metadataStore.addTools([...memoryTools, ...agentTools, ...planningTools, ...tddTools, ...guideTools, ...scienceTools]);

    logger.info(`Registered ${memoryTools.length} memory + ${agentTools.length} agent + ${planningTools.length} planning + ${tddTools.length} tdd + ${guideTools.length} guide + ${scienceTools.length} science tools`);
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
        if (toolMetadata.serverId === 'internal:memory') {
          result = await this.memoryManager.handleToolCall(toolName, request.params.arguments || {});
        } else if (toolMetadata.serverId === 'internal:agents') {
          result = await this.agentOrchestrator.handleToolCall(toolName, request.params.arguments || {});
        } else if (toolMetadata.serverId === 'internal:planning') {
          result = await this.planningManager.handleToolCall(toolName, request.params.arguments || {});
        } else if (toolMetadata.serverId === 'internal:tdd') {
          result = await this.tddManager.handleToolCall(toolName, request.params.arguments || {});
        } else if (toolMetadata.serverId === 'internal:guide') {
          result = await this.guideManager.handleToolCall(toolName, request.params.arguments || {});
        } else if (toolMetadata.serverId === 'internal:science') {
          result = await this.scienceManager.handleToolCall(toolName, request.params.arguments || {});
        } else {
          // Forward to external MCP server
          const client = this.mcpClients.get(toolMetadata.serverId);
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
   * Search for tools using BM25 and query processing
   */
  async searchTools(query: string, options?: { limit?: number }): Promise<ToolMetadata[]> {
    const limit = options?.limit || this.maxLayer2Tools;

    // If query is empty, return all tools up to the limit
    if (!query || !query.trim()) {
      return Array.from(this.availableTools.values()).slice(0, limit);
    }

    // Process query to extract intent
    const processedQuery = this.queryProcessor.processQuery(query);

    logger.debug('Query processed:', {
      original: processedQuery.originalQuery,
      intent: processedQuery.intent,
      keywords: processedQuery.keywords,
    });

    // Use enhanced query for better search results
    const result = await this.toolLoader.loadTools(processedQuery.enhancedQuery, {
      maxLayer2: limit,
    });

    logger.debug('Tool search completed:', {
      searchMethod: result.strategy.searchMethod,
      searchTimeMs: result.strategy.searchTimeMs,
      foundTools: result.relevant.length,
    });

    // Results already have category and keywords from BM25 indexer
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
    logger.info('Awesome Plugin Gateway started');
    logger.info('Statistics:', this.getStatistics());
  }

  /**
   * Stop the gateway server
   */
  async stop(): Promise<void> {
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

    // Close internal features
    try {
      this.memoryManager.close();
    } catch (error) {
      logger.error('Failed to close memory manager:', error);
    }

    try {
      this.agentOrchestrator.close();
    } catch (error) {
      logger.error('Failed to close agent orchestrator:', error);
    }

    try {
      this.planningManager.close();
    } catch (error) {
      logger.error('Failed to close planning manager:', error);
    }

    try {
      this.tddManager.close();
    } catch (error) {
      logger.error('Failed to close TDD manager:', error);
    }

    try {
      this.guideManager.close();
    } catch (error) {
      logger.error('Failed to close guide manager:', error);
    }

    try {
      this.scienceManager.close();
    } catch (error) {
      logger.error('Failed to close science manager:', error);
    }

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
