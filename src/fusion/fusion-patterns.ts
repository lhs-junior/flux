/**
 * Fusion Patterns
 *
 * Implementation patterns for feature integration
 */

import { HookType, FusionResult, FusionConfig } from './types';

/**
 * Base class for fusion patterns
 */
abstract class BaseFusionPattern {
  protected config: FusionConfig;

  constructor(config?: Partial<FusionConfig>) {
    this.config = {
      autoTriggers: true,
      sharedContext: true,
      enablePipeline: true,
      enableParallel: true,
      maxChainDepth: 5,
      timeout: 30000,
      ...config
    };
  }

  /**
   * Execute the fusion pattern
   */
  abstract execute(context: FusionContext): Promise<FusionResult>;

  /**
   * Validate if pattern can be applied
   */
  abstract validate(context: FusionContext): boolean;

  /**
   * Get pattern name
   */
  abstract getPatternName(): string;
}

/**
 * Context passed between fused features
 */
export interface FusionContext {
  /** Source feature identifier */
  source: string;

  /** Target feature identifier */
  target: string;

  /** Operation being performed */
  operation: string;

  /** Input data */
  data: any;

  /** Shared context data between features */
  sharedData?: Record<string, any>;

  /** Metadata */
  metadata?: Record<string, any>;

  /** Timestamp */
  timestamp: number;
}

/**
 * Hook registration for fusion
 */
export interface FusionHook {
  /** Hook type */
  type: HookType;

  /** Feature providing the hook */
  provider: string;

  /** Feature consuming the hook */
  consumer: string;

  /** Hook handler function */
  handler: (context: FusionContext) => Promise<void>;

  /** Condition for hook execution */
  condition?: (context: FusionContext) => boolean;
}

/**
 * AutoTriggerFusion Pattern
 *
 * Automatically triggers dependent features when source completes
 *
 * Example: Agent completion → Auto-save to memory
 *          TDD phase change → Auto-create planning todo
 */
export class AutoTriggerFusion extends BaseFusionPattern {
  private hooks: Map<string, FusionHook[]> = new Map();

  getPatternName(): string {
    return 'AutoTriggerFusion';
  }

  /**
   * Register a hook for automatic triggering
   */
  registerHook(hook: FusionHook): void {
    const key = `${hook.provider}:${hook.type}`;
    const existing = this.hooks.get(key) || [];
    existing.push(hook);
    this.hooks.set(key, existing);
  }

  /**
   * Unregister a hook
   */
  unregisterHook(provider: string, type: HookType, consumer: string): void {
    const key = `${provider}:${type}`;
    const existing = this.hooks.get(key) || [];
    this.hooks.set(
      key,
      existing.filter(h => h.consumer !== consumer)
    );
  }

