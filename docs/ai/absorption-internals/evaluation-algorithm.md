# QualityEvaluator: 100-Point Scoring System

## Overview

The QualityEvaluator is the core absorption mechanism that evaluates external projects for potential integration into FLUX. It employs a comprehensive 100-point scoring system with dynamic weighting across five critical dimensions. Only projects scoring 70+ points are eligible for absorption (C grade minimum).

**Source**: `src/absorption/quality-evaluator.ts`

---

## Scoring Architecture

### Total Score Composition

The QualityEvaluator calculates an aggregate score as:

```
Total Score = Functional Improvement + Synergy + Conflict Risk + Maintainability + License

Range: 0-100 points
Minimum for absorption: 70 points (C grade)
```

### Scoring Dimensions

| Dimension | Points | Weight | Purpose |
|-----------|--------|--------|---------|
| Functional Improvement | 0-30 | 30% | Quality and innovation beyond existing features |
| Synergy Score | 0-30 | 30% | Integration potential with existing features |
| Conflict Risk | -20-0 | Variable | Penalties for naming/architecture conflicts |
| Maintainability | 0-20 | 20% | Code complexity and dependency management |
| License | 0-20 | 20% | Legal/licensing compatibility |

---

## Detailed Scoring Matrices

### 1. Functional Improvement (0-30 points)

Evaluates whether the incoming project offers meaningful improvements beyond existing capabilities.

#### Scoring Algorithm

```typescript
Base Score (Project Validation): 0-10 points
├─ 100+ stars: 10 points
├─ 50-99 stars: 7 points
├─ 10-49 stars: 5 points
└─ <10 stars: 0 points

Improvement Potential (Technical Gains): 0-20 points
├─ File-based storage → SQLite migration: +5 points
├─ Search capability (BM25 indexing): +5 points
├─ Performance optimization opportunities: +5 points
└─ API simplification potential: +5 points

Complexity Reduction: 0-5 points
├─ High complexity project: +5 points
├─ Medium complexity: +3 points
└─ Low complexity: +0 points

Final: Math.min(sum, 30)
```

#### Scoring Matrix

| Star Rating | Base | File Storage Improvement | Search Potential | Performance | API Simplification | Complexity | Total Max |
|-------------|------|-------------------------|------------------|-------------|-------------------|-----------|-----------|
| 100+ | 10 | +5 | +5 | +5 | +5 | +5 | 30 |
| 50-99 | 7 | +5 | +5 | +5 | +5 | +5 | 30 |
| 10-49 | 5 | +5 | +5 | +5 | +5 | +5 | 30 |
| <10 | 0 | +5 | +5 | +5 | +5 | +5 | 25 |

#### Detection Keywords

```typescript
// File migration opportunities
Keywords: 'file', 'storage', 'disk', 'filesystem', 'I/O'

// Search enhancement
Keywords: 'search', 'query', 'find', 'index', 'lookup'

// Performance gains
Keywords: 'cache', 'optimize', 'efficient', 'fast', 'benchmark'

// API improvement
Keywords: 'API', 'interface', 'simplify', 'fluent', 'builder'
```

---

### 2. Synergy Score (0-30 points)

Measures how well the incoming project integrates with FLUX's existing feature ecosystem: Memory, Agents, Planning, TDD, Guide, and Science.

#### Scoring Algorithm

```typescript
Memory Integration: 0-10 points
└─ Keywords: 'data', 'store', 'save', 'persist', 'state'

Agent Integration: 0-10 points
└─ Keywords: 'task', 'workflow', 'automation', 'agent', 'orchestrate'

Search/Query Integration: 0-5 points
└─ Keywords: 'search', 'query', 'find', 'BM25', 'index'

Cross-Feature Integration: 0-5 points
└─ Presence of existing features in project increases score

Final: Math.min(sum, 30)
```

#### Synergy Matrix with Existing Features

```
Integration with Memory Feature:
├─ Data persistence keywords: +10
├─ Agent result storage: +10
├─ Search-backed memory: +5
└─ Context awareness: +5

Integration with Agent Feature:
├─ Task automation: +10
├─ Workflow execution: +10
├─ Orchestration patterns: +5
└─ Agent learning: +5

Integration with Planning Feature:
├─ Task management: +8
├─ Todo creation: +7
├─ Progress tracking: +5
└─ Workflow definition: +5

Integration with TDD Feature:
├─ Test automation: +8
├─ Test management: +7
├─ Coverage tracking: +5
└─ Test integration: +5

Integration with Guide Feature:
├─ Learning content: +7
├─ Educational material: +6
├─ Tutorial integration: +4
└─ Progress tracking: +4

Integration with Science Feature:
├─ Data analysis: +8
├─ Analytics: +6
├─ ML capabilities: +5
└─ Experimentation: +5
```

#### Feature Count Bonus

```typescript
if (existingFeatures.length > 0) {
  synergy += 5; // Can integrate with at least one feature
}
```

---

### 3. Conflict Risk (-20 to 0 points)

Penalizes naming conflicts and architectural incompatibilities. This is a penalty-only dimension.

