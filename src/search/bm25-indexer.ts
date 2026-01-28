import BM25 from 'okapibm25';
import type { BMConstants } from 'okapibm25';
import type { ToolMetadata } from '../core/types.js';

export interface IndexedDocument {
  id: string; // tool name
  text: string; // combined searchable text
  metadata: ToolMetadata;
}

export interface SearchResult {
  toolName: string;
  score: number;
  metadata: ToolMetadata;
}

export interface BM25IndexerOptions {
  k1?: number; // Term frequency saturation parameter (default: 1.2)
  b?: number; // Length normalization parameter (default: 0.75)
}

export class BM25Indexer {
  private documents: Map<string, IndexedDocument>;
  private corpus: string[];
  private constants: BMConstants;

  constructor(options: BM25IndexerOptions = {}) {
    this.documents = new Map();
    this.corpus = [];
    this.constants = {
      k1: options.k1 ?? 1.2,
      b: options.b ?? 0.75,
    };
  }

  /**
   * Add a single tool to the index
   */
  addDocument(tool: ToolMetadata): void {
    const searchText = this.buildSearchText(tool);
    const doc: IndexedDocument = {
      id: tool.name,
      text: searchText,
      metadata: tool,
    };

    // If tool already exists, update it
    const existingIndex = Array.from(this.documents.keys()).indexOf(tool.name);
    if (existingIndex >= 0) {
      this.corpus[existingIndex] = searchText;
    } else {
      this.corpus.push(searchText);
    }

    this.documents.set(tool.name, doc);
  }

  /**
   * Add multiple tools to the index
   */
  addDocuments(tools: ToolMetadata[]): void {
    for (const tool of tools) {
      const searchText = this.buildSearchText(tool);
      const doc: IndexedDocument = {
        id: tool.name,
        text: searchText,
        metadata: tool,
      };

      this.documents.set(tool.name, doc);
      this.corpus.push(searchText);
    }
  }

  /**
   * Remove a tool from the index
   */
  removeDocument(toolName: string): void {
    const doc = this.documents.get(toolName);
    if (!doc) {
      return;
    }

    // Find index in corpus
    const docIds = Array.from(this.documents.keys());
    const index = docIds.indexOf(toolName);

    if (index > -1) {
      this.corpus.splice(index, 1);
    }

    this.documents.delete(toolName);
  }

  /**
   * Clear all documents from the index
   */
  clear(): void {
    this.documents.clear();
    this.corpus = [];
  }

  /**
   * Search for tools matching the query
   */
  search(query: string, options?: { limit?: number; threshold?: number }): SearchResult[] {
    if (this.corpus.length === 0) {
      return [];
    }

    const limit = options?.limit ?? 10;
    const threshold = options?.threshold ?? 0;

    // Tokenize query (simple whitespace split)
    const queryTokens = this.tokenize(query);

    // Get BM25 scores using the function
    const scores = BM25(this.corpus, queryTokens, this.constants) as number[];

    // Create results with metadata
    const results: SearchResult[] = [];
    const docArray = Array.from(this.documents.values());

    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      const doc = docArray[i];
      if (score !== undefined && score > threshold && doc) {
        results.push({
          toolName: doc.id,
          score,
          metadata: doc.metadata,
        });
      }
    }

    // Sort by score (descending) and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Get statistics about the index
   */
  getStatistics() {
    return {
      documentCount: this.documents.size,
      corpusSize: this.corpus.length,
      isIndexed: this.corpus.length > 0,
      averageDocumentLength:
        this.corpus.reduce((sum, doc) => sum + doc.split(/\s+/).length, 0) /
          Math.max(this.corpus.length, 1) || 0,
    };
  }

  /**
   * Get a document by tool name
   */
  getDocument(toolName: string): IndexedDocument | undefined {
    return this.documents.get(toolName);
  }

  /**
   * Get all indexed documents
   */
  getAllDocuments(): IndexedDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Build searchable text from tool metadata
   * Combines name, description, keywords, and category
   */
  private buildSearchText(tool: ToolMetadata): string {
    const parts: string[] = [
      tool.name, // Weight name heavily by including it
      tool.name, // twice
      tool.description || '',
    ];

    if (tool.keywords) {
      parts.push(...tool.keywords);
    }

    if (tool.category) {
      parts.push(tool.category);
    }

    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * Tokenize text into words
   * Simple whitespace-based tokenization for now
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Update BM25 parameters (will take effect on next search)
   */
  updateParameters(options: BM25IndexerOptions): void {
    if (options.k1 !== undefined) {
      this.constants.k1 = options.k1;
    }
    if (options.b !== undefined) {
      this.constants.b = options.b;
    }
  }
}
