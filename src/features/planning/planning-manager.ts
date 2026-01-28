import { PlanningStore, TodoRecord, TodoFilter } from './planning-store.js';
import { BM25Indexer } from '../../search/bm25-indexer.js';
import type { ToolMetadata } from '../../core/gateway.js';

export interface PlanningCreateInput {
  content: string;
  parentId?: string;
  tags?: string[];
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface PlanningUpdateInput {
  id: string;
  content?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  tags?: string[];
  parentId?: string;
}

export interface PlanningTreeInput {
  filter?: {
    status?: 'pending' | 'in_progress' | 'completed';
    rootOnly?: boolean;
  };
}

export class PlanningManager {
  private store: PlanningStore;
  private indexer: BM25Indexer;

  constructor(dbPath: string = ':memory:') {
    this.store = new PlanningStore(dbPath);
    this.indexer = new BM25Indexer();

    // Index existing TODOs on initialization
    this.reindexAll();
  }

  /**
   * Create a new TODO
   */
  create(input: PlanningCreateInput): {
    success: boolean;
    todo: TodoRecord;
  } {
    try {
      const todo = this.store.create(input.content, {
        parentId: input.parentId,
        tags: input.tags,
        status: input.status,
      });

      // Add to BM25 index for semantic search
      this.indexer.addDocument({
        name: `planning:${todo.id}`,
        description: `${todo.content} (status: ${todo.status})`,
        category: 'planning',
        keywords: todo.tags,
        serverId: 'internal:planning',
        inputSchema: {},
      });

      return {
        success: true,
        todo,
      };
    } catch (error: any) {
      console.error('Failed to create TODO:', error);
      throw new Error(`Failed to create TODO: ${error.message}`);
    }
  }

  /**
   * Update an existing TODO
   */
  update(input: PlanningUpdateInput): {
    success: boolean;
    todo: TodoRecord | null;
  } {
    try {
      const todo = this.store.update(input.id, {
        content: input.content,
        status: input.status,
        tags: input.tags,
        parentId: input.parentId,
      });

      if (todo) {
        // Update in BM25 index
        this.indexer.removeDocument(`planning:${todo.id}`);
        this.indexer.addDocument({
          name: `planning:${todo.id}`,
          description: `${todo.content} (status: ${todo.status})`,
          category: 'planning',
          keywords: todo.tags,
          serverId: 'internal:planning',
          inputSchema: {},
        });
      }

      return {
        success: !!todo,
        todo,
      };
    } catch (error: any) {
      console.error('Failed to update TODO:', error);
      throw new Error(`Failed to update TODO: ${error.message}`);
    }
  }

  /**
   * Get dependency tree visualization
   */
  tree(input: PlanningTreeInput = {}): {
    tree: string;
    summary: {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
    };
  } {
    try {
      // Get root TODOs
      const filter: TodoFilter = {
        parentId: null,
      };

      if (input.filter?.status) {
        filter.status = input.filter.status;
      }

      const roots = this.store.list(filter);

      // Build tree visualization
      const lines: string[] = [];
      const summary = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
      };

      lines.push('📋 TODO Dependency Tree\n');

      if (roots.length === 0) {
        lines.push('  (no TODOs yet)\n');
      } else {
        for (let i = 0; i < roots.length; i++) {
          const isLast = i === roots.length - 1;
          this.buildTreeLines(roots[i], '', isLast, lines, summary);
        }
      }

      lines.push('\n📊 Summary:');
      lines.push(`  Total: ${summary.total}`);
      lines.push(`  Pending: ${summary.pending}`);
      lines.push(`  In Progress: ${summary.inProgress}`);
      lines.push(`  Completed: ${summary.completed}`);

      return {
        tree: lines.join('\n'),
        summary,
      };
    } catch (error: any) {
      console.error('Failed to generate tree:', error);
      throw new Error(`Failed to generate tree: ${error.message}`);
    }
  }

  /**
   * Search TODOs using BM25
   */
  search(query: string, options?: { limit?: number }): TodoRecord[] {
    const searchResults = this.indexer.search(query, {
      limit: options?.limit || 10,
    });

    const todos = searchResults
      .map((result) => {
        const todoId = result.toolName.replace('planning:', '');
        return this.store.get(todoId);
      })
      .filter((todo) => todo !== null) as TodoRecord[];

    return todos;
  }

  /**
   * List all TODOs with filters
   */
  list(filter?: TodoFilter): TodoRecord[] {
    return this.store.list(filter);
  }

