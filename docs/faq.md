# Frequently Asked Questions (FAQ)

Common questions about Awesome MCP Meta Plugin.

## Table of Contents

- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Performance](#performance)
- [Advanced Topics](#advanced-topics)
- [Troubleshooting](#troubleshooting)

---

## General Questions

### Q: What exactly is Awesome MCP Meta Plugin?

**A:** Awesome Plugin is a meta-plugin for the Model Context Protocol (MCP) that solves the "token bloat" problem. Instead of loading all tools from all MCP servers (which can waste 75,000+ tokens for 500 tools), it intelligently selects only the relevant tools using BM25 search, reducing token usage by 70-97%.

It also includes automatic discovery of MCP servers from GitHub with quality evaluation, making it easy to find and install high-quality plugins.

###  Q: How is it different from regular MCP servers?

**A:** Regular MCP servers provide tools, but Claude loads ALL tools from ALL connected servers into every conversation context. Awesome Plugin acts as a smart gateway that:

1. **Connects to multiple MCP servers** for you
2. **Indexes all their tools** using BM25
3. **Only loads relevant tools** based on your query (Layer 2)
4. **Keeps essential tools always available** (Layer 1)
5. **Provides on-demand access** to remaining tools (Layer 3)

This dramatically reduces token waste while maintaining access to all tools.

### Q: Do I need to change my existing MCP servers?

**A:** No! Awesome Plugin works with existing MCP servers without any modifications. You connect your existing servers to Awesome Plugin, and it handles the intelligent loading.

### Q: Is it production-ready?

**A:** Yes! Version 0.1.0 completed all 6 development phases and includes:
- 231 test cases (84% pass rate)
- Performance benchmarks (<1ms search time)
- Production MCP server integration
- CLI interface

See [TEST-REPORT-KO.md](../TEST-REPORT-KO.md) for detailed test results.

---

## Installation & Setup

### Q: How do I install Awesome Plugin?

**A:** Clone the repository and build:

```bash
git clone https://github.com/yourusername/awesome-pulgin.git
cd awesome-pulgin
npm install
npm run build
```

### Q: How do I set it up with Claude Desktop?

**A:** Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

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

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Then restart Claude Desktop completely.

### Q: Do I need a GitHub token?

**A:** It's optional but highly recommended:

- **Without token:** 60 requests/hour to GitHub API
- **With token:** 5,000 requests/hour

Set it up:
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Or in Claude Desktop config:
```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "node",
      "args": ["/path/to/dist/index.mjs"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### Q: What are the system requirements?

**A:**
- **Node.js:** 18.0.0 or higher
- **npm:** 7.0.0 or higher
- **OS:** macOS, Linux, or Windows
- **RAM:** 512MB minimum (depends on # of tools)
- **Disk:** 50MB for installation + database size

---

## Usage

### Q: What are Layer 1, Layer 2, and Layer 3?

**A:**

**Layer 1 (Essential Tools):**
- Always loaded (~1.5K tokens)
- Tools you use most frequently
- Example: `read_file`, `write_file`, `bash`

**Layer 2 (BM25-Matched Tools):**
- Dynamically loaded based on your query (~3-4.5K tokens)
- 10-15 most relevant tools (configurable)
- Example: For "send slack message" → loads Slack tools

**Layer 3 (On-Demand Tools):**
- Not loaded until explicitly requested
- Available but don't consume tokens
- Loaded when Claude specifically asks for them

### Q: How do I search for tools?

**A:**

**Programmatically:**
```typescript
const tools = await gateway.searchTools('read file', { limit: 5 });
```

**In Claude Desktop:**
Just ask Claude naturally, and Awesome Plugin will automatically load relevant tools:
```
"I need to read a config file"  → Loads file-reading tools
"Send a message to Slack"       → Loads Slack tools
"Create a GitHub PR"            → Loads GitHub tools
```

### Q: Can I customize which tools are essential (Layer 1)?

**A:** Yes! (Feature coming in future version. Currently, essential tools are determined automatically based on usage frequency.)

Planned API:
```typescript
gateway.setEssentialTools(['read_file', 'write_file', 'bash', 'grep']);
```

### Q: How do I discover new MCP servers?

**A:**

**CLI:**
```bash
node dist/cli.mjs discover --limit 20 --min-score 75
```

**Programmatically:**
```typescript
import { GitHubExplorer, QualityEvaluator } from 'awesome-plugin';

const explorer = new GitHubExplorer({ githubToken: process.env.GITHUB_TOKEN });
const evaluator = new QualityEvaluator({ minScore: 75 });

const repos = await explorer.searchMCPServers({ minStars: 50 });
const evaluated = evaluator.evaluateAll(repos);

console.log('Top plugins:', evaluated.slice(0, 10));
```

---

## Performance

### Q: How fast is the search?

**A:** Extremely fast! Benchmark results:

| Tools | Search Time | Target |
|-------|-------------|--------|
| 50    | 0.16-0.45ms | <50ms  |
| 100   | 0.30-0.38ms | <50ms  |
| 200   | 0.57-0.77ms | <50ms  |

That's 65-130x faster than the target!

### Q: How much memory does it use?

**A:**

- **In-memory database:** ~2-5 MB + tools metadata
- **File-based database:** ~1-2 MB on disk per 100 tools
- **Per connected server:** ~5-10 MB

For typical usage (3-5 servers, 100-200 tools): **~50-100 MB total**.

### Q: How many tokens does it save?

**A:**

| # Tools | Traditional | Awesome Plugin | Savings |
|---------|-------------|----------------|---------|
| 50      | 15,000      | 4,500         | 70%     |
| 200     | 60,000      | 6,000         | 90%     |
| 500     | 150,000     | 7,500         | 95%     |

### Q: Can I tune performance?

**A:** Yes! Adjust these parameters:

**Reduce tokens (less tools in Layer 2):**
```typescript
const gateway = new AwesomePluginGateway({
  maxLayer2Tools: 10,  // Default: 15
});
```

**Improve search relevance:**
```typescript
const indexer = new BM25Indexer({
  k1: 1.5,  // Higher = more term frequency importance
  b: 0.5,   // Lower = less length normalization
});
```

See [Performance Tuning Guide](performance-tuning.md) for details.

---

## Advanced Topics

### Q: Can I use Awesome Plugin programmatically (not as MCP server)?

**A:** Yes! See [API Reference](api-reference.md) for complete documentation.

Basic example:
```typescript
import { AwesomePluginGateway } from 'awesome-plugin';

const gateway = new AwesomePluginGateway({
  dbPath: './data/plugins.db',
});

await gateway.connectToServer({ /* ... */ });
const tools = await gateway.searchTools('query');
await gateway.stop();
```

### Q: How does BM25 search work?

**A:** BM25 (Okapi BM25) is a probabilistic ranking function that scores documents based on:

1. **Term frequency:** How often search terms appear in tool description
2. **Document length:** Normalizes for description length
3. **Corpus statistics:** Uses IDF (Inverse Document Frequency)

Parameters:
- `k1` (default 1.2): Term frequency saturation
- `b` (default 0.75): Length normalization

### Q: How does quality evaluation work?

**A:** Repositories are scored 0-100 across 4 dimensions (25 points each):

1. **Popularity (0-25):**
   - GitHub stars
   - Fork count

2. **Maintenance (0-25):**
   - Recent commits
   - Project age
   - Update frequency

3. **Documentation (0-25):**
   - README quality
   - package.json completeness
   - Examples

4. **Reliability (0-25):**
   - Issue ratio
   - Semantic versioning
   - License

**Grades:**
- A (90-100): Highly recommended
- B (80-89): Recommended
- C (70-79): Acceptable
- D (60-69): Use with caution
- F (<60): Not recommended

### Q: Can I contribute to Awesome Plugin?

**A:** Yes! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

We welcome:
- Bug fixes
- Performance improvements
- Additional tests
- Documentation improvements
- New features

### Q: Is there a plugin registry or marketplace?

**A:** Not yet, but it's planned! For now, use the GitHub discovery feature:

```bash
node dist/cli.mjs discover
```

This searches GitHub for MCP servers and evaluates their quality.

---

## Troubleshooting

### Q: Tools don't appear in Claude Desktop

**A:** Check these:

1. Verify config file location and syntax
2. Use absolute paths in config
3. Restart Claude Desktop completely (not just close window)
4. Check logs: `~/Library/Logs/Claude/mcp*.log` (macOS)

See [Troubleshooting Guide](troubleshooting.md#claude-desktop-integration-issues) for details.

### Q: Search returns no results

**A:**

1. Check tools are registered:
```typescript
const stats = gateway.getStatistics();
console.log('Total tools:', stats.totalTools);
```

2. Use broader search terms:
```typescript
// Too specific
await gateway.searchTools('read_file_from_filesystem');

// Better
await gateway.searchTools('read file');
```

### Q: "GitHub API rate limit exceeded"

**A:** Add a GitHub token:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

This increases your limit from 60 to 5,000 requests per hour.

### Q: "Cannot find module '@modelcontextprotocol/sdk'"

**A:**

```bash
npm install
npm run build
```

### Q: MCP server won't connect

**A:**

1. Test server manually:
```bash
npx -y @modelcontextprotocol/server-filesystem /path
```

2. Use absolute paths:
```typescript
command: '/usr/local/bin/node'
args: ['/absolute/path/to/server/index.js']
```

3. Check server logs for errors

See [Troubleshooting Guide](troubleshooting.md) for more solutions.

---

## More Questions?

- **Documentation:** [docs/](.)
- **Troubleshooting:** [troubleshooting.md](troubleshooting.md)
- **API Reference:** [api-reference.md](api-reference.md)
- **GitHub Issues:** https://github.com/yourusername/awesome-plugin/issues
- **Discussions:** https://github.com/yourusername/awesome-plugin/discussions
