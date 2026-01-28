import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export interface MemoryRecord {
  id: string;
  key: string;
  value: string;
  category?: string;
  tags?: string[];
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  lastAccessed?: number;
}

export interface MemoryFilter {
  category?: string;
  tags?: string[];
  since?: number;
  limit?: number;
}

export class MemoryStore {
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
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        access_count INTEGER DEFAULT 0,
        last_accessed INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
      CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
    `);
  }

  /**
   * Save a memory
   */
  save(
    key: string,
    value: string,
    metadata?: {
      category?: string;
      tags?: string[];
      expiresAt?: number;
    }
  ): MemoryRecord {
    const id = randomUUID();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, key, value, category, tags, created_at, expires_at, access_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(
      id,
      key,
      value,
      metadata?.category || null,
      metadata?.tags ? JSON.stringify(metadata.tags) : null,
      now,
      metadata?.expiresAt || null
    );

    return {
      id,
      key,
      value,
      category: metadata?.category,
      tags: metadata?.tags,
      createdAt: now,
      expiresAt: metadata?.expiresAt,
      accessCount: 0,
    };
  }

  /**
   * Recall memories by query (simple keyword matching)
   * For semantic search, use BM25Indexer externally
   */
  recall(query: string, options?: { limit?: number; category?: string }): MemoryRecord[] {
    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const now = Date.now();

    let sql = `
      SELECT * FROM memories
      WHERE (expires_at IS NULL OR expires_at > ?)
    `;

    const params: any[] = [now];

    if (options?.category) {
      sql += ` AND category = ?`;
      params.push(options.category);
    }

    // Simple keyword matching in key or value
    if (keywords.length > 0) {
      const conditions = keywords.map(() => `(LOWER(key) LIKE ? OR LOWER(value) LIKE ?)`).join(' OR ');
      sql += ` AND (${conditions})`;
      keywords.forEach((keyword) => {
        params.push(`%${keyword}%`, `%${keyword}%`);
      });
    }

    sql += ` ORDER BY created_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(this.rowToRecord.bind(this));
  }

  /**
   * Get memory by ID
   */
  get(id: string): MemoryRecord | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM memories WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return undefined;

    // Update access count and last accessed
    this.updateAccess(id);

    return this.rowToRecord(row);
  }

  /**
   * List memories with filters
   */
  list(filter?: MemoryFilter): MemoryRecord[] {
    const now = Date.now();
    let sql = `SELECT * FROM memories WHERE (expires_at IS NULL OR expires_at > ?)`;
    const params: any[] = [now];

    if (filter?.category) {
      sql += ` AND category = ?`;
      params.push(filter.category);
    }

    if (filter?.tags && filter.tags.length > 0) {
      // Simple tag matching (contains any of the tags)
      const tagConditions = filter.tags.map(() => `tags LIKE ?`).join(' OR ');
      sql += ` AND (${tagConditions})`;
      filter.tags.forEach((tag) => params.push(`%"${tag}"%`));
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

    return rows.map(this.rowToRecord.bind(this));
  }

  /**
   * Delete a memory
   */
  forget(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM memories WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Update access count and timestamp
   */
  private updateAccess(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE memories
      SET access_count = access_count + 1, last_accessed = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), id);
  }

  /**
   * Clean up expired memories
   */
  cleanupExpired(): number {
    const now = Date.now();
    const stmt = this.db.prepare(`
      DELETE FROM memories WHERE expires_at IS NOT NULL AND expires_at <= ?
    `);
    const result = stmt.run(now);
    return result.changes;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const now = Date.now();

    const total = this.db.prepare(`SELECT COUNT(*) as count FROM memories`).get() as { count: number };

    const active = this.db
      .prepare(`SELECT COUNT(*) as count FROM memories WHERE expires_at IS NULL OR expires_at > ?`)
      .get(now) as { count: number };

    const expired = this.db
      .prepare(`SELECT COUNT(*) as count FROM memories WHERE expires_at IS NOT NULL AND expires_at <= ?`)
      .get(now) as { count: number };

    const byCategory = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM memories
      WHERE expires_at IS NULL OR expires_at > ?
      GROUP BY category
    `).all(now) as Array<{ category: string; count: number }>;

    return {
      total: total.count,
      active: active.count,
      expired: expired.count,
      byCategory,
    };
  }

  /**
   * Convert database row to MemoryRecord
   */
  private rowToRecord(row: any): MemoryRecord {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      category: row.category || undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      createdAt: row.created_at,
      expiresAt: row.expires_at || undefined,
      accessCount: row.access_count,
      lastAccessed: row.last_accessed || undefined,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
