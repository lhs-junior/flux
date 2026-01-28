import { MemoryStore, MemoryRecord, MemoryFilter } from './memory-store.js';
import { BM25Indexer } from '../../search/bm25-indexer.js';
import type { ToolMetadata } from '../../core/types.js';
import {
  MemorySaveInputSchema,
  MemoryRecallInputSchema,
  MemoryListInputSchema,
  MemoryForgetInputSchema,
  validateInput,
  type MemorySaveInput,
  type MemoryRecallInput,
  type MemoryListInput,
  type MemoryForgetInput,
} from '../../validation/schemas.js';
import logger from '../../utils/logger.js';

// Re-export types for backwards compatibility
export type {
  MemorySaveInput,
  MemoryRecallInput,
  MemoryListInput,
  MemoryForgetInput,
};

export class MemoryManager {
  private store: MemoryStore;
  private indexer: BM25Indexer;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(dbPath: string = ':memory:') {
    this.store = new MemoryStore(dbPath);
    this.indexer = new BM25Indexer();

    // Index existing memories on initialization
    this.reindexAll();

    // Cleanup expired memories periodically (every hour)
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.store.cleanupExpired();
      if (cleaned > 0) {
        logger.debug(`Cleaned up ${cleaned} expired memories`);
        this.reindexAll();
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Save a memory
   */
  save(input: MemorySaveInput): { success: boolean; id: string; memory: MemoryRecord } {
    try {
      const memory = this.store.save(input.key, input.value, input.metadata);

      // Add to BM25 index for semantic search
      this.indexer.addDocument({
        name: `memory:${memory.id}`,
        description: `${memory.key}: ${memory.value}`,
        category: memory.category,
        keywords: memory.tags || [],
        serverId: 'internal:memory',
        inputSchema: { type: 'object' },
      });

      return {
        success: true,
        id: memory.id,
        memory,
      };
    } catch (error: unknown) {
      logger.error('Failed to save memory:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save memory: ${message}`);
    }
  }

  /**
   * Recall memories using BM25 semantic search
   */
  recall(input: MemoryRecallInput): {
    results: Array<{
      id: string;
      key: string;
      value: string;
      relevance: number;
      metadata: {
        category?: string;
        tags?: string[];
        createdAt: number;
        accessCount: number;
      };
    }>;
  } {
    try {
      // Use BM25 for semantic search
      const searchResults = this.indexer.search(input.query, {
        limit: input.limit || 10,
      });

      // Filter by category if specified
      const filtered = input.category
        ? searchResults.filter((r) => r.metadata.category === input.category)
        : searchResults;

      // Get full memory records
      const results = filtered
        .map((result) => {
          // Extract memory ID from tool name (format: "memory:uuid")
          const memoryId = result.toolName.replace('memory:', '');
          const memory = this.store.get(memoryId);
          if (!memory) return null;

          return {
            id: memory.id,
            key: memory.key,
            value: memory.value,
            relevance: result.score,
            metadata: {
              category: memory.category,
              tags: memory.tags,
              createdAt: memory.createdAt,
              accessCount: memory.accessCount,
            },
          };
        })
        .filter((r) => r !== null);

      return { results };
    } catch (error: unknown) {
      logger.error('Failed to recall memories:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to recall memories: ${message}`);
    }
  }

  /**
   * List memories with filters
   */
  list(input: MemoryListInput): {
    memories: Array<{
      id: string;
      key: string;
      value: string;
      createdAt: number;
      metadata: {
        category?: string;
        tags?: string[];
        accessCount: number;
      };
    }>;
  } {
    try {
      const filter: MemoryFilter = {
        ...input.filter,
        limit: input.limit,
      };

      const memories = this.store.list(filter);

      return {
        memories: memories.map((m) => ({
          id: m.id,
          key: m.key,
          value: m.value,
          createdAt: m.createdAt,
          metadata: {
            category: m.category,
            tags: m.tags,
            accessCount: m.accessCount,
          },
        })),
      };
    } catch (error: unknown) {
      logger.error('Failed to list memories:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list memories: ${message}`);
    }
  }

  /**
   * Forget a memory
   */
  forget(input: MemoryForgetInput): { success: boolean } {
    try {
      const success = this.store.forget(input.id);

      if (success) {
        // Remove from BM25 index
        this.indexer.removeDocument(`memory:${input.id}`);
      }

      return { success };
    } catch (error: unknown) {
      logger.error('Failed to forget memory:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to forget memory: ${message}`);
    }
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
        documentsIndexed: indexStats.documentCount,
        avgDocumentLength: indexStats.averageDocumentLength,
      },
    };
  }

  /**
   * Reindex all memories for BM25 search
   */
  private reindexAll(): void {
    const memories = this.store.list();

    // Clear existing memory indices
    const indexStats = this.indexer.getStatistics();
    for (const docName of Object.keys(indexStats)) {
      if (docName.startsWith('memory:')) {
        this.indexer.removeDocument(docName);
      }
    }

    // Reindex all active memories
    const tools: ToolMetadata[] = memories.map((m) => ({
      name: `memory:${m.id}`,
      description: `${m.key}: ${m.value}`,
      category: m.category,
      keywords: m.tags || [],
      serverId: 'internal:memory',
      inputSchema: { type: 'object' },
    }));

    this.indexer.addDocuments(tools);
  }

  /**
   * Get MCP tool definitions for memory management
   */
  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'memory_save',
        description: 'Save information to memory for later recall. Use this to remember important facts, preferences, or context.',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'A short, descriptive key for this memory (e.g., "user_preference", "project_goal")',
            },
            value: {
              type: 'string',
              description: 'The actual information to remember',
            },
            metadata: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional tags for categorization',
                },
                category: {
                  type: 'string',
                  description: 'Optional category (e.g., "preference", "fact", "context")',
                },
                expiresAt: {
                  type: 'number',
                  description: 'Optional Unix timestamp when this memory should expire',
                },
              },
            },
          },
          required: ['key', 'value'],
        },
        category: 'memory',
        keywords: ['memory', 'remember', 'save', 'store', 'recall', 'context'],
        serverId: 'internal:memory',
      },
      {
        name: 'memory_recall',
        description: 'Search and recall memories using semantic search. Finds relevant memories based on your query.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'What you want to remember (natural language query)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
            },
            category: {
              type: 'string',
              description: 'Optional category filter',
            },
          },
          required: ['query'],
        },
        category: 'memory',
        keywords: ['memory', 'recall', 'remember', 'search', 'find', 'retrieve'],
        serverId: 'internal:memory',
      },
      {
        name: 'memory_list',
        description: 'List all memories with optional filters. Useful for browsing what has been remembered.',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Filter by category',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by tags (matches any)',
                },
                since: {
                  type: 'number',
                  description: 'Only show memories created after this timestamp',
                },
              },
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
            },
          },
        },
        category: 'memory',
        keywords: ['memory', 'list', 'browse', 'all', 'show'],
        serverId: 'internal:memory',
      },
      {
        name: 'memory_forget',
        description: 'Delete a specific memory by its ID. Use this to remove outdated or incorrect information.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The ID of the memory to forget',
            },
          },
          required: ['id'],
        },
        category: 'memory',
        keywords: ['memory', 'forget', 'delete', 'remove', 'clear'],
        serverId: 'internal:memory',
      },
    ];
  }

  /**
   * Handle tool calls (for Gateway integration) with Zod validation
   */
  async handleToolCall(toolName: string, args: unknown): Promise<unknown> {
    switch (toolName) {
      case 'memory_save': {
        const validation = validateInput(MemorySaveInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.save(validation.data!);
      }

      case 'memory_recall': {
        const validation = validateInput(MemoryRecallInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.recall(validation.data!);
      }

      case 'memory_list': {
        const validation = validateInput(MemoryListInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.list(validation.data!);
      }

      case 'memory_forget': {
        const validation = validateInput(MemoryForgetInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.forget(validation.data!);
      }

      default:
        throw new Error(`Unknown memory tool: ${toolName}`);
    }
  }

  /**
   * Close resources
   */
  close(): void {
    // Clear cleanup interval to prevent accessing closed DB
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear indexer to free memory and remove document references
    this.indexer.clear();

    // Close database
    this.store.close();
  }
}
