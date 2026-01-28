import { spawn } from 'child_process';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Science Visualize Tool
 *
 * Provides data visualization capabilities using Python/matplotlib/seaborn:
 * - Line, bar, scatter, histogram, heatmap, boxplot charts
 * - Custom plots with Python code
 * - Interactive Plotly charts
 * - Multiple output formats (PNG, SVG, HTML)
 * - Style customization
 * - Integration with memory manager
 */
export class ScienceVisualizer {
  private pythonHelperPath: string;
  private memoryManager?: MemoryManager;

  constructor(options?: { memoryManager?: MemoryManager }) {
    this.pythonHelperPath = join(__dirname, '../python/visualize_helper.py');
    this.memoryManager = options?.memoryManager;

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
        name: 'science_visualize',
        description:
          'Create data visualizations using Python/matplotlib/seaborn. Supports line, bar, scatter, histogram, heatmap, boxplot, and custom charts. Output as PNG (base64), SVG, or HTML (Plotly). Results can be saved to memory.',
        inputSchema: {
          type: 'object',
          properties: {
            chart_type: {
              type: 'string',
              enum: [
                'line',
                'bar',
                'scatter',
                'histogram',
                'heatmap',
                'boxplot',
                'custom',
                'plotly',
              ],
              description:
                'Type of chart to create. Use "custom" for Python code, "plotly" for interactive charts.',
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
            config: {
              type: 'object',
              properties: {
                x: {
                  type: 'string',
                  description: 'X-axis column name',
                },
                y: {
                  type: ['string', 'array'],
                  description: 'Y-axis column name(s)',
                },
                column: {
                  type: 'string',
                  description: 'Column name (for histogram)',
                },
                columns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Column names (for heatmap)',
                },
                hue: {
                  type: 'string',
                  description: 'Column for color grouping',
                },
                size: {
                  type: 'string',
                  description: 'Column for size (scatter plot)',
                },
                title: {
                  type: 'string',
                  description: 'Chart title',
                },
                xlabel: {
                  type: 'string',
                  description: 'X-axis label',
                },
                ylabel: {
                  type: 'string',
                  description: 'Y-axis label',
                },
                figsize: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Figure size [width, height] in inches',
                },
                bins: {
                  type: 'number',
                  description: 'Number of bins (histogram)',
                },
                correlation: {
                  type: 'boolean',
                  description: 'Show correlation matrix (heatmap)',
                },
                annot: {
                  type: 'boolean',
                  description: 'Show annotations (heatmap)',
                },
                cmap: {
                  type: 'string',
                  description: 'Color map (heatmap)',
                },
                orientation: {
                  type: 'string',
                  enum: ['vertical', 'horizontal'],
                  description: 'Bar chart orientation',
                },
                rotate_labels: {
                  type: 'boolean',
                  description: 'Rotate x-axis labels',
                },
                plotly_type: {
                  type: 'string',
                  enum: ['line', 'bar', 'scatter', 'histogram'],
                  description: 'Plotly chart type (when chart_type is "plotly")',
                },
              },
              description: 'Chart configuration',
            },
            style: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  enum: ['default', 'dark', 'whitegrid', 'darkgrid', 'minimal'],
                  description: 'Chart theme/style',
                },
                palette: {
                  type: 'string',
                  description: 'Color palette name (e.g., "husl", "Set2")',
                },
                figsize: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Default figure size [width, height]',
                },
              },
              description: 'Style customization',
            },
            output: {
              type: 'object',
              properties: {
                format: {
                  type: 'string',
                  enum: ['png', 'svg', 'html'],
                  description: 'Output format (default: png)',
                },
                path: {
                  type: 'string',
                  description: 'Optional file path to save chart',
                },
                dpi: {
                  type: 'number',
                  description: 'DPI for PNG output (default: 100)',
                },
              },
              description: 'Output options',
            },
            code: {
              type: 'string',
              description:
                'Python code for custom chart (when chart_type is "custom"). Should create figure and assign to "fig" variable. DataFrame available as "df".',
            },
            save_to_memory: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Memory key to save chart to',
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
              description: 'Save chart to memory (saves base64 data or file path)',
            },
          },
          required: ['chart_type', 'source', 'source_type'],
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
    if (toolName === 'science_visualize') {
      return this.visualize(args);
    }
    throw new Error(`Unknown science tool: ${toolName}`);
  }

  /**
   * Execute data visualization
   */
  private async visualize(args: {
    chart_type: 'line' | 'bar' | 'scatter' | 'histogram' | 'heatmap' | 'boxplot' | 'custom' | 'plotly';
    source: string;
    source_type: 'csv' | 'json' | 'parquet' | 'dict' | 'memory';
    config?: Record<string, any>;
    style?: {
      theme?: 'default' | 'dark' | 'whitegrid' | 'darkgrid' | 'minimal';
      palette?: string;
      figsize?: [number, number];
    };
    output?: {
      format?: 'png' | 'svg' | 'html';
      path?: string;
      dpi?: number;
    };
    code?: string;
    save_to_memory?: {
      key: string;
      category?: string;
      tags?: string[];
    };
  }): Promise<{
    success: boolean;
    result?: {
      format: 'png' | 'svg' | 'html';
      data?: string; // base64 for PNG, string for SVG/HTML
      path?: string;
      size_bytes: number;
      chart_type: string;
      data_shape: { rows: number; columns: number };
    };
    error?: string;
    memory_id?: string;
  }> {
    try {
      // Validate custom chart has code
      if (args.chart_type === 'custom' && !args.code) {
        return {
          success: false,
          error: 'Custom chart type requires "code" parameter',
        };
      }

      // Prepare input for Python helper
      const input = {
        chart_type: args.chart_type,
        source: args.source,
        source_type: args.source_type,
        config: args.config || {},
        style: args.style || {},
        output: args.output || { format: 'png' },
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
          // Save chart metadata and data/path
          const memoryValue = JSON.stringify({
            format: result.result.format,
            chart_type: result.result.chart_type,
            data_shape: result.result.data_shape,
            data: result.result.data,
            path: result.result.path,
            size_bytes: result.result.size_bytes,
            created_at: new Date().toISOString(),
          });

          const memoryResult = this.memoryManager.save({
            key: args.save_to_memory.key,
            value: memoryValue,
            metadata: {
              category: args.save_to_memory.category || 'science_visualization',
              tags: args.save_to_memory.tags || ['science', 'visualization', args.chart_type],
            },
          });
          memory_id = memoryResult.id;
        } catch (error: any) {
          console.warn('Failed to save to memory:', error.message);
        }
      }

      return {
        success: true,
        result: result.result,
        memory_id,
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
    pandas?: boolean;
    matplotlib?: boolean;
    seaborn?: boolean;
    plotly?: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const testCode = `
import sys
import json
try:
    import pandas
    pandas_available = True
except ImportError:
    pandas_available = False
try:
    import matplotlib
    matplotlib_available = True
except ImportError:
    matplotlib_available = False
try:
    import seaborn
    seaborn_available = True
except ImportError:
    seaborn_available = False
try:
    import plotly
    plotly_available = True
except ImportError:
    plotly_available = False
print(json.dumps({
    'version': sys.version,
    'pandas': pandas_available,
    'matplotlib': matplotlib_available,
    'seaborn': seaborn_available,
    'plotly': plotly_available
}))
`;

      const pythonProcess = spawn('python3', ['-c', testCode]);

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

        try {
          const result = JSON.parse(stdout.trim());
          resolve({
            available: true,
            version: result.version,
            pandas: result.pandas,
            matplotlib: result.matplotlib,
            seaborn: result.seaborn,
            plotly: result.plotly,
          });
        } catch {
          resolve({
            available: true,
            version: stdout.trim(),
          });
        }
      });
    });
  }
}
