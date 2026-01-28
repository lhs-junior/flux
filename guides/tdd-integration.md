---
slug: tdd-integration
title: Test-Driven Development Workflow
category: tutorial
difficulty: intermediate
estimatedTime: 30
tags: [tdd, testing, workflow, red-green-refactor]
relatedTools: [tdd_red, tdd_green, tdd_refactor, tdd_verify]
prerequisites: [getting-started]
version: 1.0.0
excerpt: Follow test-driven development with structured Red-Green-Refactor cycles and test verification.
---

# Test-Driven Development Workflow

The TDD system provides structured test-driven development with Red-Green-Refactor cycle tracking, test management, and implementation guidance.

## Overview

The TDD workflow supports:
- **Red-Green-Refactor cycles**: Structured TDD phases
- **Test tracking**: Monitor test status and coverage
- **Implementation guidance**: Suggestions for making tests pass
- **Refactoring support**: Safe code improvements with test coverage
- **Progress monitoring**: Track TDD sessions and outcomes

## Step 1: Start the RED Phase

Begin TDD by entering the RED phase - write a failing test:

```typescript
// Use the tdd_red tool
{
  "feature": "user-registration",
  "description": "Implement user registration with email validation"
}
```

Expected output:
```json
{
  "success": true,
  "testRun": "uuid-here",
  "phase": "red",
  "feature": "user-registration",
  "message": "RED phase: Write a failing test."
}
```

The RED phase requires a failing test before implementation.

Hints:
- Use descriptive feature names
- Include clear descriptions
- Focus on one behavior per test

## Step 2: Write a Failing Test

Write a test that documents the desired behavior:

```typescript
// Create tests/user-registration.test.ts
import { describe, it, expect } from 'vitest';
import { registerUser } from '../src/auth/register';

describe('User Registration', () => {
  it('should register user with valid email', async () => {
    const result = await registerUser({
      email: 'user@example.com',
      password: 'SecurePass123!'
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('user@example.com');
  });
});
```

This test describes what the code should do, even though it doesn't exist yet.

Check: Run tests to verify they fail (expected in RED phase)

## Step 3: Verify Tests Fail (Confirm RED)

Verify your test fails for the right reason:

```typescript
// Use the tdd_verify tool
{
  "testPath": "tests/user-registration.test.ts"
}
```

Expected output:
```json
{
  "success": true,
  "phase": "red",
  "testResults": {
    "total": 1,
    "passed": 0,
    "failed": 1,
    "status": "failing"
  },
  "message": "RED phase confirmed: Test fails as expected."
}
```

The test fails because `registerUser` doesn't exist yet. This is correct for RED phase.

Hints:
- Tests should fail for the right reason
- Check error messages are meaningful
- Verify test logic is correct

## Step 4: Implement Feature (GREEN Phase)

Write minimal code to make the test pass:

```typescript
// Create src/auth/register.ts
export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  user?: {
    email: string;
    id: string;
  };
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  // Minimal implementation to make test pass
  return {
    success: true,
    user: {
      email: input.email,
      id: 'temp-id'
    }
  };
}
```

Now use tdd_green to move to the GREEN phase:

```typescript
// Use the tdd_green tool
{
  "testPath": "tests/user-registration.test.ts",
  "implementationPath": "src/auth/register.ts"
}
```

Check: Run tests again to verify they pass

## Step 5: Verify Tests Pass (Confirm GREEN)

Run the test suite to confirm all tests pass:

```typescript
// Use the tdd_verify tool
{
  "testPath": "tests/user-registration.test.ts"
}
```

Expected output:
```json
{
  "success": true,
  "phase": "green",
  "testResults": {
    "total": 1,
    "passed": 1,
    "failed": 0,
    "coverage": "78%",
    "status": "passing"
  },
  "message": "GREEN phase: All tests passing!"
}
```

Now you can refactor with confidence.

## Step 6: Refactor (REFACTOR Phase)

Improve the code while keeping tests green:

```typescript
// Improved implementation with validation and proper ID generation
import { randomUUID } from 'crypto';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  user?: {
    email: string;
    id: string;
  };
  error?: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  // Validate email
  if (!isValidEmail(input.email)) {
    return {
      success: false,
      error: 'Invalid email format'
    };
  }

  // Generate proper UUID
  const userId = randomUUID();

  return {
    success: true,
    user: {
      email: input.email,
      id: userId
    }
  };
}
```

Use tdd_refactor to verify refactoring keeps tests green:

