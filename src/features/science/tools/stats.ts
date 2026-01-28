import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ToolMetadata } from '../../../core/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface StatsTestInput {
  test: 'ttest' | 'anova' | 'chi_square' | 'correlation' | 'regression' | 'mann_whitney';
  data: {
    group1?: number[];
    group2?: number[];
    groups?: number[][];
    observed?: number[][];
    x?: number[];
    y?: number[];
    mu?: number;
    alternative?: 'two-sided' | 'less' | 'greater';
    method?: 'pearson' | 'spearman';
  };
  save_to_memory?: boolean;
  memory_key?: string;
}

export interface StatsTestResult {
  success: boolean;
  test?: string;
  statistic?: number;
  pvalue?: number;
  degrees_of_freedom?: number | { between: number; within: number };
  effect_size?: {
    type: string;
    value: number;
    interpretation: string;
  };
  interpretation?: string;
  expected?: number[][];
  predictions?: number[];
  slope?: number;
  intercept?: number;
  r_value?: number;
  r_squared?: number;
  std_err?: number;
  error?: string;
  memory_saved?: boolean;
}

/**
 * Execute Python stats helper script
 */
async function executePythonStats(input: StatsTestInput): Promise<StatsTestResult> {
  return new Promise((resolve, reject) => {
    const helperPath = join(__dirname, '../helpers/stats_helper.py');

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
      test: input.test,
      data: input.data,
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
 * Format stats result as a readable string for memory storage
 */
function formatStatsForMemory(test: string, result: StatsTestResult): string {
  let summary = `${test} Results:\n`;
  summary += `- Statistic: ${result.statistic?.toFixed(4)}\n`;
  summary += `- P-value: ${result.pvalue?.toFixed(4)}\n`;
  summary += `- Interpretation: ${result.interpretation}\n`;

  if (result.effect_size) {
    summary += `- Effect Size (${result.effect_size.type}): ${result.effect_size.value.toFixed(4)} (${result.effect_size.interpretation})\n`;
  }

  if (result.degrees_of_freedom) {
    if (typeof result.degrees_of_freedom === 'number') {
      summary += `- Degrees of Freedom: ${result.degrees_of_freedom}\n`;
    } else {
      summary += `- Degrees of Freedom: Between=${result.degrees_of_freedom.between}, Within=${result.degrees_of_freedom.within}\n`;
    }
  }

  if (result.r_squared) {
    summary += `- R-squared: ${result.r_squared.toFixed(4)}\n`;
  }

  return summary;
}

/**
 * Perform statistical tests
 */
export async function scienceStats(
  input: StatsTestInput,
  memoryManager?: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Validate input
    if (!input.test) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Missing required parameter: test',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (!input.data) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Missing required parameter: data',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Execute statistical test
    const result = await executePythonStats(input);

    // Save to memory if requested
    if (input.save_to_memory && result.success && memoryManager) {
      try {
        const memoryKey = input.memory_key || `stats_${input.test}_${Date.now()}`;
        const memorySummary = formatStatsForMemory(input.test, result);

        await memoryManager.save({
          key: memoryKey,
          value: memorySummary,
          metadata: {
            category: 'science_stats',
            tags: ['statistics', input.test, 'analysis'],
          },
        });

        result.memory_saved = true;
      } catch (error: any) {
        console.error('Failed to save stats result to memory:', error);
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
 * Get tool definition for science_stats
 */
export function getScienceStatsToolDefinition(): ToolMetadata {
  return {
    name: 'science_stats',
    description:
      'Perform statistical tests including t-test, ANOVA, chi-square, correlation, regression, and Mann-Whitney U test. Returns statistic, p-value, degrees of freedom, effect size, and interpretation.',
    inputSchema: {
      type: 'object',
      properties: {
        test: {
          type: 'string',
          enum: ['ttest', 'anova', 'chi_square', 'correlation', 'regression', 'mann_whitney'],
          description: 'Type of statistical test to perform',
        },
        data: {
          type: 'object',
          description:
            'Test data. Structure depends on test type:\n' +
            '- ttest: {group1: number[], group2?: number[], mu?: number, alternative?: "two-sided"|"less"|"greater"}\n' +
            '- anova: {groups: number[][]}\n' +
            '- chi_square: {observed: number[][]}\n' +
            '- correlation: {x: number[], y: number[], method?: "pearson"|"spearman"}\n' +
            '- regression: {x: number[], y: number[]}\n' +
            '- mann_whitney: {group1: number[], group2: number[], alternative?: "two-sided"|"less"|"greater"}',
        },
        save_to_memory: {
          type: 'boolean',
          description: 'Whether to save the results to memory (default: false)',
        },
        memory_key: {
          type: 'string',
          description: 'Optional key for saved memory (auto-generated if not provided)',
        },
      },
      required: ['test', 'data'],
    },
    category: 'science',
    keywords: ['statistics', 'ttest', 'anova', 'correlation', 'regression', 'chi-square', 'analysis', 'hypothesis'],
    serverId: 'internal:science',
  };
}