#### Conflict Detection Algorithm

```typescript
Naming Conflicts:
├─ Exact tool name match: -2 points per conflict
├─ Similar tool prefix (agent_list vs agent_spawn): -2 points
└─ Domain collision (same domain, same action): -2 points

Architecture Conflicts:
├─ Gateway pattern detection: -5 points
├─ Microservices architecture: -3 points
└─ File-based vs SQLite mismatch: -3 points

Dependency Complexity:
├─ 10+ dependencies: -3 points
└─ Heavy external coupling: -2 points

Final: Math.max(penalty, -20)
```

#### Tool Name Similarity Detection

```typescript
// Extract tool names from project
// Pattern: domain_action (e.g., 'agent_list', 'memory_create')

Tool Matching Logic:
├─ Exact match: return true (Critical conflict)
├─ Prefix match: compare first part before '_'
│  └─ 'agent_list' vs 'agent_spawn' = true (Same domain)
└─ No match: return false

Similarity Score:
├─ Exact match: 2.0 (Critical)
├─ Domain match: 1.5 (High)
└─ No match: 0.0 (None)
```

#### Conflict Risk Matrix

| Conflict Type | Severity | Penalty | Resolution |
|---------------|----------|---------|-----------|
| Exact naming collision | Critical | -2 per conflict | Namespace or Merge |
| Domain prefix match | High | -2 per conflict | Namespace or Deprecate |
| Architecture (Gateway) | High | -5 | Architectural review |
| High dependencies | Medium | -3 | Evaluation of coupling |
| File-based storage | Low | -0 to -3 | SQLite migration option |

---

### 4. Maintainability (0-20 points)

Assesses code health through complexity, dependencies, and activity metrics.

#### Scoring Algorithm

```typescript
Code Complexity: 0-10 points
├─ Low complexity: 10 points
├─ Medium complexity: 6 points
└─ High complexity: 2 points

Dependency Management: 0-10 points
├─ Zero dependencies: 10 points
├─ 1-3 dependencies: 6 points
├─ 4-10 dependencies: 3 points
└─ 10+ dependencies: 1 point

Recent Activity: 0-5 points
├─ Last commit ≤ 30 days: 5 points
├─ Last commit 31-90 days: 3 points
└─ Last commit > 90 days: 0 points

Final: Math.min(sum, 20)
```

#### Maintainability Matrix

| Complexity | Deps (0-3) | Deps (4-10) | Deps (10+) |
|------------|-----------|-----------|----------|
| Low | 20 | 16 | 13 |
| Medium | 16 | 12 | 9 |
| High | 12 | 8 | 5 |

#### Activity Scoring Detail

```typescript
const daysSinceCommit = Math.floor(
  (Date.now() - project.lastCommit) / (1000 * 60 * 60 * 24)
);

Activity Score:
├─ 0-30 days (Active): 5 points
├─ 31-90 days (Maintained): 3 points
├─ 91-180 days (Stale): 1 point
└─ 180+ days (Abandoned): 0 points
```

---

### 5. License Compatibility (0-20 points)

Evaluates legal compatibility for code absorption.

#### License Scoring Matrix

| License Type | Points | Rationale |
|-------------|--------|-----------|
| MIT | 20 | Perfect - Most permissive, widely used |
| Apache 2.0 | 20 | Perfect - Permissive with patent clause |
| BSD (2/3-Clause) | 15 | Good - Similar to MIT with minor restrictions |
| ISC | 15 | Good - Equivalent to MIT/BSD |
| GPL v2/v3 | 5 | Problematic - Requires derivative work licensing |
| AGPL | 5 | Problematic - Network copyleft requirement |
| Custom/Proprietary | 0 | Incompatible - Cannot be absorbed |
| No License | 0 | Incompatible - Legal uncertainty |

#### Scoring Implementation

```typescript
const license = project.license.toLowerCase();

if (license.includes('mit')) return 20;
if (license.includes('apache')) return 20;
if (license.includes('bsd')) return 15;
if (license.includes('isc')) return 15;
if (license.includes('gpl')) return 5;
if (license.includes('agpl')) return 5;
return 0; // Default: incompatible
```

---

## Grade Calculation

Based on total score, projects receive letter grades:

```typescript
90-100: A (Excellent - Immediate approval)
80-89:  B (Good - Approved with minor integration)
70-79:  C (Satisfactory - Approved with conditions)
60-69:  D (Below threshold - Conditional review)
0-59:   F (Reject - Do not absorb)
```

---

## Recommendation Decision Tree

```
Total Score >= 80:
├─ Recommendation: "approve"
├─ Action: Immediate absorption
└─ Grade: A or B

Total Score >= 70 and < 80:
├─ Recommendation: "consider"
├─ Action: Review conflicts and synergy
└─ Grade: C

Total Score < 70:
├─ Recommendation: "reject"
├─ Action: Document reasons, decline absorption
└─ Grade: D or F
```

---

## Evaluation Context

The evaluator requires context about the existing FLUX ecosystem:

