import { QueryProcessor } from '../search/query-processor.js';
import { ToolLoader } from './tool-loader.js';
import logger from '../utils/logger.js';
import type { ToolMetadata } from './types.js';

export interface ToolSearchEngineOptions {
  maxResults: number;
  enableToolSearch: boolean;
}

export class ToolSearchEngine {
  private queryProcessor: QueryProcessor;
  private toolLoader: ToolLoader;
  private availableTools: Map<string, ToolMetadata>;
  private options: ToolSearchEngineOptions;

  constructor(
    queryProcessor: QueryProcessor,
    toolLoader: ToolLoader,
    availableTools: Map<string, ToolMetadata>,
    options?: Partial<ToolSearchEngineOptions>
  ) {
    this.queryProcessor = queryProcessor;
    this.toolLoader = toolLoader;
    this.availableTools = availableTools;
    this.options = {
      maxResults: options?.maxResults ?? 15,
      enableToolSearch: options?.enableToolSearch ?? true,
    };
  }

  /**
   * Search for tools using BM25 and query processing
   */
  async search(query: string, options?: { limit?: number }): Promise<ToolMetadata[]> {
    const limit = options?.limit || this.options.maxResults;

    // If query is empty, return all tools up to the limit
    if (!query || !query.trim()) {
      return Array.from(this.availableTools.values()).slice(0, limit);
    }

    // Process query to extract intent
    const processedQuery = this.queryProcessor.processQuery(query);

    logger.debug('Query processed:', {
      original: processedQuery.originalQuery,
      intent: processedQuery.intent,
      keywords: processedQuery.keywords,
    });

    // Use enhanced query for better search results
    const result = await this.toolLoader.loadTools(processedQuery.enhancedQuery, {
      maxLayer2: limit,
    });

    logger.debug('Tool search completed:', {
      searchMethod: result.strategy.searchMethod,
      searchTimeMs: result.strategy.searchTimeMs,
      foundTools: result.relevant.length,
    });

    // Results already have category and keywords from BM25 indexer
    return result.relevant;
  }
}
