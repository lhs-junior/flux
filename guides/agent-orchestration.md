---
slug: agent-orchestration
title: Agent Orchestration System
category: tutorial
difficulty: intermediate
estimatedTime: 25
tags: [agents, orchestration, delegation, specialization]
relatedTools: [agent_spawn, agent_status, agent_result, agent_terminate, agent_list]
prerequisites: [getting-started, memory-system]
version: 1.0.0
excerpt: Master the 10 specialized agents for delegating complex tasks with domain expertise and cross-feature integration.
---

# Agent Orchestration System

The Agent Orchestration System provides 10 specialized agents, each with domain expertise for handling specific types of tasks. Agents can access memory, planning, and TDD features for enhanced capabilities.

## Overview

Awesome Plugin includes these 10 specialized agents:

1. **specialist_researcher**: Deep information research and analysis
2. **specialist_analyst**: Data analysis and pattern recognition
3. **specialist_strategist**: Strategic planning and decision support
4. **specialist_designer**: Design thinking and creative solutions
5. **specialist_coder**: Code generation and technical implementation
6. **specialist_teacher**: Educational content and explanations
7. **specialist_writer**: Content creation and documentation
8. **specialist_debugger**: Problem diagnosis and troubleshooting
9. **specialist_reviewer**: Code/content review and feedback
10. **specialist_optimizer**: Performance and efficiency improvements

## Step 1: Delegate Your First Task

Let's delegate a task to the Strategist agent:

```typescript
// Use the agent_spawn tool
{
  "agentType": "specialist_strategist",
  "task": "Design a database schema for user authentication with JWT tokens",
  "priority": "high"
}
```

Expected output:
```json
{
  "success": true,
  "agentId": "uuid-here",
  "agent": "specialist_strategist",
  "status": "completed",
  "result": {
    "analysis": "...",
    "recommendations": "...",
    "implementation": "..."
  }
}
```

The agent will analyze requirements and provide architectural guidance.

Hints:
- Be specific in your task description
- Include relevant context
- Set priority based on urgency (low, medium, high)

## Step 2: Check Agent Status

Monitor an agent's progress on a task:

```typescript
// Use the agent_status tool
{
  "agentId": "uuid-from-previous-delegation"
}
```

This shows the current status, progress, and any intermediate results.

Check: Use this to track long-running tasks

## Step 3: Use the Debugger Specialist

When you encounter a bug, delegate to specialist_debugger:

```typescript
{
  "agentType": "specialist_debugger",
  "task": "Investigate why authentication tokens expire too quickly",
  "priority": "high",
  "context": {
    "errorMessage": "JWT expired",
    "affectedFiles": ["src/auth/token.ts"]
  }
}
```

The Debugger specialist will:
- Analyze the error
- Identify root causes
- Suggest fixes
- Provide debugging steps

## Step 4: Optimize Code with the Optimizer

Improve code quality and performance:

```typescript
{
  "agentType": "specialist_optimizer",
  "task": "Optimize the user authentication module for better performance and testability",
  "priority": "medium",
  "context": {
    "files": ["src/auth/"],
    "goals": ["improve performance", "reduce complexity"]
  }
}
```

The Optimizer specialist will suggest improvements and provide optimized code.

Hints:
- Specify optimization goals
- Include current pain points
- Mention constraints (e.g., maintain backward compatibility)

## Step 5: Generate Tests with the Coder

Generate comprehensive tests:

```typescript
{
  "agentType": "specialist_coder",
  "task": "Create unit tests for the authentication middleware",
  "priority": "high",
  "context": {
    "testFramework": "vitest",
    "coverageGoal": "80%"
  }
}
```

The Coder specialist will:
- Design test cases
- Write test code
- Suggest edge cases
- Recommend coverage improvements

Check: Run the generated tests to ensure they pass

## Step 6: Analyze Performance

Use the Analyst specialist to identify bottlenecks:

```typescript
{
  "agentType": "specialist_analyst",
  "task": "Analyze database query performance in user lookup",
  "priority": "medium",
  "context": {
    "currentResponseTime": "500ms",
    "targetResponseTime": "100ms"
  }
}
```

Expected analysis:
- Profiling results
- Bottleneck identification
- Optimization strategies
- Benchmarking recommendations

## Agent Specializations

### specialist_researcher
**Best for**: Deep information research, analysis, investigation

```typescript
{
  "agentType": "specialist_researcher",
  "task": "Research current authentication best practices and security standards"
}
```

### specialist_analyst
**Best for**: Data analysis, pattern recognition, performance analysis

```typescript
{
  "agentType": "specialist_analyst",
  "task": "Analyze API performance metrics and identify bottlenecks"
}
```

### specialist_strategist
**Best for**: Strategic planning, decision support, architecture design

```typescript
{
  "agentType": "specialist_strategist",
  "task": "Design a scalable microservices architecture for the platform"
}
```

### specialist_designer
**Best for**: Design thinking, creative solutions, UX/UI design

```typescript
{
  "agentType": "specialist_designer",
  "task": "Create a modern, accessible dashboard design for user management"
}
```

### specialist_coder
**Best for**: Code generation, implementation, technical solutions

