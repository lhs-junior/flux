---
slug: agents-guide
title: Agents - Complete User Guide
category: feature
difficulty: intermediate
estimatedTime: 20
tags: [agents, orchestration, delegation, specialization, spawn]
relatedGuides: [memory-guide, planning-guide, tdd-guide]
version: 2.0.0
excerpt: Delegate complex tasks to specialized agents and orchestrate multi-agent workflows.
---

# Agents User Guide

Agents are specialized experts that you can delegate work to. Instead of doing everything yourself, spawn an agent with expertise in code, design, debugging, or strategy—and let them handle specific tasks while you focus on what matters most.

## What are Agents?

Agents are autonomous assistants, each specialized in different areas. When you give an agent a task, it works independently and provides results focused on that specific domain.

**Key benefits:**
- Offload specialized work to domain experts
- Run tasks in parallel (multiple agents at once)
- Get focused expertise (debugger, coder, designer, etc.)
- Access agent results immediately or check progress later

## The 10 Specialist Agents

### Strategy & Planning

**Strategist** - Designs architecture, plans approaches, makes high-level decisions
```
Use for: "Design a scalable microservices architecture"
Use for: "Plan the implementation strategy for real-time notifications"
```

**Analyst** - Analyzes data, identifies patterns, finds bottlenecks
```
Use for: "Analyze API performance metrics and find bottlenecks"
Use for: "Analyze user behavior patterns from this dataset"
```

### Development & Code

**Coder** - Generates code, implements features, writes tests
```
Use for: "Generate tests for user authentication"
Use for: "Implement the payment processing endpoint"
```

**Designer** - Creates designs, thinks about UX, solves design problems
```
Use for: "Design a modern dashboard for user management"
Use for: "Create an accessible form layout for signup"
```

### Quality & Maintenance

**Debugger** - Finds bugs, diagnoses problems, traces root causes
```
Use for: "Find why memory usage keeps increasing"
Use for: "Debug the authentication token expiry issue"
```

**Reviewer** - Reviews code, checks quality, provides feedback
```
Use for: "Review our authentication implementation for security issues"
Use for: "Check code quality and suggest improvements"
```

**Optimizer** - Improves performance, enhances efficiency, optimizes code
```
Use for: "Optimize the database queries for faster response"
Use for: "Improve the build time and bundle size"
```

### Documentation & Teaching

**Writer** - Writes documentation, creates content, explains concepts
```
Use for: "Write comprehensive API documentation"
Use for: "Create a technical guide for our system architecture"
```

**Teacher** - Explains concepts, creates tutorials, teaches
```
Use for: "Create a tutorial on OAuth2 authentication"
Use for: "Explain how our caching strategy works"
```

### Research & Discovery

**Researcher** - Investigates topics, researches best practices, finds information
```
Use for: "Research current authentication best practices"
Use for: "Find the latest Node.js performance optimization techniques"
```

## Main Operations

### Spawn an Agent

Tell an agent to work on a task:

```
Delegate: "Use the specialist_coder to create unit tests for payment module"
Or: "Spawn the strategist to design our API gateway architecture"
```

The agent starts working and you get back an agent ID. The task runs in the background.

### Check Agent Status

Monitor how your agent is progressing:

```
Ask: "What's the status of my coder agent?"
Or: "Is the debugger still working on the memory issue?"
```

Status shows: completed, in-progress, pending, or failed.

### Get Agent Results

Retrieve what an agent completed:

```
Request: "Get results from the architect agent"
Or: "Show me what the optimizer found"
```

### Terminate Agent

Stop an agent if you need to cancel:

```
Command: "Stop the researcher working on authentication"
Or: "Cancel the coder agent"
```

## Key Use Cases

### 1. Code Generation & Testing

Instead of writing tests manually:

```
You: "Use specialist_coder to write comprehensive tests for user registration
including valid/invalid email, weak password, duplicate account scenarios"

Agent: Returns full test suite covering edge cases and best practices
```

