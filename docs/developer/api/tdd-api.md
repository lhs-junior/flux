# TDD Manager API

The TDD Manager implements the RED-GREEN-REFACTOR workflow with test-first enforcement. It supports jest, vitest, and mocha test runners and integrates with the Planning Manager.

## Overview

**Class:** `TDDManager`

**Location:** `src/features/tdd/tdd-manager.ts`

The TDD Manager ensures test-first development by enforcing the RED-GREEN-REFACTOR cycle and providing comprehensive test execution and coverage analysis.

## Methods

### red()

RED phase: Create and run a failing test.

**Signature:**
```typescript
red(testPath: string, description: string): Promise<{
  success: boolean;
  message: string;
  status: 'red' | 'error';
  output: string;
  testPath: string;
  runId: string;
}>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `testPath` | `string` | Yes | Path to the test file (e.g., tests/auth.test.ts) |
| `description` | `string` | Yes | Description of what this test validates |

**Returns:**

```typescript
{
  success: boolean;      // true if test fails as expected
  message: string;       // Detailed message about the result
  status: 'red' | 'error'; // 'red' if successful, 'error' if test passed
  output: string;        // Test runner output
  testPath: string;      // Path to test file
  runId: string;         // Unique ID for this test run
}
```

**Example:**

```typescript
const manager = new TDDManager();

const result = await manager.red(
  'tests/auth.test.ts',
  'User should be able to login with valid credentials'
);

if (result.success) {
  console.log('✅ RED phase complete! Test fails as expected.');
  console.log(result.output);
} else {
  console.log('⚠️  Test passed immediately - not following TDD properly');
}
```

**Exceptions:**

- Throws `Error` if test file not found
- Throws `Error` if test runner not detected
- Returns error status if test unexpectedly passes

---

### green()

GREEN phase: Implement code to make test pass.

**Signature:**
```typescript
green(testPath: string, implementationPath?: string): Promise<{
  success: boolean;
  message: string;
  status: 'green' | 'red' | 'error';
  output: string;
  testPath: string;
  implementationPath?: string;
  runId: string;
}>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `testPath` | `string` | Yes | Path to test file |
| `implementationPath` | `string` | No | Path to implementation file (for logging) |

**Enforcements:**

- Verifies that previous run was RED phase
- Fails if called without running RED first
- Validates that test now passes

**Returns:**

```typescript
{
  success: boolean;           // true if test now passes
  message: string;            // Detailed message with next steps
  status: 'green' | 'red' | 'error'; // 'green' if successful
  output: string;             // Test runner output
  testPath: string;
  implementationPath?: string;
  runId: string;
}
```

**Example:**

```typescript
const result = await manager.green(
  'tests/auth.test.ts',
  'src/auth.ts'
);

if (result.success) {
  console.log('✅ GREEN phase complete! Test passes.');
  console.log('Time to refactor (optional) or move to next feature.');
}
```

**Exceptions:**

- Throws `Error` if test file not found
- Returns error if no previous RED phase
- Returns error if test still fails

---

### refactor()

REFACTOR phase: Improve code while keeping tests green.

**Signature:**
```typescript
refactor(filePath: string): Promise<{
  success: boolean;
  message: string;
  status: 'refactored' | 'red' | 'error';
  output: string;
  filePath: string;
  testsRun: number;
}>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `filePath` | `string` | Yes | Path to the file being refactored |

**Behavior:**

- Runs entire test suite (not just one file)
- Verifies all tests still pass after refactoring
- Prevents regressions

**Returns:**

```typescript
{
  success: boolean;           // true if all tests pass
  message: string;            // Feedback about refactoring result
  status: 'refactored' | 'red' | 'error'; // Final status
  output: string;             // Test runner output
  filePath: string;
  testsRun: number;           // Number of tests executed
}
```

**Example:**

```typescript
const result = await manager.refactor('src/auth.ts');

if (result.success) {
  console.log(`✅ REFACTOR phase complete! All ${result.testsRun} tests pass.`);
} else {
  console.log('❌ Refactoring broke tests. Revert changes.');
}
```

**Exceptions:**

- Throws `Error` if file path is invalid
- Returns error if refactoring breaks tests

---

### verify()

VERIFY: Run full test suite with coverage validation.

**Signature:**
```typescript
verify(minCoverage?: number): Promise<{
  success: boolean;
  message: string;
  coverage: number | null;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  output: string;
}>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `minCoverage` | `number` | No | Minimum coverage % required (default: 80) |

**Returns:**

```typescript
{
  success: boolean;          // true if all tests pass AND coverage sufficient
  message: string;           // Detailed result message
  coverage: number | null;   // Coverage percentage (if available)
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  output: string;            // Test runner output
}
```

**Example:**

```typescript
const result = await manager.verify(85);

if (result.success) {
  console.log(`✅ All tests pass! Coverage: ${result.coverage}%`);
} else if (result.testsFailed > 0) {
  console.log(`❌ ${result.testsFailed} tests failed`);
} else {
  console.log(`⚠️  Coverage too low: ${result.coverage}% (target: 85%)`);
}
```

**Exceptions:**

- Throws `Error` if test runner not available
- Returns error if execution times out

---

## Test Runner Detection

The TDD Manager automatically detects available test runners:

1. **vitest** - Fastest, preferred for modern projects
2. **jest** - Popular, widely used
3. **mocha** - Classic, requires nyc for coverage
4. **npm test** - Fallback command

Detection order (from package.json):
```typescript
if (deps.vitest) return 'vitest';
if (deps.jest || deps['@types/jest']) return 'jest';
if (deps.mocha) return 'mocha';
return 'unknown';
```

## TDD Workflow Example

```typescript
const manager = new TDDManager();

// 1. RED: Write failing test
const red = await manager.red(
  'tests/calculator.test.ts',
  'Add should sum two numbers'
);
console.log(red.message);

// 2. GREEN: Implement functionality
// ... implement src/calculator.ts ...
const green = await manager.green(
  'tests/calculator.test.ts',
  'src/calculator.ts'
);
console.log(green.message);

// 3. REFACTOR: Improve code quality
const refactor = await manager.refactor('src/calculator.ts');
console.log(refactor.message);

// 4. VERIFY: Final validation
const verify = await manager.verify(80);
console.log(verify.message);
```

## Integration with Planning Manager

Use with PlanningManager for TDD task tracking:

```typescript
const planningManager = new PlanningManager();

const todo = planningManager.create({
  content: 'Implement calculator add function',
  type: 'tdd',
  testPath: 'tests/calculator.test.ts'
});

// Run TDD cycle
const red = await tddManager.red(
  'tests/calculator.test.ts',
  'Add two numbers'
);

// Update TODO status
planningManager.update({
  id: todo.todo.id,
  tddStatus: 'red',
  status: 'in_progress'
});
```

## Resource Cleanup

Always close the manager when done:

```typescript
manager.close();
```

This closes the database connection and stops any monitoring processes.

## Safety Features

- **Path validation**: Prevents command injection via path sanitization
- **Output limits**: Caps stdout/stderr to prevent memory exhaustion
- **Timeout enforcement**: Kills runaway processes
- **Coverage validation**: Ensures code quality standards

See TDD Manager implementation for security details.
