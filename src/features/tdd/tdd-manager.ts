import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { TDDStore, TDDTestRun } from './tdd-store.js';
import type { ToolMetadata } from '../../core/types.js';
import {
  TDDRedInputSchema,
  TDDGreenInputSchema,
  TDDRefactorInputSchema,
  TDDVerifyInputSchema,
  validateInput,
  type TDDRedInput,
  type TDDGreenInput,
  type TDDRefactorInput,
  type TDDVerifyInput,
} from '../../validation/schemas.js';

/**
 * Test runner type
 */
type TestRunner = 'jest' | 'vitest' | 'mocha' | 'unknown';

// Re-export types for backwards compatibility
export type { TDDRedInput, TDDGreenInput, TDDRefactorInput, TDDVerifyInput };

/**
 * TDD Feature Manager
 *
 * Implements RED-GREEN-REFACTOR workflow with test-first enforcement.
 * Inspired by obra/superpowers but simplified and integrated with Planning.
 */
export class TDDManager {
  private store: TDDStore;
  private detectedRunner: TestRunner | null = null;

  constructor(dbPath: string = ':memory:') {
    this.store = new TDDStore(dbPath);
  }

  /**
   * Get tool definitions for MCP
   */
  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'tdd_red',
        description:
          'RED phase: Create and run a failing test. This is the first step in TDD - write a test that fails before implementing the feature. Verifies the test actually fails to ensure it is testing something real.',
        inputSchema: {
          type: 'object',
          properties: {
            testPath: {
              type: 'string',
              description: 'Path to the test file (e.g., tests/auth.test.ts)',
            },
            description: {
              type: 'string',
              description: 'Description of what this test validates',
            },
          },
          required: ['testPath', 'description'],
        },
        serverId: 'internal:tdd',
        category: 'tdd',
      },
      {
        name: 'tdd_green',
        description:
          'GREEN phase: Implement minimal code to make the test pass. After RED phase, write just enough code to make the failing test pass. Verifies the test now passes.',
        inputSchema: {
          type: 'object',
          properties: {
            testPath: {
              type: 'string',
              description: 'Path to the test file to verify',
            },
            implementationPath: {
              type: 'string',
              description: 'Path to the implementation file',
            },
          },
          required: ['testPath'],
        },
        serverId: 'internal:tdd',
        category: 'tdd',
      },
      {
        name: 'tdd_refactor',
        description:
          'REFACTOR phase: Improve code quality while keeping tests green. After GREEN phase, refactor the code to improve quality, performance, or readability. Re-runs all tests to ensure nothing breaks.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to refactor',
            },
          },
          required: ['filePath'],
        },
        serverId: 'internal:tdd',
        category: 'tdd',
      },
      {
        name: 'tdd_verify',
        description:
          'Run full test suite and check coverage. Verifies all tests pass and calculates code coverage. Useful for final validation before committing.',
        inputSchema: {
          type: 'object',
          properties: {
            minCoverage: {
              type: 'number',
              description: 'Minimum coverage percentage required (default: 80)',
            },
          },
        },
        serverId: 'internal:tdd',
        category: 'tdd',
      },
    ];
  }

  /**
   * Handle tool calls with Zod validation
   */
  async handleToolCall(toolName: string, args: unknown): Promise<unknown> {
    switch (toolName) {
      case 'tdd_red': {
        const validation = validateInput(TDDRedInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.red(validation.data!.testPath, validation.data!.description);
      }
      case 'tdd_green': {
        const validation = validateInput(TDDGreenInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.green(validation.data!.testPath, validation.data!.implementationPath);
      }
      case 'tdd_refactor': {
        const validation = validateInput(TDDRefactorInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.refactor(validation.data!.filePath);
      }
      case 'tdd_verify': {
        const validation = validateInput(TDDVerifyInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.verify(validation.data!.minCoverage);
      }
      default:
        throw new Error(`Unknown TDD tool: ${toolName}`);
    }
  }

  /**
   * RED: Create and run failing test
   */
  private async red(testPath: string, description: string): Promise<{
    success: boolean;
    message: string;
    status: 'red' | 'error';
    output: string;
    testPath: string;
    runId: string;
  }> {
    // Check if test file exists
    if (!existsSync(testPath)) {
      return {
        success: false,
        message: `Test file not found: ${testPath}. Create the test file first.`,
        status: 'error',
        output: '',
        testPath,
        runId: '',
      };
    }

    // Detect test runner
    const runner = await this.detectTestRunner();

    // Run the test
    const startTime = Date.now();
    const result = await this.runTest(testPath, runner);
    const duration = Date.now() - startTime;

    // Save test run
    const runId = randomUUID();
    const testRun: TDDTestRun = {
      id: runId,
      testPath,
      status: 'red',
      runner,
      output: result.output,
      timestamp: Date.now(),
      duration,
    };
    this.store.save(testRun);

    // In RED phase, test SHOULD fail
    if (!result.success) {
      return {
        success: true,
        message: `✅ RED phase complete! Test fails as expected.\n\nDescription: ${description}\n\nNow implement the code to make it pass (GREEN phase).`,
        status: 'red',
        output: result.output,
        testPath,
        runId,
      };
    } else {
      return {
        success: false,
        message: `⚠️  Test passed immediately! This violates TDD - you should write a FAILING test first.\n\nEither:\n1. The test is not testing anything meaningful\n2. The feature is already implemented\n\nRewrite the test to actually test something that doesn't exist yet.`,
        status: 'error',
        output: result.output,
        testPath,
        runId,
      };
    }
  }

  /**
   * GREEN: Verify test now passes
   */
  private async green(
    testPath: string,
    implementationPath?: string
  ): Promise<{
    success: boolean;
    message: string;
    status: 'green' | 'red' | 'error';
    output: string;
    testPath: string;
    implementationPath?: string;
    runId: string;
  }> {
    // Check previous run
    const previousRun = this.store.getLatest(testPath);
    if (!previousRun) {
      return {
        success: false,
        message: `❌ No previous test run found. Run tdd_red first to establish RED phase.`,
        status: 'error',
        output: '',
        testPath,
        implementationPath,
        runId: '',
      };
    }

    if (previousRun.status !== 'red') {
      return {
        success: false,
        message: `⚠️  Last run was ${previousRun.status.toUpperCase()}, not RED. Follow the cycle: RED → GREEN → REFACTOR`,
        status: 'error',
        output: '',
        testPath,
        implementationPath,
        runId: '',
      };
    }

    // Run the test again
    const runner = await this.detectTestRunner();
    const startTime = Date.now();
    const result = await this.runTest(testPath, runner);
    const duration = Date.now() - startTime;

    // Save test run
    const runId = randomUUID();
    const testRun: TDDTestRun = {
      id: runId,
      testPath,
      status: result.success ? 'green' : 'red',
      runner,
      output: result.output,
      timestamp: Date.now(),
      duration,
    };
    this.store.save(testRun);

    if (result.success) {
      return {
        success: true,
        message: `✅ GREEN phase complete! Test now passes.\n\n${implementationPath ? `Implementation: ${implementationPath}\n` : ''}Time to refactor (optional) or move to next feature.`,
        status: 'green',
        output: result.output,
        testPath,
        implementationPath,
        runId,
      };
    } else {
      return {
        success: false,
        message: `❌ Test still fails. Keep working on the implementation.\n\nExpected: Test passes (GREEN)\nActual: Test fails (still RED)`,
        status: 'red',
        output: result.output,
        testPath,
        implementationPath,
        runId,
      };
    }
  }

  /**
   * REFACTOR: Improve code while keeping tests green
   */
  private async refactor(filePath: string): Promise<{
    success: boolean;
    message: string;
    status: 'refactored' | 'red' | 'error';
    output: string;
    filePath: string;
    testsRun: number;
  }> {
    // Run all tests to ensure nothing breaks
    const runner = await this.detectTestRunner();
    const startTime = Date.now();
    const result = await this.runAllTests(runner);
    const duration = Date.now() - startTime;

    if (result.success) {
      return {
        success: true,
        message: `✅ REFACTOR phase complete! All tests still pass after refactoring ${filePath}.\n\nDuration: ${duration}ms\nTests run: ${result.testsRun}`,
        status: 'refactored',
        output: result.output,
        filePath,
        testsRun: result.testsRun,
      };
    } else {
      return {
        success: false,
        message: `❌ Refactoring broke tests! Revert changes or fix the failures.\n\nFailed after refactoring: ${filePath}`,
        status: 'red',
        output: result.output,
        filePath,
        testsRun: result.testsRun,
      };
    }
  }

  /**
   * VERIFY: Run full test suite with coverage
   */
  private async verify(minCoverage: number = 80): Promise<{
    success: boolean;
    message: string;
    coverage: number | null;
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    output: string;
  }> {
    const runner = await this.detectTestRunner();
    const result = await this.runAllTestsWithCoverage(runner);

    const coverageCheck = result.coverage !== null && result.coverage >= minCoverage;

    if (result.success && coverageCheck) {
      return {
        success: true,
        message: `✅ All tests pass! Coverage: ${result.coverage?.toFixed(1)}% (target: ${minCoverage}%)`,
        coverage: result.coverage,
        testsRun: result.testsRun,
        testsPassed: result.testsPassed,
        testsFailed: result.testsFailed,
        output: result.output,
      };
    } else if (result.success && !coverageCheck) {
      return {
        success: false,
        message: `⚠️  Tests pass but coverage is low: ${result.coverage?.toFixed(1)}% (target: ${minCoverage}%).\n\nWrite more tests!`,
        coverage: result.coverage,
        testsRun: result.testsRun,
        testsPassed: result.testsPassed,
        testsFailed: result.testsFailed,
        output: result.output,
      };
    } else {
      return {
        success: false,
        message: `❌ ${result.testsFailed} test(s) failed. Fix them before proceeding.`,
        coverage: result.coverage,
        testsRun: result.testsRun,
        testsPassed: result.testsPassed,
        testsFailed: result.testsFailed,
        output: result.output,
      };
    }
  }

  /**
   * Validate path to prevent command injection
   */
  private validatePath(path: string): boolean {
    // Only allow alphanumeric characters, /, _, -, .
    const validPathPattern = /^[a-zA-Z0-9/_.-]+$/;
    return validPathPattern.test(path);
  }

  /**
   * Execute command with spawn (safe from command injection)
   */
  private executeCommand(
    command: string,
    args: string[]
  ): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        shell: false,
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const output = stdout + (stderr ? `\n${stderr}` : '');
        resolve({
          success: code === 0,
          output,
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          output: `Error executing command: ${error.message}`,
        });
      });
    });
  }

  /**
   * Detect which test runner is being used
   */
  private async detectTestRunner(): Promise<TestRunner> {
    if (this.detectedRunner) {
      return this.detectedRunner;
    }

    // Check package.json
    if (existsSync('package.json')) {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.vitest) {
        this.detectedRunner = 'vitest';
        return 'vitest';
      }
      if (deps.jest || deps['@types/jest']) {
        this.detectedRunner = 'jest';
        return 'jest';
      }
      if (deps.mocha) {
        this.detectedRunner = 'mocha';
        return 'mocha';
      }
    }

    this.detectedRunner = 'unknown';
    return 'unknown';
  }

  /**
   * Run a single test file
   */
  private async runTest(
    testPath: string,
    runner: TestRunner
  ): Promise<{ success: boolean; output: string }> {
    // Validate testPath to prevent command injection
    if (!this.validatePath(testPath)) {
      return {
        success: false,
        output: `Invalid test path: ${testPath}. Path must contain only alphanumeric characters, /, _, -, .`,
      };
    }

    let command: string;
    let args: string[];

    switch (runner) {
      case 'vitest':
        command = 'npx';
        args = ['vitest', 'run', testPath, '--no-coverage'];
        break;
      case 'jest':
        command = 'npx';
        args = ['jest', testPath, '--no-coverage'];
        break;
      case 'mocha':
        command = 'npx';
        args = ['mocha', testPath];
        break;
      default:
        command = 'npm';
        args = ['test', '--', testPath];
    }

    return this.executeCommand(command, args);
  }

  /**
   * Run all tests
   */
  private async runAllTests(
    runner: TestRunner
  ): Promise<{ success: boolean; output: string; testsRun: number }> {
    let command: string;
    let args: string[];

    switch (runner) {
      case 'vitest':
        command = 'npx';
        args = ['vitest', 'run', '--no-coverage'];
        break;
      case 'jest':
        command = 'npx';
        args = ['jest', '--no-coverage'];
        break;
      case 'mocha':
        command = 'npx';
        args = ['mocha'];
        break;
      default:
        command = 'npm';
        args = ['test'];
    }

    const result = await this.executeCommand(command, args);
    const testsRun = this.parseTestCount(result.output);

    return {
      success: result.success,
      output: result.output,
      testsRun,
    };
  }

  /**
   * Run all tests with coverage
   */
  private async runAllTestsWithCoverage(
    runner: TestRunner
  ): Promise<{
    success: boolean;
    output: string;
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    coverage: number | null;
  }> {
    let command: string;
    let args: string[];

    switch (runner) {
      case 'vitest':
        command = 'npx';
        args = ['vitest', 'run', '--coverage'];
        break;
      case 'jest':
        command = 'npx';
        args = ['jest', '--coverage'];
        break;
      case 'mocha':
        command = 'npx';
        args = ['nyc', 'mocha'];
        break;
      default:
        command = 'npm';
        args = ['test', '--', '--coverage'];
    }

    const result = await this.executeCommand(command, args);
    const testsRun = this.parseTestCount(result.output);
    const coverage = this.parseCoverage(result.output);

    if (result.success) {
      return {
        success: true,
        output: result.output,
        testsRun,
        testsPassed: testsRun,
        testsFailed: 0,
        coverage,
      };
    } else {
      // Try to parse failed count
      const failedMatch = result.output.match(/(\d+) failed/i);
      const testsFailed = failedMatch ? parseInt(failedMatch[1] ?? '0') : testsRun;

      return {
        success: false,
        output: result.output,
        testsRun,
        testsPassed: testsRun - testsFailed,
        testsFailed,
        coverage,
      };
    }
  }

  /**
   * Parse test count from output
   */
  private parseTestCount(output: string): number {
    const patterns = [
      /(\d+) passed/i,
      /(\d+) tests?/i,
      /Tests:\s+(\d+) passed/i,
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return parseInt(match[1] ?? '0');
      }
    }

    return 0;
  }

  /**
   * Parse coverage percentage from output
   */
  private parseCoverage(output: string): number | null {
    // Look for coverage percentage (various formats)
    const patterns = [
      /All files[^\n]*?(\d+\.?\d*)\s*%/i,
      /Statements\s*:\s*(\d+\.?\d*)\s*%/i,
      /Lines\s*:\s*(\d+\.?\d*)\s*%/i,
      /Coverage:\s*(\d+\.?\d*)\s*%/i,
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return parseFloat(match[1] ?? '0');
      }
    }

    return null;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    store: ReturnType<TDDStore['getStatistics']>;
    runner: TestRunner | null;
  } {
    return {
      store: this.store.getStatistics(),
      runner: this.detectedRunner,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.store.close();
  }
}
