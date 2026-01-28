/**
 * Science Executor - Python subprocess management
 *
 * Manages Python process execution with session persistence via pickle.
 * Follows the pattern established in tdd-manager.ts for child_process execution.
 */

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import {
  ScienceSession,
  ExecutionLimits,
  ScienceTimeoutError,
  ScienceError,
  DEFAULT_SCIENCE_CONFIG,
} from './science-types.js';
import { ScienceStore } from './science-store.js';

const execAsync = promisify(exec);

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  returnValues?: Record<string, any>;
  variables: Record<string, string>; // variable name -> type
  executionTime: number;
  error?: string;
}

export class ScienceExecutor {
  private store: ScienceStore;
  private venvPath: string;
  private pythonPath: string;
  private limits: ExecutionLimits;
  private sessionDir: string;

  constructor(
    store: ScienceStore,
    venvPath: string = DEFAULT_SCIENCE_CONFIG.venvPath,
    limits: ExecutionLimits = DEFAULT_SCIENCE_CONFIG.limits
  ) {
    this.store = store;
    this.venvPath = venvPath;
    this.pythonPath = this.getPythonPath();
    this.limits = limits;
    this.sessionDir = join(venvPath, '.sessions');

    // Create session directory if it doesn't exist
    if (!existsSync(this.sessionDir)) {
      mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  /**
   * Get the Python executable path from venv
   */
  private getPythonPath(): string {
    const isWindows = process.platform === 'win32';
    const binDir = isWindows ? 'Scripts' : 'bin';
    const pythonExe = isWindows ? 'python.exe' : 'python';
    return join(this.venvPath, binDir, pythonExe);
  }

  /**
   * Execute Python code with optional session persistence
   */
  async executePython(
    code: string,
    sessionId?: string,
    options: {
      captureOutput?: boolean;
      returnVars?: string[];
      timeout?: number;
    } = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = options.timeout || this.limits.timeoutMs;

    try {
      // Prepare execution environment
      const execId = randomUUID();
      const scriptPath = join(this.sessionDir, `exec_${execId}.py`);
      const outputPath = join(this.sessionDir, `output_${execId}.json`);

      // Load session if provided
      let session: ScienceSession | undefined;
      let pickleFile: string | undefined;

      if (sessionId) {
        session = this.store.getSession(sessionId);
        if (!session) {
          throw new ScienceError(
            `Session not found: ${sessionId}`,
            'SESSION_NOT_FOUND'
          );
        }
        pickleFile = join(this.sessionDir, `session_${sessionId}.pkl`);
      }

      // Generate Python script with session restoration and capture logic
      const pythonScript = this.generateExecutionScript(
        code,
        pickleFile,
        outputPath,
        options.returnVars || [],
        options.captureOutput !== false
      );

      writeFileSync(scriptPath, pythonScript, 'utf-8');

      // Execute with timeout
      const result = await this.executeWithTimeout(scriptPath, timeout);

      // Parse output
      let outputData: any = {};
      if (existsSync(outputPath)) {
        try {
          const outputContent = readFileSync(outputPath, 'utf-8');
          outputData = JSON.parse(outputContent);
          unlinkSync(outputPath);
        } catch (err) {
          // Ignore parse errors
        }
      }

      // Cleanup script
      if (existsSync(scriptPath)) {
        unlinkSync(scriptPath);
      }

      // Update session if provided
      if (sessionId && session) {
        this.store.incrementExecutionCount(sessionId);

        // Update history (keep limited)
        const history = [...session.history, code];
        if (history.length > this.limits.maxHistorySize) {
          history.shift();
        }

        this.store.updateSession(sessionId, {
          history,
          variables: outputData.variables || session.variables,
        });
      }

      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        returnValues: outputData.return_values,
        variables: outputData.variables || {},
        executionTime,
        error: result.error,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      if (error instanceof ScienceTimeoutError) {
        throw error;
      }

      return {
        success: false,
        stdout: '',
        stderr: '',
        variables: {},
        executionTime,
        error: error.message,
      };
    }
  }

  /**
   * Generate Python script for execution with session management
   */
  private generateExecutionScript(
    code: string,
    pickleFile: string | undefined,
    outputPath: string,
    returnVars: string[],
    captureOutput: boolean
  ): string {
    return `
import sys
import json
import pickle
import io
import traceback
from contextlib import redirect_stdout, redirect_stderr

# Restore session if pickle file exists
globals_dict = {}
if ${pickleFile ? `'${pickleFile}'` : 'None'} and __import__('os').path.exists(${pickleFile ? `'${pickleFile}'` : 'None'}):
    try:
        with open(${pickleFile ? `'${pickleFile}'` : 'None'}, 'rb') as f:
            globals_dict = pickle.load(f)
    except Exception as e:
        print(f"Warning: Could not restore session: {e}", file=sys.stderr)

# Setup output capture
output_data = {
    'return_values': {},
    'variables': {},
    'error': None
}

${captureOutput ? `
stdout_capture = io.StringIO()
stderr_capture = io.StringIO()
` : ''}

try:
    # Execute code
    ${captureOutput ? `
    with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
        exec('''${code.replace(/'/g, "\\'")}''', globals_dict)
    ` : `
    exec('''${code.replace(/'/g, "\\'")}''', globals_dict)
    `}

    # Capture return values if specified
    ${returnVars.length > 0 ? `
    return_vars = ${JSON.stringify(returnVars)}
    for var_name in return_vars:
        if var_name in globals_dict:
            try:
                # Try to serialize the value
                value = globals_dict[var_name]
                if isinstance(value, (str, int, float, bool, list, dict, type(None))):
                    output_data['return_values'][var_name] = value
                else:
                    output_data['return_values'][var_name] = str(value)
            except:
                output_data['return_values'][var_name] = '<unserializable>'
    ` : ''}

    # Capture all variables and their types
    for key, value in globals_dict.items():
        if not key.startswith('_'):
            output_data['variables'][key] = type(value).__name__

    # Save session state
    ${pickleFile ? `
    try:
        with open('${pickleFile}', 'wb') as f:
            pickle.dump(globals_dict, f)
    except Exception as e:
        print(f"Warning: Could not save session: {e}", file=sys.stderr)
    ` : ''}

except Exception as e:
    output_data['error'] = str(e)
    traceback.print_exc()

# Write output data
try:
    with open('${outputPath}', 'w') as f:
        json.dump(output_data, f)
except Exception as e:
    print(f"Error writing output: {e}", file=sys.stderr)

${captureOutput ? `
# Print captured output
print(stdout_capture.getvalue(), end='')
if stderr_capture.getvalue():
    print(stderr_capture.getvalue(), end='', file=sys.stderr)
` : ''}
`;
  }

  /**
   * Execute Python script with timeout
   */
  private async executeWithTimeout(
    scriptPath: string,
    timeoutMs: number
  ): Promise<{ success: boolean; stdout: string; stderr: string; error?: string }> {
    return new Promise((resolve) => {
      const child: ChildProcess = spawn(this.pythonPath, [scriptPath]);

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Set up timeout
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeoutMs);

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
        if (stdout.length > this.limits.maxOutputSize) {
          child.kill('SIGTERM');
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
        if (stderr.length > this.limits.maxOutputSize) {
          child.kill('SIGTERM');
        }
      });

      child.on('close', (code: number | null) => {
        clearTimeout(timer);

        if (timedOut) {
          resolve({
            success: false,
            stdout,
            stderr,
            error: `Execution timed out after ${timeoutMs}ms`,
          });
        } else if (code === 0) {
          resolve({
            success: true,
            stdout,
            stderr,
          });
        } else {
          resolve({
            success: false,
            stdout,
            stderr,
            error: `Process exited with code ${code}`,
          });
        }
      });

      child.on('error', (error: Error) => {
        clearTimeout(timer);
        resolve({
          success: false,
          stdout,
          stderr,
          error: error.message,
        });
      });
    });
  }

