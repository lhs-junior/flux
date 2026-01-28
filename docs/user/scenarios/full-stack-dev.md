---
slug: full-stack-dev-scenario
title: Full-Stack Development Scenario
category: scenario
difficulty: intermediate
estimatedTime: 45
tags: [agents, memory, planning, tdd, integration]
relatedGuides: [memory-guide, agents-guide, planning-guide, tdd-guide]
version: 2.0.0
excerpt: Learn how to build a complete full-stack application using FLUX by coordinating Memory, Agents, Planning, and TDD in a realistic scenario.
---

This guide walks you through using FLUX to build a complete full-stack application. You'll learn how Memory, Agents, Planning, and TDD work together in a realistic project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Phase 1: Project Setup with Memory](#phase-1-project-setup-with-memory)
3. [Phase 2: Architecture Planning](#phase-2-architecture-planning)
4. [Phase 3: Parallel Development with Agents](#phase-3-parallel-development-with-agents)
5. [Phase 4: Quality Assurance with TDD](#phase-4-quality-assurance-with-tdd)
6. [Phase 5: Integration and Deployment](#phase-5-integration-and-deployment)
7. [Real Commands Reference](#real-commands-reference)

## Project Overview

Imagine you're building a task management application called "TaskFlow":

**Features:**
- User authentication (email/password)
- Create, read, update, delete tasks
- Assign tasks to users
- Track task progress (Todo, In Progress, Done)
- Real-time notifications via Webhook
- REST API for mobile clients
- React dashboard with TypeScript
- PostgreSQL database

**Tech Stack:**
- Backend: Node.js with Express
- Frontend: React 18 with TypeScript
- Database: PostgreSQL 15
- Authentication: JWT tokens
- Real-time: Webhooks with exponential backoff

This is a realistic scenario that requires parallel development, knowledge sharing, and quality assurance.

## Phase 1: Project Setup with Memory

Before you write any code, establish a knowledge base for your team.

### Step 1: Save Technology Decisions

```
Remember that TaskFlow uses Node.js 20 LTS with Express 4.x
Remember that our database is PostgreSQL 15 with connection pooling via pg-pool
Remember that authentication uses JWT tokens with 24-hour expiration
Remember that frontend is React 18 with TypeScript strict mode
```

Claude saves each decision. Key points:
- Information persists across sessions
- Teammates can recall decisions later
- Easy to search for "what database do we use?"

### Step 2: Save Architecture Decisions

```
Remember that TaskFlow architecture follows: HTTP Client -> React SPA -> Express API -> PostgreSQL DB
Remember we use JWT stored in HttpOnly cookies for security
Remember task statuses are: Todo (0), InProgress (1), Done (2) - we use numbers for database
```

These architectural decisions prevent future confusion.

### Step 3: Save Environment Configuration

```
Remember that TaskFlow environment variables are:
- NODE_ENV: production, development, or test
- DB_HOST: localhost for local, RDS endpoint for production
- DB_NAME: taskflow_prod or taskflow_dev
- JWT_SECRET: stored in .env, never commit to git
- API_PORT: 3000 for local development
```

This becomes your team's single source of truth.

### Step 4: Save Known Issues and Limitations

```
Remember that PostgreSQL VARCHAR(255) is our limit for user emails (Gmail unlimited local part)
Remember that our Webhook delivery has rate limiting: max 100 per minute per endpoint
Remember that JWT tokens have 24-hour expiration - plan refresh logic for mobile
```

Documenting limitations early prevents expensive bugs later.

### Verify Your Memory Setup

Recall what you've saved:

```
What tech stack does TaskFlow use?
```

Claude returns:
```
Based on your memories, TaskFlow uses:
- Node.js 20 LTS with Express 4.x (backend)
- PostgreSQL 15 with connection pooling (database)
- React 18 with TypeScript strict mode (frontend)
- JWT tokens with 24-hour expiration (authentication)
```

Perfect! Your knowledge base is ready.

## Phase 2: Architecture Planning

Now break down the work using Planning (TODO tracking).

### Create the Main Task Tree

```
Create a TODO tree for TaskFlow:
- Backend Development (Lead: Alice)
  - User Service Implementation
    - Implement user registration endpoint
    - Implement user login endpoint
    - Add password hashing and JWT token generation
  - Task Service Implementation
    - Create CRUD endpoints for tasks
    - Implement task assignment logic
    - Add task status transitions
  - Webhook Notification System
    - Implement webhook delivery mechanism
    - Add retry logic with exponential backoff
    - Implement webhook management endpoints
- Frontend Development (Lead: Bob)
  - Project Setup
    - Initialize React 18 with TypeScript
    - Configure Tailwind CSS and component library
  - Dashboard Implementation
    - Create task list view with filtering
    - Build task detail modal
    - Implement drag-and-drop task status changes
  - Authentication UI
    - Build login and registration forms
    - Implement JWT token storage and refresh
    - Add protected route handling
- Database Setup
  - Create PostgreSQL schema
    - Define users table
    - Define tasks table with relationships
  - Add indexes for common queries
  - Set up database migrations
- Testing and QA
  - Backend unit tests (Jest)
  - Frontend component tests (Vitest)
  - Integration tests
```

FLUX creates a hierarchical structure with dependencies. The system tracks:
- Task status (Not Started, In Progress, Completed)
- Who's responsible
- Dependencies (Database must complete before Backend)

### Visualize Progress

```
Show me the TaskFlow task tree with dependencies
```

Claude displays:
```
TaskFlow Development Plan
├─ Backend Development [Alice]
│  ├─ User Service [Not Started]
│  ├─ Task Service [Not Started]
│  └─ Webhook System [Not Started]
├─ Frontend Development [Bob]
│  ├─ Project Setup [Not Started]
│  ├─ Dashboard [Not Started]
│  └─ Auth UI [Not Started]
├─ Database Setup [Not Started]
│  ├─ Schema [Not Started]
│  └─ Indexes [Not Started]
└─ Testing [Not Started]

Legend: [Not Started] [In Progress] [Done]

Blockers:
- Frontend development waits for API contracts from Backend
- Testing depends on both Backend and Frontend completion
```

### Update Task Status

As work progresses:

```
Mark the Database Setup as complete
Mark Backend User Service as in progress
```

FLUX updates the tree and shows:
- Overall progress (20% complete)
- Blocker alerts (What's preventing other tasks)
- Who's next (Who should start what)

## Phase 3: Parallel Development with Agents

Now use Agents to work on multiple components simultaneously.

### Spawn Backend Developer Agent

```
Spawn a backend developer agent to implement the user registration endpoint.
Guidelines:
- Use Express middleware for validation
- Hash passwords with bcrypt
- Return JWT tokens as HttpOnly cookies
- Include proper error handling and logging
- Assume the User model is defined in database layer
```

Claude spawns an agent that:
1. Loads backend specialist knowledge
2. Understands your JWT token strategy from Memory
3. Creates implementation code for user registration
4. Returns the result in the background

While this agent works, you continue with other tasks.

### Spawn Frontend Developer Agent (In Parallel)

```
Spawn a frontend developer agent to build the login form.
Guidelines:
- Use React hooks (useState, useEffect)
- TypeScript strict mode
- Handle form validation before submission
- Call the /api/auth/login endpoint
- Store JWT in cookie (backend handles HttpOnly)
- Show loading and error states
- Redirect to dashboard on success
```

Now two agents work simultaneously:
- Backend agent: Building API endpoints
- Frontend agent: Building UI components

This parallelization saves days on a real project.

### Spawn Database Optimization Agent

```
Spawn a database optimization agent to:
- Analyze which queries are called frequently (tasks by user, tasks by status)
- Recommend indexes for these queries
- Create migration file for indexes
- Check for N+1 query patterns
```

While developers code, the database agent optimizes schema.

### Monitor Agent Progress

```
Check the status of all running agents
```

Response:
```
Active Agents:
1. Backend Dev Agent (80% complete)
   - Completed: User registration endpoint
   - Current: Implementing password hashing
   - Next: Adding JWT token generation

2. Frontend Dev Agent (60% complete)
   - Completed: Form component structure
   - Current: Building validation logic
   - Next: Adding API integration

3. DB Optimization Agent (40% complete)
   - Current: Analyzing query patterns
   - Next: Creating indexes migration
```

### Get Agent Results

```
Get the result from the backend dev agent
```

The agent returns:
- User registration implementation
- Explanation of key decisions
- Generated JWT token code
- Error handling patterns used

You can:
1. Review the code immediately
2. Ask follow-up questions
3. Request modifications
4. Mark corresponding TODO tasks as complete

### Sync with Team

```
Sync backend and frontend agents:
Backend agent, provide the /api/auth/login API contract
Frontend agent, use this contract to implement form submission
```

Agents communicate and coordinate work:
- Backend provides API contract
- Frontend implements against that contract
- No manual handoff needed

This is where FLUX shines - work stays coordinated without meetings.

### Handle Agent Conflicts

If agents suggest conflicting approaches:

```
Backend agent, you suggested JWT in header, but Frontend agent suggested cookies.
Recall our security decision and resolve the conflict.
```

The agent:
1. Recalls: "Remember we use JWT stored in HttpOnly cookies for security"
2. Acknowledges this aligns with cookies (not headers)
3. Updates its implementation
4. Notifies frontend agent of the correction

## Phase 4: Quality Assurance with TDD

Now ensure code quality using Test-Driven Development.

### Start TDD for User Service

```
Begin TDD for TaskFlow User Service:
Write a failing test for user registration that checks:
- Email validation (must be valid email)
- Password strength (minimum 8 characters)
- No duplicate emails allowed
- Return user object with id and email (not password)
```

Claude writes:
```
jest test for User Service registration:
- Test email validation
- Test password strength
- Test duplicate email prevention
- Test response structure
```

You run:
```bash
npm test -- user.test.ts
```

All tests fail (RED phase). Expected.

### Implement to Pass Tests

```
Make the user registration tests pass with minimal implementation:
- Implement email validation using standard regex
- Check password length >= 8
- Check for duplicate emails in database
- Return only id and email in response
```

Claude generates minimal code. You run:
```bash
npm test -- user.test.ts
```

Tests pass (GREEN phase).

### Refactor While Keeping Tests Green

```
Refactor the user registration code:
- Extract email validation to a separate util function
- Use bcrypt for password hashing (add to implementation)
- Add JSDoc comments
- Improve error messages
- Ensure all tests still pass
```

You run:
```bash
npm test -- user.test.ts
```

All tests still pass (REFACTOR phase complete).

### TDD for Task Service

```
Begin TDD for TaskFlow Task Service CRUD operations:
1. Test creating a task (require user_id, title, description)
2. Test reading a task (only owner can read)
3. Test listing user's tasks with filtering by status
4. Test updating a task (only owner can update)
5. Test deleting a task (only owner can delete)
```

For each test:
1. Write failing test
2. Implement minimal code
3. Refactor
4. Verify all tests pass

```bash
npm test -- task.test.ts
```

### Frontend Component Testing

```
Begin TDD for React task list component:
1. Test rendering task list with mock data
2. Test filtering by status (Todo, InProgress, Done)
3. Test drag-and-drop status change (mocking the drag API)
4. Test loading state display
5. Test error state display
```

Each test follows the RED-GREEN-REFACTOR cycle:

```bash
npm test -- TaskList.test.tsx
```

### Integration Tests

Once unit tests pass, integration tests verify components work together:

```
Write integration tests for TaskFlow:
1. User registration -> login -> get tasks (full authentication flow)
2. Create task -> update status -> verify update in database
3. Webhook delivery -> retry on failure -> verify success
```

These tests use:
- Real database (test instance)
- Real API endpoints
- Real React components
- Mock external services (webhooks)

```bash
npm test:integration
```

## Phase 5: Integration and Deployment

### Verify All Tests Pass

```
Run complete test suite for TaskFlow:
- All backend unit tests
- All frontend unit tests
- All integration tests
- Generate coverage report
```

You run:
```bash
npm test -- --coverage
```

View results:
```
Test Results:
✓ Backend: 150 tests passed, 0 failed
✓ Frontend: 85 tests passed, 0 failed
✓ Integration: 20 tests passed, 0 failed

Coverage:
- Statements: 87%
- Branches: 84%
- Functions: 89%
- Lines: 86%

All critical paths covered. Ready for deployment.
```

### Update Task Status

Mark major work as complete:

```
Mark Backend Development as done
Mark Frontend Development as done
Mark Testing and QA as done
Mark entire TaskFlow project as complete
```

FLUX shows:
```
TaskFlow Development: 100% Complete
- All tasks finished
- All tests passing
- All agents completed

Timeline: Started 2 weeks ago, completed on schedule
Team: Alice (Backend), Bob (Frontend), FLUX (Agents, Testing)
```

### Deployment Checklist

```
Create a deployment checklist for TaskFlow:
1. Environment verification
   - All environment variables set in production
   - Database connection string verified
   - API endpoints accessible
2. Database migration
   - Run pending migrations
   - Verify schema matches code
3. Backup verification
   - Production database backed up
   - Backup restoration tested
4. Health checks
   - API health endpoint returns 200
   - Database connectivity confirmed
   - Authentication flow tested
5. Monitoring setup
   - Error tracking enabled
   - Performance monitoring active
   - Webhook delivery monitoring configured
```

### Deployment

```
Deploy TaskFlow to production following our deployment checklist
```

The agent:
1. Verifies all checks pass
2. Backs up production database
3. Runs migrations
4. Deploys code
5. Runs post-deployment verification
6. Provides rollback command if needed

## Real Commands Reference

### Memory Commands

**Save technology decisions:**
```
Remember that TaskFlow backend uses Node.js 20 LTS with Express 4.x
```

**Recall decisions:**
```
What database does TaskFlow use?
```

**Search memories:**
```
Find all memories about authentication
```

**List all memories:**
```
Show all TaskFlow memories
```

### Planning Commands

**Create tasks with dependencies:**
```
Create a TODO for TaskFlow with backend and frontend as dependencies
```

**Update task status:**
```
Mark TaskFlow backend development as in progress
```

**View task hierarchy:**
```
Show me the TaskFlow task tree with progress
```

**Get blocker report:**
```
What tasks are blocking other work in TaskFlow?
```

### Agent Commands

**Spawn an agent:**
```
Spawn a backend developer agent to implement the task creation endpoint
```

**Check agent status:**
```
Check status of the backend developer agent
```

**Get agent results:**
```
Get the result from the backend developer agent
```

**Terminate an agent:**
```
Stop the database optimization agent
```

**List all agents:**
```
Show all active agents
```

### TDD Commands

**Start TDD cycle:**
```
Begin TDD for the TaskService class
```

**Write failing test:**
```
RED phase: Write a failing test for task filtering by status
```

**Implement code:**
```
GREEN phase: Make the task filtering test pass with minimal implementation
```

**Refactor code:**
```
REFACTOR phase: Improve the task filtering code while keeping tests green
```

**Verify tests pass:**
```
Run all tests for TaskFlow and show coverage
```

## Workflow Summary

Here's the typical FLUX workflow for full-stack development:

**Day 1: Planning & Memory**
1. Save architecture and tech decisions
2. Create task tree with dependencies
3. Identify blockers

**Day 2-5: Parallel Development**
1. Spawn agents for different components
2. Agents work in parallel
3. You integrate and test results
4. Update task status

**Day 6-8: TDD & Quality**
1. Write tests for critical paths
2. Make tests pass
3. Refactor code
4. Achieve target coverage (85%+)

**Day 9-10: Integration & Deployment**
1. Run complete test suite
2. Verify all tasks are complete
3. Deploy to production
4. Monitor for issues

## Key Takeaways

1. **Memory = Team Knowledge**: All decisions documented and searchable
2. **Planning = Visibility**: Everyone knows what's happening and what's blocked
3. **Agents = Parallelization**: Work on multiple features simultaneously
4. **TDD = Quality**: High confidence in code correctness
5. **Coordination = Teamwork**: Agents stay synchronized without manual handoffs

This workflow reduces:
- Context switching (Memory keeps context)
- Meetings (Task status visible to all)
- Integration time (Agents coordinate)
- Bugs (TDD catches issues early)
- Manual work (Agents automate)

## Next Steps

Once you've completed a project with FLUX:

1. Review what worked and what didn't
2. Refine your memory structure for future projects
3. Create custom agent prompts for your domain
4. Build a library of useful test templates
5. Share team workflows with colleagues

FLUX improves with use - the more you practice, the more efficient your development becomes.

---

Ready to build something amazing with FLUX? Start with a smaller project to get comfortable, then apply these patterns to larger applications.
