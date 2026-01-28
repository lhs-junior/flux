import { spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ToolDefinition extends Tool {
  serverId: string;
  category?: string;
  keywords?: string[];
}
import type { MemoryManager } from '../../memory/memory-manager.js';
import type { PlanningManager } from '../../planning/planning-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Science Analyze Tool
 *
 * Provides data analysis capabilities using Python/pandas:
 * - Load data from various sources (CSV, JSON, Parquet)
 * - Transform and clean data
 * - Describe and summarize data
 * - Execute queries and custom code
 * - Integration with memory and planning managers
 */
export class ScienceAnalyzer {
  private pythonHelperPath: string;
  private memoryManager?: MemoryManager;
  private planningManager?: PlanningManager;

  constructor(options?: {
    memoryManager?: MemoryManager;
    planningManager?: PlanningManager;
  }) {
    this.pythonHelperPath = join(__dirname, '../python/analyze_helper.py');
    this.memoryManager = options?.memoryManager;
    this.planningManager = options?.planningManager;

    // Verify Python helper exists
    if (!existsSync(this.pythonHelperPath)) {
      throw new Error(`Python helper not found: ${this.pythonHelperPath}`);
    }
  }

  /**
   * Get tool definitions for MCP
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'science_analyze',
        description:
          'Analyze data using Python/pandas. Load data from CSV/JSON/Parquet, transform, describe, query, and execute custom analysis code. Results can be saved to memory and create planning TODOs.',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['load', 'describe', 'transform', 'query', 'execute'],
              description:
                'Action to perform: load (load data), describe (get statistics), transform (apply transformations), query (filter with pandas query), execute (run custom code)',
            },
            source: {
              type: 'string',
              description: 'Data source: file path or JSON string for dict/memory types',
            },
            source_type: {
              type: 'string',
              enum: ['csv', 'json', 'parquet', 'dict', 'memory'],
              description: 'Type of data source',
            },
            options: {
              type: 'object',
              description:
                'Loading options (e.g., {"sep": ",", "encoding": "utf-8"} for CSV)',
            },
            transformations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  operation: {
                    type: 'string',
                    enum: [
                      'filter',
                      'select',
                      'sort',
                      'groupby',
                      'rename',
                      'drop',
                      'fillna',
                      'astype',
                    ],
                  },
                },
              },
              description:
                'Array of transformations to apply (for transform action)',
            },
            query: {
              type: 'string',
              description: 'Pandas query string (for query action, e.g., "age > 30 and city == \'NYC\'")',
            },
            code: {
              type: 'string',
              description:
                'Python code to execute (for execute action). DataFrame is available as "df". Set "result" variable for output.',
            },
            save_to_memory: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Memory key to save results to',
                },
                category: {
                  type: 'string',
                  description: 'Optional memory category',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional tags',
                },
              },
              description: 'Save analysis results to memory',
            },
            create_todo: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'TODO content',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional tags',
                },
              },
              description: 'Create a planning TODO based on analysis',
            },
          },
          required: ['action', 'source', 'source_type'],
        },
        serverId: 'internal:science',
        category: 'science',
      },
    ];
  }

  /**
   * Handle tool calls
   */
  async handleToolCall(toolName: string, args: any): Promise<any> {
    if (toolName === 'science_analyze') {
      return this.analyze(args);
    }
    throw new Error(`Unknown science tool: ${toolName}`);
  }

  /**
   * Execute data analysis
   */
  private async analyze(args: {
    action: 'load' | 'describe' | 'transform' | 'query' | 'execute';
    source: string;
    source_type: 'csv' | 'json' | 'parquet' | 'dict' | 'memory';
    options?: Record<string, any>;
    transformations?: Array<{
      operation: string;
      [key: string]: any;
    }>;
    query?: string;
    code?: string;
    save_to_memory?: {
      key: string;
      category?: string;
      tags?: string[];
    };
    create_todo?: {
      content: string;
      tags?: string[];
    };
  }): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    shape?: { rows: number; columns: number };
    memory_id?: string;
    todo_id?: string;
  }> {
    try {
      // Prepare input for Python helper
      const input = {
        action: args.action,
        source: args.source,
        source_type: args.source_type,
        options: args.options || {},
        transformations: args.transformations || [],
        query: args.query || '',
        code: args.code || '',
      };

      // Execute Python helper
      const result = await this.executePython(input);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Python execution failed',
        };
      }

      // Save to memory if requested
      let memory_id: string | undefined;
      if (args.save_to_memory && this.memoryManager) {
        try {
          const memoryResult = this.memoryManager.save({
            key: args.save_to_memory.key,
            value: JSON.stringify(result.result),
            metadata: {
              category: args.save_to_memory.category || 'science_analysis',
              tags: args.save_to_memory.tags || ['science', 'analysis'],
            },
          });
          memory_id = memoryResult.id;
        } catch (error: any) {
          console.warn('Failed to save to memory:', error.message);
        }
      }

      // Create TODO if requested
      let todo_id: string | undefined;
      if (args.create_todo && this.planningManager) {
        try {
          const todoResult = this.planningManager.create({
            content: args.create_todo.content,
            tags: args.create_todo.tags || ['science', 'analysis'],
          });
          todo_id = todoResult.todo.id;
        } catch (error: any) {
          console.warn('Failed to create TODO:', error.message);
        }
      }

      return {
        success: true,
        result: result.result,
        shape: result.result.shape,
        memory_id,
        todo_id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute Python helper script
   */
  private async executePython(input: any): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    traceback?: string;
  }> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [this.pythonHelperPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          // Try to parse error from stdout (our script outputs JSON on error)
          try {
            const errorOutput = JSON.parse(stdout);
            resolve(errorOutput);
          } catch {
            resolve({
              success: false,
              error: `Python process exited with code ${code}`,
              traceback: stderr,
            });
          }
          return;
        }

        // Parse JSON output
        try {
          const output = JSON.parse(stdout);
          resolve(output);
        } catch (error: any) {
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error.message}`,
            traceback: stdout,
          });
        }
      });

      // Send input as JSON
      try {
        pythonProcess.stdin.write(JSON.stringify(input));
        pythonProcess.stdin.end();
      } catch (error: any) {
        reject(new Error(`Failed to write to Python stdin: ${error.message}`));
      }
    });
  }

  /**
   * Test Python environment
   */
  async testPython(): Promise<{
    available: boolean;
    version?: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', ['--version']);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('error', (error) => {
        resolve({
          available: false,
          error: error.message,
        });
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            available: false,
            error: `Python not available (exit code ${code})`,
          });
          return;
        }

        const version = (stdout + stderr).trim();
        resolve({
          available: true,
          version,
        });
      });
    });
  }
}
