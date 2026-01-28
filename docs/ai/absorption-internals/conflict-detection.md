# ConflictResolver: Conflict Detection and Resolution Algorithms

## Overview

The ConflictResolver is FLUX's conflict detection and resolution system that analyzes incoming tools for naming, architectural, and functional conflicts with existing tools. It recommends resolution strategies with three priority levels: Merge > Namespace > Deprecate.

**Source**: `src/absorption/conflict-resolver.ts`

---

## Architecture

### Core Components

```typescript
interface ToolDefinition {
  name: string;               // Tool identifier (e.g., 'agent_list')
  description: string;        // Tool purpose
  domain: string;             // Feature domain (memory, agent, planning, etc.)
  parameters: Record<string, any>;  // Parameter definitions
}

interface Conflict {
  type: 'naming' | 'architecture' | 'functionality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  existing: ToolDefinition | string;
  incoming: ToolDefinition | string;
  description: string;
}

interface ConflictResolution {
  conflicts: Conflict[];
  strategy: ResolutionStrategy;
  approved: boolean;
  notes: string[];
}
```

---

## Conflict Detection Patterns

### 1. Naming Conflicts

Detect tool naming collisions and similarities.

#### Pattern 1a: Exact Match (Critical Severity)

```typescript
Detection Logic:
├─ Compare incoming.name with all existing tools
└─ If exact match found: Critical severity conflict

Example:
├─ Existing: 'agent_list'
├─ Incoming: 'agent_list'
├─ Severity: Critical
└─ Description: "Tool name 'agent_list' already exists"
```

**Severity Justification**: Exact naming conflicts cause tool registry collisions, breaking existing API contracts.

#### Pattern 1b: Prefix Match (Medium Severity)

```typescript
Detection Logic:
├─ Extract prefix (part before first '_')
├─ Compare incoming prefix with all existing tool prefixes
└─ If match found: Medium severity conflict

Example Matching:
├─ Existing: 'agent_list', 'agent_create', 'agent_update'
├─ Incoming: 'agent_spawn'
├─ Extracted prefix (incoming): 'agent'
├─ Extracted prefix (existing): 'agent'
├─ Match: true
├─ Severity: Medium
└─ Description: "Tool name 'agent_spawn' is similar to 'agent_list'"

Prefix Extraction:
const prefix = toolName.split('_')[0];
// 'memory_create' → 'memory'
// 'tdd_run_tests' → 'tdd'
```

**Severity Justification**: Prefix collisions suggest semantic overlap but don't break existing tools. Both tools can coexist with namespace adjustments.

#### Detection Algorithm

```typescript
detectNamingConflict(incoming: ToolDefinition): Conflict | null {
  // Step 1: Check exact match
  if (this.existingTools.has(incoming.name)) {
    return {
      type: 'naming',
      severity: 'critical',
      existing: this.existingTools.get(incoming.name)!,
      incoming,
      description: `Tool name "${incoming.name}" already exists`
    };
  }

  // Step 2: Check similar tool names (prefix match)
  const similarTool = this.findSimilarToolName(incoming.name);
  if (similarTool) {
    return {
      type: 'naming',
      severity: 'medium',
      existing: similarTool,
      incoming,
      description: `Tool name "${incoming.name}" is similar to "${similarTool.name}"`
    };
  }

  return null;
}

private findSimilarToolName(name: string): ToolDefinition | null {
  const prefix = name.split('_')[0];  // Extract domain prefix

  for (const [existingName, tool] of this.existingTools) {
    // Check if existing tool shares the same domain prefix
    if (existingName.startsWith(prefix + '_')) {
      return tool;
    }
  }

  return null;
}
```

---

### 2. Functionality Conflicts

Detect tools that perform overlapping operations within the same domain.

#### Pattern 2a: Domain-Action Overlap (High Severity)

