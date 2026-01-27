import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MCPServerConfig, ToolMetadata } from './gateway.js';

export interface MCPClientOptions {
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class MCPClient {
  private config: MCPServerConfig;
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number;
  private reconnectDelay: number;
  private currentAttempt: number = 0;
  private onError?: (error: Error) => void;
  private onDisconnect?: () => void;

  constructor(config: MCPServerConfig, options: MCPClientOptions = {}) {
    this.config = config;
    this.reconnectAttempts = options.reconnectAttempts ?? 3;
    this.reconnectDelay = options.reconnectDelay ?? 1000;
    this.onError = options.onError;
    this.onDisconnect = options.onDisconnect;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    try {
      console.log(`Connecting to MCP server: ${this.config.name} (${this.config.id})`);

      // Create stdio transport (it will spawn the process internally)
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          env[key] = value;
        }
      }
      if (this.config.env) {
        Object.assign(env, this.config.env);
      }

      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env,
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'awesome-plugin-gateway',
          version: '0.1.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect to the server
      await this.client.connect(this.transport);

      this.connected = true;
      this.currentAttempt = 0;

      console.log(`✅ Connected to MCP server: ${this.config.name}`);
    } catch (error: any) {
      console.error(`Failed to connect to MCP server (${this.config.id}):`, error);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }

      this.connected = false;
      console.log(`Disconnected from MCP server: ${this.config.name}`);
    } catch (error: any) {
      console.error(`Error disconnecting from MCP server (${this.config.id}):`, error);
    }
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<ToolMetadata[]> {
    if (!this.client || !this.connected) {
      throw new Error(`Not connected to MCP server: ${this.config.id}`);
    }

    try {
      const response = await this.client.listTools();

      return response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        serverId: this.config.id,
        category: this.inferCategory(tool.name, tool.description),
        keywords: this.extractKeywords(tool.name, tool.description),
      }));
    } catch (error: any) {
      console.error(`Failed to list tools from ${this.config.id}:`, error);
      throw error;
    }
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    if (!this.client || !this.connected) {
      throw new Error(`Not connected to MCP server: ${this.config.id}`);
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args,
      });

      // Check if MCP returned an error
      if (response.isError) {
        const errorText = response.content?.[0]?.text || 'Unknown error';
        throw new Error(errorText);
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to call tool ${name} on ${this.config.id}:`, error);
      throw error;
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get server configuration
   */
  getConfig(): MCPServerConfig {
    return this.config;
  }

  /**
   * Handle connection errors
   */
  private handleError(error: Error): void {
    if (this.onError) {
      this.onError(error);
    }

    // Attempt reconnection if configured
    if (this.currentAttempt < this.reconnectAttempts) {
      this.currentAttempt++;
      console.log(
        `Attempting to reconnect (${this.currentAttempt}/${this.reconnectAttempts})...`
      );

      setTimeout(() => {
        this.connect().catch((err) => {
          console.error('Reconnection failed:', err);
        });
      }, this.reconnectDelay);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    if (this.onDisconnect) {
      this.onDisconnect();
    }
  }

  /**
   * Infer tool category from name and description
   */
  private inferCategory(name: string, description?: string): string | undefined {
    const text = `${name} ${description || ''}`.toLowerCase();

    const categories: Record<string, string[]> = {
      communication: ['slack', 'discord', 'email', 'message', 'chat', 'notify'],
      database: ['database', 'sql', 'query', 'postgres', 'mongodb', 'sqlite'],
      filesystem: ['file', 'directory', 'path', 'read', 'write', 'fs'],
      development: ['github', 'gitlab', 'git', 'code', 'repo'],
      web: ['http', 'api', 'fetch', 'request', 'url'],
      ai: ['ai', 'llm', 'model', 'embedding'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Extract keywords from tool name and description
   */
  private extractKeywords(name: string, description?: string): string[] {
    const text = `${name} ${description || ''}`;
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2);

    // Remove duplicates and return unique keywords
    return Array.from(new Set(words)).slice(0, 10);
  }
}