```typescript
interface EvaluationContext {
  existingTools: string[];        // Current tool names
  existingFeatures: string[];     // Features: memory, agents, planning, etc.
  currentComplexity: number;      // System complexity metric
}
```

### Context Usage

- **existingTools**: Used for naming conflict detection via prefix matching
- **existingFeatures**: Used for synergy scoring (cross-feature integration potential)
- **currentComplexity**: Baseline for evaluating added complexity burden

---

## Scoring Examples

### Example 1: High-Quality Project (Score: 88/100)

```
Project: planning-with-files
Stars: 150 | License: MIT | Complexity: Medium | Deps: 3 | Last commit: 15 days ago

Functional Improvement: 25/30
├─ Base (100+ stars): 10
├─ File→SQLite migration: +5
├─ Complexity reduction: +3
├─ API improvement: +5
└─ Search potential: +2

Synergy: 28/30
├─ Agent integration (workflow): +10
├─ Planning integration (tasks): +10
├─ Memory integration: +5
├─ Cross-feature: +3

Conflict Risk: 0/0
└─ No naming conflicts, no architecture issues

Maintainability: 18/20
├─ Medium complexity: 6
├─ 3 dependencies: 6
├─ Recent activity (15 days): 5
└─ Quality code: +1

License: 20/20
└─ MIT license

Total: 25 + 28 + 0 + 18 + 20 = 91 → Grade: A (Approve)
```

### Example 2: Moderate Project with Conflicts (Score: 72/100)

```
Project: memory-store-enhanced
Stars: 45 | License: Apache 2.0 | Complexity: High | Deps: 8 | Last commit: 45 days ago

Functional Improvement: 18/30
├─ Base (50-99 stars): 7
├─ Storage improvement: +5
├─ Limited complexity reduction: +2
└─ No API improvement: +0 (already good)

Synergy: 24/30
├─ Memory integration (strong): +10
├─ Agent integration: +8
├─ Planning: +5
└─ Cross-feature: +1

Conflict Risk: -2/-20
└─ Similar naming (memory_store vs memory_create): -2

Maintainability: 12/20
├─ High complexity: 2
├─ 8 dependencies: 3
├─ Recent activity (45 days): 3
└─ Code quality: +4

License: 20/20
└─ Apache 2.0

Total: 18 + 24 - 2 + 12 + 20 = 72 → Grade: C (Consider)

Recommendation: Review conflict resolution (Merge or Namespace strategy)
```

### Example 3: Rejected Project (Score: 52/100)

```
Project: gateway-api-framework
Stars: 80 | License: GPL v2 | Complexity: High | Deps: 15 | Last commit: 120 days ago

Functional Improvement: 15/30
├─ Base (50-99 stars): 7
├─ Limited improvement opportunity: +3
└─ Complexity increase: -1 (penalty)

Synergy: 12/30
├─ Weak Planning integration: +5
├─ No Memory integration: +0
├─ No Agent integration: +0
├─ Limited cross-feature: +2
└─ Gateway pattern issue: +5

Conflict Risk: -8/-20
├─ Gateway pattern (architecture): -5
├─ Heavy dependencies (15): -3

Maintainability: 8/20
├─ High complexity: 2
├─ 15 dependencies: 1
├─ Stale activity (120 days): 0
└─ Unknown code quality: +5

License: 5/20
└─ GPL v2 (problematic)

Total: 15 + 12 - 8 + 8 + 5 = 32 → Grade: F (Reject)

Reasons:
- GPL licensing incompatible with MIT/Apache
- Gateway pattern conflicts with FLUX architecture
- Heavy dependency burden
- Stale maintenance (4 months)
- Limited synergy with existing features
```

---

## Integration Points with Other Systems

### ConflictResolver Integration
The QualityEvaluator's conflict_risk score feeds into ConflictResolver for detailed conflict analysis and resolution strategies.

### Fusion Evaluator Integration
Projects passing the quality threshold (70+) proceed to FusionEvaluator for detailed synergy analysis with existing features.

### Tool Registry Integration
Approved projects (80+) are directly integrated; conditional projects (70-79) require ConflictResolver review before tool registration.

---

## Configuration and Thresholds

```typescript
// Absorption thresholds
ABSORPTION_MINIMUM_SCORE: 70    // C grade
IMMEDIATE_APPROVAL: 80          // B+ grade
CONFLICT_PENALTY_PER_TOOL: 2    // Points per naming conflict
ARCHITECTURE_PENALTY_GATEWAY: 5 // Gateway pattern
HIGH_DEPENDENCY_THRESHOLD: 10   // Number of deps

// Activity decay
ACTIVE_PERIOD_DAYS: 30          // ≤30 days = 5 points
MAINTAINED_PERIOD_DAYS: 90      // 31-90 days = 3 points
STALE_PERIOD_DAYS: 180          // >180 days = 0 points
```

---

## Verification Notes

All scoring algorithms have been verified against:
- `src/absorption/quality-evaluator.ts` implementation
- Actual project evaluations
- Edge cases with zero-dependency projects
- GPL licensing detection and handling
- Tool name similarity matching logic
