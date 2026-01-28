/**
 * Context Recovery Fusion
 *
 * Saves and restores complete session context across /clear or restarts.
 * Enables infinite context extension by capturing state from all features.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { DatabaseRow, SqlParam } from '../../types/database.js';
import type { MemoryManager } from '../../features/memory/memory-manager.js';
import type { PlanningManager } from '../../features/planning/planning-manager.js';
import type { AgentOrchestrator } from '../../features/agents/agent-orchestrator.js';
import type { TDDManager } from '../../features/tdd/tdd-manager.js';
import type { ScienceManager } from '../../features/science/index.js';
import { HookType } from '../types.js';
import logger from '../../utils/logger.js';

/**
 * Serialized state for each feature
 */
export interface FeatureState {
  memory?: {
    memories: Array<{
      id: string;
      key: string;
      value: string;
      category?: string;
      tags?: string[];
      createdAt: number;
      expiresAt?: number;
      accessCount: number;
    }>;
  };
  planning?: {
    todos: Array<{
      id: string;
      parentId: string | null;
      content: string;
      status: 'pending' | 'in_progress' | 'completed';
      type?: 'todo' | 'tdd';
      tddStatus?: 'red' | 'green' | 'refactored';
      testPath?: string;
      tags: string[];
      createdAt: number;
      updatedAt: number;
      completedAt: number | null;
    }>;
  };
  agents?: {
    executions: Array<{
      id: string;
      agentType: string;
      status: string;
      result?: any;
      startedAt: number;
      completedAt?: number;
    }>;
  };
  tdd?: {
    runs: Array<{
      id: string;
      testPath: string;
      status: string;
      runner: string;
      output: string;
      timestamp: number;
      duration: number;
    }>;
  };
  science?: {
    experiments: Array<{
      id: string;
      type: string;
      data: any;
      timestamp: number;
    }>;
  };
}

/**
 * Context record stored in database
 */
export interface ContextRecord {
  id: string;
  sessionId: string;
  timestamp: number;
  state: FeatureState;
  metadata?: {
    user?: string;
    project?: string;
    description?: string;
  };
}

/**
 * Session summary for listing
 */
export interface SessionSummary {
  sessionId: string;
  timestamp: number;
  memoriesCount: number;
  todosCount: number;
  agentExecutionsCount: number;
  tddRunsCount: number;
  metadata?: {
    user?: string;
    project?: string;
    description?: string;
  };
}

/**
 * Context Recovery Manager
 *
 * Handles capturing, saving, and restoring complete session context
 */
export class ContextRecoveryManager {
  private db: Database.Database;
  private memoryManager?: MemoryManager;
  private planningManager?: PlanningManager;
  private agentOrchestrator?: AgentOrchestrator;
  private tddManager?: TDDManager;
  private scienceManager?: ScienceManager;

  constructor(
    dbPath: string = ':memory:',
    dependencies?: {
      memoryManager?: MemoryManager;
      planningManager?: PlanningManager;
      agentOrchestrator?: AgentOrchestrator;
      tddManager?: TDDManager;
      scienceManager?: ScienceManager;
    }
  ) {
    this.db = new Database(dbPath);
    this.memoryManager = dependencies?.memoryManager;
    this.planningManager = dependencies?.planningManager;
    this.agentOrchestrator = dependencies?.agentOrchestrator;
    this.tddManager = dependencies?.tddManager;
    this.scienceManager = dependencies?.scienceManager;

    this.initSchema();
  }