### 2. Architecture Planning

When starting a new system:

```
You: "Use specialist_strategist to design authentication system architecture.
Consider: JWT tokens, 2FA, session management, and scaling to 1M users"

Agent: Returns detailed architecture with component diagrams and flow
```

### 3. Performance Analysis

When your app is slow:

```
You: "Use specialist_analyst to analyze these database query logs
and identify the top 3 performance bottlenecks"

Agent: Returns analysis with specific slow queries and recommendations
```

### 4. Bug Investigation

When something breaks:

```
You: "Use specialist_debugger to find why users are getting kicked out
after 5 minutes. Check session timeout logic in auth middleware"

Agent: Returns root cause analysis and fix recommendations
```

### 5. Code Review & Quality

Before shipping features:

```
You: "Use specialist_reviewer to review our payment processing code.
Check for security issues, error handling, and testing coverage"

Agent: Returns detailed review with specific issues and improvement suggestions
```

## Example Workflows

### Feature Development Workflow

```
Step 1: Architecture
You: "Use specialist_strategist to design real-time notifications feature.
Consider WebSocket vs polling, database schema, and error handling"

Agent: Returns architectural design and recommendations

Step 2: Implementation
You: "Use specialist_coder to implement the notification system
following the architecture we just designed"

Agent: Returns working implementation

Step 3: Testing
You: "Use specialist_coder to write comprehensive tests
for the notification system"

Agent: Returns complete test suite

Step 4: Review
You: "Use specialist_reviewer to review the notification code
for bugs, security, and performance"

Agent: Returns review with suggestions

Step 5: Documentation
You: "Use specialist_writer to create documentation
for the notification API"

Agent: Returns comprehensive documentation
```

### Debugging Workflow

```
Step 1: Investigate
You: "Use specialist_debugger to find why the API is returning
500 errors for specific users"

Agent: Returns investigation findings

Step 2: Confirm
You: "Use specialist_analyzer to analyze the affected user data
to understand what's common"

Agent: Returns pattern analysis

Step 3: Fix
You: "Use specialist_optimizer to optimize and fix the issue"

Agent: Returns fix implementation

Step 4: Verify
You: "Use specialist_reviewer to check the fix doesn't break anything"

Agent: Returns verification results
```

### Optimization Workflow

```
Step 1: Analyze
You: "Use specialist_analyst to analyze our API response times.
Show me the slowest endpoints and their timing breakdown"

Agent: Returns performance analysis

Step 2: Optimize
You: "Use specialist_optimizer to optimize the slowest endpoints.
Focus on reducing database queries and caching strategies"

Agent: Returns optimized implementation

Step 3: Verify
You: "Use specialist_analyzer to benchmark the optimized version
and compare with baseline"

Agent: Returns performance comparison showing improvements
```

## Best Practices

### Clear Task Descriptions

**Be specific about what you want:**
```
Good: "Create unit tests for the authentication middleware that verify
JWT validation, token expiry, and unauthorized access handling"

Bad: "Write tests for authentication"
```

**Include relevant context:**
```
"Use specialist_coder to implement user profile update feature.
Context: Use REST API, validate all inputs, audit changes in database"
```

### Choosing the Right Agent

| Task Type | Best Agent |
|-----------|-----------|
| Need architecture/strategy | Strategist |
| Need to find bugs | Debugger |
| Need code generated | Coder |
| Need performance improvement | Optimizer |
| Need review/feedback | Reviewer |
| Need documentation | Writer |
| Need tutorials/teaching | Teacher |
| Need design/UX | Designer |
| Need to understand data | Analyst |
| Need research/investigation | Researcher |

### Sequential vs Parallel

**Run in sequence when:**
```
Use Agent A for architecture
→ Use Agent B to implement based on A's output
→ Use Agent C to review B's implementation
```

