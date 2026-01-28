---
slug: planning-guide
title: Planning & TODO - Complete User Guide
category: feature
difficulty: beginner
estimatedTime: 15
tags: [planning, todo, tasks, workflow, organization]
relatedGuides: [agents-guide, tdd-guide, memory-guide]
version: 2.0.0
excerpt: Organize your work with hierarchical TODOs, track progress, and manage complex projects.
---

# Planning & TODO User Guide

Planning helps you break down complex work into manageable tasks, track what you're doing, and see what's done. It's like having a smart to-do list that understands relationships between tasks and shows your progress.

## What is Planning?

Planning is your project organization system. Instead of loose notes, create structured tasks that relate to each other, mark progress, and get a clear picture of what's left to do.

**Key benefits:**
- Break large goals into manageable subtasks
- See what's done, in-progress, or pending
- Understand dependencies between tasks
- Track progress visually with a task tree
- Stay organized across complex projects

## Main Operations

### Create a Task

Add a new task to your plan:

```
Say: "Create a TODO: Implement user authentication with JWT"
Or: "Plan: Add email notifications feature"
```

### Create Subtasks

Break down big tasks into smaller ones:

```
Parent task: "Build user authentication system"

Subtasks:
"Design database schema for users and tokens"
"Implement JWT token generation"
"Create login endpoint with validation"
"Write unit tests for authentication"
"Update API documentation"
```

### Update Task Status

Mark progress as you work:

```
Change status to: "Implement JWT token generation is in-progress"
Or: "Mark design database schema as completed"
```

**Status options:**
- `pending` - Not started yet
- `in-progress` - Currently working on it
- `completed` - Finished and verified

### View Task Tree

See everything in an organized view:

```
Request: "Show my TODO tree"
Or: "Display all pending tasks"
Or: "Show completed items"
```

## Key Use Cases

### 1. Feature Development Planning

Break down a feature into implementation phases:

```
Feature: "Build real-time notifications"

Subtasks:
├─ Design notification system architecture
├─ Set up WebSocket infrastructure
├─ Implement notification sending
├─ Add email notification support
├─ Write comprehensive tests
└─ Document the notification API
```

### 2. Sprint Planning

Organize work for a development sprint:

```
Sprint: "Q1 Sprint 1"

Features:
├─ User authentication (5 tasks)
├─ Payment processing (4 tasks)
├─ Performance optimization (3 tasks)
└─ Documentation updates (2 tasks)
```

### 3. Bug Fixing Process

Organize investigation and fixing:

```
Bug: "Users getting logged out after 5 minutes"

Steps:
├─ Reproduce and document the issue
├─ Analyze session timeout logic
├─ Identify root cause
├─ Implement the fix
└─ Add regression tests
```

### 4. Refactoring Projects

Plan large code improvements:

```
Refactor: "Modernize database layer"

Tasks:
├─ Audit current implementation
├─ Design repository pattern
├─ Migrate to new pattern
├─ Update all queries
├─ Verify tests still pass
└─ Update documentation
```

### 5. Learning & Research

Structure learning goals:

```
Learning: "Master TypeScript advanced types"

Topics:
├─ Read TypeScript handbook chapters
├─ Study generic types
├─ Learn conditional types
├─ Practice with examples
└─ Build small project to apply
```

## Example Workflow

### Session 1: Planning a Feature

```
You: "Create a TODO for building real-time chat feature"
FLUX: TODO created

You: "Create subtasks:
  - Design chat message schema
  - Implement WebSocket connection
  - Create message sending endpoint
  - Add message history retrieval
  - Write tests for chat
  - Document chat API"

FLUX: Subtasks created and organized under main feature
```

### Session 2: Starting Work

```
You: "Show my TODO tree"
FLUX: Displays tree with all tasks marked as pending

You: "Mark 'Design chat message schema' as in-progress"
FLUX: Status updated

You: "Complete 'Design chat message schema'"
FLUX: Status changed to completed
```

