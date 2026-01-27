import Database from 'better-sqlite3';
import type { ToolMetadata } from '../core/gateway.js';

export interface PluginRecord {
  id: string;
  name: string;
  command: string;
  args?: string;
  env?: string;
  addedAt: number;
  lastUsed: number;
  usageCount: number;
  qualityScore: number;
}

export interface ToolRecord {
  name: string;
  serverId: string;
  description: string;
  inputSchema: string;
  category?: string;
  keywords?: string;
  addedAt: number;
  lastUsed: number;
  usageCount: number;
}

export interface UsageLogRecord {
  id?: number;
  timestamp: number;
  toolName: string;
  query: string;
  success: boolean;
  responseTime?: number;
}

export interface MetadataStoreOptions {
  filepath?: string;
  readonly?: boolean;
  verbose?: boolean;
}

export class MetadataStore {
  private db: Database.Database;
  private readonly filepath: string;

  constructor(options: MetadataStoreOptions = {}) {
    this.filepath = options.filepath || ':memory:';

    // Build database options (better-sqlite3 doesn't accept undefined values)
    const dbOptions: Database.Options = {};
    if (options.readonly !== undefined) {
      dbOptions.readonly = options.readonly;
    }
    if (options.verbose) {
      dbOptions.verbose = console.log;
    }

    this.db = new Database(this.filepath, dbOptions);

    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    // Plugins table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        command TEXT NOT NULL,
        args TEXT,
        env TEXT,
        added_at INTEGER NOT NULL,
        last_used INTEGER NOT NULL,
        usage_count INTEGER DEFAULT 0,
        quality_score REAL DEFAULT 0
      )
    `);

    // Tools table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tools (
        name TEXT PRIMARY KEY,
        server_id TEXT NOT NULL,
        description TEXT,
        input_schema TEXT NOT NULL,
        category TEXT,
        keywords TEXT,
        added_at INTEGER NOT NULL,
        last_used INTEGER NOT NULL,
        usage_count INTEGER DEFAULT 0,
        FOREIGN KEY (server_id) REFERENCES plugins(id) ON DELETE CASCADE
      )
    `);

    // Usage logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        tool_name TEXT NOT NULL,
        query TEXT NOT NULL,
        success INTEGER NOT NULL,
        response_time INTEGER,
        FOREIGN KEY (tool_name) REFERENCES tools(name) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tools_server_id ON tools(server_id);
      CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_tool_name ON usage_logs(tool_name);
    `);
  }

  // ========== Plugin Operations ==========

  addPlugin(plugin: Omit<PluginRecord, 'addedAt' | 'lastUsed' | 'usageCount'>): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO plugins (id, name, command, args, env, added_at, last_used, usage_count, quality_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT usage_count FROM plugins WHERE id = ?), 0), ?)
    `);

    const now = Date.now();
    stmt.run(
      plugin.id,
      plugin.name,
      plugin.command,
      plugin.args || null,
      plugin.env || null,
      now,
      now,
      plugin.id,
      plugin.qualityScore
    );
  }

  getPlugin(id: string): PluginRecord | null {
    const stmt = this.db.prepare(`
      SELECT id, name, command, args, env, added_at as addedAt, last_used as lastUsed, usage_count as usageCount, quality_score as qualityScore
      FROM plugins WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      command: result.command,
      args: result.args || undefined,
      env: result.env || undefined,
      addedAt: result.addedAt,
      lastUsed: result.lastUsed,
      usageCount: result.usageCount,
      qualityScore: result.qualityScore,
    };
  }

  getAllPlugins(): PluginRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, name, command, args, env, added_at as addedAt, last_used as lastUsed, usage_count as usageCount, quality_score as qualityScore
      FROM plugins ORDER BY quality_score DESC, usage_count DESC
    `);

    return stmt.all() as PluginRecord[];
  }

  removePlugin(id: string): void {
    const stmt = this.db.prepare('DELETE FROM plugins WHERE id = ?');
    stmt.run(id);
  }

  updatePluginUsage(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE plugins
      SET last_used = ?, usage_count = usage_count + 1
      WHERE id = ?
    `);

    stmt.run(Date.now(), id);
  }

  // ========== Tool Operations ==========

  addTool(tool: ToolMetadata): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tools (name, server_id, description, input_schema, category, keywords, added_at, last_used, usage_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT usage_count FROM tools WHERE name = ?), 0))
    `);

    const now = Date.now();
    stmt.run(
      tool.name,
      tool.serverId,
      tool.description || null,
      JSON.stringify(tool.inputSchema),
      tool.category || null,
      tool.keywords ? JSON.stringify(tool.keywords) : null,
      now,
      now,
      tool.name
    );
  }

  addTools(tools: ToolMetadata[]): void {
    const insertMany = this.db.transaction((toolsList: ToolMetadata[]) => {
      for (const tool of toolsList) {
        this.addTool(tool);
      }
    });

    insertMany(tools);
  }

  getTool(name: string): ToolMetadata | null {
    const stmt = this.db.prepare(`
      SELECT name, server_id as serverId, description, input_schema as inputSchema, category, keywords
      FROM tools WHERE name = ?
    `);

    const row = stmt.get(name) as any;
    if (!row) {
      return null;
    }

    return {
      name: row.name,
      description: row.description,
      inputSchema: JSON.parse(row.inputSchema),
      serverId: row.serverId,
      category: row.category || undefined,
      keywords: row.keywords ? JSON.parse(row.keywords) : undefined,
    };
  }

  getAllTools(): ToolMetadata[] {
    const stmt = this.db.prepare(`
      SELECT name, server_id as serverId, description, input_schema as inputSchema, category, keywords
      FROM tools ORDER BY usage_count DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      name: row.name,
      description: row.description,
      inputSchema: JSON.parse(row.inputSchema),
      serverId: row.serverId,
      category: row.category,
      keywords: row.keywords ? JSON.parse(row.keywords) : undefined,
    }));
  }

  getToolsByServer(serverId: string): ToolMetadata[] {
    const stmt = this.db.prepare(`
      SELECT name, server_id as serverId, description, input_schema as inputSchema, category, keywords
      FROM tools WHERE server_id = ? ORDER BY usage_count DESC
    `);

    const rows = stmt.all(serverId) as any[];
    return rows.map((row) => ({
      name: row.name,
      description: row.description,
      inputSchema: JSON.parse(row.inputSchema),
      serverId: row.serverId,
      category: row.category,
      keywords: row.keywords ? JSON.parse(row.keywords) : undefined,
    }));
  }

  removeTool(name: string): void {
    const stmt = this.db.prepare('DELETE FROM tools WHERE name = ?');
    stmt.run(name);
  }

  removeToolsByServer(serverId: string): void {
    const stmt = this.db.prepare('DELETE FROM tools WHERE server_id = ?');
    stmt.run(serverId);
  }

  updateToolUsage(name: string): void {
    const stmt = this.db.prepare(`
      UPDATE tools
      SET last_used = ?, usage_count = usage_count + 1
      WHERE name = ?
    `);

    stmt.run(Date.now(), name);
  }

  // ========== Usage Log Operations ==========

  addUsageLog(log: Omit<UsageLogRecord, 'id'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO usage_logs (timestamp, tool_name, query, success, response_time)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      log.timestamp,
      log.toolName,
      log.query,
      log.success ? 1 : 0,
      log.responseTime || null
    );
  }

  getUsageLogs(options?: { limit?: number; toolName?: string }): UsageLogRecord[] {
    let query = 'SELECT * FROM usage_logs';
    const params: any[] = [];

    if (options?.toolName) {
      query += ' WHERE tool_name = ?';
      params.push(options.toolName);
    }

    query += ' ORDER BY timestamp DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      toolName: row.tool_name,
      query: row.query,
      success: row.success === 1,
      responseTime: row.response_time,
    }));
  }

  clearOldUsageLogs(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    const stmt = this.db.prepare('DELETE FROM usage_logs WHERE timestamp < ?');
    const result = stmt.run(cutoffTime);
    return result.changes;
  }

  // ========== Statistics ==========

  getStatistics() {
    const pluginCount = this.db.prepare('SELECT COUNT(*) as count FROM plugins').get() as any;
    const toolCount = this.db.prepare('SELECT COUNT(*) as count FROM tools').get() as any;
    const logCount = this.db.prepare('SELECT COUNT(*) as count FROM usage_logs').get() as any;

    const mostUsedTools = this.db
      .prepare('SELECT name, usage_count FROM tools ORDER BY usage_count DESC LIMIT 5')
      .all() as any[];

    return {
      pluginCount: pluginCount.count,
      toolCount: toolCount.count,
      logCount: logCount.count,
      mostUsedTools: mostUsedTools.map((t) => ({ name: t.name, count: t.usage_count })),
    };
  }

  // ========== Cleanup ==========

  close(): void {
    this.db.close();
  }

  vacuum(): void {
    this.db.exec('VACUUM');
  }

  /**
   * Get database file path
   */
  getFilePath(): string {
    return this.filepath;
  }
}