  /**
   * Trigger hooks for a given event
   */
  async triggerHooks(provider: string, type: HookType, context: FusionContext): Promise<void> {
    if (!this.config.autoTriggers) return;

    const key = `${provider}:${type}`;
    const hooks = this.hooks.get(key) || [];

    const results = await Promise.allSettled(
      hooks
        .filter(hook => !hook.condition || hook.condition(context))
        .map(hook => this.executeHook(hook, context))
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const hook = hooks[index];
        if (hook) {
          console.error(`Hook execution failed for ${hook.consumer}:`, result.reason);
        }
      }
    });
  }

  /**
   * Execute a single hook
   */
  private async executeHook(hook: FusionHook, context: FusionContext): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Hook execution timeout')), this.config.timeout)
    );

    await Promise.race([hook.handler(context), timeoutPromise]);
  }

  validate(context: FusionContext): boolean {
    return this.config.autoTriggers && !!context.source && !!context.target;
  }

  async execute(context: FusionContext): Promise<FusionResult> {
    const startTime = Date.now();

    try {
      // Determine hook type based on operation
      const hookType = this.inferHookType(context.operation);

      // Trigger relevant hooks
      await this.triggerHooks(context.source, hookType, context);

      const executionTime = Date.now() - startTime;

      return {
        features: [context.source, context.target],
        level: 2,
        patternsUsed: [this.getPatternName()],
        hooks: Array.from(this.hooks.values())
          .flat()
          .map(h => ({ type: h.type, provider: h.provider, consumer: h.consumer })),
        performanceMetrics: {
          executionTime,
          stepsReduced: this.hooks.size,
          tokensSaved: 0
        },
        success: true
      };
    } catch (error) {
      return {
        features: [context.source, context.target],
        level: 0,
        patternsUsed: [this.getPatternName()],
        hooks: [],
        performanceMetrics: {
          executionTime: Date.now() - startTime,
          stepsReduced: 0,
          tokensSaved: 0
        },
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Infer hook type from operation name
   */
  private inferHookType(operation: string): HookType {
    if (operation.includes('complete') || operation.includes('finish')) {
      return HookType.POST_EXECUTION;
    }
    if (operation.includes('start') || operation.includes('begin')) {
      return HookType.PRE_EXECUTION;
    }
    if (operation.includes('error') || operation.includes('fail')) {
      return HookType.ON_ERROR;
    }
    if (operation.includes('update') || operation.includes('change')) {
      return HookType.DATA_CHANGE;
    }
    return HookType.CUSTOM_EVENT;
  }
}

/**
 * SharedContextFusion Pattern
 *
 * Shares data context between features for seamless integration
 *
 * Example: Agent uses memory context for enhanced responses
 *          TDD phases share test results with planning
 */
export class SharedContextFusion extends BaseFusionPattern {
  private contextStore: Map<string, any> = new Map();

  getPatternName(): string {
    return 'SharedContextFusion';
  }

  /**
   * Set shared context data
   */
  setContext(key: string, value: any): void {
    if (!this.config.sharedContext) return;
    this.contextStore.set(key, value);
  }

  /**
   * Get shared context data
   */
  getContext<T = any>(key: string): T | undefined {
    if (!this.config.sharedContext) return undefined;
    return this.contextStore.get(key);
  }

  /**
   * Get all context data for a feature
   */
  getFeatureContext(featureId: string): Record<string, any> {
    if (!this.config.sharedContext) return {};

    const context: Record<string, any> = {};
    for (const [key, value] of this.contextStore.entries()) {
      if (key.startsWith(`${featureId}:`)) {
        const shortKey = key.substring(featureId.length + 1);
        context[shortKey] = value;
      }
    }
    return context;
  }

  /**
   * Clear context for a feature
   */
  clearFeatureContext(featureId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.contextStore.keys()) {
      if (key.startsWith(`${featureId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.contextStore.delete(key));
  }

  /**
   * Merge context from source to target
   */
  mergeContext(source: string, target: string, keys?: string[]): void {
    if (!this.config.sharedContext) return;

    const sourceContext = this.getFeatureContext(source);
    const keysToMerge = keys || Object.keys(sourceContext);

    keysToMerge.forEach(key => {
      if (sourceContext[key] !== undefined) {
        this.setContext(`${target}:${key}`, sourceContext[key]);
      }
    });
  }

  validate(context: FusionContext): boolean {
    return this.config.sharedContext && !!context.source && !!context.target;
  }

  async execute(context: FusionContext): Promise<FusionResult> {
    const startTime = Date.now();

    try {
      // Store context data
      const contextKey = `${context.source}:${context.operation}`;
      this.setContext(contextKey, context.data);

      // Make context available to target
      this.mergeContext(context.source, context.target);

      const executionTime = Date.now() - startTime;

      return {
        features: [context.source, context.target],
        level: 2,
        patternsUsed: [this.getPatternName()],
        hooks: [],
        performanceMetrics: {
          executionTime,
          stepsReduced: 1,
          tokensSaved: 0
        },
        success: true
      };
    } catch (error) {
      return {
        features: [context.source, context.target],
        level: 0,
        patternsUsed: [this.getPatternName()],
        hooks: [],
        performanceMetrics: {
          executionTime: Date.now() - startTime,
          stepsReduced: 0,
          tokensSaved: 0
        },
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * PipelineFusion Pattern
 *
 * Creates sequential execution pipeline between features
 *
 * Example: Agent → Planning → TDD workflow
 *          Science analysis → Memory save → Report generation
 */
export class PipelineFusion extends BaseFusionPattern {
  private stages: PipelineStage[] = [];

  getPatternName(): string {
    return 'PipelineFusion';
  }

  /**
   * Add a stage to the pipeline
   */
  addStage(stage: PipelineStage): void {
    if (!this.config.enablePipeline) return;
    this.stages.push(stage);
  }

  /**
   * Remove a stage from the pipeline
   */
  removeStage(featureId: string): void {
    this.stages = this.stages.filter(s => s.feature !== featureId);
  }

  /**
   * Execute the pipeline
   */
  async executePipeline(initialContext: FusionContext): Promise<FusionResult> {
    if (!this.config.enablePipeline) {
      throw new Error('Pipeline execution is disabled');
    }

    const startTime = Date.now();
    let currentContext = initialContext;
    const executedStages: string[] = [];
    const allHooks: Array<{ type: HookType; provider: string; consumer: string }> = [];

    try {
      for (let i = 0; i < this.stages.length; i++) {
        const stage = this.stages[i];

        if (!stage) {
          continue;
        }

        // Check depth limit
        if (i >= this.config.maxChainDepth) {
          console.warn(`Pipeline depth limit reached (${this.config.maxChainDepth})`);
          break;
        }

        // Check condition
        if (stage.condition && !stage.condition(currentContext)) {
          continue;
        }

        // Execute stage
        const stageResult = await this.executeStage(stage, currentContext);

        executedStages.push(stage.feature);

        // Update context for next stage
        if (stageResult.data) {
          const nextStage = this.stages[i + 1];
          currentContext = {
            ...currentContext,
            source: stage.feature,
            target: nextStage?.feature || currentContext.target,
            data: stageResult.data,
            sharedData: { ...currentContext.sharedData, ...stageResult.sharedData }
          };
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        features: executedStages,
        level: 3,
        patternsUsed: [this.getPatternName()],
        hooks: allHooks,
        performanceMetrics: {
          executionTime,
          stepsReduced: executedStages.length - 1,
          tokensSaved: 0
        },
        success: true
      };
    } catch (error) {
      return {
        features: executedStages,
        level: 0,
        patternsUsed: [this.getPatternName()],
        hooks: [],
        performanceMetrics: {
          executionTime: Date.now() - startTime,
          stepsReduced: 0,
          tokensSaved: 0
        },
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a single pipeline stage
   */
  private async executeStage(
    stage: PipelineStage,
    context: FusionContext
  ): Promise<{ data: any; sharedData?: Record<string, any> }> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Stage ${stage.feature} timeout`)), this.config.timeout)
    );

    return await Promise.race([stage.handler(context), timeoutPromise]);
  }

  validate(context: FusionContext): boolean {
    return this.config.enablePipeline && this.stages.length > 0;
  }

  async execute(context: FusionContext): Promise<FusionResult> {
    return this.executePipeline(context);
  }
}

