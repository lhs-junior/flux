import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export interface TodoRecord {
  id: string;
  parentId: string | null;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface TodoFilter {
  status?: 'pending' | 'in_progress' | 'completed';
  tags?: string[];
  parentId?: string | null;
  since?: number;
  limit?: number;
}

export class PlanningStore {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  /**
   * Initialize database schema
   */
  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        tags TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        FOREIGN KEY (parent_id) REFERENCES todos(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
      CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos(parent_id);
      CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
    `);
  }

  /**
   * Create a new TODO
   */
  create(
    content: string,
    options?: {
      parentId?: string;
      tags?: string[];
      status?: 'pending' | 'in_progress' | 'completed';
    }
  ): TodoRecord {
    const id = randomUUID();
    const now = Date.now();
    const status = options?.status || 'pending';
    const parentId = options?.parentId || null;
    const tags = options?.tags || [];

    // Verify parent exists if specified
    if (parentId) {
      const parent = this.get(parentId);
      if (!parent) {
        throw new Error(`Parent TODO ${parentId} not found`);
      }
    }

    const stmt = this.db.prepare(`
      INSERT INTO todos (id, parent_id, content, status, tags, created_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      parentId,
      content,
      status,
      JSON.stringify(tags),
      now,
      now,
      status === 'completed' ? now : null
    );

    return this.get(id)!;
  }

  /**
   * Get a TODO by ID
   */
  get(id: string): TodoRecord | null {
    const stmt = this.db.prepare('SELECT * FROM todos WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.rowToRecord(row);
  }

  /**
   * Update a TODO
   */
  update(
    id: string,
    updates: {
      content?: string;
      status?: 'pending' | 'in_progress' | 'completed';
      tags?: string[];
      parentId?: string;
    }
  ): TodoRecord | null {
    const existing = this.get(id);
    if (!existing) {
      return null;
    }

    const now = Date.now();
    const content = updates.content ?? existing.content;
    const status = updates.status ?? existing.status;
    const tags = updates.tags ?? existing.tags;
    const parentId = updates.parentId !== undefined ? updates.parentId : existing.parentId;

    // Verify parent exists if specified
    if (parentId && parentId !== id) {
      const parent = this.get(parentId);
      if (!parent) {
        throw new Error(`Parent TODO ${parentId} not found`);
      }

      // Prevent circular dependencies
      if (this.wouldCreateCycle(id, parentId)) {
        throw new Error('Cannot create circular dependency');
      }
    }

    const completedAt = status === 'completed' && existing.status !== 'completed'
      ? now
      : existing.completedAt;

    const stmt = this.db.prepare(`
      UPDATE todos
      SET content = ?, status = ?, tags = ?, parent_id = ?, updated_at = ?, completed_at = ?
      WHERE id = ?
    `);

    stmt.run(content, status, JSON.stringify(tags), parentId, now, completedAt, id);

    return this.get(id);
  }

  /**
   * Delete a TODO (and all its children due to CASCADE)
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * List TODOs with optional filters
   */
  list(filter?: TodoFilter): TodoRecord[] {
    let query = 'SELECT * FROM todos WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter?.parentId !== undefined) {
      if (filter.parentId === null) {
        query += ' AND parent_id IS NULL';
      } else {
        query += ' AND parent_id = ?';
        params.push(filter.parentId);
      }
    }

    if (filter?.since) {
      query += ' AND created_at >= ?';
      params.push(filter.since);
    }

    query += ' ORDER BY created_at DESC';

    if (filter?.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    let todos = rows.map((row) => this.rowToRecord(row));

    // Filter by tags if specified
    if (filter?.tags && filter.tags.length > 0) {
      todos = todos.filter((todo) =>
        filter.tags!.some((tag) => todo.tags.includes(tag))
      );
    }

    return todos;
  }

  /**
   * Get all children of a TODO
   */
  getChildren(parentId: string): TodoRecord[] {
    const stmt = this.db.prepare('SELECT * FROM todos WHERE parent_id = ? ORDER BY created_at ASC');
    const rows = stmt.all(parentId) as any[];
    return rows.map((row) => this.rowToRecord(row));
  }

  /**
   * Get dependency tree starting from root TODOs
   */
  getTree(): TodoRecord[] {
    // Get all root todos (no parent)
    return this.list({ parentId: null });
  }

  /**
   * Check if adding parentId to todoId would create a cycle
   */
  private wouldCreateCycle(todoId: string, parentId: string): boolean {
    let current: string | null = parentId;
    const visited = new Set<string>();

    while (current) {
      if (current === todoId) {
        return true; // Cycle detected
      }

      if (visited.has(current)) {
        return false; // Already checked this branch
      }

      visited.add(current);

      const parent = this.get(current);
      current = parent?.parentId || null;
    }

    return false;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM todos');
    const total = (totalStmt.get() as any).count;

    const byStatusStmt = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM todos
      GROUP BY status
    `);
    const byStatus = byStatusStmt.all();

    const rootsStmt = this.db.prepare('SELECT COUNT(*) as count FROM todos WHERE parent_id IS NULL');
    const roots = (rootsStmt.get() as any).count;

    return {
      totalTodos: total,
      rootTodos: roots,
      byStatus,
    };
  }

  /**
   * Convert database row to TodoRecord
   */
  private rowToRecord(row: any): TodoRecord {
    return {
      id: row.id,
      parentId: row.parent_id,
      content: row.content,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
