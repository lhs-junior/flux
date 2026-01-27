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
  // Common action verbs mapped to their synonyms
  private actionSynonyms: Map<string, string[]> = new Map([
    ['send', ['send', 'post', 'publish', 'transmit', 'deliver']],
    ['read', ['read', 'get', 'fetch', 'retrieve', 'view', 'show']],
    ['write', ['write', 'create', 'add', 'insert', 'save']],
    ['update', ['update', 'modify', 'change', 'edit', 'alter']],
    ['delete', ['delete', 'remove', 'drop', 'clear', 'erase']],
    ['search', ['search', 'find', 'query', 'lookup', 'locate']],
    ['list', ['list', 'show', 'display', 'enumerate']],
  ]);

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
    ['ai', ['ai', 'llm', 'model', 'embedding', 'vector', 'semantic', 'ml', 'prompt']],
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
    // Detect action verb
    let action: string | undefined;
    let maxActionMatches = 0;

    for (const [baseAction, synonyms] of this.actionSynonyms.entries()) {
      const matches = synonyms.filter((syn) => query.includes(syn)).length;
      if (matches > maxActionMatches) {
        maxActionMatches = matches;
        action = baseAction;
      }
    }

    // Detect domain/category
    let domain: ToolCategory = 'other';
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

    // Extract entities (keywords that are not action verbs or common words)
    const entities = keywords.filter((kw) => {
      return !Array.from(this.actionSynonyms.values()).some((synonyms) =>
        synonyms.includes(kw)
      );
    });

    // Calculate confidence based on matches
    const confidence =
      (maxActionMatches > 0 ? 0.3 : 0) +
      (maxCategoryScore > 0 ? 0.5 : 0) +
      (entities.length > 0 ? 0.2 : 0);

    return {
      action,
      domain: maxCategoryScore > 0 ? domain : undefined,
      entities,
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Enhance query with synonyms and related terms
   */
  private enhanceQuery(query: string, intent: QueryIntent): string {
    const enhancements: string[] = [query];

    // Add action synonyms
    if (intent.action) {
      const synonyms = this.actionSynonyms.get(intent.action);
      if (synonyms) {
        enhancements.push(...synonyms.filter((s) => !query.includes(s)));
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
