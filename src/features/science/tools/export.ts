import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ToolMetadata } from '../../../core/types.js';
import type { MemoryManager } from '../../memory/memory-manager.js';
import {
  ExportInputSchema,
  validateInput,
  type ExportInput,
} from '../../../validation/schemas.js';
import logger from '../../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type { ExportInput };

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
async function executePythonExport(type: string, data: unknown): Promise<ExportResult> {
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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        resolve({
          success: false,
          error: `Failed to parse Python output: ${message}`,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      resolve({
        success: false,
        error: `Failed to write to Python stdin: ${message}`,
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
  input: unknown,
  memoryManager?: MemoryManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Validate input using Zod schema
    const validation = validateInput(ExportInputSchema, input);
    if (!validation.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: validation.error,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const validatedInput = validation.data!;
    let result: ExportResult;

    // Handle different export types
    if (validatedInput.type === 'data') {
      result = await executePythonExport('data', validatedInput.data);
    } else if (validatedInput.type === 'report') {
      // Determine report format from filepath extension
      const filepath = validatedInput.data.filepath;
      const reportType = filepath.endsWith('.pdf') ? 'pdf' : 'html';
      result = await executePythonExport(reportType, validatedInput.data);
    } else if (validatedInput.type === 'notebook') {
      result = await executePythonExport('notebook', validatedInput.data);
    } else if (validatedInput.type === 'all') {
      // Export multiple formats
      const results: ExportResult[] = [];

      // Export data if available
      if (validatedInput.data.data) {
        const baseFilepath = validatedInput.data.filepath.replace(/\.[^.]+$/, '');
        const dataResult = await executePythonExport('data', {
          ...validatedInput.data,
          filepath: `${baseFilepath}.csv`,
          format: 'csv',
        });
        results.push(dataResult);
      }

      // Generate HTML report if sections available
      if (validatedInput.data.sections) {
        const baseFilepath = validatedInput.data.filepath.replace(/\.[^.]+$/, '');
        const htmlResult = await executePythonExport('html', {
          ...validatedInput.data,
          filepath: `${baseFilepath}.html`,
        });
        results.push(htmlResult);
      }

      // Generate notebook if cells available
      if (validatedInput.data.cells) {
        const baseFilepath = validatedInput.data.filepath.replace(/\.[^.]+$/, '');
        const notebookResult = await executePythonExport('notebook', {
          ...validatedInput.data,
          filepath: `${baseFilepath}.ipynb`,
        });
        results.push(notebookResult);
      }

      // Combine results
      const successCount = results.filter((r) => r.success).length;
      result = {
        success: successCount > 0,
        filepath: validatedInput.data.filepath,
        format: 'multiple',
        error: successCount === 0 ? 'All exports failed' : undefined,
      };
    } else {
      result = {
        success: false,
        error: `Unknown export type: ${validatedInput.type}`,
      };
    }

    // Save to memory if requested
    if (validatedInput.save_to_memory && result.success && memoryManager) {
      try {
        const memoryKey = validatedInput.memory_key || `export_${validatedInput.type}_${Date.now()}`;
        const memorySummary = formatExportForMemory(validatedInput.type, result);

        await memoryManager.save({
          key: memoryKey,
          value: memorySummary,
          metadata: {
            category: 'science_export',
            tags: ['export', validatedInput.type, result.format || 'unknown'],
          },
        });

        result.memory_saved = true;
      } catch (error: unknown) {
        logger.error('Failed to save export result to memory:', error);
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: message,
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