```typescript
// Use the tdd_refactor tool
{
  "testPath": "tests/user-registration.test.ts",
  "description": "Add email validation and proper ID generation"
}
```

Check: Verify tests still pass after refactoring

## Step 7: Add More Tests (Cycle Back to RED)

Add tests for edge cases:

```typescript
// Add to tests/user-registration.test.ts
it('should reject invalid email format', async () => {
  const result = await registerUser({
    email: 'invalid-email',
    password: 'SecurePass123!'
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe('Invalid email format');
});

it('should generate unique user IDs', async () => {
  const result1 = await registerUser({
    email: 'user1@example.com',
    password: 'Pass123!'
  });

  const result2 = await registerUser({
    email: 'user2@example.com',
    password: 'Pass123!'
  });

  expect(result1.user.id).not.toBe(result2.user.id);
});
```

Cycle back to RED → GREEN → REFACTOR for each new test.

## Step 8: Final Verification

Run full test suite with coverage verification:

```typescript
// Use the tdd_verify tool with coverage check
{
  "testPath": "tests/user-registration.test.ts",
  "coverage": true,
  "threshold": 80
}
```

Expected output:
```json
{
  "success": true,
  "phase": "green",
  "testResults": {
    "total": 3,
    "passed": 3,
    "failing": 0,
    "coverage": "95%"
  },
  "message": "All tests passing with excellent coverage!"
}
```

Track cycles completed and coverage metrics.

## The Red-Green-Refactor Cycle

### RED Phase: Write Failing Test

**Goal**: Define expected behavior

```typescript
// Test describes what SHOULD happen
it('should validate email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('invalid')).toBe(false);
});
```

