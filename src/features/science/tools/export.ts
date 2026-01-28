import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ToolMetadata } from '../../../core/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ExportInput {
  type: 'data' | 'report' | 'notebook' | 'model' | 'all';
  data: {
    // For data export
    data?: Array<Record<string, any>>;
    filepath?: string;
    format?: 'csv' | 'excel' | 'json' | 'parquet';

    // For report generation
    title?: string;
    sections?: Array<{
      type: 'text' | 'table' | 'metrics' | 'plot' | 'code' | 'alert';
      title?: string;
      content: any;
      alert_type?: 'info' | 'success' | 'warning';
    }>;

    // For notebook generation
    cells?: Array<{
      type: 'markdown' | 'code';
      content: string;
    }>;
  };
  save_to_memory?: boolean;
  memory_key?: string;
}

export interface ExportResult {
  success: boolean;
  filepath?: string;
  format?: string;
  rows?: number;
  columns?: number;
  sections?: number;
  cells?: number;
  error?: string;
  memory_saved?: boolean;
}

/**
 * Execute Python export helper script
 */
async function executePythonExport(type: string, data: any): Promise<ExportResult> {
  return new Promise((resolve, reject) => {
    const helperPath = join(__dirname, '../helpers/export_helper.py');

    const python = spawn('python3', [helperPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: `Python process exited with code ${code}: ${stderr}`,
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error: any) {
        resolve({
          success: false,
          error: `Failed to parse Python output: ${error.message}`,
        });
      }
    });

    python.on('error', (error) => {
      resolve({
        success: false,
        error: `Failed to spawn Python process: ${error.message}`,
      });
    });

    // Send input to Python script
    const inputData = {
      type: type,
      data: data,
    };

    try {
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();
    } catch (error: any) {
      resolve({
        success: false,
        error: `Failed to write to Python stdin: ${error.message}`,
      });
    }
  });
}

/**
 * Format export result as a readable string for memory storage
 */
function formatExportForMemory(type: string, result: ExportResult): string {
  let summary = `Export ${type} Results:\n`;

  if (result.filepath) {
    summary += `- File Path: ${result.filepath}\n`;
  }

  if (result.format) {
    summary += `- Format: ${result.format}\n`;
  }

  if (result.rows !== undefined && result.columns !== undefined) {
    summary += `- Data: ${result.rows} rows × ${result.columns} columns\n`;
  }

  if (result.sections !== undefined) {
    summary += `- Sections: ${result.sections}\n`;
  }

  if (result.cells !== undefined) {
    summary += `- Cells: ${result.cells}\n`;
  }

  return summary;
}

/**
 * Export data and reports
 */
export async function scienceExport(
  input: ExportInput,
  memoryManager?: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Validate input
    if (!input.type) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Missing required parameter: type',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (!input.data || !input.data.filepath) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Missing required parameter: data.filepath',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    let result: ExportResult;

    // Handle different export types
    if (input.type === 'data') {
      result = await executePythonExport('data', input.data);
    } else if (input.type === 'report') {
      // Determine report format from filepath extension
      const filepath = input.data.filepath;
      const reportType = filepath.endsWith('.pdf') ? 'pdf' : 'html';
      result = await executePythonExport(reportType, input.data);
    } else if (input.type === 'notebook') {
      result = await executePythonExport('notebook', input.data);
    } else if (input.type === 'all') {
      // Export multiple formats
      const results: ExportResult[] = [];

      // Export data if available
      if (input.data.data) {
        const baseFilepath = input.data.filepath.replace(/\.[^.]+$/, '');
        const dataResult = await executePythonExport('data', {
          ...input.data,
          filepath: `${baseFilepath}.csv`,
          format: 'csv',
        });
        results.push(dataResult);
      }

      // Generate HTML report if sections available
      if (input.data.sections) {
        const baseFilepath = input.data.filepath.replace(/\.[^.]+$/, '');
        const htmlResult = await executePythonExport('html', {
          ...input.data,
          filepath: `${baseFilepath}.html`,
        });
        results.push(htmlResult);
      }

      // Generate notebook if cells available
      if (input.data.cells) {
        const baseFilepath = input.data.filepath.replace(/\.[^.]+$/, '');
        const notebookResult = await executePythonExport('notebook', {
          ...input.data,
          filepath: `${baseFilepath}.ipynb`,
        });
        results.push(notebookResult);
      }

      // Combine results
      const successCount = results.filter((r) => r.success).length;
      result = {
        success: successCount > 0,
        filepath: input.data.filepath,
        format: 'multiple',
        error: successCount === 0 ? 'All exports failed' : undefined,
      };
    } else {
      result = {
        success: false,
        error: `Unknown export type: ${input.type}`,
      };
    }

    // Save to memory if requested
    if (input.save_to_memory && result.success && memoryManager) {
      try {
        const memoryKey = input.memory_key || `export_${input.type}_${Date.now()}`;
        const memorySummary = formatExportForMemory(input.type, result);

        await memoryManager.save({
          key: memoryKey,
          value: memorySummary,
          metadata: {
            category: 'science_export',
            tags: ['export', input.type, result.format || 'unknown'],
          },
        });

        result.memory_saved = true;
      } catch (error: any) {
        console.error('Failed to save export result to memory:', error);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}

/**
 * Get tool definition for science_export
 */
export function getScienceExportToolDefinition(): ToolMetadata {
  return {
    name: 'science_export',
    description:
      'Export data and generate comprehensive reports in various formats (CSV, Excel, JSON, Parquet, HTML, PDF, Jupyter Notebook). Supports data export, report generation with plots and metrics, and notebook creation.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['data', 'report', 'notebook', 'model', 'all'],
          description: 'Type of export to perform',
        },
        data: {
          type: 'object',
          description:
            'Export-specific data:\n' +
            '- data: {data: array, filepath: string, format?: "csv"|"excel"|"json"|"parquet"}\n' +
            '- report: {title?: string, sections: array, filepath: string}\n' +
            '- notebook: {title?: string, cells: array, filepath: string}\n' +
            '- all: Exports data, report, and notebook (combines all)',
          properties: {
            data: {
              type: 'array',
              items: { type: 'object' },
              description: 'Data to export (array of objects)',
            },
            filepath: {
              type: 'string',
              description: 'Output file path',
            },
            format: {
              type: 'string',
              enum: ['csv', 'excel', 'json', 'parquet', 'html', 'pdf'],
              description: 'Export format (for data export)',
            },
            title: {
              type: 'string',
              description: 'Title for report or notebook',
            },
            sections: {
              type: 'array',
              description:
                'Report sections (array of {type, title?, content}). Types: text, table, metrics, plot, code, alert',
            },
            cells: {
              type: 'array',
              description: 'Notebook cells (array of {type: "markdown"|"code", content: string})',
            },
          },
          required: ['filepath'],
        },
        save_to_memory: {
          type: 'boolean',
          description: 'Whether to save export info to memory (default: false)',
        },
        memory_key: {
          type: 'string',
          description: 'Optional key for saved memory',
        },
      },
      required: ['type', 'data'],
    },
    category: 'science',
    keywords: ['export', 'report', 'csv', 'excel', 'json', 'html', 'pdf', 'notebook', 'jupyter', 'data'],
    serverId: 'internal:science',
  };
}