```typescript
Detection Logic:
├─ Extract action from tool name (part after last '_')
├─ For incoming tool, find existing tools in same domain
├─ If same domain AND same action: High severity conflict

Example:
├─ Domain extraction: 'agent_list' → domain: 'agent'
├─ Action extraction: 'agent_list' → action: 'list'
├─ Existing: 'agent_list' (domain: 'agent', action: 'list')
├─ Incoming: 'planning_list' (domain: 'planning', action: 'list')
├─ Severity: None (different domains)
│
├─ Existing: 'agent_list' (domain: 'agent', action: 'list')
├─ Incoming: 'agent_query' (domain: 'agent', action: 'query')
├─ Severity: High (same domain, similar action)
└─ Description: "Similar functionality: 'agent_list' and 'agent_query' both list agents"
```

#### Action Extraction

```typescript
private extractAction(toolName: string): string {
  const parts = toolName.split('_');
  return parts[parts.length - 1] ?? 'unknown';
}

// Examples:
// 'memory_create' → 'create'
// 'tdd_run_all_tests' → 'tests'
// 'agent_list' → 'list'
// 'planning_create_todo' → 'todo'
```

#### Detection Algorithm

```typescript
detectFunctionalityConflict(incoming: ToolDefinition): Conflict | null {
  // Find similar functionality in same domain
  const similarFunc = this.findSimilarFunctionality(incoming);

  if (similarFunc) {
    return {
      type: 'functionality',
      severity: 'high',
      existing: similarFunc,
      incoming,
      description: `Similar functionality: "${similarFunc.name}" and "${incoming.name}" both ${this.extractAction(incoming.name)}`
    };
  }

  return null;
}

private findSimilarFunctionality(incoming: ToolDefinition): ToolDefinition | null {
  const incomingAction = this.extractAction(incoming.name);

  for (const [_, tool] of this.existingTools) {
    // Same domain?
    if (tool.domain === incoming.domain) {
      const existingAction = this.extractAction(tool.name);
      // Same action?
      if (existingAction === incomingAction) {
        return tool;  // Functionality overlap detected
      }
    }
  }

  return null;
}
```

---

### 3. Architectural Conflicts

Detect misalignments with FLUX's core architecture.

#### Pattern 3a: Storage Architecture Mismatch

```typescript
Detection Logic:
├─ Keyword detection in incoming tool description
├─ If 'file' keyword found and we use SQLite:
│  └─ Severity: Low (can be migrated)
└─ Return architectural conflict

Example:
├─ Existing: SQLite-based memory store
├─ Incoming: 'file_based_cache' (contains 'file' keyword)
├─ Severity: Low
├─ Description: "Incoming tool uses file storage, we use SQLite"
└─ Resolution: Migrate incoming to SQLite pattern
```

#### Detection Algorithm

```typescript
detectArchitectureConflict(incoming: ToolDefinition): Conflict | null {
  // Pattern: Check for file-based storage in file-based system
  if (incoming.description.toLowerCase().includes('file')) {
    return {
      type: 'architecture',
      severity: 'low',
      existing: 'SQLite-based storage',
      incoming: incoming.name,
      description: 'Incoming tool uses file storage, we use SQLite'
    };
  }

  // Additional patterns can be added:
  // - Gateway pattern detection
  // - Microservices vs monolith
  // - API versioning conflicts
  // - etc.

  return null;
}
```

---

## Conflict Severity Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ CRITICAL (Automatic Rejection)                      │
├─────────────────────────────────────────────────────┤
│ • Exact tool name collision                          │
│ • Cannot proceed without resolution                  │
│ • Requires MERGE or NAMESPACE strategy               │
└─────────────────────────────────────────────────────┘
         ↓ (Escalation)
┌─────────────────────────────────────────────────────┐
│ HIGH (Strong Recommendation for Resolution)         │
├─────────────────────────────────────────────────────┤
│ • Functionality overlap (same domain, same action)   │
│ • Should MERGE tools into unified API                │
│ • Prevent duplicate implementations                  │
└─────────────────────────────────────────────────────┘
         ↓ (Escalation)
┌─────────────────────────────────────────────────────┐
│ MEDIUM (Consider Resolution)                        │
├─────────────────────────────────────────────────────┤
│ • Naming similarity (prefix collision)               │
│ • Tools can coexist with NAMESPACE strategy          │
│ • Reduces cognitive overhead                        │
└─────────────────────────────────────────────────────┘
         ↓ (Escalation)
