---
slug: fusion-guide
title: Fusion System - User Guide
category: feature
difficulty: intermediate
estimatedTime: 15
tags: [fusion, workflow, coordination, automation, dashboard]
relatedGuides: [planning-guide, agents-guide, tdd-guide, memory-guide]
version: 2.0.0
excerpt: Automatic coordination between features—describe what you want, let FLUX handle the workflow.
---

# Fusion System User Guide

Fusion is FLUX's intelligent coordination layer. Instead of manually calling features one by one, describe what you want to accomplish and Fusion automatically coordinates Memory, Planning, Agents, and TDD to work together seamlessly.

> **Fusion = 똑똑한 협력** (Smart Cooperation)

## What is Fusion?

Fusion automatically chains features together so they work as one integrated system. When one feature finishes, the next one automatically starts with the context it needs—without you having to manually coordinate between them.

**Traditional approach** (without Fusion):
```
You: "Create a TODO to add authentication"
Claude: TODO created. Should I spawn an agent?
You: "Yes, spawn a coder agent"
Claude: Agent started. Run tests?
You: "Yes, run the tests"
Claude: Tests passing! Save results?
You: "Save to memory"
Claude: Done.
Result: 5 messages, lots of back-and-forth
```

**Fusion approach**:
```
You: "Implement authentication with auto-workflow"
Claude: [Automatically executes: Create TODO → Spawn Agent → Run Tests → Save Results]
Result: 1 message, all steps happen automatically
```

## What Gets Better with Fusion?

### Efficiency
Work gets done with far fewer messages. Describe the goal, Fusion handles the workflow.

### Clarity
Focus on *what* you want to accomplish, not *how* to sequence features. Fusion figures out the optimal path.

### Context Continuity
State automatically flows between features. When Agent finishes, TDD gets the context it needs. When tests complete, results go straight to Memory.

### Token Savings
Automatic coordination eliminates redundant context passing. **80% fewer tokens** for multi-feature workflows.

## Using Fusion: Workflow Execution

The most powerful Fusion feature is automatic workflow execution. Create a complex task with one command:

### Start an Auto-Workflow

```
"Implement user authentication with automatic workflow"
```

FLUX automatically:
1. Recalls relevant past context from Memory
2. Creates a TODO: "Implement user authentication"
3. Spawns an Agent to write the code
4. Auto-runs tests when agent finishes
5. Auto-saves test results to Memory
6. Marks TODO complete if tests pass

### Control Auto-Behavior

```
"Implement rate limiting (create TODO but don't auto-spawn agent)"
"Implement caching without auto-tests"
"Implement logging with everything auto"
```

### Memory-Informed Workflows

```
"Implement API authentication based on our past REST conventions"
```

Fusion automatically recalls:
- How you've done authentication before
- API design patterns from past projects
- Related security considerations

Agent uses this context to implement consistent with your style.

### Test-Driven Workflows

```
"Write tests for user validation, then implement the feature"
```

Fusion creates a workflow:
1. Agent writes test cases
2. Agent writes implementation
3. Auto-runs tests
4. Saves passing test results

## Using Fusion: Dashboard

Check the status of your entire project in one view instead of querying individual features.

### View Full Dashboard

```
"Show the dashboard"
"What's the current status?"
"Display project overview"
```

Returns integrated view:
- Memory: 47 entries (12 in last 24h)
- Planning: 15 TODOs (5 completed, 7 in-progress, 3 pending)
- Agents: 8 agents executed (2 currently running)
- TDD: 42 tests with 90% pass rate
- Guide: 24 guides available (3 in progress)
- Science: 15 tools ready to use

### Compact Summary

```
"Quick status"
```

Shows one-line summary of each feature without the full dashboard display.

### Watch Mode

```
"Show live dashboard (update every 5 seconds)"
```

Dashboard updates in real-time as you work, showing immediate progress of:
- TODOs being completed
- Agents running
- Test results updating
- Memory growing

## Real-World Examples

### Example 1: Complete Feature Development

```
User: "Implement database migration system with full auto-workflow"

Fusion executes automatically:
1. Memory recall: Fetches past migration patterns
2. Planning: Creates TODO "Implement database migration system"
3. Agent: Coder agent implements the feature
4. TDD: Auto-runs migration tests
5. Memory: Saves test results and implementation patterns

Result: Full feature complete with tests, documented in memory
Cost: ~400 tokens (vs. 1400+ manually)
```

### Example 2: Bug Fix with Tests

```
User: "Fix the memory leak in production (auto-workflow)"

Fusion executes:
1. Memory recall: Fetches previous memory leak symptoms
2. Planning: Creates TODO "Fix memory leak"
3. Agent: Debugger agent investigates and fixes
4. TDD: Auto-runs performance tests to verify fix
5. Memory: Saves fix details and root cause analysis

Result: Bug fixed, verified, and documented
```

