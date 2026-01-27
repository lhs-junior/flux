# Troubleshooting Guide

Common issues and solutions for Awesome MCP Meta Plugin.

## Table of Contents

- [Installation Issues](#installation-issues)
- [MCP Server Connection Issues](#mcp-server-connection-issues)
- [Search Issues](#search-issues)
- [GitHub Discovery Issues](#github-discovery-issues)
- [CLI Issues](#cli-issues)
- [Performance Issues](#performance-issues)
- [Claude Desktop Integration Issues](#claude-desktop-integration-issues)
- [Database Issues](#database-issues)
- [Debug Mode](#debug-mode)
- [Getting Help](#getting-help)

---

## Installation Issues

### Error: Cannot find module '@modelcontextprotocol/sdk'

**Cause:** Dependencies not installed.

**Solution:**
```bash
npm install
npm run build
```

If the issue persists:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: TypeScript compilation fails

**Cause:** Incompatible TypeScript version or configuration issues.

**Solution:**
```bash
# Install correct TypeScript version
npm install typescript@^5.7 --save-dev

# Run type check
npm run typecheck

# If errors persist, clean and rebuild
rm -rf dist
npm run build
```

### Error: better-sqlite3 installation fails

**Cause:** Missing build tools for native modules.

**Solution:**

**macOS:**
```bash
xcode-select --install
npm install better-sqlite3 --build-from-source
```

**Linux:**
```bash
sudo apt-get install build-essential python3
npm install better-sqlite3 --build-from-source
```

**Windows:**
```bash
npm install --global windows-build-tools
npm install better-sqlite3 --build-from-source
```

---

## MCP Server Connection Issues

### Error: "Tool not found: read_file"

**Cause:** MCP server not connected or tools not registered.

**Solution:**

1. Check server connection:
```typescript
const stats = gateway.getStatistics();
console.log('Connected servers:', stats.connectedServers);
console.log('Total tools:', stats.totalTools);
```

2. Verify server command:
```bash
# Test server manually
npx -y @modelcontextprotocol/server-filesystem /path/to/directory
```

3. Check server logs for errors

### Error: "MCP server not connected: filesystem"

**Cause:** Server failed to start or crashed.

**Solution:**

1. **Verify command and arguments:**
```typescript
await gateway.connectToServer({
  id: 'filesystem',
  name: 'Filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});
```

2. **Use absolute paths:**
```typescript
await gateway.connectToServer({
  id: 'filesystem',
  name: 'Filesystem',
  command: '/usr/local/bin/node',
  args: ['/absolute/path/to/server/index.js', '/absolute/path/to/directory'],
});
```

3. **Check server output:**
```typescript
await gateway.connectToServer({
  ...config,
  onError: (error) => {
    console.error('Server error:', error);
  },
});
```

### Error: ENOENT when starting MCP server

**Cause:** Command not found in PATH.

**Solution:**

1. **Use full path to command:**
```typescript
await gateway.connectToServer({
  command: '/usr/local/bin/npx',  // Full path
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});
```

2. **Or use node directly:**
```typescript
await gateway.connectToServer({
  command: 'node',
  args: ['/path/to/server/dist/index.js', process.cwd()],
});
```

3. **Check PATH:**
```bash
which npx
echo $PATH
```

### Server disconnects randomly

**Cause:** Server crashes or timeout issues.

**Solution:**

1. **Increase timeout:**
```typescript
const client = new MCPClient({
  ...config,
  maxRetries: 5,
  retryDelay: 2000,
});
```

2. **Monitor server health:**
```typescript
setInterval(() => {
  const stats = gateway.getStatistics();
  if (stats.connectedServers === 0) {
    console.warn('No servers connected! Reconnecting...');
    // Reconnection logic
  }
}, 10000);
```

---

## Search Issues

### Search returns no results

**Cause:** Tools not indexed or query mismatch.

**Solution:**

1. **Verify tools are registered:**
```typescript
const stats = gateway.getStatistics();
console.log('Total tools:', stats.totalTools);

// List all tools
const allTools = await gateway.searchTools('', { limit: 1000 });
console.log('Available tools:', allTools.map(t => t.name));
```

2. **Try broader search terms:**
```typescript
// Too specific
const tools1 = await gateway.searchTools('read_file_from_filesystem');

// Better
const tools2 = await gateway.searchTools('read file');

// Even better
const tools3 = await gateway.searchTools('file');
```

3. **Check tool descriptions:**
```typescript
const tools = await gateway.searchTools('', { limit: 100 });
tools.forEach(tool => {
  console.log(`${tool.name}: ${tool.description}`);
});
```

### Search is slow (>1ms)

**Cause:** Too many tools or inefficient query.

**Solution:**

1. **Reduce maxLayer2Tools:**
```typescript
const gateway = new AwesomePluginGateway({
  maxLayer2Tools: 10,  // Reduce from 15
});
```

2. **Use more specific queries:**
```typescript
// Vague (slow)
await gateway.searchTools('data');

// Specific (fast)
await gateway.searchTools('read file data');
```

3. **Check index statistics:**
```typescript
const indexer = new BM25Indexer();
// ... add documents ...
const stats = indexer.getStatistics();
console.log('Index stats:', stats);
```

### Search results not relevant

**Cause:** BM25 parameters not tuned for your use case.

**Solution:**

Adjust BM25 parameters:
```typescript
const indexer = new BM25Indexer({
  k1: 1.5,  // Higher = more weight to term frequency (default: 1.2)
  b: 0.5,   // Lower = less length normalization (default: 0.75)
});
```

See [Performance Tuning Guide](performance-tuning.md) for details.

---

## GitHub Discovery Issues

### Error: GitHub API rate limit exceeded

**Cause:** Too many requests without authentication.

**Solution:**

1. **Use GitHub token (5000 req/hour vs 60 req/hour):**
```bash
# Set environment variable
export GITHUB_TOKEN=ghp_your_token_here
```

Or pass directly:
```typescript
const explorer = new GitHubExplorer({
  githubToken: 'ghp_your_token_here',
});
```

2. **Check remaining quota:**
```typescript
const rateLimit = await explorer.getRateLimitInfo();
console.log(`${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
console.log(`Resets at: ${rateLimit.reset.toLocaleString()}`);
```

3. **Enable caching:**
```typescript
const explorer = new GitHubExplorer({
  githubToken: process.env.GITHUB_TOKEN,
  enableCache: true,
  cacheExpiry: 3600000, // 1 hour
});
```

### No repositories found

**Cause:** Search criteria too strict.

**Solution:**

1. **Lower minStars:**
```typescript
const repos = await explorer.searchMCPServers({
  minStars: 5,  // Lower from default 10
  maxResults: 100,
});
```

2. **Broaden search topics:**
```typescript
const repos = await explorer.searchMCPServers({
  topics: ['mcp', 'mcp-server', 'model-context-protocol', 'claude'],
});
```

3. **Try different languages:**
```typescript
const repos = await explorer.searchMCPServers({
  language: undefined,  // Search all languages
});
```

### Repository information incomplete

**Cause:** Repository missing package.json or README.

**Solution:**

This is expected for some repositories. Filter by quality score:
```typescript
const evaluator = new QualityEvaluator({ minScore: 70 });
const repos = await explorer.searchMCPServers();
const recommended = evaluator.filterRecommended(repos);
```

---

## CLI Issues

### Error: "command not found: awesome-plugin"

**Cause:** CLI not installed globally or not in PATH.

**Solution:**

1. **Use local build:**
```bash
node dist/cli.mjs discover
```

2. **Or install globally:**
```bash
npm install -g .
awesome-plugin discover
```

3. **Or use npm scripts:**
```bash
npm run cli -- discover
```

### CLI hangs during discovery

**Cause:** Network timeout or API issues.

**Solution:**

1. **Check internet connection**

2. **Verify GitHub token:**
```bash
echo $GITHUB_TOKEN
```

3. **Reduce search scope:**
```bash
node dist/cli.mjs discover --limit 10 --min-score 80
```

4. **Add timeout:**
```bash
timeout 60s node dist/cli.mjs discover
```

### CLI output not displaying colors

**Cause:** Terminal doesn't support ANSI colors.

**Solution:**

```bash
# Force color output
FORCE_COLOR=1 node dist/cli.mjs discover

# Or disable colors
NO_COLOR=1 node dist/cli.mjs discover
```

---

## Performance Issues

### High memory usage

**Cause:** Too many tools loaded or large database.

**Solution:**

1. **Use in-memory database for temporary usage:**
```typescript
const gateway = new AwesomePluginGateway({
  dbPath: ':memory:',  // No persistence
});
```

2. **Reduce connected servers:**
```typescript
// Only connect to needed servers
await gateway.connectToServer(filesystemConfig);
// Don't connect to unused servers
```

3. **Monitor memory:**
```typescript
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`Memory: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
}, 5000);
```

### Slow startup time

**Cause:** Multiple MCP servers starting simultaneously.

**Solution:**

Connect servers sequentially:
```typescript
// Sequential (slower but more stable)
for (const config of serverConfigs) {
  await gateway.connectToServer(config);
}

// Parallel (faster but may have race conditions)
await Promise.all(
  serverConfigs.map(config => gateway.connectToServer(config))
);
```

### High CPU usage

**Cause:** Frequent searches or inefficient indexing.

**Solution:**

1. **Cache search results:**
```typescript
const searchCache = new Map();

async function cachedSearch(query) {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }
  const results = await gateway.searchTools(query);
  searchCache.set(query, results);
  return results;
}
```

2. **Debounce searches:**
```typescript
let searchTimeout;
function debouncedSearch(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    gateway.searchTools(query);
  }, 300);
}
```

---

## Claude Desktop Integration Issues

### Tools don't appear in Claude

**Cause:** Configuration error or server not started.

**Solution:**

1. **Verify config location:**
```bash
# macOS
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json

# Linux
cat ~/.config/Claude/claude_desktop_config.json
```

2. **Check config syntax (must be valid JSON):**
```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "node",
      "args": ["/absolute/path/to/awesome-pulgin/dist/index.mjs"]
    }
  }
}
```

3. **Restart Claude Desktop completely** (not just close window)

4. **Check logs:**
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows
type %APPDATA%\Claude\logs\mcp*.log

# Linux
tail -f ~/.config/Claude/logs/mcp*.log
```

### Error in Claude Desktop logs: "spawn ENOENT"

**Cause:** Invalid command path.

**Solution:**

Use absolute paths:
```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "/usr/local/bin/node",
      "args": ["/Users/you/awesome-pulgin/dist/index.mjs"]
    }
  }
}
```

Find correct paths:
```bash
which node   # Get node path
pwd         # Get current directory path
```

### Tools work but searches are slow in Claude

**Cause:** Too many tools being loaded.

**Solution:**

Reduce Layer 2 tools in config:
```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "node",
      "args": ["/path/to/dist/index.mjs"],
      "env": {
        "MAX_LAYER2_TOOLS": "10"
      }
    }
  }
}
```

---

## Database Issues

### Error: "database is locked"

**Cause:** Multiple processes accessing same database.

**Solution:**

1. **Use different database per process:**
```typescript
const gateway1 = new AwesomePluginGateway({
  dbPath: './data/gateway1.db',
});

const gateway2 = new AwesomePluginGateway({
  dbPath: './data/gateway2.db',
});
```

2. **Or use in-memory mode for testing:**
```typescript
const gateway = new AwesomePluginGateway({
  dbPath: ':memory:',
});
```

3. **Close database connections:**
```typescript
await gateway.stop();  // Closes database
```

### Error: "unable to open database file"

**Cause:** Invalid path or permissions.

**Solution:**

1. **Create directory first:**
```bash
mkdir -p ./data
```

2. **Use absolute path:**
```typescript
import path from 'path';

const gateway = new AwesomePluginGateway({
  dbPath: path.join(process.cwd(), 'data', 'plugins.db'),
});
```

3. **Check permissions:**
```bash
ls -la ./data
chmod 755 ./data
```

### Database file grows too large

**Cause:** Many usage logs accumulating.

**Solution:**

```typescript
// Periodically clean old logs (implement this in your code)
await metadataStore.cleanOldLogs(30);  // Keep 30 days

// Or use in-memory database
const gateway = new AwesomePluginGateway({
  dbPath: ':memory:',
});
```

---

## Debug Mode

Enable debug logging to diagnose issues:

### Method 1: Environment Variable

```bash
export DEBUG=awesome-plugin:*
node your-script.js
```

### Method 2: Code

```typescript
// Enable verbose logging
process.env.DEBUG = 'awesome-plugin:*';
```

### Method 3: Development Mode

```bash
export NODE_ENV=development
node your-script.js
```

### Reading Debug Output

```bash
# Save to file
DEBUG=awesome-plugin:* node your-script.js 2>&1 | tee debug.log

# Filter specific component
DEBUG=awesome-plugin:gateway node your-script.js
```

---

## Getting Help

### Before Asking for Help

1. Search [existing issues](https://github.com/yourusername/awesome-plugin/issues)
2. Check [FAQ](faq.md)
3. Enable [Debug Mode](#debug-mode) and capture logs

### Creating an Issue

Include:

1. **Environment:**
   ```bash
   node --version
   npm --version
   uname -a  # or `ver` on Windows
   ```

2. **Full error message and stack trace**

3. **Minimal reproduction:**
   ```typescript
   // Minimal code that reproduces the issue
   ```

4. **Configuration files** (sanitized, no tokens)

5. **Debug logs** (with `DEBUG=awesome-plugin:*`)

### Community Support

- **GitHub Issues**: https://github.com/yourusername/awesome-plugin/issues
- **Discussions**: https://github.com/yourusername/awesome-plugin/discussions
- **Documentation**: https://github.com/yourusername/awesome-plugin/tree/main/docs

---

## Common Error Messages Reference

| Error Message | Cause | Solution |
|---------------|-------|----------|
| Cannot find module | Missing dependencies | `npm install` |
| spawn ENOENT | Command not found | Use absolute path |
| database is locked | Multiple processes | Use separate databases |
| API rate limit | Too many GitHub requests | Add GITHUB_TOKEN |
| Tool not found | Server not connected | Check `getStatistics()` |
| TypeScript errors | Version mismatch | `npm install typescript@^5.7` |
| Connection refused | Server not running | Verify server command |

---

**Still having issues?** Open an issue on [GitHub](https://github.com/yourusername/awesome-plugin/issues) with debug logs and system information.