  /**
   * Check if Python environment is available
   */
  async checkEnvironment(): Promise<{
    available: boolean;
    version?: string;
    error?: string;
  }> {
    if (!existsSync(this.pythonPath)) {
      return {
        available: false,
        error: `Python executable not found at ${this.pythonPath}`,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        `"${this.pythonPath}" --version`
      );
      const version = (stdout + stderr).trim();
      return {
        available: true,
        version,
      };
    } catch (error: any) {
      return {
        available: false,
        error: error.message,
      };
    }
  }

  /**
   * Clean up session files
   */
  cleanupSession(sessionId: string): void {
    const pickleFile = join(this.sessionDir, `session_${sessionId}.pkl`);
    if (existsSync(pickleFile)) {
      unlinkSync(pickleFile);
    }
  }

  /**
   * Clean up all temporary files
   */
  cleanupTempFiles(): number {
    let count = 0;
    if (existsSync(this.sessionDir)) {
      const fs = require('fs');
      const files = fs.readdirSync(this.sessionDir);
      for (const file of files) {
        if (file.startsWith('exec_') || file.startsWith('output_')) {
          try {
            unlinkSync(join(this.sessionDir, file));
            count++;
          } catch {
            // Ignore errors
          }
        }
      }
    }
    return count;
  }
}