  /**
   * Delete a TODO
   */
  delete(id: string): { success: boolean } {
    const success = this.store.delete(id);

    if (success) {
      // Remove from BM25 index
      this.indexer.removeDocument(`planning:${id}`);
    }

    return { success };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const storeStats = this.store.getStatistics();
    const indexStats = this.indexer.getStatistics();

    return {
      store: storeStats,
      index: {
        documentsIndexed: indexStats.totalDocuments,
        avgDocumentLength: indexStats.avgDocumentLength,
      },
    };
  }

  /**
   * Build tree lines recursively
   */
  private buildTreeLines(
    todo: TodoRecord,
    prefix: string,
    isLast: boolean,
    lines: string[],
    summary: { total: number; pending: number; inProgress: number; completed: number }
  ): void {
    // Update summary
    summary.total++;
    if (todo.status === 'pending') summary.pending++;
    else if (todo.status === 'in_progress') summary.inProgress++;
    else if (todo.status === 'completed') summary.completed++;

    // Status icon
    const statusIcon = todo.status === 'completed' ? '✅' : todo.status === 'in_progress' ? '🔄' : '⏳';

    // Branch characters
    const connector = isLast ? '└─' : '├─';

    // Build line
    const line = `${prefix}${connector} ${statusIcon} ${todo.content}`;
    const tagsStr = todo.tags.length > 0 ? ` [${todo.tags.join(', ')}]` : '';
    lines.push(line + tagsStr);

    // Get children
    const children = this.store.getChildren(todo.id);

    // Recursively build children
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    for (let i = 0; i < children.length; i++) {
      const childIsLast = i === children.length - 1;
      this.buildTreeLines(children[i], newPrefix, childIsLast, lines, summary);
    }
  }

  /**
   * Reindex all TODOs for BM25 search
   */
  private reindexAll(): void {
    const todos = this.store.list();

    // Clear existing planning indices
    const indexStats = this.indexer.getStatistics();
    for (const docName of Object.keys(indexStats)) {
      if (docName.startsWith('planning:')) {
        this.indexer.removeDocument(docName);
      }
    }

    // Reindex all active TODOs
    const tools: ToolMetadata[] = todos.map((todo) => ({
      name: `planning:${todo.id}`,
      description: `${todo.content} (status: ${todo.status})`,
      category: 'planning',
      keywords: todo.tags,
      serverId: 'internal:planning',
      inputSchema: {},
    }));

    this.indexer.addDocuments(tools);
  }

  /**
   * Get MCP tool definitions for planning
   */
  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'planning_create',
        description: 'Create a new TODO item with optional parent (for dependencies) and tags. Use this to track tasks and their relationships.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The TODO content/description',
            },
            parentId: {
              type: 'string',
              description: 'Optional parent TODO ID (creates dependency)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional tags for categorization (e.g., ["priority-high", "backend"])',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              description: 'Optional initial status (default: pending)',
            },
          },
          required: ['content'],
        },
        category: 'planning',
        keywords: ['planning', 'todo', 'task', 'create', 'add', 'dependency'],
        serverId: 'internal:planning',
      },
      {
        name: 'planning_update',
        description: 'Update an existing TODO: change status, content, tags, or parent. Use this to mark progress or modify tasks.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The TODO ID to update',
            },
            content: {
              type: 'string',
              description: 'New content (optional)',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              description: 'New status (optional)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'New tags (optional)',
            },
            parentId: {
              type: 'string',
              description: 'New parent ID (optional, use null to remove parent)',
            },
          },
          required: ['id'],
        },
        category: 'planning',
        keywords: ['planning', 'todo', 'update', 'modify', 'status', 'progress'],
        serverId: 'internal:planning',
      },
      {
        name: 'planning_tree',
        description: 'Visualize TODO dependency tree with status icons. Shows hierarchical task structure and progress summary.',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed'],
                  description: 'Filter by status (optional)',
                },
                rootOnly: {
                  type: 'boolean',
                  description: 'Show only root TODOs (no children expansion)',
                },
              },
            },
          },
        },
        category: 'planning',
        keywords: ['planning', 'tree', 'visualize', 'hierarchy', 'dependencies', 'overview'],
        serverId: 'internal:planning',
      },
    ];
  }

  /**
   * Handle tool calls (for Gateway integration)
   */
  async handleToolCall(toolName: string, args: unknown): Promise<any> {
    switch (toolName) {
      case 'planning_create':
        return this.create(args as PlanningCreateInput);

      case 'planning_update':
        return this.update(args as PlanningUpdateInput);

      case 'planning_tree':
        return this.tree(args as PlanningTreeInput);

      default:
        throw new Error(`Unknown planning tool: ${toolName}`);
    }
  }

  /**
   * Close resources
   */
  close(): void {
    this.store.close();
  }
}
