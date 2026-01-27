import type { ToolMetadata } from './gateway.js';
import { BM25Indexer } from '../search/bm25-indexer.js';

export interface ToolLoadingStrategy {
  layer: 1 | 2 | 3;
  priority: number;
  reason: string;
  searchMethod: 'bm25' | 'keyword' | 'none';
  searchTimeMs?: number;
}

export interface LoadedToolsResult {
  essential: ToolMetadata[]; // Layer 1: Always loaded
  relevant: ToolMetadata[]; // Layer 2: Query-matched
  available: number; // Layer 3: Total available
  strategy: ToolLoadingStrategy;
}

export class ToolLoader {
  private allTools: Map<string, ToolMetadata>;
  private essentialTools: Set<string>;
  private loadingHistory: Map<string, number>; // toolName -> usage count
  private bm25Indexer: BM25Indexer;

  constructor() {
    this.allTools = new Map();
    this.essentialTools = new Set();
    this.loadingHistory = new Map();
    this.bm25Indexer = new BM25Indexer({
      k1: 1.2, // Term frequency saturation parameter
      b: 0.75, // Length normalization parameter
    });
  }

  registerTool(tool: ToolMetadata): void {
    this.allTools.set(tool.name, tool);
    // Add to BM25 index
    this.bm25Indexer.addDocument(tool);
  }

  registerTools(tools: ToolMetadata[]): void {
    for (const tool of tools) {
      this.allTools.set(tool.name, tool);
    }
    // Batch add to BM25 index for better performance
    this.bm25Indexer.addDocuments(tools);
  }

  unregisterTool(toolName: string): void {
    this.allTools.delete(toolName);
    this.loadingHistory.delete(toolName);
    // Remove from BM25 index
    this.bm25Indexer.removeDocument(toolName);
  }

  setEssentialTool(toolName: string): void {
    this.essentialTools.add(toolName);
  }

  removeEssentialTool(toolName: string): void {
    this.essentialTools.delete(toolName);
  }

  /**
   * Load tools using 3-layer strategy
   * Layer 1: Essential tools (always loaded)
   * Layer 2: Query-matched tools (based on BM25 search)
   * Layer 3: On-demand tools (loaded when explicitly requested)
   */
  loadTools(query?: string, options?: { maxLayer2?: number }): LoadedToolsResult {
    const maxLayer2 = options?.maxLayer2 || 15;

    // Layer 1: Essential tools
    const essential = Array.from(this.essentialTools)
      .map((name) => this.allTools.get(name))
      .filter((tool): tool is ToolMetadata => tool !== undefined);

    // Layer 2: Query-matched tools (if query provided)
    let relevant: ToolMetadata[] = [];
    let searchTimeMs: number | undefined;
    let searchMethod: 'bm25' | 'keyword' | 'none' = 'none';

    if (query && query.trim()) {
      const startTime = performance.now();
      relevant = this.searchTools(query, { limit: maxLayer2 });
      searchTimeMs = performance.now() - startTime;
      searchMethod = 'bm25';
    }

    // Remove duplicates (tools that are both essential and relevant)
    const essentialNames = new Set(essential.map((t) => t.name));
    relevant = relevant.filter((t) => !essentialNames.has(t.name));

    return {
      essential,
      relevant,
      available: this.allTools.size,
      strategy: {
        layer: query && query.trim() ? 2 : 1,
        priority: this.calculatePriority(essential.length, relevant.length),
        reason: query
          ? `Loaded ${essential.length} essential + ${relevant.length} query-matched tools using BM25`
          : `Loaded ${essential.length} essential tools only`,
        searchMethod,
        searchTimeMs,
      },
    };
  }

  /**
   * Search tools using BM25 algorithm
   * Combines BM25 scores with usage history for better relevance
   */
  searchTools(query: string, options?: { limit?: number }): ToolMetadata[] {
    if (!query || !query.trim()) {
      return [];
    }

    const limit = options?.limit || 15;

    // Get BM25 results
    const bm25Results = this.bm25Indexer.search(query, { limit: limit * 2 });

    // Combine BM25 score with usage history
    const scoredResults = bm25Results.map((result) => {
      const usageCount = this.loadingHistory.get(result.toolName) || 0;
      const usageBoost = Math.log(usageCount + 1) * 0.1; // Logarithmic boost for usage
      const finalScore = result.score + usageBoost;

      return {
        tool: result.metadata,
        score: finalScore,
      };
    });

    // Sort by final score and return top N
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, limit).map((r) => r.tool);
  }

  recordToolUsage(toolName: string): void {
    const currentCount = this.loadingHistory.get(toolName) || 0;
    this.loadingHistory.set(toolName, currentCount + 1);
  }

  getToolUsageCount(toolName: string): number {
    return this.loadingHistory.get(toolName) || 0;
  }

  getMostUsedTools(limit: number = 10): ToolMetadata[] {
    const usageArray = Array.from(this.loadingHistory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return usageArray
      .map(([name]) => this.allTools.get(name))
      .filter((tool): tool is ToolMetadata => tool !== undefined);
  }

  private calculatePriority(essentialCount: number, relevantCount: number): number {
    // Priority decreases as tool count increases (to indicate token usage)
    const totalTools = essentialCount + relevantCount;
    return Math.max(1, 10 - Math.floor(totalTools / 5));
  }

  getTool(toolName: string): ToolMetadata | undefined {
    return this.allTools.get(toolName);
  }

  getAllTools(): ToolMetadata[] {
    return Array.from(this.allTools.values());
  }

  getToolCount(): number {
    return this.allTools.size;
  }

  getStatistics() {
    const bm25Stats = this.bm25Indexer.getStatistics();

    return {
      totalTools: this.allTools.size,
      essentialTools: this.essentialTools.size,
      toolsWithUsageHistory: this.loadingHistory.size,
      averageUsageCount:
        Array.from(this.loadingHistory.values()).reduce((a, b) => a + b, 0) /
          Math.max(this.loadingHistory.size, 1) || 0,
      bm25: {
        documentCount: bm25Stats.documentCount,
        isIndexed: bm25Stats.isIndexed,
        averageDocumentLength: bm25Stats.averageDocumentLength,
      },
    };
  }

  /**
   * Get BM25 indexer instance for advanced operations
   */
  getBM25Indexer(): BM25Indexer {
    return this.bm25Indexer;
  }

  /**
   * Clear all tools and reset indexer
   */
  clear(): void {
    this.allTools.clear();
    this.loadingHistory.clear();
    this.bm25Indexer.clear();
    this.essentialTools.clear();
  }
}
