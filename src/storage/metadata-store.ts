import Database from 'better-sqlite3';
import type { ToolMetadata } from '../core/types.js';
import {
  parsePluginRow,
  parsePluginRows,
  parseToolRow,
  parseToolRows,
  parseUsageLogRows,
  parseCountRow,
  parseMostUsedToolRows,
  type PluginDbRow,
  type ToolDbRow,
} from '../utils/validation.js';
import logger from '../utils/logger.js';

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

/**
 * Current schema version for migration tracking.
 * Increment this when adding new indexes or schema changes.
 *
 * Version History:
 * - v1: Initial schema with basic indexes
 * - v2: Added performance indexes (tool_name, composite indexes, added_at)
 */
const SCHEMA_VERSION = 2;

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
      dbOptions.verbose = (msg) => logger.debug(msg);
    }

    this.db = new Database(this.filepath, dbOptions);

    this.initializeSchema();
    this.runMigrations();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    // Schema version tracking table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `);

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
    // These are idempotent (IF NOT EXISTS) so safe to run on every startup
    this.createIndexes();
  }

  /**
   * Create database indexes for query optimization.
   *
   * Performance Impact Analysis:
   * - idx_tools_server_id: Used in disconnectServer(), getToolsByServer()
   *   Without index: O(n) full table scan
   *   With index: O(log n) B-tree lookup
   *   Expected improvement: ~10-50x for 500+ tools
   *
   * - idx_tools_category: Used in category-based filtering
   *   Expected improvement: ~5-20x for category queries
   *
   * - idx_tools_added_at: Used in time-based range queries
   *   Expected improvement: ~10-30x for date range filters
   *
   * - idx_tools_name_search: Covering index for name lookups with server_id
   *   Expected improvement: ~2-5x for filtered searches
   *
   * - idx_usage_logs_timestamp: Used in clearOldUsageLogs(), time-based queries
   *   Without index: O(n) scan of potentially millions of logs
   *   With index: O(log n) + O(k) where k = matching rows
   *   Expected improvement: ~50-100x for large log tables
   *
   * - idx_usage_logs_tool_name: Used in getUsageLogs() with toolName filter
   *   Expected improvement: ~20-50x for tool-specific log queries
   *
   * - idx_usage_logs_composite: Composite index for common query pattern
   *   Covers: timestamp DESC with tool_name filter
   *   Expected improvement: ~10-30x for combined queries
   *
   * - idx_plugins_quality_usage: Covering index for getAllPlugins() ORDER BY
   *   Expected improvement: ~5-10x avoids sort operation
   */
  private createIndexes(): void {
    this.db.exec(`
      -- Tools table indexes
      CREATE INDEX IF NOT EXISTS idx_tools_server_id ON tools(server_id);
      CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
      CREATE INDEX IF NOT EXISTS idx_tools_added_at ON tools(added_at);
      CREATE INDEX IF NOT EXISTS idx_tools_name_search ON tools(name, server_id);

      -- Usage logs table indexes
      CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_tool_name ON usage_logs(tool_name);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_composite ON usage_logs(tool_name, timestamp DESC);

      -- Plugins table indexes (for ORDER BY optimization)
      CREATE INDEX IF NOT EXISTS idx_plugins_quality_usage ON plugins(quality_score DESC, usage_count DESC);
    `);
  }

  /**
   * Run database migrations for existing databases.
   * This handles schema upgrades when the application is updated.
   */
  private runMigrations(): void {
    const currentVersion = this.getSchemaVersion();

    if (currentVersion >= SCHEMA_VERSION) {
      return; // Already up to date
    }

    logger.info(`Running migrations from v${currentVersion} to v${SCHEMA_VERSION}`);

    // Migration v1 -> v2: Add performance indexes
    if (currentVersion < 2) {
      this.migrateToV2();
    }

    // Record the new schema version
    this.setSchemaVersion(SCHEMA_VERSION);
  }

  /**
   * Get current schema version from database
   */
  private getSchemaVersion(): number {
    try {
      const row = this.db.prepare(
        'SELECT MAX(version) as version FROM schema_version'
      ).get() as { version: number | null } | undefined;
      return row?.version ?? 0;
    } catch {
      // Table doesn't exist yet, return 0
      return 0;
    }
  }

  /**
   * Set schema version in database
   */
  private setSchemaVersion(version: number): void {
    this.db.prepare(
      'INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (?, ?)'
    ).run(version, Date.now());
  }

  /**
   * Migration to schema version 2:
   * - Adds performance indexes for tools and usage_logs tables
   * - Adds composite indexes for common query patterns
   *
   * This migration is safe for existing data - indexes are created
   * in the background and don't modify existing rows.
   */
  private migrateToV2(): void {
    logger.info('Migrating to schema v2: Adding performance indexes');

    // These indexes may already exist from createIndexes(), but CREATE INDEX IF NOT EXISTS is idempotent
    this.db.exec(`
      -- New indexes for v2
      CREATE INDEX IF NOT EXISTS idx_tools_added_at ON tools(added_at);
      CREATE INDEX IF NOT EXISTS idx_tools_name_search ON tools(name, server_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_composite ON usage_logs(tool_name, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_plugins_quality_usage ON plugins(quality_score DESC, usage_count DESC);
    `);

    // Run ANALYZE to update query planner statistics after adding indexes
    this.db.exec('ANALYZE');

    logger.info('Migration to v2 complete');
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

    const row = stmt.get(id);
    const result = parsePluginRow(row);
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

    const rows = stmt.all();
    const validated = parsePluginRows(rows);
    return validated.map((r) => ({
      id: r.id,
      name: r.name,
      command: r.command,
      args: r.args || undefined,
      env: r.env || undefined,
      addedAt: r.addedAt,
      lastUsed: r.lastUsed,
      usageCount: r.usageCount,
      qualityScore: r.qualityScore,
    }));
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

    const row = stmt.get(name);
    const validated = parseToolRow(row);
    if (!validated) {
      return null;
    }

    return {
      name: validated.name,
      description: validated.description || undefined,
      inputSchema: JSON.parse(validated.inputSchema),
      serverId: validated.serverId,
      category: validated.category || undefined,
      keywords: validated.keywords ? JSON.parse(validated.keywords) : undefined,
    };
  }

  getAllTools(): ToolMetadata[] {
    const stmt = this.db.prepare(`
      SELECT name, server_id as serverId, description, input_schema as inputSchema, category, keywords
      FROM tools ORDER BY usage_count DESC
    `);

    const rows = stmt.all();
    const validated = parseToolRows(rows);
    return validated.map((row) => ({
      name: row.name,
      description: row.description || undefined,
      inputSchema: JSON.parse(row.inputSchema),
      serverId: row.serverId,
      category: row.category || undefined,
      keywords: row.keywords ? JSON.parse(row.keywords) : undefined,
    }));
  }

  getToolsByServer(serverId: string): ToolMetadata[] {
    const stmt = this.db.prepare(`
      SELECT name, server_id as serverId, description, input_schema as inputSchema, category, keywords
      FROM tools WHERE server_id = ? ORDER BY usage_count DESC
    `);

    const rows = stmt.all(serverId);
    const validated = parseToolRows(rows);
    return validated.map((row) => ({
      name: row.name,
      description: row.description || undefined,
      inputSchema: JSON.parse(row.inputSchema),
      serverId: row.serverId,
      category: row.category || undefined,
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
    const params: (string | number)[] = [];

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
    const rows = stmt.all(...params);
    const validated = parseUsageLogRows(rows);

    return validated.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      toolName: row.tool_name,
      query: row.query,
      success: row.success === 1 || row.success === true,
      responseTime: row.response_time ?? undefined,
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
    const pluginCount = parseCountRow(
      this.db.prepare('SELECT COUNT(*) as count FROM plugins').get()
    );
    const toolCount = parseCountRow(
      this.db.prepare('SELECT COUNT(*) as count FROM tools').get()
    );
    const logCount = parseCountRow(
      this.db.prepare('SELECT COUNT(*) as count FROM usage_logs').get()
    );

    const mostUsedToolsRaw = this.db
      .prepare('SELECT name, usage_count FROM tools ORDER BY usage_count DESC LIMIT 5')
      .all();
    const mostUsedTools = parseMostUsedToolRows(mostUsedToolsRaw);

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
