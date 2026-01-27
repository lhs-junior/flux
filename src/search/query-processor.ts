/**
 * Query Processor for intent analysis and query enhancement
 * Phase 2: Basic implementation
 * Phase 4: Advanced NLP-based intent classification
 */

export type ToolCategory =
  | 'communication'
  | 'database'
  | 'filesystem'
  | 'development'
  | 'web'
  | 'ai'
  | 'other';

export interface QueryIntent {
  action?: string; // e.g., "send", "read", "create", "delete"
  domain?: ToolCategory; // e.g., "communication", "database"
  entities: string[]; // e.g., ["message", "channel", "slack"]
  confidence: number; // 0-1
}

export interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  keywords: string[];
  intent: QueryIntent;
  enhancedQuery: string; // Expanded query with synonyms/related terms
}

export class QueryProcessor {
  // Map individual action words to their canonical form
  private actionSynonyms: Record<string, string> = {
    'send': 'send',
    'read': 'read',
    'write': 'write',
    'delete': 'delete',
    'create': 'write',
    'update': 'write',
    'modify': 'write',
    'add': 'write',
    'insert': 'write',
    'list': 'read',
    'search': 'read',
    'find': 'read',
    'get': 'read',
    'fetch': 'read',
    'query': 'read',
    'remove': 'delete',
    'destroy': 'delete',
  };

  // Category keywords for domain classification
  private categoryKeywords: Map<ToolCategory, string[]> = new Map([
    [
      'communication',
      ['slack', 'discord', 'email', 'message', 'chat', 'notification', 'channel', 'dm'],
    ],
    [
      'database',
      [
        'database',
        'sql',
        'query',
        'table',
        'postgres',
        'mongodb',
        'sqlite',
        'redis',
        'db',
      ],
    ],
    [
      'filesystem',
      ['file', 'directory', 'folder', 'path', 'read', 'write', 'fs', 'disk'],
    ],
    [
      'development',
      [
        'github',
        'gitlab',
        'git',
        'code',
        'commit',
        'pull',
        'push',
        'branch',
        'repo',
        'issue',
      ],
    ],
    ['web', ['http', 'api', 'fetch', 'request', 'url', 'endpoint', 'rest', 'graphql']],
    ['ai', ['gpt', 'llm', 'ai', 'generate', 'model', 'anthropic', 'openai', 'claude']],
  ]);

  // Common stop words to filter out
  private stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'but',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'or',
    'that',
    'the',
    'to',
    'was',
    'will',
    'with',
  ]);

  /**
   * Process a user query and extract intent, keywords, and enhanced query
   */
  processQuery(query: string): ProcessedQuery {
    // Normalize query
    const normalizedQuery = this.normalizeQuery(query);

    // Extract keywords (tokenize and filter stop words)
    const keywords = this.extractKeywords(normalizedQuery);

    // Detect intent (action + domain)
    const intent = this.detectIntent(normalizedQuery, keywords);

    // Enhance query with synonyms and related terms
    const enhancedQuery = this.enhanceQuery(normalizedQuery, intent);

    return {
      originalQuery: query,
      normalizedQuery,
      keywords,
      intent,
      enhancedQuery,
    };
  }

  /**
   * Normalize query: lowercase, trim, remove extra spaces
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Extract keywords from query (filter stop words)
   */
  private extractKeywords(query: string): string[] {
    return query
      .split(/\s+/)
      .filter((word) => word.length > 2 && !this.stopWords.has(word));
  }

  /**
   * Detect user intent (action + domain + entities)
   */
  private detectIntent(query: string, keywords: string[]): QueryIntent {
    // Detect action verb and map to canonical form
    let action: string | undefined;

    for (const synonym in this.actionSynonyms) {
      if (query.includes(synonym)) {
        action = this.actionSynonyms[synonym];
        break;
      }
    }

    // Default action for queries with no clear action
    if (!action && keywords.length > 0) {
      action = 'read';
    }

    // Detect domain/category
    let domain: ToolCategory | undefined;
    let maxCategoryScore = 0;

    for (const [category, categoryWords] of this.categoryKeywords.entries()) {
      let score = 0;
      for (const keyword of keywords) {
        if (categoryWords.some((cw) => keyword.includes(cw) || cw.includes(keyword))) {
          score++;
        }
      }
      if (score > maxCategoryScore) {
        maxCategoryScore = score;
        domain = category;
      }
    }

    // Default domain for queries with no clear domain
    if (!domain && keywords.length > 0) {
      domain = 'other';
    }

    // Extract entities (keywords that are not in action synonyms)
    const actionSynonymWords = new Set(Object.keys(this.actionSynonyms));
    const entities = keywords.filter((kw) => !actionSynonymWords.has(kw));

    // Calculate confidence based on matches
    let confidence = 0;
    if (action) confidence += 0.3;
    if (domain && domain !== 'other') confidence += 0.5;
    if (entities.length > 0) confidence += 0.2;

    return {
      action,
      domain,
      entities,
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Enhance query with synonyms and related terms
   */
  private enhanceQuery(query: string, intent: QueryIntent): string {
    const enhancements: string[] = [query];

    // Add action synonym words
    if (intent.action) {
      for (const [synonym, canonical] of Object.entries(this.actionSynonyms)) {
        if (canonical === intent.action && !query.includes(synonym)) {
          enhancements.push(synonym);
        }
      }
      // Add the canonical form if not in original query
      if (!query.includes(intent.action)) {
        enhancements.push(intent.action);
      }
    }

    // Add category-related terms
    if (intent.domain) {
      const categoryWords = this.categoryKeywords.get(intent.domain);
      if (categoryWords) {
        // Add top 3 most relevant category words not in original query
        const relevantWords = categoryWords
          .filter((cw) => !query.includes(cw))
          .slice(0, 3);
        enhancements.push(...relevantWords);
      }
    }

    return enhancements.join(' ');
  }

  /**
   * Get category keywords for a specific category
   */
  getCategoryKeywords(category: ToolCategory): string[] {
    return this.categoryKeywords.get(category) || [];
  }

  /**
   * Get all supported categories
   */
  getSupportedCategories(): ToolCategory[] {
    return Array.from(this.categoryKeywords.keys());
  }

  /**
   * Check if a query is related to a specific category
   */
  isQueryRelatedToCategory(query: string, category: ToolCategory): boolean {
    const normalized = this.normalizeQuery(query);
    const keywords = this.categoryKeywords.get(category) || [];

    return keywords.some((keyword) => normalized.includes(keyword));
  }
}
