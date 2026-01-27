# API Reference

Complete API documentation for Awesome MCP Meta Plugin. This reference covers all public classes, methods, interfaces, and types.

## Table of Contents

- [Core Classes](#core-classes)
  - [AwesomePluginGateway](#awesomeplugingateway)
  - [ToolLoader](#toolloader)
  - [MCPClient](#mcpclient)
- [Search & Classification](#search--classification)
  - [BM25Indexer](#bm25indexer)
  - [QueryProcessor](#queryprocessor)
- [Discovery & Quality](#discovery--quality)
  - [GitHubExplorer](#githubexplorer)
  - [QualityEvaluator](#qualityevaluator)
- [Storage](#storage)
  - [MetadataStore](#metadatastore)
- [Type Definitions](#type-definitions)
- [Complete Examples](#complete-examples)

---

## Core Classes

### AwesomePluginGateway

The main gateway class for managing MCP servers and tools. This is the primary entry point for using Awesome Plugin.

#### Constructor

```typescript
new AwesomePluginGateway(options?: GatewayOptions)
```

**Parameters:**
- `options.dbPath` (string, optional): SQLite database path. Default: `':memory:'`
- `options.enableToolSearch` (boolean, optional): Enable BM25 search. Default: `true`
- `options.maxLayer2Tools` (number, optional): Maximum tools in Layer 2. Default: `15`

**Example:**
```typescript
import { AwesomePluginGateway } from 'awesome-plugin';

const gateway = new AwesomePluginGateway({
  dbPath: './data/plugins.db',
  enableToolSearch: true,
  maxLayer2Tools: 15,
});
```

#### Methods

##### connectToServer()

Connect to an MCP server and register its tools.

```typescript
await gateway.connectToServer(config: MCPServerConfig): Promise<void>
```

**Parameters:**
- `config.id` (string): Unique server identifier
- `config.name` (string): Display name for the server
- `config.command` (string): Command to start the server
- `config.args` (string[], optional): Command arguments
- `config.env` (Record<string, string>, optional): Environment variables

**Returns:** `Promise<void>`

**Throws:** Error if server fails to connect

**Example:**
```typescript
await gateway.connectToServer({
  id: 'filesystem',
  name: 'Filesystem Server',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});
```

##### searchTools()

Search for tools using BM25 algorithm.

```typescript
await gateway.searchTools(query: string, options?: SearchOptions): Promise<ToolMetadata[]>
```

**Parameters:**
- `query` (string): Search query string
- `options.limit` (number, optional): Maximum results to return. Default: `10`

**Returns:** Array of matching tools sorted by relevance

**Example:**
```typescript
const tools = await gateway.searchTools('read file', { limit: 5 });
console.log(`Found ${tools.length} tools:`);
tools.forEach(tool => {
  console.log(`- ${tool.name}: ${tool.description}`);
});
```

##### getStatistics()

Get gateway statistics and metrics.

```typescript
gateway.getStatistics(): GatewayStatistics
```

**Returns:**
```typescript
{
  connectedServers: number;    // Number of connected MCP servers
  totalTools: number;           // Total tools across all servers
  essentialTools: number;       // Tools in Layer 1
  layer2Tools: number;          // Tools in Layer 2
  searchEnabled: boolean;       // Whether search is enabled
  uptime: number;              // Uptime in milliseconds
}
```

**Example:**
```typescript
const stats = gateway.getStatistics();
console.log(`Connected servers: ${stats.connectedServers}`);
console.log(`Total tools: ${stats.totalTools}`);
console.log(`Token usage: ~${stats.essentialTools * 300 + stats.layer2Tools * 300} tokens`);
```

##### start()

Start the gateway as an MCP server (stdio transport). This runs the gateway as a standalone MCP server that Claude Desktop or other MCP clients can connect to.

```typescript
await gateway.start(): Promise<void>
```

**Returns:** `Promise<void>` (never resolves, runs until stopped)

**Example:**
```typescript
// Start gateway server
await gateway.start();

// This line will never execute unless server stops
console.log('Gateway stopped');
```

##### stop()

Stop the gateway and disconnect all MCP servers.

```typescript
await gateway.stop(): Promise<void>
```

**Returns:** `Promise<void>`

**Example:**
```typescript
// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await gateway.stop();
  process.exit(0);
});
```

---

### ToolLoader

Manages 3-layer intelligent tool loading strategy.

#### Constructor

```typescript
new ToolLoader()
```

**Example:**
```typescript
import { ToolLoader } from 'awesome-plugin';

const loader = new ToolLoader();
```

#### Methods

##### loadTools()

Load tools using 3-layer strategy based on query.

```typescript
loader.loadTools(query: string, allTools: ToolMetadata[], options?: LoadOptions): LoadResult
```

**Parameters:**
- `query` (string): User query or context
- `allTools` (ToolMetadata[]): All available tools
- `options.maxLayer2` (number, optional): Max Layer 2 tools. Default: `15`
- `options.essentialToolNames` (string[], optional): Names of essential tools

**Returns:**
```typescript
{
  essential: ToolMetadata[];  // Layer 1: Always loaded
  relevant: ToolMetadata[];   // Layer 2: BM25-matched
  onDemand: ToolMetadata[];  // Layer 3: Available on request
}
```

**Example:**
```typescript
const result = loader.loadTools(
  'read and write files',
  allTools,
  { maxLayer2: 10 }
);

console.log(`Essential tools: ${result.essential.length}`);
console.log(`Relevant tools: ${result.relevant.length}`);
console.log(`On-demand tools: ${result.onDemand.length}`);
```

##### recordToolUsage()

Record tool usage for learning.

```typescript
loader.recordToolUsage(toolName: string): void
```

**Parameters:**
- `toolName` (string): Name of the used tool

**Example:**
```typescript
// After calling a tool
loader.recordToolUsage('read_file');
```

---

### MCPClient

Client for connecting to individual MCP servers.

#### Constructor

```typescript
new MCPClient(config: MCPClientConfig)
```

**Parameters:**
- `config.command` (string): Command to start server
- `config.args` (string[], optional): Command arguments
- `config.env` (Record<string, string>, optional): Environment variables
- `config.onError` (function, optional): Error callback
- `config.maxRetries` (number, optional): Max connection retries. Default: `3`
- `config.retryDelay` (number, optional): Retry delay in ms. Default: `1000`

**Example:**
```typescript
import { MCPClient } from 'awesome-plugin';

const client = new MCPClient({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir'],
  onError: (error) => console.error('MCP error:', error),
});
```

#### Methods

##### connect()

Connect to the MCP server.

```typescript
await client.connect(): Promise<void>
```

##### listTools()

List all tools provided by the server.

```typescript
await client.listTools(): Promise<Tool[]>
```

##### callTool()

Call a tool on the server.

```typescript
await client.callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>
```

##### disconnect()

Disconnect from the server.

```typescript
await client.disconnect(): Promise<void>
```

---

## Search & Classification

### BM25Indexer

BM25 search engine for tool indexing and retrieval.

#### Constructor

```typescript
new BM25Indexer(options?: BM25IndexerOptions)
```

**Parameters:**
- `options.k1` (number, optional): Term frequency saturation. Default: `1.2`
- `options.b` (number, optional): Length normalization. Default: `0.75`

**Example:**
```typescript
import { BM25Indexer } from 'awesome-plugin';

const indexer = new BM25Indexer({
  k1: 1.2,  // Higher = more importance to term frequency
  b: 0.75,  // Higher = more length normalization
});
```

#### Methods

##### addDocument()

Add a single tool to the index.

```typescript
indexer.addDocument(tool: ToolMetadata): void
```

**Parameters:**
- `tool` (ToolMetadata): Tool metadata to index

**Example:**
```typescript
indexer.addDocument({
  name: 'read_file',
  description: 'Read contents of a file',
  serverId: 'filesystem',
  inputSchema: { /* ... */ },
});
```

##### addDocuments()

Add multiple tools to the index.

```typescript
indexer.addDocuments(tools: ToolMetadata[]): void
```

##### search()

Search for tools matching a query.

```typescript
indexer.search(query: string, options?: SearchOptions): SearchResult[]
```

**Parameters:**
- `query` (string): Search query
- `options.limit` (number, optional): Max results. Default: `10`
- `options.boost` (Map<string, number>, optional): Boost scores for specific tools

**Returns:** Array of search results sorted by relevance

**Example:**
```typescript
const results = indexer.search('read file', { limit: 5 });

results.forEach(result => {
  console.log(`${result.toolName}: ${result.score.toFixed(2)}`);
});
```

##### getStatistics()

Get indexer statistics.

```typescript
indexer.getStatistics(): IndexStatistics
```

**Returns:**
```typescript
{
  totalDocuments: number;
  totalTerms: number;
  averageDocumentLength: number;
}
```

---

### QueryProcessor

Processes and classifies user queries for intelligent tool selection.

#### Constructor

```typescript
new QueryProcessor()
```

#### Methods

##### processQuery()

Process and analyze a query.

```typescript
processor.processQuery(query: string): ProcessedQuery
```

**Parameters:**
- `query` (string): User query to process

**Returns:**
```typescript
{
  original: string;              // Original query
  normalized: string;            // Normalized query
  action?: string;               // Detected action (read, write, delete, etc.)
  domain?: string;               // Detected domain (filesystem, database, etc.)
  entities: string[];            // Extracted entities/keywords
  enhancedTerms: string[];       // Query with synonyms expanded
}
```

**Example:**
```typescript
import { QueryProcessor } from 'awesome-plugin';

const processor = new QueryProcessor();
const result = processor.processQuery('I want to read a text file');

console.log(result.action);   // 'read'
console.log(result.domain);   // 'filesystem'
console.log(result.entities); // ['text', 'file']
```

---

## Discovery & Quality

### GitHubExplorer

Discovers MCP servers from GitHub repositories.

#### Constructor

```typescript
new GitHubExplorer(options?: ExplorerOptions)
```

**Parameters:**
- `options.githubToken` (string, optional): GitHub personal access token
- `options.cacheExpiry` (number, optional): Cache expiration in ms. Default: `86400000` (24 hours)
- `options.enableCache` (boolean, optional): Enable caching. Default: `true`

**Example:**
```typescript
import { GitHubExplorer } from 'awesome-plugin';

const explorer = new GitHubExplorer({
  githubToken: process.env.GITHUB_TOKEN,
  cacheExpiry: 3600000, // 1 hour
});
```

#### Methods

##### searchMCPServers()

Search for MCP server repositories on GitHub.

```typescript
await explorer.searchMCPServers(options?: SearchOptions): Promise<GitHubRepoInfo[]>
```

**Parameters:**
- `options.minStars` (number, optional): Minimum stars. Default: `10`
- `options.maxResults` (number, optional): Maximum results. Default: `50`
- `options.topics` (string[], optional): Topics to search. Default: `['mcp-server', 'mcp', 'model-context-protocol']`
- `options.keywords` (string[], optional): Keywords to search. Default: `['mcp', 'server', 'plugin']`
- `options.language` (string, optional): Repository language. Default: `'typescript'`

**Returns:** Array of repository information

**Example:**
```typescript
const repos = await explorer.searchMCPServers({
  minStars: 50,
  maxResults: 20,
  topics: ['mcp-server'],
  language: 'typescript',
});

console.log(`Found ${repos.length} repositories`);
repos.forEach(repo => {
  console.log(`${repo.fullName}: ${repo.stars} stars`);
});
```

##### getRateLimitInfo()

Get GitHub API rate limit information.

```typescript
await explorer.getRateLimitInfo(): Promise<RateLimitInfo>
```

**Returns:**
```typescript
{
  limit: number;      // Total requests allowed
  remaining: number;  // Requests remaining
  reset: Date;        // When limit resets
}
```

**Example:**
```typescript
const rateLimit = await explorer.getRateLimitInfo();
console.log(`${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
console.log(`Resets at: ${rateLimit.reset.toLocaleString()}`);
```

---

### QualityEvaluator

Evaluates quality of MCP server repositories.

#### Constructor

```typescript
new QualityEvaluator(options?: EvaluationOptions)
```

**Parameters:**
- `options.minScore` (number, optional): Minimum passing score. Default: `70`
- `options.weights` (object, optional): Category weights (all default to `1.0`):
  - `popularity` (number): Weight for popularity score
  - `maintenance` (number): Weight for maintenance score
  - `documentation` (number): Weight for documentation score
  - `reliability` (number): Weight for reliability score

**Example:**
```typescript
import { QualityEvaluator } from 'awesome-plugin';

const evaluator = new QualityEvaluator({
  minScore: 75,
  weights: {
    popularity: 1.0,
    maintenance: 1.5,  // Prioritize maintenance
    documentation: 1.0,
    reliability: 1.2,
  },
});
```

#### Methods

##### evaluate()

Evaluate a single repository.

```typescript
evaluator.evaluate(repo: GitHubRepoInfo): QualityScore
```

**Parameters:**
- `repo` (GitHubRepoInfo): Repository information

**Returns:**
```typescript
{
  total: number;                // Total score (0-100)
  breakdown: {
    popularity: number;         // 0-25
    maintenance: number;        // 0-25
    documentation: number;      // 0-25
    reliability: number;        // 0-25
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: 'highly_recommended' | 'recommended' | 'acceptable' | 'not_recommended';
  reasons: string[];           // Human-readable reasons
}
```

**Example:**
```typescript
const score = evaluator.evaluate(repo);

console.log(`${repo.fullName}: ${score.total}/100 (${score.grade})`);
console.log(`Recommendation: ${score.recommendation}`);
console.log('Reasons:');
score.reasons.forEach(reason => console.log(`  - ${reason}`));
```

##### evaluateAll()

Evaluate multiple repositories and return sorted by score.

```typescript
evaluator.evaluateAll(repos: GitHubRepoInfo[]): Array<{ repo: GitHubRepoInfo; score: QualityScore }>
```

**Example:**
```typescript
const evaluated = evaluator.evaluateAll(repos);

console.log('Top 5 plugins:');
evaluated.slice(0, 5).forEach(({ repo, score }, index) => {
  console.log(`${index + 1}. ${repo.fullName}: ${score.total}/100 (${score.grade})`);
});
```

##### filterRecommended()

Filter repositories by minimum score.

```typescript
evaluator.filterRecommended(repos: GitHubRepoInfo[]): GitHubRepoInfo[]
```

**Returns:** Repositories meeting or exceeding `minScore`

---

## Storage

### MetadataStore

SQLite-based storage for plugin metadata and usage logs.

#### Constructor

```typescript
new MetadataStore(options?: StoreOptions)
```

**Parameters:**
- `options.filepath` (string, optional): SQLite database path. Default: `':memory:'`

**Example:**
```typescript
import { MetadataStore } from 'awesome-plugin';

const store = new MetadataStore({
  filepath: './data/plugins.db',
});
```

#### Methods

##### addPlugin()

Add a plugin to the database.

```typescript
store.addPlugin(plugin: PluginInfo): void
```

##### getPluginByName()

Get plugin by name.

```typescript
store.getPluginByName(name: string): PluginInfo | undefined
```

##### listPlugins()

List all plugins.

```typescript
store.listPlugins(): PluginInfo[]
```

##### addTools()

Add tools for a plugin.

```typescript
store.addTools(pluginId: string, tools: ToolMetadata[]): void
```

##### updateToolUsage()

Record tool usage.

```typescript
store.updateToolUsage(toolName: string): void
```

##### getStatistics()

Get database statistics.

```typescript
store.getStatistics(): StoreStatistics
```

**Returns:**
```typescript
{
  totalPlugins: number;
  totalTools: number;
  totalUsageLogs: number;
}
```

---

## Type Definitions

### MCPServerConfig

Configuration for connecting to an MCP server.

```typescript
interface MCPServerConfig {
  id: string;                         // Unique identifier
  name: string;                       // Display name
  command: string;                    // Command to start server
  args?: string[];                    // Command arguments
  env?: Record<string, string>;       // Environment variables
}
```

### ToolMetadata

Extended tool information with metadata.

```typescript
interface ToolMetadata extends Tool {
  serverId: string;                   // Server that provides this tool
  category?: string;                  // Tool category
  keywords?: string[];                // Search keywords
}
```

### GatewayOptions

Options for AwesomePluginGateway.

```typescript
interface GatewayOptions {
  dbPath?: string;                    // Database path (default: ':memory:')
  enableToolSearch?: boolean;         // Enable search (default: true)
  maxLayer2Tools?: number;            // Max Layer 2 tools (default: 15)
}
```

### GitHubRepoInfo

GitHub repository information.

```typescript
interface GitHubRepoInfo {
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
```

---

## Complete Examples

### Example 1: Basic Gateway Usage

```typescript
import { AwesomePluginGateway } from 'awesome-plugin';

async function main() {
  // 1. Create gateway
  const gateway = new AwesomePluginGateway({
    dbPath: './data/plugins.db',
    enableToolSearch: true,
    maxLayer2Tools: 15,
  });

  // 2. Connect to MCP servers
  await gateway.connectToServer({
    id: 'filesystem',
    name: 'Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
  });

  // 3. Search for tools
  const tools = await gateway.searchTools('read file', { limit: 5 });
  console.log('Found tools:', tools.map(t => t.name));

  // 4. Get statistics
  const stats = gateway.getStatistics();
  console.log('Statistics:', stats);

  // 5. Cleanup
  await gateway.stop();
}

main();
```

### Example 2: Multi-Server Setup

```typescript
import { AwesomePluginGateway } from 'awesome-plugin';

async function setupMultiServer() {
  const gateway = new AwesomePluginGateway({
    dbPath: './data/dev-env.db',
    maxLayer2Tools: 20,
  });

  const servers = [
    {
      id: 'filesystem',
      name: 'Filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    },
    {
      id: 'github',
      name: 'GitHub',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
    },
    {
      id: 'slack',
      name: 'Slack',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: { SLACK_TOKEN: process.env.SLACK_TOKEN },
    },
  ];

  // Connect to all servers in parallel
  await Promise.all(
    servers.map(config => gateway.connectToServer(config))
  );

  // Search across all servers
  const fileTools = await gateway.searchTools('read write file');
  const githubTools = await gateway.searchTools('create pull request');
  const slackTools = await gateway.searchTools('send message');

  console.log(`File tools: ${fileTools.length}`);
  console.log(`GitHub tools: ${githubTools.length}`);
  console.log(`Slack tools: ${slackTools.length}`);

  return gateway;
}
```

### Example 3: GitHub Discovery

```typescript
import { GitHubExplorer, QualityEvaluator } from 'awesome-plugin';

async function discoverPlugins() {
  // Setup
  const explorer = new GitHubExplorer({
    githubToken: process.env.GITHUB_TOKEN,
  });

  const evaluator = new QualityEvaluator({
    minScore: 75,
  });

  // Search
  const repos = await explorer.searchMCPServers({
    minStars: 50,
    maxResults: 50,
  });

  console.log(`Found ${repos.length} repositories`);

  // Evaluate
  const evaluated = evaluator.evaluateAll(repos);

  // Display top 10
  console.log('\nTop 10 MCP Plugins:');
  evaluated.slice(0, 10).forEach(({ repo, score }, i) => {
    console.log(`\n${i + 1}. ${repo.fullName}`);
    console.log(`   Score: ${score.total}/100 (${score.grade})`);
    console.log(`   Stars: ${repo.stars}`);
    console.log(`   ${score.recommendation}`);
    console.log(`   Reasons: ${score.reasons.join(', ')}`);
  });

  // Filter recommended
  const recommended = evaluated.filter(e => e.score.total >= 75);
  console.log(`\n${recommended.length} plugins meet quality threshold`);

  return recommended;
}
```

### Example 4: Custom Search Configuration

```typescript
import { BM25Indexer } from 'awesome-plugin';

// Create indexer with custom parameters
const indexer = new BM25Indexer({
  k1: 1.5,  // Higher term frequency importance
  b: 0.5,   // Less length normalization
});

// Index tools
const tools = [
  { name: 'read_file', description: 'Read file contents', serverId: 'fs' },
  { name: 'write_file', description: 'Write to a file', serverId: 'fs' },
  { name: 'list_dir', description: 'List directory contents', serverId: 'fs' },
];

indexer.addDocuments(tools);

// Search with custom boost
const usageBoost = new Map([
  ['read_file', 1.5],  // Boost frequently used tool
]);

const results = indexer.search('read file', {
  limit: 10,
  boost: usageBoost,
});

console.log('Search results:');
results.forEach(result => {
  console.log(`${result.toolName}: ${result.score.toFixed(2)}`);
});
```

---

## Error Handling

All async methods can throw errors. Always use try-catch:

```typescript
try {
  await gateway.connectToServer(config);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Command not found:', config.command);
  } else if (error.message.includes('spawn')) {
    console.error('Failed to spawn MCP server');
  } else {
    console.error('Connection error:', error);
  }
}
```

## Best Practices

1. **Database Path**: Use persistent database for production:
   ```typescript
   const gateway = new AwesomePluginGateway({
     dbPath: './data/plugins.db', // Not ':memory:'
   });
   ```

2. **GitHub Token**: Always use token for higher rate limits:
   ```typescript
   const explorer = new GitHubExplorer({
     githubToken: process.env.GITHUB_TOKEN, // 5000 req/hr vs 60
   });
   ```

3. **Graceful Shutdown**: Always clean up resources:
   ```typescript
   process.on('SIGINT', async () => {
     await gateway.stop();
     process.exit(0);
   });
   ```

4. **Error Handling**: Handle MCP server failures:
   ```typescript
   await gateway.connectToServer({
     ...config,
     onError: (error) => {
       console.error(`Server ${config.id} error:`, error);
       // Handle reconnection logic
     },
   });
   ```

---

For more examples, see the [examples directory](examples/).

For troubleshooting, see the [Troubleshooting Guide](troubleshooting.md).