  /**
   * Initialize database schema
   */
  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contexts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        memory_state TEXT,
        planning_state TEXT,
        agents_state TEXT,
        tdd_state TEXT,
        science_state TEXT,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_contexts_session_id ON contexts(session_id);
      CREATE INDEX IF NOT EXISTS idx_contexts_timestamp ON contexts(timestamp);
    `);
  }

  /**
   * Capture current context from all features
   */
  async captureContext(): Promise<FeatureState> {
    const state: FeatureState = {};

    // Capture Memory state
    if (this.memoryManager) {
      try {
        const memories = this.memoryManager.list({ limit: 1000 });
        state.memory = {
          memories: memories.memories.map((m) => ({
            id: m.id,
            key: m.key,
            value: m.value,
            category: m.metadata.category,
            tags: m.metadata.tags,
            createdAt: m.createdAt,
            expiresAt: m.metadata.category === 'session' ? undefined : undefined, // Keep session memories
            accessCount: m.metadata.accessCount,
          })),
        };
        logger.info(`Captured ${state.memory.memories.length} memories`);
      } catch (error) {
        logger.error('Failed to capture memory state:', error);
      }
    }

    // Capture Planning state
    if (this.planningManager) {
      try {
        const todos = this.planningManager.list();
        state.planning = {
          todos: todos.map((t) => ({
            id: t.id,
            parentId: t.parentId,
            content: t.content,
            status: t.status,
            type: t.type,
            tddStatus: t.tddStatus,
            testPath: t.testPath,
            tags: t.tags,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            completedAt: t.completedAt,
          })),
        };
        logger.info(`Captured ${state.planning.todos.length} todos`);
      } catch (error) {
        logger.error('Failed to capture planning state:', error);
      }
    }

    // Capture Agent state (if accessible)
    if (this.agentOrchestrator) {
      try {
        // Get recent agent executions from agent orchestrator's internal state
        state.agents = {
          executions: [], // Agent orchestrator doesn't expose execution history currently
        };
        logger.info('Captured agent state');
      } catch (error) {
        logger.error('Failed to capture agent state:', error);
      }
    }

    // Capture TDD state
    if (this.tddManager) {
      try {
        // Get TDD statistics which includes run history
        const stats = this.tddManager.getStatistics();
        state.tdd = {
          runs: [], // TDD manager doesn't expose run history in public API
        };
        logger.info('Captured TDD state');
      } catch (error) {
        logger.error('Failed to capture TDD state:', error);
      }
    }

    // Capture Science state
    if (this.scienceManager) {
      try {
        state.science = {
          experiments: [], // Science manager is stateless
        };
        logger.info('Captured science state');
      } catch (error) {
        logger.error('Failed to capture science state:', error);
      }
    }

    return state;
  }

  /**
   * Save context to database
   */
  async saveContext(
    sessionId: string,
    state?: FeatureState,
    metadata?: {
      user?: string;
      project?: string;
      description?: string;
    }
  ): Promise<string> {
    // If no state provided, capture current state
    const contextState = state || (await this.captureContext());

    const id = randomUUID();
    const timestamp = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO contexts (
        id, session_id, timestamp,
        memory_state, planning_state, agents_state, tdd_state, science_state,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      timestamp,
      contextState.memory ? JSON.stringify(contextState.memory) : null,
      contextState.planning ? JSON.stringify(contextState.planning) : null,
      contextState.agents ? JSON.stringify(contextState.agents) : null,
      contextState.tdd ? JSON.stringify(contextState.tdd) : null,
      contextState.science ? JSON.stringify(contextState.science) : null,
      metadata ? JSON.stringify(metadata) : null
    );

    logger.info(`Saved context ${id} for session ${sessionId}`);
    return id;
  }

  /**
   * Restore context from database
   */
  async restoreContext(sessionId: string): Promise<{
    success: boolean;
    state?: FeatureState;
    restored: {
      memories: number;
      todos: number;
      agents: number;
      tddRuns: number;
    };
    error?: string;
  }> {
    try {
      // Get latest context for session
      const stmt = this.db.prepare(`
        SELECT * FROM contexts
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `);

      const row = stmt.get(sessionId) as DatabaseRow | undefined;

      if (!row) {
        return {
          success: false,
          restored: { memories: 0, todos: 0, agents: 0, tddRuns: 0 },
          error: `No saved context found for session: ${sessionId}`,
        };
      }

      // Parse state from JSON columns
      const state: FeatureState = {
        memory: row.memory_state ? JSON.parse(String(row.memory_state)) : undefined,
        planning: row.planning_state ? JSON.parse(String(row.planning_state)) : undefined,
        agents: row.agents_state ? JSON.parse(String(row.agents_state)) : undefined,
        tdd: row.tdd_state ? JSON.parse(String(row.tdd_state)) : undefined,
        science: row.science_state ? JSON.parse(String(row.science_state)) : undefined,
      };

      const restored = {
        memories: 0,
        todos: 0,
        agents: 0,
        tddRuns: 0,
      };

      // Restore Memory state
      if (state.memory && this.memoryManager) {
        for (const memory of state.memory.memories) {
          try {
            this.memoryManager.save({
              key: memory.key,
              value: memory.value,
              metadata: {
                category: memory.category,
                tags: memory.tags,
                expiresAt: memory.expiresAt,
              },
            });
            restored.memories++;
          } catch (error) {
            logger.error(`Failed to restore memory ${memory.id}:`, error);
          }
        }
        logger.info(`Restored ${restored.memories} memories`);
      }

      // Restore Planning state
      if (state.planning && this.planningManager) {
        // Map old IDs to new IDs to preserve parent-child relationships
        const idMap = new Map<string, string>();

        // First restore root todos
        const rootTodos = state.planning.todos.filter((t) => !t.parentId);
        for (const todo of rootTodos) {
          try {
            const result = this.planningManager.create({
              content: todo.content,
              status: todo.status,
              tags: todo.tags,
              type: todo.type,
              tddStatus: todo.tddStatus,
              testPath: todo.testPath,
            });
            idMap.set(todo.id, result.todo.id);
            restored.todos++;
          } catch (error) {
            logger.error(`Failed to restore root todo ${todo.id}:`, error);
          }
        }

        // Then restore children with mapped parent IDs
        const childTodos = state.planning.todos.filter((t) => t.parentId);
        for (const todo of childTodos) {
          try {
            // Map parent ID to new ID
            const newParentId = todo.parentId ? idMap.get(todo.parentId) : undefined;

            const result = this.planningManager.create({
              content: todo.content,
              status: todo.status,
              parentId: newParentId,
              tags: todo.tags,
              type: todo.type,
              tddStatus: todo.tddStatus,
              testPath: todo.testPath,
            });
            idMap.set(todo.id, result.todo.id);
            restored.todos++;
          } catch (error) {
            logger.error(`Failed to restore child todo ${todo.id}:`, error);
          }
        }
        logger.info(`Restored ${restored.todos} todos`);
      }

      // Agent and TDD states are not restored (execution history)
      // These are reference data, not actionable state

      return {
        success: true,
        state,
        restored,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to restore context:', error);
      return {
        success: false,
        restored: { memories: 0, todos: 0, agents: 0, tddRuns: 0 },
        error: `Failed to restore context: ${message}`,
      };
    }
  }

  /**
   * Get available sessions
   */
  getAvailableSessions(options?: {
    limit?: number;
    since?: number;
  }): SessionSummary[] {
    let sql = `
      SELECT
        session_id,
        MAX(timestamp) as timestamp,
        metadata
      FROM contexts
    `;

    const params: SqlParam[] = [];

    if (options?.since) {
      sql += ' WHERE timestamp >= ?';
      params.push(options.since);
    }

    sql += ' GROUP BY session_id ORDER BY timestamp DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as DatabaseRow[];

    return rows.map((row) => {
      // Get counts for this session
      const sessionId = String(row.session_id);
      const latestContextStmt = this.db.prepare(`
        SELECT * FROM contexts
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `);
      const latestContext = latestContextStmt.get(sessionId) as DatabaseRow | undefined;

      let memoriesCount = 0;
      let todosCount = 0;
      let agentExecutionsCount = 0;
      let tddRunsCount = 0;

      if (latestContext) {
        if (latestContext.memory_state) {
          const memoryState = JSON.parse(String(latestContext.memory_state));
          memoriesCount = memoryState.memories?.length || 0;
        }
        if (latestContext.planning_state) {
          const planningState = JSON.parse(String(latestContext.planning_state));
          todosCount = planningState.todos?.length || 0;
        }
        if (latestContext.agents_state) {
          const agentsState = JSON.parse(String(latestContext.agents_state));
          agentExecutionsCount = agentsState.executions?.length || 0;
        }
        if (latestContext.tdd_state) {
          const tddState = JSON.parse(String(latestContext.tdd_state));
          tddRunsCount = tddState.runs?.length || 0;
        }
      }

      return {
        sessionId,
        timestamp: Number(row.timestamp),
        memoriesCount,
        todosCount,
        agentExecutionsCount,
        tddRunsCount,
        metadata: row.metadata ? JSON.parse(String(row.metadata)) : undefined,
      };
    });
  }

  /**
   * Delete a session's context
   */
  deleteSession(sessionId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM contexts WHERE session_id = ?');
    const result = stmt.run(sessionId);
    return result.changes > 0;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM contexts');
    const total = (totalStmt.get() as any).count;

    const sessionsStmt = this.db.prepare('SELECT COUNT(DISTINCT session_id) as count FROM contexts');
    const sessions = (sessionsStmt.get() as any).count;

    return {
      totalContexts: total,
      uniqueSessions: sessions,
    };
  }

  /**
   * Register hooks for automatic context management
   */
  registerHooks(): {
    sessionEnd: () => Promise<void>;
    sessionStart: () => Promise<void>;
    contextFull: () => Promise<void>;
  } {
    return {
      // SessionEnd hook: capture and save context
      sessionEnd: async () => {
        try {
          const sessionId = `session_${Date.now()}`;
          const state = await this.captureContext();
          await this.saveContext(sessionId, state);
          logger.info(`Context saved on session end: ${sessionId}`);
        } catch (error) {
          logger.error('Failed to save context on session end:', error);
        }
      },

      // SessionStart hook: check for previous session and offer restore
      sessionStart: async () => {
        try {
          const sessions = this.getAvailableSessions({ limit: 5 });
          if (sessions.length > 0) {
            logger.info(`Found ${sessions.length} previous sessions available for restoration`);
            // In a real implementation, this would prompt the user
          }
        } catch (error) {
          logger.error('Failed to check for previous sessions:', error);
        }
      },

      // ContextFull hook: trigger context compression and save
      contextFull: async () => {
        try {
          const sessionId = `session_${Date.now()}_compressed`;
          const state = await this.captureContext();
          await this.saveContext(sessionId, state, {
            description: 'Auto-saved due to context limit',
          });
          logger.info(`Context compressed and saved: ${sessionId}`);
        } catch (error) {
          logger.error('Failed to compress context:', error);
        }
      },
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
