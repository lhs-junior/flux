import { Octokit } from '@octokit/rest';

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  stars: number;
  forks: number;
  lastCommit: Date;
  topics: string[];
  hasReadme: boolean;
  readmeUrl?: string;
  packageJson?: {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
  };
  license?: string;
  createdAt: Date;
  updatedAt: Date;
  openIssues: number;
  url: string;
}

export interface SearchOptions {
  minStars?: number;
  maxResults?: number;
  topics?: string[];
  keywords?: string[];
  language?: string;
}

export interface ExplorerOptions {
  githubToken?: string;
  cacheExpiry?: number; // ms
  enableCache?: boolean;
}

interface CacheEntry {
  data: GitHubRepoInfo[];
  timestamp: number;
}

export class GitHubExplorer {
  private octokit: Octokit;
  private cache: Map<string, CacheEntry>;
  private cacheExpiry: number;
  private enableCache: boolean;

  constructor(options: ExplorerOptions = {}) {
    this.octokit = new Octokit({
      auth: options.githubToken || process.env.GITHUB_TOKEN,
    });
    this.cache = new Map();
    this.cacheExpiry = options.cacheExpiry ?? 24 * 60 * 60 * 1000; // 24 hours
    this.enableCache = options.enableCache ?? true;
  }

  /**
   * Search for MCP server repositories on GitHub
   */
  async searchMCPServers(options: SearchOptions = {}): Promise<GitHubRepoInfo[]> {
    const minStars = options.minStars ?? 10;
    const maxResults = options.maxResults ?? 50;
    const topics = options.topics ?? ['mcp-server', 'mcp', 'model-context-protocol'];
    const keywords = options.keywords ?? ['mcp', 'server', 'plugin'];
    const language = options.language ?? 'typescript';

    // Check cache
    const cacheKey = this.getCacheKey(options);
    if (this.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('Returning cached results');
        return cached;
      }
    }

    console.log('Searching GitHub for MCP servers...');

    const results: GitHubRepoInfo[] = [];

    // Strategy 1: Search by topics
    for (const topic of topics) {
      const query = `topic:${topic} stars:>=${minStars} language:${language}`;
      const repos = await this.searchRepositories(query, Math.ceil(maxResults / topics.length));
      results.push(...repos);
    }

    // Strategy 2: Search by name patterns (mcp-server-*, *-mcp-server)
    const namePatterns = ['mcp-server', 'mcp-plugin', 'mcp-tool'];
    for (const pattern of namePatterns) {
      const query = `${pattern} in:name stars:>=${minStars} language:${language}`;
      const repos = await this.searchRepositories(query, Math.ceil(maxResults / namePatterns.length));
      results.push(...repos);
    }

    // Strategy 3: Search by keywords in description
    for (const keyword of keywords) {
      const query = `${keyword} in:description,readme stars:>=${minStars} language:${language}`;
      const repos = await this.searchRepositories(query, Math.ceil(maxResults / keywords.length));
      results.push(...repos);
    }

    // Deduplicate by repository full name
    const uniqueRepos = this.deduplicateRepos(results);

    // Sort by stars (descending)
    uniqueRepos.sort((a, b) => b.stars - a.stars);

    // Limit results
    const finalResults = uniqueRepos.slice(0, maxResults);

    // Enrich with additional metadata
    const enrichedResults = await this.enrichRepoInfo(finalResults);

    // Cache results
    if (this.enableCache) {
      this.addToCache(cacheKey, enrichedResults);
    }

    console.log(`Found ${enrichedResults.length} unique MCP server repositories`);

    return enrichedResults;
  }

  /**
   * Get detailed information about a specific repository
   */
  async getRepoInfo(owner: string, repo: string): Promise<GitHubRepoInfo | null> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });

      // Get latest commit
      const { data: commits } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1,
      });

      const lastCommit = commits[0]?.commit.committer?.date
        ? new Date(commits[0].commit.committer.date)
        : new Date(data.updated_at);

      // Check for README
      let hasReadme = false;
      let readmeUrl: string | undefined;
      try {
        const { data: readme } = await this.octokit.repos.getReadme({ owner, repo });
        hasReadme = true;
        readmeUrl = readme.download_url ?? undefined;
      } catch {
        // README not found
      }

      // Try to get package.json
      let packageJson: GitHubRepoInfo['packageJson'];
      try {
        const { data: pkgFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: 'package.json',
        });

        if ('content' in pkgFile && pkgFile.content) {
          const content = Buffer.from(pkgFile.content, 'base64').toString('utf-8');
          const pkg = JSON.parse(content);
          packageJson = {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            keywords: pkg.keywords,
          };
        }
      } catch {
        // package.json not found
      }

      return {
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description ?? undefined,
        stars: data.stargazers_count,
        forks: data.forks_count,
        lastCommit,
        topics: data.topics || [],
        hasReadme,
        readmeUrl,
        packageJson,
        license: data.license?.spdx_id ?? undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        openIssues: data.open_issues_count,
        url: data.html_url,
      };
    } catch (error) {
      console.error(`Failed to get repo info for ${owner}/${repo}:`, error);
      return null;
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimit() {
    const { data } = await this.octokit.rateLimit.get();
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
      used: data.rate.used,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Search repositories with a query
   */
  private async searchRepositories(query: string, perPage: number = 30): Promise<GitHubRepoInfo[]> {
    try {
      const { data } = await this.octokit.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: Math.min(perPage, 100),
      });

      return data.items.map((repo) => ({
        owner: repo.owner?.login ?? '',
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description ?? undefined,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        lastCommit: new Date(repo.updated_at),
        topics: repo.topics || [],
        hasReadme: true, // Assume true, will be verified during enrichment
        license: repo.license?.spdx_id ?? undefined,
        createdAt: new Date(repo.created_at),
        updatedAt: new Date(repo.updated_at),
        openIssues: repo.open_issues_count,
        url: repo.html_url,
      }));
    } catch (error: any) {
      if (error.status === 403) {
        console.error('GitHub API rate limit exceeded. Please provide a GITHUB_TOKEN or wait.');
      } else {
        console.error('GitHub search error:', error.message);
      }
      return [];
    }
  }

  /**
   * Enrich repository information with additional metadata
   */
  private async enrichRepoInfo(repos: GitHubRepoInfo[]): Promise<GitHubRepoInfo[]> {
    console.log(`Enriching ${repos.length} repositories with additional metadata...`);

    const enriched: GitHubRepoInfo[] = [];

    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      const promises = batch.map((repo) => this.getRepoInfo(repo.owner, repo.name));
      const results = await Promise.all(promises);

      for (const result of results) {
        if (result) {
          enriched.push(result);
        }
      }

      // Small delay to respect rate limits
      if (i + batchSize < repos.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return enriched;
  }

  /**
   * Deduplicate repositories by full name
   */
  private deduplicateRepos(repos: GitHubRepoInfo[]): GitHubRepoInfo[] {
    const seen = new Set<string>();
    const unique: GitHubRepoInfo[] = [];

    for (const repo of repos) {
      if (!seen.has(repo.fullName)) {
        seen.add(repo.fullName);
        unique.push(repo);
      }
    }

    return unique;
  }

  /**
   * Get cache key from search options
   */
  private getCacheKey(options: SearchOptions): string {
    return JSON.stringify(options);
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache(key: string): GitHubRepoInfo[] | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Add data to cache
   */
  private addToCache(key: string, data: GitHubRepoInfo[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}
