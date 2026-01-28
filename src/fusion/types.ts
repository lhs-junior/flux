/**
 * Fusion Evaluation System Types
 *
 * Evaluates potential feature integrations and recommends fusion opportunities
 */

/**
 * Fusion Level indicates the degree of integration between features
 *
 * Level 0: No integration - Features work independently
 * Level 1: Basic integration - Simple data passing or sequential execution
 * Level 2: Medium integration - Shared context and automatic triggers
 * Level 3: Advanced integration - Deep hooks and bidirectional data flow
 * Level 4: Full fusion - Seamless unified experience, merged workflows
 */
export type FusionLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Hook types for feature integration points
 */
export enum HookType {
  /** Triggered before an operation starts */
  PRE_EXECUTION = 'pre_execution',

  /** Triggered after an operation completes successfully */
  POST_EXECUTION = 'post_execution',

  /** Triggered when an operation fails */
  ON_ERROR = 'on_error',

  /** Triggered when data is created or updated */
  DATA_CHANGE = 'data_change',

  /** Triggered when status changes (e.g., agent state, TDD phase) */
  STATUS_CHANGE = 'status_change',

  /** Triggered periodically during long-running operations */
  PROGRESS_UPDATE = 'progress_update',

  /** Triggered when a condition is met */
  CONDITIONAL = 'conditional',

  /** Custom event-based trigger */
  CUSTOM_EVENT = 'custom_event'
}

/**
 * Evaluation metrics for fusion potential
 */
export interface FusionMetrics {
  /** Synergy score: How well features complement each other (0-20) */
  synergy: number;

  /** Automation score: Potential for reducing manual steps (0-20) */
  automation: number;

  /** Performance score: Impact on execution efficiency (0-20) */
  performance: number;

  /** User value score: Direct benefit to end users (0-20) */
  userValue: number;

  /** Total score: Sum of all metrics (0-80) */
  total: number;
}

/**
 * Detailed evaluation of fusion potential between two features
 */
export interface FusionPotential {
  /** First feature identifier */
  featureA: string;

  /** Second feature identifier */
  featureB: string;

  /** Current integration level */
  currentLevel: FusionLevel;

  /** Estimated achievable level with fusion implementation */
  potentialLevel: FusionLevel;

  /** Detailed scoring metrics */
  metrics: FusionMetrics;

  /** Recommended integration patterns */
  recommendedPatterns: string[];

  /** Specific integration opportunities */
  opportunities: FusionOpportunity[];

  /** Estimated implementation effort (hours) */
  estimatedEffort: number;

  /** Priority level (high, medium, low) */
  priority: 'high' | 'medium' | 'low';

  /** Human-readable recommendation */
  recommendation: string;
}

/**
 * Specific integration opportunity between features
 */
export interface FusionOpportunity {
  /** Brief description of the opportunity */
  description: string;

  /** Hook type that would enable this integration */
  hookType: HookType;

  /** Feature that would provide the hook */
  hookProvider: string;

  /** Feature that would consume the hook */
  hookConsumer: string;

  /** Expected user value gain */
  valueGain: string;

  /** Implementation complexity (1-5) */
  complexity: number;
}

/**
 * Result of a fusion implementation
 */
export interface FusionResult {
  /** Features involved in the fusion */
  features: string[];

  /** Achieved fusion level */
  level: FusionLevel;

  /** Patterns implemented */
  patternsUsed: string[];

  /** Hooks registered */
  hooks: {
    type: HookType;
    provider: string;
    consumer: string;
  }[];

  /** Performance metrics after fusion */
  performanceMetrics: {
    executionTime: number;
    stepsReduced: number;
    tokensSaved: number;
  };

  /** Success status */
  success: boolean;

  /** Error message if fusion failed */
  error?: string;
}

/**
 * Configuration for feature fusion
 */
export interface FusionConfig {
  /** Enable automatic trigger propagation */
  autoTriggers: boolean;

  /** Enable shared context between features */
  sharedContext: boolean;

  /** Enable pipeline execution */
  enablePipeline: boolean;

  /** Enable parallel execution */
  enableParallel: boolean;

  /** Maximum depth for chained fusions */
  maxChainDepth: number;

  /** Timeout for fusion operations (ms) */
  timeout: number;
}

/**
 * Feature metadata for fusion evaluation
 */
export interface FeatureMetadata {
  /** Feature identifier */
  id: string;

  /** Feature display name */
  name: string;

  /** Primary capabilities */
  capabilities: string[];

  /** Data types produced */
  outputs: string[];

  /** Data types consumed */
  inputs: string[];

  /** Available hook points */
  hookPoints: HookType[];

  /** Current integrations with other features */
  integrations: string[];

  /** Average execution time (ms) */
  avgExecutionTime: number;

  /** Stateful or stateless */
  stateful: boolean;
}
