import { GuideStore } from './guide-store.js';
import { BM25Indexer } from '../../search/bm25-indexer.js';
import type { ToolMetadata } from '../../core/types.js';
import type { MemoryManager } from '../memory/memory-manager.js';
import type { PlanningManager } from '../planning/planning-manager.js';
import type {
  GuideRecord,
  TutorialStep,
  LearningProgress,
} from './guide-types.js';
import logger from '../../utils/logger.js';
import {
  GuideSearchInputSchema,
  GuideTutorialInputSchema,
  validateInput,
  type GuideSearchInput,
  type GuideTutorialInput,
} from '../../validation/schemas.js';

// Re-export types for backwards compatibility
export type { GuideSearchInput, GuideTutorialInput };

export class GuideManager {
  private store: GuideStore;
  private indexer: BM25Indexer;
  private memoryManager?: MemoryManager;
  private planningManager?: PlanningManager;

  constructor(
    dbPath: string = ':memory:',
    options?: {
      memoryManager?: MemoryManager;
      planningManager?: PlanningManager;
    }
  ) {
    this.store = new GuideStore(dbPath);
    this.indexer = new BM25Indexer();
    this.memoryManager = options?.memoryManager;
    this.planningManager = options?.planningManager;

    // Index existing guides on initialization
    this.indexGuides();
  }

  /**
   * Index all guides in BM25 for semantic search
   */
  indexGuides(): void {
    const guides = this.store.listGuides();

    // Clear existing guide indices
    const allDocs = this.indexer.getAllDocuments();
    for (const doc of allDocs) {
      if (doc.id.startsWith('guide:')) {
        this.indexer.removeDocument(doc.id);
      }
    }

    // Index all guides
    const tools: ToolMetadata[] = guides.map((guide) => ({
      name: `guide:${guide.id}`,
      description: `${guide.title}: ${guide.excerpt}`,
      category: 'guide',
      keywords: [
        ...guide.tags,
        guide.category,
        guide.difficulty,
        ...guide.relatedTools,
      ],
      serverId: 'internal:guide',
      inputSchema: { type: 'object' },
    }));

    this.indexer.addDocuments(tools);
  }

  /**
   * Search guides using BM25 semantic search
   */
  search(input: GuideSearchInput): {
    results: Array<{
      guide: GuideRecord;
      relevance: number;
      progress?: LearningProgress;
    }>;
  } {
    try {
      // Use BM25 for semantic search
      const searchResults = this.indexer.search(input.query, {
        limit: input.limit || 10,
      });

      // Get full guide records and apply filters
      const results = searchResults
        .map((result) => {
          // Extract guide ID from tool name (format: "guide:uuid")
          const guideId = result.toolName.replace('guide:', '');
          const guide = this.store.getGuide(guideId);
          if (!guide) return null;

          // Apply filters
          if (input.category && guide.category !== input.category) return null;
          if (input.difficulty && guide.difficulty !== input.difficulty) return null;
          if (input.relatedTool && !guide.relatedTools.includes(input.relatedTool))
            return null;

          // Get learning progress if available
          const progress = this.store.getProgress(guideId);

          return {
            guide,
            relevance: result.score,
            progress,
          };
        })
        .filter((r) => r !== null);

      return { results };
    } catch (error: any) {
      logger.error('Failed to search guides:', error);
      throw new Error(`Failed to search guides: ${error.message}`);
    }
  }

  /**
   * Handle tutorial actions
   */
  async tutorial(input: GuideTutorialInput): Promise<any> {
    try {
      // Resolve guide ID from slug if provided
      let guideId = input.guideId;
      if (!guideId && input.guideSlug) {
        const guide = this.store.getGuideBySlug(input.guideSlug);
        if (!guide) {
          throw new Error(`Guide not found with slug: ${input.guideSlug}`);
        }
        guideId = guide.id;
      }

      switch (input.action) {
        case 'start':
          return this.startTutorial(guideId!);

        case 'next':
          return this.nextStep(guideId!);

        case 'previous':
          return this.previousStep(guideId!);

        case 'hint':
          return this.getHint(guideId!);

        case 'check':
          return this.checkStep(guideId!);

        case 'status':
          return this.getStatus(guideId!);

        case 'complete':
          return this.completeStep(guideId!);

        case 'reset':
          return this.resetTutorial(guideId!);

        default:
          throw new Error(`Unknown tutorial action: ${input.action}`);
      }
    } catch (error: any) {
      logger.error('Failed to handle tutorial action:', error);
      throw new Error(`Failed to handle tutorial action: ${error.message}`);
    }
  }