### Session 3: Tracking Progress

```
You: "Show only pending tasks"
FLUX: Shows remaining work

You: "Show completed tasks"
FLUX: Displays what's done - gives sense of accomplishment
```

## Task Organization Strategies

### Strategy 1: Feature-Based

Organize by major features:

```
Create feature TODOs for:
- User authentication
- Payment processing
- Admin dashboard
- Notification system

Each has subtasks for:
- Backend implementation
- Frontend implementation
- Testing
- Documentation
```

### Strategy 2: Layer-Based

Organize by architecture layers:

```
Database Layer
├─ Schema design
├─ Migrations
├─ Query optimization
└─ Backup strategy

API Layer
├─ Endpoint design
├─ Request validation
├─ Error handling
└─ Rate limiting

Frontend Layer
├─ Component design
├─ State management
├─ Performance optimization
└─ Accessibility
```

### Strategy 3: Timeline-Based

Organize by when work should happen:

```
Week 1
├─ Database setup
└─ API scaffolding

Week 2
├─ Core endpoint implementation
└─ Basic frontend

Week 3
├─ Feature completion
└─ Testing

Week 4
├─ Optimization
└─ Documentation
```

### Strategy 4: Priority-Based

Organize by importance:

```
Priority 1 (Critical)
├─ Security features
├─ Performance bottlenecks
└─ Critical bugs

Priority 2 (Important)
├─ User experience improvements
├─ Code quality
└─ Documentation

Priority 3 (Nice-to-Have)
├─ Optimizations
├─ Polish
└─ Advanced features
```

## Best Practices

### Writing Good Tasks

**Be specific and actionable:**
```
Good: "Write unit tests for email validation function"
Bad: "Write tests"

Good: "Implement WebSocket message handler with ACK support"
Bad: "Add WebSocket support"
```

**One responsibility per task:**
```
Instead of: "Implement authentication and add tests"

Split into:
- "Implement authentication logic"
- "Write tests for authentication"
```

**Include enough context:**
```
"Implement database backup strategy with daily snapshots
to S3, handle failures gracefully, test recovery process"
```

### Status Management

**Update regularly:**
- Mark tasks as in-progress when you start
- Complete immediately when finished
- This keeps your TODO accurate

**Use pending for not-yet-started:**
- Good for roadmapping future work
- Helps see the full scope of the project

**Track completion:**
- Move items to completed
- You'll see progress and stay motivated

### Subtask Guidelines

**Don't go too deep:**
```
Good hierarchy (3-4 levels):
Feature
├─ Component 1
│  ├─ Subtask
│  └─ Subtask
└─ Component 2

Too deep:
Feature
└─ Component
   └─ Subcomponent
      └─ Subfeature
         └─ Detail
```

**Group related work:**
```
Instead of scattered subtasks:
✗ Task 1: Database migration
✗ Task 2: API endpoint
✗ Task 3: More database work
✗ Task 4: More API work

Organize as:
Feature
├─ Database tasks
│  ├─ Design schema
│  └─ Write migration
└─ API tasks
   ├─ Create endpoint
   └─ Add validation
```

### Work Flow

**Daily routine:**
```
Morning:
1. View TODO tree
2. See what's pending/in-progress
3. Start your day with clear priorities

During day:
1. Update task status as you progress
2. Mark completed items
3. Keep momentum visible

Evening:
1. Review progress
2. Plan next day's tasks
3. Note any blockers
```

## Integration Tips

### With Agents

Delegate tasks to agents:

```
Create TODO: "Implement payment processing module"

Then: "Use specialist_coder to help implement this TODO"

Agent works on the specific task while you track in TODO
```

### With Memory

Remember why tasks matter:

```
Save: "Q1 priorities - performance improvement is critical because
our API hits bottleneck at 1000 concurrent users"

When planning: Tasks related to performance are more important
```

### With TDD

Organize TDD work:

