---
slug: memory-guide
title: Memory System - Complete User Guide
category: feature
difficulty: beginner
estimatedTime: 15
tags: [memory, persistence, save, recall, forget]
relatedGuides: [agents-guide, planning-guide]
version: 2.0.0
excerpt: Master the Memory system to save, recall, and organize information across your development sessions.
---

# Memory System User Guide

The Memory system lets you save and retrieve information that persists across all your conversations. Think of it as your personal notebook that understands context and helps you find what you need instantly.

## What is Memory?

Memory is FLUX's persistent information storage with intelligent search. Instead of repeating the same information over and over, save it once and recall it whenever you need it.

**Key benefits:**
- Save context about your project, team, and preferences
- Search with natural language (not exact keywords)
- Organize information with tags and categories
- Access memories across all future sessions

## Main Operations

### Save Information

Store important information you want to remember:

```
Tell me: "Remember that our project uses Node.js 18 with TypeScript and SQLite"
Or: "Save the API base URL is https://api.example.com with tag 'config'"
```

**What to save:**
- Project tech stack and architecture decisions
- Team preferences and coding standards
- External service URLs and credentials
- Important project context
- Business requirements and constraints

### Recall Information

Find saved information with natural language queries:

```
Ask: "What technologies are we using?"
Or: "Recall everything about authentication"
Or: "What's our API endpoint?"
```

Memory uses smart search to find relevant information even if you don't use exact keywords. Search for "what's our database" and it will find "PostgreSQL 15".

### List All Memories

View everything you've saved:

```
Request: "Show me all my memories"
Or: "List memories about configuration"
Or: "What have I saved with the 'api' tag?"
```

### Delete Information

Remove memories you no longer need:

```
Tell me: "Forget the old API endpoint"
Or: "Delete the temporary note I saved"
```

## Key Use Cases

### 1. Storing Project Context

Save information that shapes how you work on the project:

```
"Remember: We're building a real-time chat application with WebSockets,
using React on frontend and Node.js on backend. PostgreSQL is our database.
Target launch is February 2024."
```

Later, recall with: "What's our tech stack?" or "When do we launch?"

### 2. Recording Team Standards

Save coding practices and preferences:

```
"Remember: Code style - Functional programming preferred,
use TypeScript strict mode, aim for 80% test coverage,
use ESLint with airbnb-typescript config"
```

Share these with agents when delegating work so they follow your standards.

### 3. Keeping External Service Details

Store API keys, endpoints, and credentials:

```
"Remember: Stripe API endpoint https://api.stripe.com/v1,
webhook URL https://app.example.com/webhooks/stripe,
live key starts with sk_live_"
```

Recall when you need to integrate with external services.

### 4. Tracking Important Decisions

Document why you made technical choices:

```
"Remember: We chose SQLite over PostgreSQL because
this is a desktop app that needs to work offline.
SQLite's simplicity and portability are perfect for this constraint."
```

This helps future developers understand your reasoning.

### 5. Managing Project Goals

Save objectives to keep work focused:

```
"Remember: Q1 Goals - 30% performance improvement,
upgrade to React 19, implement dark mode.
Priority: performance > React > dark mode"
```

Recall these when planning sprints or making decisions about features.

## Example Workflow

### Session 1: Setup and Save Context

```
You: "Remember: We're building an e-commerce API using Express,
PostgreSQL, and Redis for caching. We need 95% uptime SLA and
support 10k concurrent users."

FLUX: Saved context about your project
```

### Session 2: Quick Recall

```
You: "What database are we using and what's our uptime target?"

FLUX: From memory:
- Database: PostgreSQL
- Target: 95% uptime SLA, 10k concurrent users support
```

### Session 3: Share with Agents

```
You: "Remember to recall our project context and database setup
when optimizing the API performance"

FLUX: Recalls your saved context automatically when working on optimization
```

## Best Practices

### Organization

**Use clear, descriptive keys:**
- Good: "project_tech_stack", "team_coding_standards", "api_config"
- Bad: "stuff", "data1", "temp"