  /**
   * Start a tutorial
   */
  private startTutorial(guideId: string): {
    success: boolean;
    guide: GuideRecord;
    currentStep: TutorialStep;
    progress: LearningProgress;
  } {
    const guide = this.store.getGuide(guideId);
    if (!guide) {
      throw new Error(`Guide not found: ${guideId}`);
    }

    const steps = this.store.getSteps(guideId);
    if (steps.length === 0) {
      throw new Error(`No tutorial steps found for guide: ${guide.title}`);
    }

    // Initialize or get progress
    const progress = this.store.updateProgress(guideId, {
      currentStep: 1,
      totalSteps: steps.length,
      status: 'in-progress',
      completedSteps: [],
    });

    const currentStep = steps[0];
    if (!currentStep) {
      throw new Error('Failed to get first step');
    }

    return {
      success: true,
      guide,
      currentStep,
      progress,
    };
  }

  /**
   * Move to next step
   */
  private nextStep(guideId: string): {
    success: boolean;
    currentStep: TutorialStep | null;
    progress: LearningProgress;
    completed: boolean;
  } {
    const progress = this.store.getProgress(guideId);
    if (!progress) {
      throw new Error('Tutorial not started. Use "start" action first.');
    }

    const steps = this.store.getSteps(guideId);
    const nextStepNumber = progress.currentStep + 1;

    if (nextStepNumber > steps.length) {
      // Tutorial completed
      const updatedProgress = this.store.updateProgress(guideId, {
        status: 'completed',
      });

      // Save completion to memory if available
      if (this.memoryManager) {
        const guide = this.store.getGuide(guideId);
        if (guide) {
          this.memoryManager.save({
            key: `tutorial_completed:${guide.slug}`,
            value: `Completed tutorial: ${guide.title}`,
            metadata: {
              category: 'learning',
              tags: ['tutorial', 'completed', guide.category],
            },
          });
        }
      }

      return {
        success: true,
        currentStep: null,
        progress: updatedProgress,
        completed: true,
      };
    }

    const updatedProgress = this.store.updateProgress(guideId, {
      currentStep: nextStepNumber,
    });

    const currentStep = this.store.getStep(guideId, nextStepNumber);

    return {
      success: true,
      currentStep: currentStep || null,
      progress: updatedProgress,
      completed: false,
    };
  }

  /**
   * Move to previous step
   */
  private previousStep(guideId: string): {
    success: boolean;
    currentStep: TutorialStep | null;
    progress: LearningProgress;
  } {
    const progress = this.store.getProgress(guideId);
    if (!progress) {
      throw new Error('Tutorial not started. Use "start" action first.');
    }

    const prevStepNumber = progress.currentStep - 1;

    if (prevStepNumber < 1) {
      throw new Error('Already at the first step');
    }

    const updatedProgress = this.store.updateProgress(guideId, {
      currentStep: prevStepNumber,
    });

    const currentStep = this.store.getStep(guideId, prevStepNumber);

    return {
      success: true,
      currentStep: currentStep || null,
      progress: updatedProgress,
    };
  }

  /**
   * Get hint for current step
   */
  private getHint(guideId: string): {
    success: boolean;
    hints: string[];
    currentStep: TutorialStep;
  } {
    const progress = this.store.getProgress(guideId);
    if (!progress) {
      throw new Error('Tutorial not started. Use "start" action first.');
    }

    const currentStep = this.store.getStep(guideId, progress.currentStep);
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    return {
      success: true,
      hints: currentStep.hints,
      currentStep,
    };
  }

  /**
   * Check current step (for validation)
   */
  private async checkStep(guideId: string): Promise<{
    success: boolean;
    passed: boolean;
    message: string;
    currentStep: TutorialStep;
  }> {
    const progress = this.store.getProgress(guideId);
    if (!progress) {
      throw new Error('Tutorial not started. Use "start" action first.');
    }

    const currentStep = this.store.getStep(guideId, progress.currentStep);
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // If step has a check command, it would be executed here
    // For now, return success with instructions
    if (currentStep.checkCommand) {
      return {
        success: true,
        passed: false,
        message: `Please run the check command: ${currentStep.checkCommand}`,
        currentStep,
      };
    }

    return {
      success: true,
      passed: true,
      message: 'No automatic check available for this step. Proceed when ready.',
      currentStep,
    };
  }