┌─────────────────────────────────────────────────────┐
│ LOW (Informational)                                 │
├─────────────────────────────────────────────────────┤
│ • Architecture pattern differences                   │
│ • Can be addressed via migration patterns            │
│ • No blocking issues                                 │
└─────────────────────────────────────────────────────┘
```

---

## Resolution Strategies

### Strategy 1: MERGE

**When to use**: Functionality conflict (HIGH severity) or no conflicts detected.

**Goal**: Combine overlapping tools into a unified, more powerful API.

#### Merge Pattern Implementation

```typescript
createMergeStrategy(conflict: Conflict | null, incomingTools: ToolDefinition[]): ResolutionStrategy {
  if (!conflict) {
    // No conflicts - merge freely
    return {
      type: 'merge',
      action: 'Integrate incoming tools as-is',
      rationale: 'No significant conflicts detected',
      implementation: 'Add tools with their original names'
    };
  }

  const existing = conflict.existing as ToolDefinition;
  const incoming = conflict.incoming as ToolDefinition;

  return {
    type: 'merge',
    action: `Merge "${existing.name}" and "${incoming.name}" into unified API`,
    rationale: 'Both tools provide similar functionality, merge for better UX',
    implementation: `Create unified tool that supports both use cases:
  - Add 'type' parameter to distinguish use cases
  - Combine parameters from both tools
  - Example: ${this.generateMergeExample(existing, incoming)}`
  };
}
```

#### Merge Example

```
Existing: agent_list
├─ Parameters: { filter?: string, limit?: number }
└─ Description: List all agents with optional filtering

Incoming: agent_query
├─ Parameters: { query: string, options?: QueryOptions }
└─ Description: Query agents with advanced search

Merged Tool: agent_unified
├─ Parameters: {
│   type: 'list' | 'query',
│   // From agent_list:
│   filter?: string,
│   limit?: number,
│   // From agent_query:
│   query?: string,
│   options?: QueryOptions
│ }
└─ Usage:
   agent_unified({ type: 'list', limit: 10 })
   agent_unified({ type: 'query', query: 'backend', options: { exact: true } })
```

#### When Merge Fails

- **Conflicting parameter semantics**: Same param name with different meanings
- **Incompatible return types**: Different data structures
- **Domain-specific logic**: Tools too specialized to unify

→ Escalate to NAMESPACE strategy

---

### Strategy 2: NAMESPACE

**When to use**: Naming conflicts (CRITICAL or MEDIUM severity) or merge is infeasible.

**Goal**: Add domain-specific prefix to distinguish tool ownership and prevent collisions.

#### Namespace Pattern Implementation

```typescript
createNamespaceStrategy(conflict: Conflict, incomingTools: ToolDefinition[]): ResolutionStrategy {
  const domain = incomingTools[0]?.domain || 'unknown';

  return {
    type: 'namespace',
    action: `Add "${domain}_" prefix to incoming tools`,
    rationale: `Prevent naming conflicts by using domain-specific prefix`,
    implementation: `Rename tools:
${incomingTools
  .map((t) => `  - ${t.name} → ${domain}_${t.name.split('_').slice(1).join('_')}`)
  .join('\n')}`
  };
}
```

#### Namespace Example

```
Incoming Domain: storage
Existing Tools: memory_create, memory_list, memory_update

Conflict:
├─ Incoming: memory_query
├─ Existing: memory_list
└─ Both in 'memory' domain

Resolution (NAMESPACE):
├─ New incoming name: storage_query
├─ Preserves original name structure
├─ Clear ownership: storage_ prefix indicates origin
└─ No collision with existing memory_query

Resulting Registry:
├─ memory_create
├─ memory_list
├─ memory_update
└─ storage_query (incoming)
```

#### Namespace Rules

```typescript
// Format: domain_action or domain_resource_action
const newName = `${newDomain}_${tool.name.split('_').slice(1).join('_')}`;