**Add tags for easy filtering:**
- Technical details: "tech-stack", "architecture", "database"
- Configuration: "config", "api", "external-services"
- Team info: "standards", "preferences", "process"
- Project info: "goals", "timeline", "requirements"

**Organize by category:**
- `technical`: Code, architecture, implementation
- `configuration`: Settings, URLs, credentials
- `context`: Project background and goals
- `standards`: Team practices and preferences

### Search Effectively

**Natural language works best:**
- Good: "What's our authentication strategy?"
- Also good: "How do we handle user login?"
- Works but less clear: "authentication", "login"

**Be specific for better results:**
- Instead of: "Tell me about the project"
- Try: "What are our main technical challenges?"

### Maintain Your Memory

**Keep information current:**
- Update old credentials when they change
- Remove outdated information
- Consolidate duplicate memories

**Be consistent with tags:**
- Use the same tag for related items
- Create a tag scheme for your project
- Share tag naming with your team

## Integration Tips

### With Agents

Save standards, then use them with agents:

```
Save: "Team standards - functional programming, immutable data,
pure functions when possible"

Later use: "Delegate code optimization to specialist_optimizer,
make sure it follows our functional programming standards"

Agent will reference your saved standards automatically
```

### With Planning

Store goals that guide your TODOs:

```
Save: "Q1 Goals: Fix critical bugs, add 2FA, improve docs"

When planning: Create TODOs aligned with these saved goals
```

### With TDD

Remember testing requirements:

```
Save: "Testing standards - 80% coverage minimum,
test happy path AND edge cases, use vitest"

When writing tests: Recall these standards to maintain consistency
```

## Common Patterns

### API Integration Pattern

```
Save these separately:
1. "API Config: Base URL https://api.example.com"
2. "API Auth: Bearer token format with 1-hour expiry"
3. "API Errors: 400 validation, 401 auth, 500 server error"

Later recall just what you need with specific queries
```

### Feature Requirements Pattern

```
For each feature, save:
1. "Feature: User authentication - requirements and scope"
2. "Feature: User authentication - database schema design"
3. "Feature: User authentication - API endpoints spec"
4. "Feature: User authentication - security considerations"

Easy to recall all details about one feature
```

### Decision Log Pattern

```
Save each important decision as:
"Decision: [Topic] - Why [reasoning] - When [date] - Impact [consequences]"

Example: "Decision: Chose PostgreSQL because we need ACID transactions
for financial data. Decision made Jan 2024. Impacts: Can't use Firebase,
must manage DB ourselves"
```

## Tips & Tricks

### Quick Recall During Work

If you're mid-conversation and need context:
```
"Quickly remind me about our database schema"
```

Memory searches fast and returns exactly what you need.

### Sharing Context with New Sessions

When starting a new project session:
```
"Load my project context from memory"
```

This helps Claude understand what you've been working on.

### Combining Searches

Ask about multiple related items:
```
"What's our tech stack, deployment target, and performance goals?"
```

Memory returns all matching information.

### Organizing by Project

If working on multiple projects:
```
Save with project prefix:
- "ProjectA: Tech stack - TypeScript, React, Node"
- "ProjectB: Tech stack - Python, Django, PostgreSQL"

Recall with: "Show me ProjectA memories" or "ProjectB tech stack?"
```

### Creating Memory Backups

If you want a record of important decisions:
```
"List all memories with the 'decision' tag"
```

You can save the output to your project docs.

## Troubleshooting

**Memory not finding what I saved:**
- Try different search words
- Search is smart but works better with context
- "What's our API endpoint?" works better than just "API"

**Too many results when recalling:**
- Use more specific search terms
- Filter by tag or category
- Narrow down with "only from configuration memories"

**Accidentally saved wrong information:**
- Simply save the correct version
- The new information will be found in future searches
- Use forget to remove the old version

## Next Steps

- Learn **Agents Guide** to have agents use your saved context
- Explore **Planning Guide** to align TODOs with saved goals
- Check **TDD Guide** to ensure tests follow saved standards

---

Need to find something specific? Use the search to recall related memories, or ask for a tutorial on any Memory feature.