  /**
   * Get tutorial status
   */
  private getStatus(guideId: string): {
    success: boolean;
    guide: GuideRecord;
    progress: LearningProgress;
    currentStep?: TutorialStep;
    stats: {
      completed: number;
      remaining: number;
      percentage: number;
    };
  } {
    const guide = this.store.getGuide(guideId);
    if (!guide) {
      throw new Error(`Guide not found: ${guideId}`);
    }

    const progress = this.store.getProgress(guideId);
    if (!progress) {
      return {
        success: true,
        guide,
        progress: {
          id: '',
          guideId,
          currentStep: 0,
          totalSteps: this.store.getSteps(guideId).length,
          status: 'not-started',
          completedSteps: [],
          startedAt: Date.now(),
          lastAccessedAt: Date.now(),
        },
        stats: {
          completed: 0,
          remaining: this.store.getSteps(guideId).length,
          percentage: 0,
        },
      };
    }

    const currentStep =
      progress.currentStep > 0
        ? this.store.getStep(guideId, progress.currentStep)
        : undefined;

    const completedCount = progress.completedSteps.length;
    const totalSteps = progress.totalSteps;
    const percentage = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

    return {
      success: true,
      guide,
      progress,
      currentStep,
      stats: {
        completed: completedCount,
        remaining: totalSteps - completedCount,
        percentage: Math.round(percentage),
      },
    };
  }

  /**
   * Mark current step as complete
   */
  private completeStep(guideId: string): {
    success: boolean;
    progress: LearningProgress;
    message: string;
  } {
    const progress = this.store.getProgress(guideId);
    if (!progress) {
      throw new Error('Tutorial not started. Use "start" action first.');
    }

    const currentStepNumber = progress.currentStep;
    const completedSteps = [...progress.completedSteps];

    if (!completedSteps.includes(currentStepNumber)) {
      completedSteps.push(currentStepNumber);
    }

    const updatedProgress = this.store.updateProgress(guideId, {
      completedSteps,
    });

    return {
      success: true,
      progress: updatedProgress,
      message: `Step ${currentStepNumber} marked as complete`,
    };
  }

  /**
   * Reset tutorial progress
   */
  private resetTutorial(guideId: string): {
    success: boolean;
    message: string;
  } {
    const guide = this.store.getGuide(guideId);
    if (!guide) {
      throw new Error(`Guide not found: ${guideId}`);
    }

    // Delete progress to reset
    this.store.deleteProgress(guideId);

    return {
      success: true,
      message: `Tutorial reset for: ${guide.title}`,
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const storeStats = this.store.getStatistics();
    const indexStats = this.indexer.getStatistics();

    return {
      store: storeStats,
      index: {
        documentsIndexed: indexStats.documentCount,
        avgDocumentLength: indexStats.averageDocumentLength,
      },
    };
  }

  /**
   * Get MCP tool definitions for guide features
   */
  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'guide_search',
        description:
          'Search for guides and tutorials using semantic search. Find learning resources by query, category, difficulty, or related tools.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (natural language)',
            },
            category: {
              type: 'string',
              enum: [
                'getting-started',
                'tutorial',
                'reference',
                'concept',
                'troubleshooting',
              ],
              description: 'Filter by guide category',
            },
            difficulty: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'Filter by difficulty level',
            },
            relatedTool: {
              type: 'string',
              description: 'Filter by related tool name',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
        category: 'guide',
        keywords: [
          'guide',
          'tutorial',
          'learn',
          'documentation',
          'help',
          'search',
          'find',
        ],
        serverId: 'internal:guide',
      },
      {
        name: 'guide_tutorial',
        description:
          'Interactive tutorial system. Start, navigate, and track progress through step-by-step guides.',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: [
                'start',
                'next',
                'previous',
                'hint',
                'check',
                'status',
                'complete',
                'reset',
              ],
              description:
                'Tutorial action: start (begin), next (move forward), previous (move back), hint (get help), check (validate step), status (view progress), complete (mark step done), reset (restart)',
            },
            guideId: {
              type: 'string',
              description: 'Guide ID (use this OR guideSlug)',
            },
            guideSlug: {
              type: 'string',
              description: 'Guide slug (use this OR guideId)',
            },
          },
          required: ['action'],
        },
        category: 'guide',
        keywords: [
          'tutorial',
          'guide',
          'learn',
          'interactive',
          'step',
          'progress',
          'training',
        ],
        serverId: 'internal:guide',
      },
    ];
  }

  /**
   * Handle tool calls (for Gateway integration) with Zod validation
   */
  async handleToolCall(toolName: string, args: unknown): Promise<unknown> {
    switch (toolName) {
      case 'guide_search': {
        const validation = validateInput(GuideSearchInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.search(validation.data!);
      }

      case 'guide_tutorial': {
        const validation = validateInput(GuideTutorialInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.tutorial(validation.data!);
      }

      default:
        throw new Error(`Unknown guide tool: ${toolName}`);
    }
  }

  /**
   * Close resources
   */
  close(): void {
    this.store.close();
  }

  /**
   * Get the underlying store (for initialization purposes)
   */
  getStore(): GuideStore {
    return this.store;
  }

  /**
   * Get the BM25 indexer (for initialization purposes)
   */
  getIndexer(): BM25Indexer {
    return this.indexer;
  }
}
