---
slug: getting-started
title: Getting Started with FLUX
category: guide
difficulty: beginner
estimatedTime: 20
tags: [installation, setup, onboarding, memory]
relatedGuides: [memory-guide, agents-guide, planning-guide]
version: 2.0.0
excerpt: Install FLUX, configure it for your system, and take your first steps using the Memory system.
---

Welcome to FLUX! This guide will help you install, configure, and take your first steps with the FLUX plugin system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Basic Configuration](#basic-configuration)
4. [First Steps: Using Memory](#first-steps-using-memory)
5. [Next Steps](#next-steps)

## Prerequisites

Before installing FLUX, make sure you have:

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher (installed with Node.js)
- **Claude Code** - The official Claude IDE (latest version)
- **macOS, Linux, or Windows** with a supported shell (bash, zsh, or PowerShell)

To verify your Node.js version:

```bash
node --version
npm --version
```

Both commands should return version numbers without errors.

## Installation

### Step 1: Install FLUX Globally

Open your terminal and run:

```bash
npm install -g flux
```

This installs the FLUX CLI tool globally, making it available from any directory.

### Step 2: Verify Installation

Check that FLUX installed correctly:

```bash
flux --version
flux list
```

You should see the FLUX version and a list of available skills.

### Step 3: Install Skills to Claude Code

FLUX skills are added to your Claude Code environment with a single command:

```bash
flux install-skills
```

This command:
- Locates your Claude Code configuration directory
- Creates the `~/.cclaude-code/skills` directory if needed
- Copies 7 skill files to Claude Code
- Registers the skills with Claude Code's plugin system

After running this command, restart Claude Code. The skills will load automatically when you mention relevant keywords.

### Step 4: Verify Skills Installation

Inside Claude Code, ask:

```
Show me the installed FLUX skills
```

Claude should respond with a list of 7 available skills:
- awesome-memory
- awesome-agents
- awesome-planning
- awesome-tdd
- awesome-guide
- awesome-science
- awesome-specialists

## Basic Configuration

### Default Configuration

FLUX works out of the box with sensible defaults. No configuration is required to get started.

The default settings are:
- **Database Location**: `~/.flux/flux.db` (automatically created)
- **Debug Mode**: Disabled (set `FLUX_DEBUG=true` to enable)
- **Tool Search**: Enabled (BM25-powered semantic search)
- **Max Layer 2 Tools**: 15 (dynamic tools loaded per query)

### Custom Database Location

If you want to store FLUX data in a custom location, set the environment variable:

```bash
export FLUX_DB_PATH=/path/to/your/flux.db
```

Add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make it permanent:

```bash
# ~/.zshrc or ~/.bashrc
export FLUX_DB_PATH=$HOME/my-projects/flux-data/flux.db
```

### Enable Debug Logging

For troubleshooting, enable detailed logging:

```bash
export FLUX_DEBUG=true
```

Then run flux commands to see detailed output:

```bash
flux stats
flux verify
```

This shows what's happening under the hood, useful for debugging issues.

### View Configuration

Check your current FLUX configuration:

```bash
flux stats
```

Output includes:
- Installation path
- Database location
- Number of stored memories
- Agent statistics
- Task counts
- TDD run history

## First Steps: Using Memory

Let's create your first FLUX memory. The Memory skill is the perfect starting point because it's intuitive and immediately useful.

### What is Memory?

Memory lets you save important information and recall it later. It uses semantic search (BM25) to find relevant memories from your notes.

Think of it as:
- A searchable personal knowledge base
- Context that persists across Claude Code sessions
- Smart reminders for important project details

### Save Your First Memory

Inside Claude Code, type:

```
Remember that our main API endpoint is https://api.example.com
```

Claude will:
1. Recognize the "remember" keyword
2. Load the Memory skill
3. Save this information to your local SQLite database
4. Assign tags automatically (api, endpoint, example.com)

You'll get a response confirming the memory was saved.

### Recall a Memory

Now try retrieving it:

```
Recall information about our API endpoint
```

Claude will:
1. Search your memories using the query
2. Find the API endpoint memory you just saved
3. Display the most relevant memories
4. Show match scores (how relevant each result is)

### Example Workflow

Here's a realistic workflow for a typical day:

**Morning - Save Project Context:**
```
Remember that we're using React 18, TypeScript 5.0, and Node 20 LTS
```

**Mid-morning - Save a Decision:**
```
Remember that we decided to use Tailwind CSS for styling instead of Material-UI
```

**Afternoon - Recall Context:**
```
What tech stack are we using?
```

Claude searches and returns:
- React 18, TypeScript 5.0, Node 20 LTS
- Tailwind CSS decision

**Before End of Day - Save Issues Found:**
```
Remember that we found a memory leak in the user service when processing large datasets
```

**Next Day - Recall the Issue:**
```
Tell me about any performance issues we discovered
```

Claude retrieves the memory and you can continue fixing from where you left off.

### Memory Best Practices

1. **Be Specific**: Save facts, not vague notes
   - Good: "We use PostgreSQL 15 with pg_vector extension for AI features"
   - Avoid: "database stuff"

2. **Use Natural Language**: Write like you're talking to a colleague
   - Good: "Remember that the authentication system uses JWT tokens with 24-hour expiration"
   - Avoid: "auth sys jwt 24h"

3. **Save Decisions, Not Results**: Focus on *why* not just *what*
   - Good: "Remember we chose GraphQL because REST was causing N+1 query problems"
   - Avoid: "We use GraphQL"

4. **Tag Important Information**: The system auto-tags, but you can mention context
   - "Remember that the /api/users endpoint has rate limiting of 100 requests per minute"
   - This saves context about rate limits, which helps with future searches

5. **Organize by Project**: If you work on multiple projects, mention the project name
   - "Remember that in the E-commerce Platform, we use Redis for session storage"
   - This helps when searching later across different projects

### Common Memory Commands

After you're comfortable with basic save and recall, try these:

**List all memories:**
```
Show all my saved memories
```

**Search for specific memories:**
```
Find everything related to authentication
```

**Forget a memory:**
```
Forget the API endpoint memory
```

**Get memory statistics:**
```
How many memories do I have? When was the last one added?
```

## Next Steps

Now that you've set up FLUX and used Memory, here are natural next steps:

### 1. Explore Agent Orchestration

Agents let you spawn background workers to handle tasks in parallel:

- Spawn an agent to analyze your codebase while you work on implementation
- Have multiple agents work on different components simultaneously
- Monitor agent progress and collect results

Start with:
```
Spawn an agent to analyze our codebase architecture
```

See [Agent Orchestration Guide](#) for detailed documentation.

### 2. Learn Planning & TODO

Create hierarchical task structures with dependencies:

- Break down features into subtasks
- Track dependencies between tasks
- Visualize your project structure
- Monitor progress

Try:
```
Create a TODO tree for implementing user authentication with database setup and API implementation as subtasks
```

See [Planning Guide](#) for detailed documentation.

### 3. Practice TDD Workflow

Follow the RED-GREEN-REFACTOR cycle:

- Write failing tests first
- Make them pass with minimal code
- Refactor while keeping tests green
- Maintain test coverage

Start with:
```
Begin TDD for the UserService class: first write a failing test for email validation
```

See [TDD Guide](#) for detailed documentation.

### 4. Study Real-World Scenarios

Learn how FLUX skills work together in practical situations:

- [Full-Stack Development Scenario](scenarios/full-stack-dev.md) - Build a complete app using all FLUX features
- [API Development](scenarios/api-development.md) - Design and implement REST APIs
- [Performance Optimization](scenarios/performance-optimization.md) - Profile and optimize your code

### 5. Troubleshoot and Optimize

When you run into issues or want to improve performance:

- Check [Troubleshooting Guide](troubleshooting.md) for common problems and solutions
- Review [FLUX Statistics](getting-started.md#view-configuration) to understand usage patterns
- Adjust configuration for your workflow

### 6. Advanced Configuration

Once comfortable, explore:

- Custom memory recall strategies (keyword weighting, date ranges)
- Agent customization (agent types, timeouts, resource limits)
- TDD integration with CI/CD pipelines
- Scientific computing for data analysis

## Key Concepts

### On-Demand Loading

FLUX loads skills only when needed:

1. You type: "Remember that we use React"
2. FLUX detects the "remember" keyword
3. Memory skill (~270 tokens) loads automatically
4. Command executes
5. Skill unloads when done

This reduces token usage by 93% compared to loading all skills at once.

### SQLite Persistence

All FLUX data persists in your local SQLite database:

- Memories stay between sessions
- Agent results are archived
- Task history is maintained
- TDD test runs are recorded

Your data never leaves your computer. Everything is local.

### BM25 Search

Memories use BM25 (Best Match 25) semantic search:

- Fast relevance ranking
- Handles typos gracefully
- Context-aware matching
- Sub-millisecond search times

This means memories you saved months ago are still findable naturally.

## What's Next?

You're now ready to:
1. Save important project context with Memory
2. Explore other skills as needed
3. Integrate FLUX into your development workflow
4. Automate repetitive tasks with Agents

For a complete walkthrough of a real-world project, see [Full-Stack Development Scenario](scenarios/full-stack-dev.md).

## Getting Help

If you encounter issues:

1. **Check Status**: Run `flux verify` to check your installation
2. **Review Logs**: Enable `FLUX_DEBUG=true` for detailed output
3. **Consult Troubleshooting**: See [Troubleshooting Guide](troubleshooting.md) for common issues
4. **Check Version**: Ensure you have the latest FLUX with `npm install -g flux@latest`

## Uninstalling FLUX

If you need to remove FLUX:

```bash
# Remove skills from Claude Code
flux uninstall-skills

# Remove global npm package
npm uninstall -g flux

# Optional: Remove local database
rm ~/.flux/flux.db
```

---

You're all set! Start by saving a memory about your current project, and explore the rest of FLUX as you need it.