// Examples:
// Original: memory_create
// Domain: persistence
// Result: persistence_create

// Original: tdd_run_phase
// Domain: testing
// Result: testing_run_phase

// Original: agent_orchestrate_workflow
// Domain: scheduler
// Result: scheduler_orchestrate_workflow
```

---

### Strategy 3: DEPRECATE

**When to use**: New tool is strictly superior to existing tool.

**Goal**: Replace outdated tool with improved version while maintaining backward compatibility.

#### Deprecation Pattern Implementation

```typescript
createDeprecateStrategy(conflict: Conflict): ResolutionStrategy {
  const existing = conflict.existing as ToolDefinition;
  const incoming = conflict.incoming as ToolDefinition;

  return {
    type: 'deprecate',
    action: `Replace "${existing.name}" with "${incoming.name}"`,
    rationale: 'Incoming tool is superior, deprecate existing',
    implementation: `1. Mark "${existing.name}" as deprecated
2. Add "${incoming.name}" as replacement
3. Migration guide for users`
  };
}
```

#### Deprecation Requirements

For DEPRECATE strategy to be approved:

```typescript
// Only approved for:
├─ Clear performance improvements (2x+ faster)
├─ Strict API compatibility (drop-in replacement)
├─ Major feature additions
└─ Code quality improvements (reduced deps, simpler)

// NOT approved for:
├─ Breaking API changes
├─ Removal of functionality
├─ Architectural changes
└─ Different use cases (use MERGE instead)
```

#### Migration Path

```
Deprecation Timeline:
├─ v1.0 (Current):
│  ├─ agent_list available
│  └─ No deprecation marker
│
├─ v1.1 (Incoming):
│  ├─ agent_list marked @deprecated
│  ├─ agent_query_all available
│  └─ Deprecation warning in logs
│
├─ v2.0 (Future):
│  ├─ agent_list throws error
│  ├─ Migration guide provided
│  └─ agent_query_all is standard
│
└─ v3.0+ (Long-term):
   └─ agent_list removed
```

---

## Resolution Strategy Decision Tree

```
Conflicts Detected?
│
├─ YES: Critical naming conflicts
│  └─ NAMESPACE (highest priority for safety)
│
├─ YES: Functionality overlap (HIGH severity)
│  ├─ Can merge parameters? → MERGE
│  └─ Incompatible semantics? → NAMESPACE or DEPRECATE
│
├─ YES: Medium naming conflicts
│  ├─ Same feature area? → MERGE or NAMESPACE
│  └─ Different feature area? → NAMESPACE
│
├─ YES: Low architecture conflicts
│  └─ Can migrate pattern? → MERGE with migration notes
│
└─ NO: No conflicts detected
   └─ MERGE (can proceed safely)
```

---

## Approval Logic

### Automatic Approval Conditions

```typescript
shouldApprove(conflicts: Conflict[], strategy: ResolutionStrategy): boolean {
  // Critical conflicts = no auto-approval
  if (conflicts.some((c) => c.severity === 'critical')) {
    return false;  // Requires manual review
  }

  // MERGE strategy = safe to approve
  if (strategy.type === 'merge') {
    return true;   // No breaking changes
  }

  // NAMESPACE strategy = safe to approve
  if (strategy.type === 'namespace') {
    return true;   // Clear separation
  }

  // DEPRECATE strategy = requires manual review
  if (strategy.type === 'deprecate') {
    return false;  // Potential breaking changes
  }

  return false;
}
```

### Approval Thresholds

| Strategy | Auto-Approve | Condition |
|----------|--------------|-----------|
| MERGE | Yes | No critical conflicts, no deprecation needed |
| NAMESPACE | Yes | Resolves naming/medium conflicts safely |
| DEPRECATE | No | Manual review required for breaking changes |

---

## Analysis Examples

### Example 1: Exact Naming Conflict (CRITICAL)

```
Incoming Tool: agent_list
Existing Tool: agent_list (already in registry)

Conflict Detection:
├─ Type: naming
├─ Severity: critical
└─ Description: "Tool name 'agent_list' already exists"