```typescript
{
  "agentType": "specialist_coder",
  "task": "Implement WebSocket support for real-time notifications"
}
```

### specialist_teacher
**Best for**: Educational content, explanations, documentation

```typescript
{
  "agentType": "specialist_teacher",
  "task": "Create a tutorial on implementing OAuth2 authentication"
}
```

### specialist_writer
**Best for**: Content creation, documentation, technical writing

```typescript
{
  "agentType": "specialist_writer",
  "task": "Write comprehensive API documentation for the auth module"
}
```

### specialist_debugger
**Best for**: Problem diagnosis, troubleshooting, root cause analysis

```typescript
{
  "agentType": "specialist_debugger",
  "task": "Debug why memory usage increases over time in production"
}
```

### specialist_reviewer
**Best for**: Code review, feedback, quality assurance

```typescript
{
  "agentType": "specialist_reviewer",
  "task": "Review the authentication implementation for security issues"
}
```

### specialist_optimizer
**Best for**: Performance optimization, efficiency improvements, profiling

```typescript
{
  "agentType": "specialist_optimizer",
  "task": "Optimize the data processing pipeline for faster execution"
}
```

## Cross-Feature Integration

### Agents + Memory

Agents automatically access memory for context:

```typescript
// First, save relevant context
memory_save({
  "key": "coding_standards",
  "value": "Follow functional programming, use TypeScript strict mode",
  "metadata": { "category": "technical", "tags": ["standards"] }
})

// Agent will recall this when delegated
agent_spawn({
  "agentType": "specialist_optimizer",
  "task": "Optimize user service to follow coding standards"
})
```

### Agents + Planning

Agents can work within plans:

```typescript
// Create a plan
planning_create({
  "name": "feature-auth",
  "goals": ["implement JWT", "add tests"]
})

// Delegate tasks related to the plan
agent_spawn({
  "agentType": "specialist_strategist",
  "task": "Design auth architecture for plan: feature-auth"
})
```

### Agents + TDD

Combine agents with TDD workflow:

```typescript
// Start TDD for a feature
tdd_red({ "feature": "user registration" })

// Delegate test writing to Coder
agent_spawn({
  "agentType": "specialist_coder",
  "task": "Write tests for user registration validation"
})

// Delegate implementation to Coder
agent_spawn({
  "agentType": "specialist_coder",
  "task": "Implement user registration endpoint"
})
```

## Best Practices

### Task Descriptions

1. **Be specific**: Clear requirements lead to better results
   - Good: "Design a caching layer for API responses with Redis"
   - Bad: "Make it faster"

2. **Include context**: Help agents understand the situation
   - Current state
   - Constraints
   - Goals

3. **Set clear priorities**: Helps agents focus on what matters
   - `high`: Urgent, blocking work
   - `medium`: Important but not urgent
   - `low`: Nice to have, future work

### Choosing the Right Specialist

- **Strategic planning** → specialist_strategist
- **Bug investigation** → specialist_debugger
- **Performance tuning** → specialist_optimizer
- **Code generation** → specialist_coder
- **Documentation** → specialist_writer or specialist_teacher
- **Code review** → specialist_reviewer
- **Data analysis** → specialist_analyst
- **Research needs** → specialist_researcher
- **Design work** → specialist_designer

### Agent Workflow

1. **Delegate clearly**: Provide complete task description
2. **Monitor progress**: Check status for long tasks
3. **Review results**: Validate agent output
4. **Iterate if needed**: Refine and re-delegate
5. **Document outcomes**: Save insights to memory

## Common Patterns

### Code Review Workflow

```typescript
// 1. Security review
agent_spawn({
  "agentType": "specialist_reviewer",
  "task": "Review authentication code for vulnerabilities and best practices"
})

// 2. Performance check
agent_spawn({
  "agentType": "specialist_analyst",
  "task": "Analyze authentication performance metrics"
})

// 3. Quality assessment
agent_spawn({
  "agentType": "specialist_reviewer",
  "task": "Check code quality and test coverage for auth module"
})
```

### Feature Development

```typescript
// 1. Architecture & Strategy
agent_spawn({
  "agentType": "specialist_strategist",
  "task": "Design feature: real-time notifications"
})

// 2. Implementation
agent_spawn({
  "agentType": "specialist_coder",
  "task": "Implement WebSocket notification system"
})

// 3. Testing
agent_spawn({
  "agentType": "specialist_coder",
  "task": "Write tests for notification system"
})

// 4. Documentation
agent_spawn({
  "agentType": "specialist_writer",
  "task": "Document notification API"
})
```

### Debugging Workflow

```typescript
// 1. Investigation
agent_spawn({
  "agentType": "specialist_debugger",
  "task": "Find root cause of memory leak"
})

// 2. Fix
agent_spawn({
  "agentType": "specialist_optimizer",
  "task": "Optimize code to fix memory leak"
})

// 3. Verification
agent_spawn({
  "agentType": "specialist_analyst",
  "task": "Verify memory leak is fixed through analysis"
})
```

## Next Steps

- Learn about **Planning Workflow** for structured task management
- Explore **TDD Integration** for test-driven development
- Check **Memory System** for context retention

Use `guide_search` to find more tutorials and documentation.
