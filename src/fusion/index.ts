/**
 * Fusion Module - Feature Integration System
 *
 * Evaluates and implements feature fusion patterns for seamless integration
 */

// Types
export type { FusionLevel } from './types';
export { HookType } from './types';
export type {
  FusionMetrics,
  FusionPotential,
  FusionOpportunity,
  FusionResult,
  FusionConfig,
  FeatureMetadata
} from './types';

// Evaluator
export { FusionEvaluator } from './fusion-evaluator';

// Patterns
export type {
  FusionContext,
  FusionHook,
  PipelineStage,
  ParallelTask
} from './fusion-patterns';
export {
  AutoTriggerFusion,
  SharedContextFusion,
  PipelineFusion,
  ParallelFusion,
  FusionOrchestrator
} from './fusion-patterns';

// Lifecycle Hooks (Implementations)
export {
  HooksManager,
  LifecycleHookType,
  getGlobalHooksManager,
  resetGlobalHooksManager,
  type HookContext,
  type HookHandler,
} from './implementations/lifecycle-hooks-fusion';

// Context Recovery (Implementations)
export {
  ContextRecoveryManager,
  type FeatureState,
  type ContextRecord,
  type SessionSummary,
} from './implementations/context-recovery-fusion';

// Workflow Fusion (Implementations)
export {
  WorkflowOrchestrator,
  type WorkflowTask,
  type WorkflowResult,
} from './implementations/workflow-fusion';