**Characteristics**:
- Test fails (function doesn't exist or returns wrong value)
- Failure message is clear and helpful
- Test is focused on one behavior

### GREEN Phase: Make It Pass

**Goal**: Write minimal code to pass the test

```typescript
// Simplest implementation that works
function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}
```

**Characteristics**:
- Test passes
- Code is simple (not necessarily perfect)
- No extra features added

### REFACTOR Phase: Improve Code

**Goal**: Enhance quality while keeping tests green

```typescript
// Better implementation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}
```

**Characteristics**:
- Tests still pass
- Code is cleaner, more efficient, or more maintainable
- No behavior changes

## Best Practices

### Writing Tests

1. **Start with the simplest test**: Build complexity gradually
   ```typescript
   // Start here
   it('should return true for valid input', () => {
     expect(validate('valid')).toBe(true);
   });

   // Then add edge cases
   it('should return false for empty input', () => {
     expect(validate('')).toBe(false);
   });
   ```

2. **One assertion per test**: Tests are clearer and failures are specific
   ```typescript
   // Good: Clear failure point
   it('should set status to active', () => {
     expect(user.status).toBe('active');
   });

   it('should set created timestamp', () => {
     expect(user.createdAt).toBeDefined();
   });

   // Avoid: Multiple assertions
   it('should create user correctly', () => {
     expect(user.status).toBe('active');
     expect(user.createdAt).toBeDefined();
     expect(user.id).toBeDefined();
   });
   ```

3. **Test behavior, not implementation**: Focus on what, not how
   ```typescript
   // Good: Tests behavior
   it('should hash password before saving', async () => {
     await saveUser({ password: 'plain' });
     const saved = await getUser();
     expect(saved.password).not.toBe('plain');
   });

   // Avoid: Tests implementation
   it('should call bcrypt.hash', () => {
     expect(bcrypt.hash).toHaveBeenCalled();
   });
   ```

### Implementation

1. **Write minimum code**: Don't over-engineer
2. **Keep it simple**: Complexity comes through refactoring
3. **Focus on the test**: Only make the current test pass

### Refactoring

1. **Keep tests green**: Run tests after each change
2. **Make small changes**: Easy to revert if something breaks
3. **Common refactorings**:
   - Extract functions
   - Rename variables
   - Remove duplication
   - Improve error handling
   - Add types/interfaces

### TDD Workflow

1. **RED**: Write failing test first, always
2. **GREEN**: Write simplest code to pass
3. **REFACTOR**: Improve code quality
4. **REPEAT**: Add next test, start cycle again

## Integration with Other Features

### TDD + Planning

Structure TDD with planning:

```typescript
// Create TODO for TDD feature
planning_create({
  "content": "Implement authentication system with TDD",
  "tags": ["tdd", "auth"]
})

// Create child TODOs for phases
planning_create({
  "content": "Write authentication tests (RED phase)",
  "parentId": "uuid-from-above",
  "tags": ["tdd", "testing"]
})

planning_create({
  "content": "Implement authentication (GREEN phase)",
  "parentId": "uuid-from-above",
  "tags": ["tdd", "implementation"]
})

planning_create({
  "content": "Refactor authentication code",
  "parentId": "uuid-from-above",
  "tags": ["tdd", "refactoring"]
})

// Start TDD RED phase
tdd_red({
  "feature": "authentication"
})
```

### TDD + Agents

Use agents for test and code generation:

```typescript
// Delegate test writing
agent_spawn({
  "agentType": "specialist_coder",
  "task": "Generate comprehensive tests for user authentication"
})

// Use generated tests in TDD RED phase
tdd_red({
  "feature": "authentication"
})

// Delegate implementation
agent_spawn({
  "agentType": "specialist_coder",
  "task": "Implement authentication to pass generated tests"
})

// Move to GREEN phase after implementation
tdd_green({
  "testPath": "tests/auth.test.ts"
})
```

### TDD + Memory

Save TDD insights:

```typescript
memory_save({
  "key": "tdd_lesson_edge_cases",
  "value": "Always test null, undefined, empty string, and boundary values",
  "metadata": {
    "category": "technical",
    "tags": ["tdd", "testing", "lessons"]
  }
})
```

## Common TDD Patterns

### Feature Development

```typescript
// 1. Start RED phase
tdd_red({ "feature": "user-profile-update" })

// 2. Write tests for main path
// Create tests/user-profile.test.ts with happy path tests

// 3. Confirm RED phase (tests fail)
tdd_verify({ "testPath": "tests/user-profile.test.ts" })

// 4. Implement feature
// Create src/user-profile.ts with implementation

// 5. Move to GREEN phase
tdd_green({ "testPath": "tests/user-profile.test.ts" })

// 6. Add edge case tests
// Add more tests to tests/user-profile.test.ts

// 7. Back to RED, then GREEN for edge cases
tdd_red({ "feature": "user-profile-update-edge-cases" })

// 8. Implement edge case handling
tdd_green({ "testPath": "tests/user-profile.test.ts" })

// 9. Refactor
tdd_refactor({ "testPath": "tests/user-profile.test.ts", "description": "Clean up code" })
```

### Bug Fixing with TDD

```typescript
// 1. Write test that reproduces bug
// Create tests/bug-fix.test.ts with failing test case

// 2. Start RED phase - test should fail
tdd_red({ "feature": "null-input-handling" })

// 3. Verify test reproduces bug
tdd_verify({ "testPath": "tests/bug-fix.test.ts" })

// 4. Fix the bug in implementation
// Update src/handler.ts

// 5. Move to GREEN phase
tdd_green({ "testPath": "tests/bug-fix.test.ts" })

// 6. Verify test passes
tdd_verify({ "testPath": "tests/bug-fix.test.ts" })
```

### Refactoring with Test Coverage

```typescript
// 1. Write tests for current behavior first
// Create tests/existing-feature.test.ts covering current code

// 2. Confirm tests pass
tdd_verify({ "testPath": "tests/existing-feature.test.ts" })

// 3. Refactor code
// Update implementation while keeping tests as safety net

// 4. Refactor phase - ensure tests still pass
tdd_refactor({ "testPath": "tests/existing-feature.test.ts", "description": "Improve code structure" })

// 5. Final verification
tdd_verify({ "testPath": "tests/existing-feature.test.ts", "coverage": true })
```

## Measuring Success

### Coverage Metrics

- **Line coverage**: Aim for 80%+ on critical paths
- **Branch coverage**: Test all conditionals
- **Edge cases**: Null, empty, boundary values

### Quality Metrics

- **Test clarity**: Tests are easy to read and understand
- **Test speed**: Tests run quickly (< 1s for unit tests)
- **Test isolation**: Tests don't depend on each other
- **Failure messages**: Clear indication of what broke

### Process Metrics

- **Cycle time**: How long RED → GREEN → REFACTOR takes
- **Refactoring frequency**: How often you improve code
- **Test-first ratio**: Percentage of code written test-first

## Next Steps

- Explore **Agent Orchestration** for test generation
- Learn **Planning Workflow** for organizing TDD sessions
- Check **Memory System** for saving TDD insights

Use `guide_search` to find more tutorials and documentation.
