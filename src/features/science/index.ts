/**
 * Science Tools Module
 * Provides statistical analysis, machine learning, and data export capabilities
 */

import type { ToolMetadata } from '../../core/gateway.js';
import { scienceStats, getScienceStatsToolDefinition } from './tools/stats.js';
import { scienceML, getScienceMLToolDefinition } from './tools/ml.js';
import { scienceExport, getScienceExportToolDefinition } from './tools/export.js';

export interface ScienceManagerDependencies {
  memoryManager?: any;
  planningManager?: any;
}

/**
 * Science Tools Manager
 * Manages science-related tools (stats, ML, export)
 */
export class ScienceManager {
  private memoryManager?: any;
  private planningManager?: any;

  constructor(dependencies: ScienceManagerDependencies = {}) {
    this.memoryManager = dependencies.memoryManager;
    this.planningManager = dependencies.planningManager;
  }

  /**
   * Get tool definitions for all science tools
   */
  getToolDefinitions(): ToolMetadata[] {
    return [
      getScienceStatsToolDefinition(),
      getScienceMLToolDefinition(),
      getScienceExportToolDefinition(),
    ];
  }

  /**
   * Handle tool calls for science tools
   */
  async handleToolCall(
    toolName: string,
    args: Record<string, any>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      switch (toolName) {
        case 'science_stats':
          return await scienceStats(args, this.memoryManager);

        case 'science_ml':
          return await scienceML(args, this.memoryManager, this.planningManager);

        case 'science_export':
          return await scienceExport(args, this.memoryManager);

        default:
          throw new Error(`Unknown science tool: ${toolName}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `Science tool error: ${error.message}`,
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
   * Get statistics about science tools usage
   */
  getStatistics() {
    return {
      toolsAvailable: 3,
      tools: ['science_stats', 'science_ml', 'science_export'],
      features: {
        statistics: [
          'ttest',
          'anova',
          'chi_square',
          'correlation',
          'regression',
          'mann_whitney',
        ],
        machine_learning: [
          'linear_regression',
          'logistic_regression',
          'random_forest',
          'xgboost',
          'svm',
          'kmeans',
        ],
        export_formats: ['csv', 'excel', 'json', 'parquet', 'html', 'pdf', 'notebook'],
      },
    };
  }

  /**
   * Close and cleanup resources
   */
  close(): void {
    // No persistent resources to clean up
    console.log('ScienceManager closed');
  }
}

// Export tool functions
export { scienceStats, scienceML, scienceExport };

// Export tool definitions
export {
  getScienceStatsToolDefinition,
  getScienceMLToolDefinition,
  getScienceExportToolDefinition,
};
