---
slug: tdd-guide
title: Test-Driven Development - Complete User Guide
category: feature
difficulty: intermediate
estimatedTime: 20
tags: [tdd, testing, red-green-refactor, workflow, development]
relatedGuides: [agents-guide, planning-guide, memory-guide]
version: 2.0.0
excerpt: Master the Red-Green-Refactor cycle to write better code with confidence and test coverage.
---

# TDD (Test-Driven Development) User Guide

Test-Driven Development (TDD) is a workflow where you write tests first, then code to make them pass, then improve the code. It leads to better design, fewer bugs, and code you can confidently refactor.

## What is TDD?

TDD is a development approach with three phases that repeat:

1. **RED** - Write a test that fails (code doesn't exist yet)
2. **GREEN** - Write the simplest code to make the test pass
3. **REFACTOR** - Improve the code while keeping tests passing

**Key benefits:**
- Tests document how code should work
- Catch bugs early, before they reach production
- Refactor with confidence - tests catch regressions
- Better code design from thinking about usage first
- Improved code quality and maintainability

## The Red-Green-Refactor Cycle

### RED Phase: Write a Failing Test

Start by writing a test for behavior that doesn't exist yet:

```
You: "Start TDD for user registration feature"
FLUX: Enter RED phase - time to write a failing test

You write test that checks:
- Valid email + password → success
- Invalid email → error
- Weak password → error
- Duplicate email → error
```

**The test will FAIL because the code doesn't exist. That's the point!**

### GREEN Phase: Make It Pass

Write the simplest code to make the test pass:

```
You: "GREEN - Make the test pass"
FLUX: Now implement the minimum code needed

You implement:
- Email validation
- Password validation
- User creation
- Error handling

Test now PASSES
```

Don't over-engineer. Just make the test pass.

### REFACTOR Phase: Improve the Code

Make the code better while keeping tests passing:

```
You: "REFACTOR - Improve the implementation"
FLUX: Update code quality while tests verify correctness

You improve:
- Extract validation functions
- Better error messages
- Cleaner code structure
- Remove duplication

Tests still PASS - your safety net caught any issues
```

Then cycle back - write another test and repeat.

## Main Operations

### Start RED Phase

Begin a TDD cycle:

```
Say: "Start TDD for email validation"
Or: "Begin RED phase for authentication"
```

### Write Failing Test

Create a test that documents expected behavior:

```
You write test like:
"When email is 'user@example.com', validation succeeds"
"When email is 'invalid', validation fails"

Test fails because the function doesn't exist yet
```

### Verify RED Phase

Confirm your test fails as expected:

```
Request: "Verify the test fails"
FLUX: Confirms test failure is correct

You get: "RED phase verified - test fails as expected"
```

### Move to GREEN Phase

Write code to pass the test:

```
You: "Move to GREEN - implement the feature"

You write code to make test pass

Then request: "Confirm GREEN - tests pass"
```

### Refactor Code

Improve the implementation:

```
You: "REFACTOR while keeping tests passing"

You improve code, run tests after each change

Request: "Verify tests still pass"
FLUX: Confirms refactoring didn't break anything
```

## Key Use Cases

### 1. Building New Features

Feature development with confidence:

```
RED:
Write tests for: user registration, email validation, password rules

GREEN:
Implement registration function with validation

REFACTOR:
Extract validation into separate functions, improve error messages

Repeat with more complex scenarios
```

### 2. Fixing Bugs

Find and fix bugs with tests:

```
RED:
Write test that reproduces the bug (test fails)

GREEN:
Fix the bug (test now passes)

REFACTOR:
Improve the fix if needed

Result: Bug is fixed AND protected by a test
```

### 3. Refactoring Code

Improve code safely:

```
Start:
Have existing code with tests (good test coverage)

REFACTOR:
Change code structure, simplify, optimize

Tests verify: You didn't break anything while improving
```

### 4. Adding Edge Cases

Cover all scenarios:

```
First cycle:
Test happy path (normal use)

Later cycles:
Test edge cases (null, empty, boundary values)

Each gets: RED → GREEN → REFACTOR cycle
```

### 5. API Development

Build APIs with clear contracts:

```
RED:
Write tests defining API responses and error codes

GREEN:
Implement endpoints to pass tests

REFACTOR:
Improve implementation quality, add caching, optimize queries
```

## Example Workflow

### Feature: Email Validation

#### Cycle 1: Valid Email

```
RED PHASE:
Test: "Valid email 'user@example.com' should pass validation"
Status: Test fails (function doesn't exist)

GREEN PHASE:
Implement: Simple function that checks for @ and .
Status: Test passes

REFACTOR PHASE:
Improve: Use regex for better validation
Status: Test still passes
```

#### Cycle 2: Invalid Emails

```
RED PHASE:
Test: "Invalid email 'notanemail' should fail"
Status: Test fails

GREEN PHASE:
Implement: Same validation catches this
Status: Test passes

REFACTOR PHASE:
Extract validation logic to separate function
```

#### Cycle 3: Edge Cases

```
RED PHASE:
Tests: Empty string, spaces, special characters should fail

GREEN PHASE:
Enhance validation to handle edge cases

REFACTOR PHASE:
Clean up code, add helpful error messages
```

### Feature: User Registration

#### Step 1: Design Tests

```
Write test for:
✓ Valid email + password → creates user
✓ Invalid email → error
✓ Weak password → error
✓ Duplicate email → error
✓ Creates unique user ID
```

#### Step 2: RED Phase

```
You: "Start TDD for user registration"
FLUX: Ready for RED phase

You: Write all the tests above
Tests: All fail (function doesn't exist)
```

#### Step 3: GREEN Phase

```
You: "Move to GREEN - implement basic registration"

Implement minimum code:
- Check email validity
- Check password strength
- Save user to database
- Return user object

Tests: All pass
```

#### Step 4: REFACTOR Phase

```
You: "REFACTOR to improve code"

Improvements:
- Extract email validation function
- Extract password strength function
- Add better error messages
- Handle duplicate users

Tests: Still all pass (safety net works!)
```

## Best Practices

### Write Good Tests

**Focus on behavior, not implementation:**

```
Good test:
"Password 'weak' should fail validation" (tests behavior)

Bad test:
"ValidationUtils.checkLength should be called" (tests internals)
```

**One clear purpose per test:**

```
Good:
Test: "Valid email passes"
Test: "Invalid email fails"

Bad:
Test: "Email works and password works and user saves"
```

**Test real scenarios:**

```
Good:
"Empty string should fail"
"Null should fail"
"Very long email should fail"
"Normal email should pass"

Bad:
"Happy path works"
```

### Write Simple Code

In GREEN phase, keep it simple:

```
Good implementation (GREEN phase):
function validateEmail(email) {
  return email.includes('@');
}

Too complex (GREEN phase):
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // ...complex logic...
}
```

Better implementation (REFACTOR phase):

```
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### Refactor Safely

Always run tests while refactoring:

```
1. Change one thing in code
2. Run tests
3. All pass? Continue
4. All fail? Revert change
5. Repeat with next change
```

### Handle Errors

Test error scenarios:

```
Tests for valid cases:
"Valid input produces expected output"

Tests for error cases:
"Null input throws error"
"Invalid input returns error object"
"Unauthorized access is rejected"
```

## Integration Tips

### With Planning

Organize TDD work:

```
Create TODO: "Implement payment with TDD"

Subtasks:
├─ Write tests for valid payment
├─ Implement payment (GREEN)
├─ Add error case tests
├─ Implement error handling
├─ Refactor and improve

Track progress as you complete each cycle
```

### With Agents

Use agents for code and tests:

```
RED: "Use specialist_coder to write comprehensive tests
for user registration including all validation cases"

Agent writes tests you implement against

GREEN: You implement to pass tests

REFACTOR: "Use specialist_optimizer to improve the code"
while tests ensure nothing breaks
```

### With Memory

Remember testing standards:

```
Save: "Testing requirements - 80% coverage minimum,
test happy path AND edge cases, use vitest framework"

Use in TDD: "Write tests following our saved standards"
```

## Common Patterns

### Feature Implementation Pattern

```
Feature: Real-time notifications

Cycle 1 - Core functionality
RED:   Write test for sending notification
GREEN: Implement basic sending
REFACTOR: Clean up

Cycle 2 - Error handling
RED:   Write tests for error cases
GREEN: Implement error handling
REFACTOR: Improve error messages

Cycle 3 - Performance
RED:   Write test for bulk sending
GREEN: Implement bulk operation
REFACTOR: Optimize for speed

Cycle 4 - Edge cases
RED:   Write tests for edge cases
GREEN: Handle them
REFACTOR: Improve robustness
```

### Bug Fix Pattern

```
Bug: Users can register with invalid emails

RED: Write test that reproduces bug
(Test fails - invalid email accepted)

GREEN: Fix validation to reject invalid emails
(Test passes)

REFACTOR: Improve validation logic
(Test still passes)

Result: Bug fixed and protected by test
```

### Refactoring Pattern

```
Have: Messy code with existing tests

REFACTOR: Simplify code structure
(Run tests after each change)

Each step: Change one thing, verify tests pass

Result: Cleaner code, same functionality, tests confirm
```

## Tips & Tricks

### Start Simple

Don't write 100 tests at once:

```
Better:
1. Write 1 test
2. Make it pass
3. Refactor
4. Repeat

Not: Write all tests at once
```

### Skip Unnecessary Details

In GREEN phase, avoid premature complexity:

```
GREEN goal: Pass the test, nothing more

Test: "Valid password should work"
Implementation: return true; // Good for GREEN!

REFACTOR: Now add real validation
```

### Run Tests Frequently

After every small change:

```
Change one line → Run tests
Pass? Continue to next change
Fail? Revert and fix
```

### Track Test Coverage

Make sure you're testing enough:

```
"Show test coverage"
FLUX: 78% coverage

Areas to add tests:
- Error handling paths
- Edge cases
- Integration points
```

### Test Documentation

Good tests document code behavior:

```
Reading the test tells you:
- What the function does
- What inputs it accepts
- What outputs it produces
- What errors it handles

So tests ARE documentation
```

### Time Estimates

TDD often feels slower at first:

```
Without TDD:
Fast to write code, slow to debug bugs

With TDD:
Slightly slower to write, fast to ship confident code
Very fast to maintain and refactor

Over full project lifecycle: TDD is faster
```

## Troubleshooting

**Test fails but I'm sure code is right:**
- Check test logic - might be wrong
- Verify the error message
- Try simpler implementation

**Too many tests failing at once:**
- Fix one at a time
- TDD is cycle by cycle
- Don't try to pass all at once

**Not sure what to test next:**
- Think about user scenarios
- Test happy path first
- Then add error cases
- Then edge cases

**Code quality isn't improving:**
- REFACTOR phase is where quality improves
- Don't skip refactoring
- Use tests as safety net to refactor more aggressively

**Tests are slow:**
- Might need to refactor test setup
- Consider test isolation
- Mock external dependencies

## Next Steps

- Learn **Planning Guide** to organize TDD sessions
- Explore **Agents Guide** to delegate testing/coding work
- Check **Memory Guide** to save testing standards

---

TDD feels different at first, but developers who use it consistently become more productive. Start with small features and practice the cycle until it becomes natural.