```
Create TODO: "Implement user service with TDD"

Subtasks:
├─ Write failing tests (RED phase)
├─ Implement to pass tests (GREEN phase)
└─ Refactor while tests pass (REFACTOR phase)
```

## Common Patterns

### Shipping a Feature (Complete Pattern)

```
Feature: "Implement real-time notifications"

Design Phase
├─ Decide on technology (WebSockets vs polling)
├─ Design notification schema
└─ Plan database structure

Implementation Phase
├─ Set up WebSocket server
├─ Implement notification sending
├─ Add notification retrieval
└─ Implement real-time delivery

Testing Phase
├─ Write unit tests
├─ Write integration tests
└─ Manual testing

Polish Phase
├─ Error handling & edge cases
├─ Performance optimization
└─ Code review and refactoring

Documentation Phase
├─ API documentation
├─ Setup guide
└─ Troubleshooting guide
```

### Bug Fix Pattern

```
Bug: "Users disconnected after 30 minutes of inactivity"

Investigation
├─ Reproduce the issue
├─ Check session timeout settings
└─ Trace connection lifecycle

Analysis
├─ Review WebSocket handling code
├─ Check server logs
└─ Identify root cause

Fix
├─ Implement the fix
├─ Test thoroughly
└─ Add regression test

Verification
├─ Confirm fix works
├─ Check no new issues
└─ Deploy safely
```

### Refactoring Pattern

```
Refactor: "Modernize authentication system"

Preparation
├─ Write tests for current behavior
├─ Document current implementation
└─ Plan new architecture

Migration
├─ Build new system alongside old
├─ Migrate users gradually
└─ Handle edge cases

Cleanup
├─ Remove old code
├─ Update documentation
└─ Deploy new system

Verification
├─ Monitor for issues
├─ Confirm all tests pass
└─ Get team sign-off
```

## Tips & Tricks

### Seeing Progress Motivation

```
Regularly view your TODO tree to see:
- Completed items (motivating!)
- What's left to do (clear scope)
- Your progress percentage
```

### Parallel Task Tracking

```
Work on multiple items:
"I'm working on authentication, design, and documentation at the same time"

TODOs show this clearly:
├─ Authentication (in-progress)
├─ Design (in-progress)
└─ Documentation (in-progress)
```

### Quick Filtering

```
"Show only pending tasks" - See what needs to be done
"Show only completed tasks" - Celebrate wins
"Show only in-progress tasks" - Focus on current work
```

### Estimating Scope

Count your TODOs to see project scope:
```
"Small feature" = 3-5 tasks
"Medium feature" = 5-15 tasks
"Large feature" = 15+ tasks
```

### Reusing Task Templates

Common patterns you can reuse:

```
Copy structure from previous projects:
- Feature planning structure
- Testing approach tasks
- Documentation requirements
- Refactoring phases
```

### Breaking Down Overwhelming Projects

If something feels too big:

```
Instead of: "Build entire e-commerce platform"

Break into:
└─ User Management
   ├─ Authentication
   ├─ Profile management
   └─ Admin controls
└─ Product Catalog
   ├─ Product listing
   ├─ Search & filtering
   └─ Product details
└─ Shopping Cart
   ├─ Add to cart
   ├─ Cart management
   └─ Checkout process
```

## Troubleshooting

**Too many tasks, feeling overwhelmed:**
- Filter to see only today's work
- Focus on one parent task at a time
- You don't need to see everything at once

**Not sure how to break down a task:**
- Think about the natural phases (design, implement, test)
- Consider the different components involved
- Ask an agent to help plan the breakdown

**Can't decide if tasks are done enough:**
- If you're unsure, leave it as in-progress
- Mark complete when fully verified and tested
- Tasks marked complete should be truly finished

## Next Steps

- Learn **Agents Guide** to delegate planning tasks
- Explore **TDD Guide** to organize test-driven development
- Check **Memory Guide** to save planning lessons learned

---

Planning helps keep complex projects manageable. Start with your biggest goal and break it down—see how clear everything becomes!