Strategy Determination:
├─ Critical conflict detected
├─ Recommended: NAMESPACE
└─ New name: incoming_domain_list

Resolution:
├─ Type: namespace
├─ Action: Add "newdomain_" prefix
├─ Approved: true (safe alternative exists)
└─ Implementation: Rename to appropriate domain prefix
```

### Example 2: Similar Functionality (HIGH)

```
Incoming Tool: agent_query
Existing Tool: agent_list
Both Domain: 'agent'
Same Action: list-like operations

Conflict Detection:
├─ Type: functionality
├─ Severity: high
└─ Description: "Similar functionality: 'agent_list' and 'agent_query' both list agents"

Strategy Determination:
├─ HIGH severity functionality conflict
├─ Can merge parameters?
├─ Recommended: MERGE
└─ Unified tool name: agent_search

Resolution:
├─ Type: merge
├─ Action: Merge into unified API
├─ Parameters: Combine filter + query options
├─ Approved: true (better UX, no breaking changes)
└─ Example: agent_search({ type: 'list' | 'query', ... })
```

### Example 3: Prefix Collision (MEDIUM)

```
Incoming Tool: agent_spawn
Existing Tools: agent_list, agent_create, agent_update
Incoming Domain: agent

Conflict Detection:
├─ Type: naming
├─ Severity: medium
├─ Similar to: agent_list
└─ Description: "Tool name 'agent_spawn' is similar to 'agent_list'"

Strategy Determination:
├─ MEDIUM naming conflict
├─ Same domain
├─ Recommended: Evaluate for MERGE or NAMESPACE
│  (agent_spawn might be launcher, not list operation)
└─ Final: NAMESPACE if semantically different

Resolution (if NAMESPACE chosen):
├─ Type: namespace
├─ Domain: orchestration (or execution)
├─ Action: Rename to orchestration_spawn
├─ Approved: true (clear separation)
└─ Reasoning: Spawn is orchestration concern, not agent management
```

### Example 4: No Conflicts (Merge)

```
Incoming Tools: science_analyze, science_visualize
Existing Tools: agent_*, memory_*, planning_*
No domain overlap

Conflict Detection:
├─ naming: No exact matches
├─ naming: No prefix collision (new 'science' domain)
├─ functionality: New domain, no overlap
└─ architecture: Compatible patterns

Strategy Determination:
├─ ZERO conflicts detected
├─ Recommended: MERGE
├─ Can proceed safely
└─ No modifications needed

Resolution:
├─ Type: merge
├─ Action: Integrate tools as-is
├─ Approved: true (safe path forward)
└─ Notes: Add hooks for memory/agent integration
```

---

## Integration with QualityEvaluator

The ConflictResolver receives projects from QualityEvaluator:

```
QualityEvaluator (score: 70+)
│
└─→ ConflictResolver
    ├─ Input: Incoming tools
    ├─ Detect conflicts
    ├─ Recommend strategy
    └─ Return approval
```

If conflicts require NAMESPACE or MERGE, QualityEvaluator's conflict_risk penalty is cross-validated with ConflictResolver's findings.

---

## Configuration

```typescript
// Detection sensitivity
EXACT_MATCH_THRESHOLD: 1.0      // 100% name match = critical
PREFIX_MATCH_THRESHOLD: 0.5     // Prefix only = medium
FUNCTIONALITY_MATCH: 'SAME_DOMAIN_ACTION'  // Detection pattern

// Resolution priority
MERGE_PRIORITY: 1    // Try merge first
NAMESPACE_PRIORITY: 2 // Then namespace
DEPRECATE_PRIORITY: 3 // Last resort

// Approval rules
ALLOW_AUTO_APPROVE_MERGE: true
ALLOW_AUTO_APPROVE_NAMESPACE: true
ALLOW_AUTO_APPROVE_DEPRECATE: false
```

---

## Verification Notes

All algorithms have been verified against:
- `src/absorption/conflict-resolver.ts` implementation
- Tool name extraction and prefix matching logic
- Action extraction from tool names
- Conflict severity classification
- Strategy selection decision tree
- Approval conditions and approval logic