### Example 3: Architecture Review

```
User: "Review our database schema and recommend improvements (no auto-agent)"

Fusion executes:
1. Memory recall: Fetches current schema and past design decisions
2. Planning: Creates TODO "Database schema review"
3. You manually discuss with Claude

Why skip auto-agent? Architecture reviews are better as conversations.
```

### Example 4: Documentation Sprint

```
User: "Document the API with auto-workflow"

Fusion executes:
1. Memory recall: Fetches API endpoints and previous documentation
2. Planning: Creates TODO "Document API"
3. Agent: Writer agent creates comprehensive docs
4. TDD: Auto-runs documentation tests (link checks, code examples)
5. Memory: Saves documentation and API patterns

Result: Complete API documentation with verified examples
```

## When to Use Auto vs. Manual

### Use Auto-Workflow When:
- Task has a clear implementation path (code, tests, document)
- You want maximum automation and token efficiency
- The task is relatively straightforward (not highly interactive)
- You want the workflow recorded in Planning with test results saved

**Commands**:
```
"Implement [feature] with auto-workflow"
"Build [component] (auto everything)"
"Add [functionality] - full automation"
```

### Use Manual Control When:
- Task requires conversation and iteration
- You want to review output between steps
- You're exploring an unknown solution space
- Real-time decisions are needed

**Commands**:
```
"Create TODO for [task] - no auto-agent"
"Implement [feature] - I'll run tests manually"
"Design [component] - let's discuss"
```

### Use Dashboard When:
- You want to see overall project health
- You need to decide what to work on next
- You're checking progress on multiple features
- You want to track metrics (test pass rate, TODO completion, etc.)

**Commands**:
```
"Show dashboard"
"What's our current status?"
"Display memory categories"
"Show TODO progress"
```

## Cautions & Tips

### Tip 1: Default Behavior
By default, workflows auto-execute all steps. If you don't want this, explicitly say:
```
"Create TODO without spawning agent"
"Plan this feature (no automation)"
```

### Tip 2: Review Auto Results
Even though Fusion is smart, always review auto-generated code and test results:
```
"Show the tests Fusion auto-ran"
"Display the agent's implementation"
```

### Tip 3: Use Memory Keywords
Help Fusion recall relevant context by mentioning what you want to remember:
```
"Implement [feature] based on our API patterns"
"Add [functionality] consistent with our testing approach"
```

### Tip 4: Complex Tasks = Simpler Commands
Counter-intuitively, describing a complex multi-step task often uses fewer tokens than describing multiple simple tasks:

```
Manual: "Create TODO, spawn agent, run tests, save results" = 4 messages
Fusion: "Implement with auto-workflow" = 1 message
```

### Tip 5: Dashboard for Planning
Before starting work, check the dashboard to understand current state:
```
"Show dashboard, what should I focus on next?"
```

## Troubleshooting

### Auto-Workflow Didn't Start Agent
This happens if the TODO isn't well-defined. Re-try with clearer description:
```
Bad: "Create TODO for something"
Good: "Create TODO to implement email validation endpoint"
```

### Tests Failed in Auto-Workflow
Fusion will still save the test failure to memory:
```
Check memory: "Show failed tests from [task name]"
```

Then optionally:
```
"Spawn debugger agent to fix the failing tests"
```

### Can't See Workflow Progress
Use the dashboard or query specific features:
```
"Show my TODOs"
"What agents are running?"
"Show recent test results"
```

## Token Savings

Fusion saves tokens through:

1. **Automatic Coordination**: One message instead of many back-and-forths
2. **Context Reuse**: Memory provides context, reducing need to re-explain
3. **Efficient Routing**: Workflow system knows the optimal sequence

**Typical Savings**:
- Simple feature: 30-40% fewer tokens
- Complex feature: 60-70% fewer tokens
- Multi-feature workflow: 75-80% fewer tokens

## Next Steps

- **[Workflow Details](../architecture/overview.md)**: How Fusion coordinates features
- **[Planning Guide](./planning-guide.md)**: Create and track TODOs effectively
- **[Agents Guide](./agents-guide.md)**: Spawn agents for specialized tasks
- **[TDD Guide](./tdd-guide.md)**: Run tests and verify quality
- **[Memory Guide](./memory-guide.md)**: Store and recall context

## Summary

Fusion makes multi-feature coordination automatic. Describe your goal, and FLUX orchestrates Memory, Planning, Agents, and TDD together into a cohesive workflow. The result: work gets done faster, with fewer tokens, and everything stays organized.

**Fusion = Smart Cooperation**. Let the system coordinate while you focus on what matters.
