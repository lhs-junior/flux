/**
 * Science Store - SQLite persistence for Python sessions and results
 *
 * Manages science sessions and execution results using SQLite,
 * following the pattern established by memory-store.ts
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import {
  ScienceSession,
  ScienceResult,
  DEFAULT_SCIENCE_CONFIG,
} from './science-types.js';

export interface SessionFilter {
  namespace?: string;
  since?: number;
  limit?: number;
}

export interface ResultFilter {
  sessionId?: string;
  toolName?: string;
  resultType?: 'success' | 'error' | 'partial';
  since?: number;
  limit?: number;
}

export class ScienceStore {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    const dbOptions: Database.Options = {};
    this.db = new Database(dbPath, dbOptions);
    this.initSchema();
  }

  /**
   * Initialize database schema
   */
  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS science_sessions (
        id TEXT PRIMARY KEY,
        namespace TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_used_at INTEGER NOT NULL,
        execution_count INTEGER DEFAULT 0,
        variables TEXT, -- JSON serialized
        packages TEXT, -- JSON array
        history TEXT, -- JSON array
        pickle_data BLOB -- pickled Python session state
      );

      CREATE TABLE IF NOT EXISTS science_results (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        result_type TEXT NOT NULL,
        result_data TEXT, -- JSON serialized
        metadata TEXT, -- JSON serialized
        created_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES science_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_namespace ON science_sessions(namespace);
      CREATE INDEX IF NOT EXISTS idx_sessions_last_used ON science_sessions(last_used_at);
      CREATE INDEX IF NOT EXISTS idx_results_session ON science_results(session_id);
      CREATE INDEX IF NOT EXISTS idx_results_tool ON science_results(tool_name);
      CREATE INDEX IF NOT EXISTS idx_results_created ON science_results(created_at);
    `);
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Create a new science session
   */
  createSession(namespace: string): ScienceSession {
    const id = randomUUID();
    const now = Date.now();

    const session: ScienceSession = {
      id,
      namespace,
      createdAt: now,
      lastUsedAt: now,
      executionCount: 0,
      variables: {},
      packages: [],
      history: [],
    };

    const stmt = this.db.prepare(`
      INSERT INTO science_sessions (
        id, namespace, created_at, last_used_at, execution_count,
        variables, packages, history, pickle_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      namespace,
      now,
      now,
      0,
      JSON.stringify(session.variables),
      JSON.stringify(session.packages),
      JSON.stringify(session.history),
      null
    );

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(id: string): ScienceSession | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM science_sessions WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return undefined;

    return this.rowToSession(row);
  }

  /**
   * Update session
   */
  updateSession(
    id: string,
    updates: Partial<{
      variables: Record<string, any>;
      packages: string[];
      history: string[];
      pickleData: Buffer;
      executionCount: number;
    }>
  ): boolean {
    const now = Date.now();
    const fields: string[] = ['last_used_at = ?'];
    const values: any[] = [now];

    if (updates.variables !== undefined) {
      fields.push('variables = ?');
      values.push(JSON.stringify(updates.variables));
    }

    if (updates.packages !== undefined) {
      fields.push('packages = ?');
      values.push(JSON.stringify(updates.packages));
    }

    if (updates.history !== undefined) {
      fields.push('history = ?');
      values.push(JSON.stringify(updates.history));
    }

    if (updates.pickleData !== undefined) {
      fields.push('pickle_data = ?');
      values.push(updates.pickleData);
    }

    if (updates.executionCount !== undefined) {
      fields.push('execution_count = ?');
      values.push(updates.executionCount);
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE science_sessions
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * Delete session and all its results
   */
  deleteSession(id: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM science_sessions WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * List sessions with filters
   */
  listSessions(filter?: SessionFilter): ScienceSession[] {
    let sql = `SELECT * FROM science_sessions WHERE 1=1`;
    const params: any[] = [];

    if (filter?.namespace) {
      sql += ` AND namespace = ?`;
      params.push(filter.namespace);
    }

    if (filter?.since) {
      sql += ` AND last_used_at >= ?`;
      params.push(filter.since);
    }

    sql += ` ORDER BY last_used_at DESC`;

    if (filter?.limit) {
      sql += ` LIMIT ?`;
      params.push(filter.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(this.rowToSession.bind(this));
  }

  /**
   * Increment execution count for a session
   */
  incrementExecutionCount(sessionId: string): void {
    const stmt = this.db.prepare(`
      UPDATE science_sessions
      SET execution_count = execution_count + 1, last_used_at = ?
      WHERE id = ?
    `);

    stmt.run(Date.now(), sessionId);
  }

  // ============================================================================
  // Result Management
  // ============================================================================

  /**
   * Create a new result
   */
  createResult(
    sessionId: string,
    toolName: string,
    resultType: 'success' | 'error' | 'partial',
    resultData: any,
    metadata: Record<string, any> = {}
  ): ScienceResult {
    const id = randomUUID();
    const now = Date.now();

    const result: ScienceResult = {
      id,
      sessionId,
      toolName,
      resultType,
      resultData,
      metadata,
      createdAt: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO science_results (
        id, session_id, tool_name, result_type, result_data, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      toolName,
      resultType,
      JSON.stringify(resultData),
      JSON.stringify(metadata),
      now
    );

    return result;
  }

  /**
   * Get result by ID
   */
  getResult(id: string): ScienceResult | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM science_results WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return undefined;

    return this.rowToResult(row);
  }

  /**
   * List results with filters
   */
  listResults(filter?: ResultFilter): ScienceResult[] {
    let sql = `SELECT * FROM science_results WHERE 1=1`;
    const params: any[] = [];

    if (filter?.sessionId) {
      sql += ` AND session_id = ?`;
      params.push(filter.sessionId);
    }

    if (filter?.toolName) {
      sql += ` AND tool_name = ?`;
      params.push(filter.toolName);
    }

    if (filter?.resultType) {
      sql += ` AND result_type = ?`;
      params.push(filter.resultType);
    }

    if (filter?.since) {
      sql += ` AND created_at >= ?`;
      params.push(filter.since);
    }

    sql += ` ORDER BY created_at DESC`;

    if (filter?.limit) {
      sql += ` LIMIT ?`;
      params.push(filter.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(this.rowToResult.bind(this));
  }

  /**
   * Delete results for a session
   */
  deleteResults(sessionId: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM science_results WHERE session_id = ?
    `);

    const result = stmt.run(sessionId);
    return result.changes;
  }

  // ============================================================================
  // Statistics and Cleanup
  // ============================================================================

  /**
   * Get statistics
   */
  getStatistics() {
    const totalSessions = this.db
      .prepare(`SELECT COUNT(*) as count FROM science_sessions`)
      .get() as { count: number };

    const totalResults = this.db
      .prepare(`SELECT COUNT(*) as count FROM science_results`)
      .get() as { count: number };

    const sessionsByNamespace = this.db.prepare(`
      SELECT namespace, COUNT(*) as count
      FROM science_sessions
      GROUP BY namespace
      ORDER BY count DESC
    `).all() as Array<{ namespace: string; count: number }>;

    const resultsByTool = this.db.prepare(`
      SELECT tool_name, COUNT(*) as count
      FROM science_results
      GROUP BY tool_name
      ORDER BY count DESC
    `).all() as Array<{ tool_name: string; count: number }>;

    const avgExecutionCount = this.db.prepare(`
      SELECT AVG(execution_count) as avg FROM science_sessions
    `).get() as { avg: number };

    const recentActivity = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM science_sessions
      WHERE last_used_at > ?
    `).get(Date.now() - 24 * 60 * 60 * 1000) as { count: number };

    return {
      sessions: {
        total: totalSessions.count,
        byNamespace: sessionsByNamespace,
        avgExecutionCount: Math.round(avgExecutionCount.avg || 0),
        activeLastDay: recentActivity.count,
      },
      results: {
        total: totalResults.count,
        byTool: resultsByTool,
      },
    };
  }

  /**
   * Clean up old sessions
   */
  cleanupOldSessions(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs;
    const stmt = this.db.prepare(`
      DELETE FROM science_sessions WHERE last_used_at < ?
    `);

    const result = stmt.run(cutoff);
    return result.changes;
  }

  /**
   * Clean up results older than specified time
   */
  cleanupOldResults(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs;
    const stmt = this.db.prepare(`
      DELETE FROM science_results WHERE created_at < ?
    `);

    const result = stmt.run(cutoff);
    return result.changes;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Convert database row to ScienceSession
   */
  private rowToSession(row: any): ScienceSession {
    return {
      id: row.id,
      namespace: row.namespace,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      executionCount: row.execution_count,
      variables: row.variables ? JSON.parse(row.variables) : {},
      packages: row.packages ? JSON.parse(row.packages) : [],
      history: row.history ? JSON.parse(row.history) : [],
      pickleData: row.pickle_data || undefined,
    };
  }

  /**
   * Convert database row to ScienceResult
   */
  private rowToResult(row: any): ScienceResult {
    return {
      id: row.id,
      sessionId: row.session_id,
      toolName: row.tool_name,
      resultType: row.result_type,
      resultData: row.result_data ? JSON.parse(row.result_data) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
