---
slug: getting-started
title: Getting Started with Awesome Plugin
category: getting-started
difficulty: beginner
estimatedTime: 15
tags: [intro, basics, quickstart]
relatedTools: []
prerequisites: []
version: 1.0.0
excerpt: Learn how to install, configure, and start using Awesome Plugin to supercharge your MCP workflow.
---

# Getting Started with Awesome Plugin

Welcome to Awesome Plugin! This guide will help you get started with the intelligent MCP meta-plugin that provides tool discovery, memory management, agent orchestration, planning workflows, and TDD integration.

## What is Awesome Plugin?

Awesome Plugin is a Model Context Protocol (MCP) gateway that acts as a single entry point to multiple MCP servers. It provides:

- **Intelligent Tool Selection**: BM25-powered semantic search for finding the right tools
- **Memory Management**: Persistent memory system with semantic recall
- **Agent Orchestration**: 10 specialized agents for different tasks
- **Planning & TODO Tracking**: Structured planning with file-based workflows
- **TDD Integration**: Test-driven development workflow support
- **Guide System**: Interactive learning and documentation

## Installation

Install Awesome Plugin via npm:

```bash
npm install -g awesome-plugin
```

Or add it to your project:

```bash
npm install awesome-plugin
```

## Configuration

Create a configuration file to connect to MCP servers. Create `mcp-config.json`:

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Starting the Gateway

Start the Awesome Plugin gateway:

```bash
awesome-plugin --config mcp-config.json
```

The gateway will:
1. Connect to configured MCP servers
2. Load and index all available tools
3. Initialize internal features (memory, agents, planning, TDD, guides)
4. Start accepting requests via stdio

## Using with Claude Desktop

Add Awesome Plugin to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "awesome-plugin",
      "args": ["--config", "/path/to/mcp-config.json"]
    }
  }
}
```

Restart Claude Desktop, and you'll have access to all tools through the gateway.

## Key Features

### Memory System

Save and recall information across conversations:

```
Save: memory_save with key "user_preference" and value "prefers TypeScript"
Recall: memory_recall with query "programming language preference"
```

### Agent Orchestration

Delegate complex tasks to specialized agents:

```
agent_spawn with task "analyze codebase performance" and agentType "specialist_analyst"
```

Available agents: specialist_researcher, specialist_analyst, specialist_designer, specialist_coder, specialist_teacher, specialist_writer, specialist_debugger, specialist_reviewer, specialist_optimizer, specialist_strategist

### Planning Workflows

Create structured plans with TODO tracking:

```
planning_create with name "feature-auth" and goals ["implement JWT", "add tests"]
planning_update with planName "feature-auth" and task "create auth middleware"
```

### TDD Workflow

Follow test-driven development:

```
tdd_red with feature "user authentication"
tdd_green with testPath "tests/auth.test.ts" and implementation "..."
tdd_verify
```

### Guide Search

Find learning resources and documentation:

```
guide_search with query "how to use memory system"
guide_tutorial with action "start" and guideSlug "memory-system"
```

## Next Steps

Now that you have Awesome Plugin running, explore:

1. **Memory System Guide**: Learn how to use persistent memory
2. **Agent Orchestration Guide**: Understand the 10 specialized agents
3. **Planning Workflow Guide**: Structure your development process
4. **TDD Integration Guide**: Follow test-driven development

Use `guide_search` to find specific topics or tutorials.

## Troubleshooting

**Tools not appearing**: Check that MCP servers are properly configured and accessible.

**Permission errors**: Ensure file paths in configuration have proper permissions.

**Connection issues**: Verify that server commands can be executed from the terminal.

For more help, see the Troubleshooting guide or check the FAQ.