/**
 * Pipeline stage definition
 */
export interface PipelineStage {
  /** Feature identifier */
  feature: string;

  /** Stage handler function */
  handler: (context: FusionContext) => Promise<{ data: any; sharedData?: Record<string, any> }>;

  /** Condition for stage execution */
  condition?: (context: FusionContext) => boolean;

  /** Error handler */
  onError?: (error: Error, context: FusionContext) => void;
}

/**
 * ParallelFusion Pattern
 *
 * Executes multiple features in parallel for performance
 *
 * Example: Save to memory + Create todo simultaneously
 *          Run tests + Generate docs in parallel
 */
export class ParallelFusion extends BaseFusionPattern {
  private tasks: ParallelTask[] = [];

  getPatternName(): string {
    return 'ParallelFusion';
  }

  /**
   * Add a task to parallel execution
   */
  addTask(task: ParallelTask): void {
    if (!this.config.enableParallel) return;
    this.tasks.push(task);
  }

  /**
   * Remove a task
   */
  removeTask(featureId: string): void {
    this.tasks = this.tasks.filter(t => t.feature !== featureId);
  }

  /**
   * Execute all tasks in parallel
   */
  async executeParallel(context: FusionContext): Promise<FusionResult> {
    if (!this.config.enableParallel) {
      throw new Error('Parallel execution is disabled');
    }

    const startTime = Date.now();
    const features: string[] = [];

    try {
      // Create task promises
      const taskPromises = this.tasks.map(task => this.executeTask(task, context));

      // Execute all in parallel
      const results = await Promise.allSettled(taskPromises);

      // Collect successful features
      results.forEach((result, index) => {
        const task = this.tasks[index];
        if (task) {
          if (result.status === 'fulfilled') {
            features.push(task.feature);
          } else {
            console.error(`Parallel task failed for ${task.feature}:`, result.reason);
          }
        }
      });

      const executionTime = Date.now() - startTime;
      const successRate = features.length / this.tasks.length;

      return {
        features,
        level: 2,
        patternsUsed: [this.getPatternName()],
        hooks: [],
        performanceMetrics: {
          executionTime,
          stepsReduced: Math.floor(this.tasks.length / 2),
          tokensSaved: 0
        },
        success: successRate >= 0.5 // At least 50% success
      };
    } catch (error) {
      return {
        features,
        level: 0,
        patternsUsed: [this.getPatternName()],
        hooks: [],
        performanceMetrics: {
          executionTime: Date.now() - startTime,
          stepsReduced: 0,
          tokensSaved: 0
        },
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a single parallel task
   */
  private async executeTask(task: ParallelTask, context: FusionContext): Promise<any> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Task ${task.feature} timeout`)), this.config.timeout)
    );

    return await Promise.race([task.handler(context), timeoutPromise]);
  }

  validate(context: FusionContext): boolean {
    return this.config.enableParallel && this.tasks.length > 0;
  }

  async execute(context: FusionContext): Promise<FusionResult> {
    return this.executeParallel(context);
  }
}

/**
 * Parallel task definition
 */
export interface ParallelTask {
  /** Feature identifier */
  feature: string;

  /** Task handler function */
  handler: (context: FusionContext) => Promise<any>;

  /** Priority (higher = more important) */
  priority?: number;

  /** Whether failure is critical */
  critical?: boolean;
}

/**
 * Fusion orchestrator for managing multiple patterns
 */
export class FusionOrchestrator {
  private autoTrigger: AutoTriggerFusion;
  private sharedContext: SharedContextFusion;
  private pipeline: PipelineFusion;
  private parallel: ParallelFusion;

  constructor(config?: Partial<FusionConfig>) {
    this.autoTrigger = new AutoTriggerFusion(config);
    this.sharedContext = new SharedContextFusion(config);
    this.pipeline = new PipelineFusion(config);
    this.parallel = new ParallelFusion(config);
  }

  getAutoTrigger(): AutoTriggerFusion {
    return this.autoTrigger;
  }

  getSharedContext(): SharedContextFusion {
    return this.sharedContext;
  }

  getPipeline(): PipelineFusion {
    return this.pipeline;
  }

  getParallel(): ParallelFusion {
    return this.parallel;
  }

  /**
   * Execute fusion with appropriate pattern
   */
  async executeFusion(patternName: string, context: FusionContext): Promise<FusionResult> {
    switch (patternName) {
      case 'AutoTriggerFusion':
        return this.autoTrigger.execute(context);
      case 'SharedContextFusion':
        return this.sharedContext.execute(context);
      case 'PipelineFusion':
        return this.pipeline.execute(context);
      case 'ParallelFusion':
        return this.parallel.execute(context);
      default:
        throw new Error(`Unknown fusion pattern: ${patternName}`);
    }
  }
}
