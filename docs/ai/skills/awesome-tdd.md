---
name: awesome-tdd
description: Test-Driven Development workflow enforcement
triggers:
  - tdd
  - red green refactor
  - test first
  - testing
---

# Awesome TDD

Test-Driven Development workflow system enforcing the RED-GREEN-REFACTOR cycle for test-first development.

## When to Use

- Follow TDD methodology strictly
- Enforce test-first approach in your team
- Verify code coverage thresholds
- Maintain high test quality standards

## TDD Cycle Overview

The RED-GREEN-REFACTOR cycle ensures quality code through disciplined testing:

1. **RED**: Write a failing test that documents desired behavior
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve code quality while tests remain green

## Commands

### RED Phase - Write Failing Test
```bash
npx awesome-plugin tdd red <test-path> [--json]
```
Validates that your test fails before implementation. Prevents writing tests after code.

### GREEN Phase - Make Test Pass
```bash
npx awesome-plugin tdd green <test-path> [--json]
```
Runs test and confirms it passes. Enforces minimal implementation principle.

### REFACTOR Phase - Improve Code
```bash
npx awesome-plugin tdd refactor <file-path> [--json]
```
Refactors implementation while maintaining test coverage. No behavior changes.

### Verify Suite - Check Coverage
```bash
npx awesome-plugin tdd verify [--coverage <number>] [--json]
```
Validates entire test suite and coverage threshold (default: 80%). Exits with failure if threshold not met.

## Test Runner Auto-Detection

Automatically detects and uses:
- **Jest** (Recommended for TypeScript)
- **Vitest** (Fast, modern alternative)
- **Mocha** (Classic test framework)

No configuration needed - plugin detects your test setup automatically.

## Examples

**Example 1: RED-GREEN Cycle**
```bash
# Step 1: RED - Write test that fails
$ npx awesome-plugin tdd red tests/calculator.test.ts
✗ Test failed (expected): Calculator.add is not defined

# Step 2: GREEN - Implement feature
# (Edit src/calculator.ts to add add function)

$ npx awesome-plugin tdd green tests/calculator.test.ts
✓ Test passed: Calculator.add works correctly
```

**Example 2: REFACTOR Safely**
```bash
$ npx awesome-plugin tdd refactor src/calculator.ts
✓ All tests pass (12 tests, 95% coverage)
✓ Ready to improve implementation
```

**Example 3: Coverage Verification**
```bash
$ npx awesome-plugin tdd verify --coverage 90
✓ Coverage: 92% (exceeds 90% threshold)
✓ All 48 tests passing
```
