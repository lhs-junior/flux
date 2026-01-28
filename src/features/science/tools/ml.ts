import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ToolMetadata } from '../../../core/types.js';
import type { MemoryManager } from '../../memory/memory-manager.js';
import type { PlanningManager } from '../../planning/planning-manager.js';
import {
  MLInputSchema,
  validateInput,
  type MLInput,
} from '../../../validation/schemas.js';
import logger from '../../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type { MLInput };

export interface MLResult {
  success: boolean;
  model_id?: string;
  algorithm?: string;
  task_type?: string;
  metrics?: Record<string, number>;
  feature_importance?: number[] | number[][];
  predictions?: number[];
  probabilities?: number[][];
  n_train?: number;
  n_test?: number;
  n_predictions?: number;
  n_samples?: number;
  best_params?: Record<string, unknown>;
  best_score?: number;
  cv_results?: {
    mean_scores: number[];
    std_scores: number[];
  };
  model_params?: Record<string, string>;
  metadata?: Record<string, unknown>;
  filepath?: string;
  error?: string;
  memory_saved?: boolean;
  planning_saved?: boolean;
}

/**
 * Execute Python ML helper script
 */
async function executePythonML(input: MLInput): Promise<MLResult> {
  return new Promise((resolve, reject) => {
    const helperPath = join(__dirname, '../helpers/ml_helper.py');

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
      action: input.action,
      data: input.data,
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
 * Format ML result as a readable string for memory storage
 */
function formatMLForMemory(action: string, result: MLResult): string {
  let summary = `ML ${action} Results:\n`;

  if (result.model_id) {
    summary += `- Model ID: ${result.model_id}\n`;
  }

  if (result.algorithm) {
    summary += `- Algorithm: ${result.algorithm}\n`;
  }

  if (result.task_type) {
    summary += `- Task Type: ${result.task_type}\n`;
  }

  if (result.metrics) {
    summary += '- Metrics:\n';
    for (const [key, value] of Object.entries(result.metrics)) {
      summary += `  - ${key}: ${typeof value === 'number' ? value.toFixed(4) : value}\n`;
    }
  }

  if (result.feature_importance) {
    summary += `- Feature Importance: Available (${Array.isArray(result.feature_importance) ? result.feature_importance.length : 'N/A'} features)\n`;
  }

  if (result.best_params) {
    summary += '- Best Params:\n';
    for (const [key, value] of Object.entries(result.best_params)) {
      summary += `  - ${key}: ${value}\n`;
    }
  }

  if (result.best_score) {
    summary += `- Best Score: ${result.best_score.toFixed(4)}\n`;
  }

  if (result.n_predictions) {
    summary += `- Predictions Made: ${result.n_predictions}\n`;
  }

  if (result.filepath) {
    summary += `- File Path: ${result.filepath}\n`;
  }

  return summary;
}

/**
 * Format ML result for planning context
 */
function formatMLForPlanning(action: string, result: MLResult, context?: string): string {
  let summary = `ML Task: ${action}\n`;

  if (context) {
    summary += `Context: ${context}\n\n`;
  }

  if (result.model_id) {
    summary += `Model: ${result.model_id} (${result.algorithm})\n`;
  }

  if (result.metrics) {
    summary += 'Performance Metrics:\n';
    for (const [key, value] of Object.entries(result.metrics)) {
      summary += `- ${key}: ${typeof value === 'number' ? value.toFixed(4) : value}\n`;
    }
  }

  if (result.best_params) {
    summary += '\nOptimized Parameters:\n';
    for (const [key, value] of Object.entries(result.best_params)) {
      summary += `- ${key}: ${value}\n`;
    }
  }

  return summary;
}

/**
 * Perform machine learning operations
 */
export async function scienceML(
  input: unknown,
  memoryManager?: MemoryManager,
  planningManager?: PlanningManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Validate input using Zod schema
    const validation = validateInput(MLInputSchema, input);
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

    // Execute ML operation
    const result = await executePythonML(validatedInput);

    // Save to memory if requested
    if (validatedInput.save_to_memory && result.success && memoryManager) {
      try {
        const memoryKey = validatedInput.memory_key || `ml_${validatedInput.action}_${Date.now()}`;
        const memorySummary = formatMLForMemory(validatedInput.action, result);

        await memoryManager.save({
          key: memoryKey,
          value: memorySummary,
          metadata: {
            category: 'science_ml',
            tags: ['machine-learning', validatedInput.action, result.algorithm || 'unknown'],
          },
        });

        result.memory_saved = true;
      } catch (error: unknown) {
        logger.error('Failed to save ML result to memory:', error);
      }
    }

    // Save to planning if requested (using create instead of appendToScratchpad which doesn't exist)
    if (validatedInput.save_to_planning && result.success && planningManager) {
      try {
        const planningSummary = formatMLForPlanning(validatedInput.action, result, validatedInput.planning_context);

        planningManager.create({
          content: planningSummary,
          tags: ['ml_results', validatedInput.action],
        });

        result.planning_saved = true;
      } catch (error: unknown) {
        logger.error('Failed to save ML result to planning:', error);
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
 * Get tool definition for science_ml
 */
export function getScienceMLToolDefinition(): ToolMetadata {
  return {
    name: 'science_ml',
    description:
      'Train, evaluate, and use machine learning models. Supports linear/logistic regression, random forests, XGBoost, SVM, and K-means clustering. Actions: train, predict, evaluate, tune, explain, save, load.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['train', 'predict', 'evaluate', 'tune', 'explain', 'save', 'load'],
          description: 'ML operation to perform',
        },
        data: {
          type: 'object',
          description:
            'Action-specific data:\n' +
            '- train: {X: number[][], y: number[], algorithm: string, task_type?: string, model_id?: string, test_size?: number, params?: object, scale?: boolean}\n' +
            '- predict: {X: number[][], model_id: string}\n' +
            '- evaluate: {X: number[][], y: number[], model_id: string}\n' +
            '- tune: {X: number[][], y: number[], algorithm: string, task_type?: string, param_grid: object, cv?: number, scale?: boolean}\n' +
            '- explain: {model_id: string}\n' +
            '- save: {model_id: string, filepath: string}\n' +
            '- load: {filepath: string, model_id?: string}',
          properties: {
            X: {
              type: 'array',
              items: { type: 'array', items: { type: 'number' } },
              description: 'Feature matrix (2D array)',
            },
            y: {
              type: 'array',
              items: { type: 'number' },
              description: 'Target variable (1D array)',
            },
            algorithm: {
              type: 'string',
              enum: ['linear_regression', 'logistic_regression', 'random_forest', 'xgboost', 'svm', 'kmeans'],
              description: 'ML algorithm to use',
            },
            task_type: {
              type: 'string',
              enum: ['regression', 'classification', 'clustering'],
              description: 'Type of ML task (default: regression)',
            },
            model_id: {
              type: 'string',
              description: 'Model identifier for saving/loading',
            },
            test_size: {
              type: 'number',
              description: 'Fraction of data for testing (default: 0.2)',
            },
            params: {
              type: 'object',
              description: 'Algorithm-specific parameters',
            },
            scale: {
              type: 'boolean',
              description: 'Whether to scale features (default: false)',
            },
            param_grid: {
              type: 'object',
              description: 'Parameter grid for hyperparameter tuning',
            },
            cv: {
              type: 'number',
              description: 'Number of cross-validation folds (default: 5)',
            },
            filepath: {
              type: 'string',
              description: 'File path for saving/loading model',
            },
          },
        },
        save_to_memory: {
          type: 'boolean',
          description: 'Whether to save results to memory (default: false)',
        },
        memory_key: {
          type: 'string',
          description: 'Optional key for saved memory',
        },
        save_to_planning: {
          type: 'boolean',
          description: 'Whether to save results to planning scratchpad (default: false)',
        },
        planning_context: {
          type: 'string',
          description: 'Optional context for planning integration',
        },
      },
      required: ['action', 'data'],
    },
    category: 'science',
    keywords: [
      'machine-learning',
      'ml',
      'train',
      'predict',
      'model',
      'regression',
      'classification',
      'clustering',
      'xgboost',
      'random-forest',
      'svm',
    ],
    serverId: 'internal:science',
  };
}