**Run in parallel when:**
```
Spawn Agent 1 for code analysis
Spawn Agent 2 for documentation writing
Spawn Agent 3 for performance testing
Get all results when ready
```

### Quality Results

**Give agents enough context:**
```
Instead of: "Optimize our code"
Provide: "Optimize our API handler. Current: 500ms/request.
Goal: 100ms/request. Known bottleneck: Database queries"
```

**Set clear priorities:**
```
"Use specialist_optimizer to improve our system with priorities:
1) Reduce API latency
2) Lower database load
3) Reduce bundle size"
```

## Integration Tips

### With Memory

Save your standards, agents use them:

```
Save: "Team standards - functional programming, TypeScript strict mode,
80% test coverage requirement"

Delegate: "Use specialist_coder to implement feature X following
our saved team standards"

Agent will automatically recall and follow your standards
```

### With Planning

Create tasks, delegate with context:

```
Create TODO: "Implement payment processing module"

Delegate: "Use specialist_strategist to design payment processing.
This is part of the Q1 roadmap we planned"

Architect designs with your planning context in mind
```

### With TDD

Use agents in your testing workflow:

```
Start: tdd_red phase for user authentication

Delegate: "Use specialist_coder to write comprehensive tests
for user authentication that we can implement against"

Agent writes tests for RED phase

You implement to pass tests (GREEN phase)

Use specialist_optimizer for refactoring phase
```

## Common Patterns

### Full Feature Development (5 Steps)

```
1. Design: specialist_strategist
   ↓
2. Implementation: specialist_coder
   ↓
3. Testing: specialist_coder
   ↓
4. Review: specialist_reviewer
   ↓
5. Documentation: specialist_writer
```

### Code Quality Review (3 Steps)

```
1. Security: specialist_reviewer (security focus)
   ↓
2. Performance: specialist_analyzer (bottleneck analysis)
   ↓
3. Refactoring: specialist_optimizer (improvement suggestions)
```

### Research & Implementation (2 Steps)

```
1. Research: specialist_researcher (best practices, patterns)
   ↓
2. Implementation: specialist_coder (implement recommendations)
```

## Tips & Tricks

### Parallel Agent Work

You can spawn multiple agents at once for faster turnaround:

```
"Spawn 3 agents in parallel:
- specialist_coder: Write tests
- specialist_writer: Start documentation
- specialist_designer: Create UI mockups"
```

### Chaining Agent Results

Use one agent's output as input to another:

```
Step 1: "Use specialist_strategist to design the architecture"
→ Save or note the architecture

Step 2: "Use specialist_coder to implement the design from step 1"

Step 3: "Use specialist_reviewer to review the implementation"
```

### Reusing Agent Results

If you get good results from an agent, reference them:

```
"Remember the performance analysis from the analyst agent"

Later: "Optimize based on the findings from our saved analysis"
```

### Delegating with Examples

Show agents what good looks like:

```
"Use specialist_coder to write tests like this style:
[show example test], generate similar tests for the auth module"
```

### Iterative Refinement

Not happy with agent output? Ask for improvements:

```
First: "Use specialist_writer to write API documentation"

Then: "That's good but needs more code examples and better structure,
refine it with more detailed examples"
```

## Troubleshooting

**Agent seems stuck or slow:**
- Complex tasks take time
- Check status to see progress
- Cancel and re-delegate with more specific task if needed

**Results aren't quite right:**
- Provide more context in your task description
- Give examples of what "right" looks like
- Try a different specialist agent if appropriate

**Need agent to use your project's style:**
- Save your standards/examples to Memory first
- Mention them in the task: "Follow our saved coding standards"
- Agent will recall and apply them

## Next Steps

- Learn **Memory Guide** to save standards for agents to use
- Explore **Planning Guide** to structure multi-agent workflows
- Check **TDD Guide** to use agents in your testing process

---

Need help choosing which agent for your task? Ask about agent specializations or get recommendations for your specific use case.
