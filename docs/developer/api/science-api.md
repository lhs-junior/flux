# Science Manager API

The Science Manager provides statistical analysis, machine learning, and data visualization capabilities. It integrates Python execution with session persistence and supports data science workflows.

## Overview

**Class:** `ScienceManager`

**Location:** `src/features/science/index.ts`

The Science Manager manages three key tools: statistics analysis, machine learning, and data export. It works with persistent Python sessions managed by the ScienceExecutor.

## Architecture

```
ScienceManager
├── scienceStats (statistics analysis)
├── scienceML (machine learning)
└── scienceExport (data export)
    └── ScienceExecutor (Python execution)
        └── ScienceStore (session persistence)
```

## Methods

### analyze()

Perform statistical analysis on datasets (via scienceStats tool).

**Supported Tests:**

| Test | Purpose |
|------|---------|
| `ttest` | Compare means of two groups |
| `anova` | Compare means across multiple groups |
| `chi_square` | Test independence of categorical variables |
| `correlation` | Measure relationship between variables |
| `regression` | Linear/logistic regression analysis |
| `mann_whitney` | Non-parametric alternative to t-test |

**Configuration:** See statistics analysis in tool definitions.

---

### visualize()

Create visualizations from Python session data.

**Configuration:** See statistics analysis in tool definitions.

---

### stats()

Core statistical analysis tool.

**Signature:**
```typescript
scienceStats(args: unknown, memoryManager?: MemoryManager): Promise<{
  content: Array<{ type: string; text: string }>
}>
```

**Tool Definition:**
```typescript
getScienceStatsToolDefinition(): ToolMetadata
```

**Supported Statistics:**

- t-test (independent, paired)
- ANOVA (one-way, two-way)
- Chi-square test
- Pearson/Spearman correlation
- Linear/logistic regression
- Mann-Whitney U test

**Example Usage (via Claude):**

```
Use the science_stats tool to:
- Compare test performance between two groups
- Analyze variance in A/B test results
- Calculate correlation between variables
```

---

### ml()

Machine learning model training and evaluation.

**Signature:**
```typescript
scienceML(
  args: unknown,
  memoryManager?: MemoryManager,
  planningManager?: PlanningManager
): Promise<{
  content: Array<{ type: string; text: string }>
}>
```

**Tool Definition:**
```typescript
getScienceMLToolDefinition(): ToolMetadata
```

**Supported Models:**

- linear_regression
- logistic_regression
- random_forest
- xgboost
- svm (Support Vector Machine)
- kmeans (clustering)

**Features:**

- Model training and evaluation
- Feature importance analysis
- Hyperparameter optimization
- Cross-validation support
- Prediction on new data

**Example Usage:**

```typescript
// Train a random forest classifier
// Features handled via Python execution in session
```

---

### export()

Export analysis results in multiple formats.

**Signature:**
```typescript
scienceExport(
  args: unknown,
  memoryManager?: MemoryManager
): Promise<{
  content: Array<{ type: string; text: string }>
}>
```

**Tool Definition:**
```typescript
getScienceExportToolDefinition(): ToolMetadata
```

**Supported Export Formats:**

| Format | Use Case |
|--------|----------|
| csv | Spreadsheet/data analysis |
| excel | Excel workbook with formatting |
| json | API/web integration |
| parquet | Big data/Apache ecosystem |
| html | Web viewing/sharing |
| pdf | Reports/formal documentation |
| notebook | Jupyter notebook (ipynb) |

**Example Usage:**

```typescript
// Export session results to multiple formats
// Results can be saved to memory for later reference
```

---

## ScienceExecutor Integration

The ScienceExecutor manages Python code execution:

**Signature:**
```typescript
async executePython(
  code: string,
  sessionId?: string,
  options?: {
    captureOutput?: boolean;
    returnVars?: string[];
    timeout?: number;
  }
): Promise<ExecutionResult>
```

**ExecutionResult:**
```typescript
{
  success: boolean;
  stdout: string;
  stderr: string;
  returnValues?: Record<string, any>;
  variables: Record<string, string>; // variable name -> type
  executionTime: number;
  error?: string;
}
```

## ScienceStore: Session Management

The ScienceStore persists Python sessions using SQLite:

**Session Structure:**
```typescript
interface ScienceSession {
  id: string;
  namespace: string;        // e.g., 'ml-experiment', 'data-analysis'
  createdAt: number;
  lastUsedAt: number;
  executionCount: number;
  variables: Record<string, unknown>;
  packages: string[];       // installed packages
  history: string[];        // code execution history
  pickleData?: Buffer;      // serialized Python state
}
```

**Result Structure:**
```typescript
interface ScienceResult {
  id: string;
  sessionId: string;
  toolName: string;
  resultType: 'success' | 'error' | 'partial';
  resultData: unknown;
  metadata: {
    executionTime?: number;
    memoryUsage?: number;
    outputSize?: number;
  };
  createdAt: number;
}
```

## Configuration

**Default Configuration:**
```typescript
const DEFAULT_SCIENCE_CONFIG = {
  venvPath: '.venv-science',
  pythonVersion: '3.9',
  defaultPackages: [
    'numpy', 'pandas', 'matplotlib',
    'scikit-learn', 'scipy', 'jupyter', 'ipython'
  ],
  limits: {
    timeoutMs: 300000,        // 5 minutes
    maxMemoryMB: 2048,        // 2GB
    maxOutputSize: 10485760,  // 10MB
    maxHistorySize: 1000
  },
  enableGpu: false,
  enablePlotting: true
};
```

## Execution Safety

The ScienceExecutor includes security validations:

**Blocked Patterns:**
- `__import__()` - Import prevention
- `eval()`, `exec()` - Code injection
- `compile()` - Dynamic compilation
- `os.system()`, `subprocess.*` - System access
- `globals()`, `locals()` - Namespace manipulation
- `input()` - Interactive input (dangerous in automation)

**Constraints:**
- Execution timeout enforced
- Memory limits monitored
- Output size capped
- File operations isolated to session directory

## Statistics Features

**Statistical Tests:**
```
- Hypothesis testing (t-test, ANOVA, Chi-square)
- Correlation and regression analysis
- Non-parametric tests (Mann-Whitney)
- Distribution analysis
- Effect size calculations
```

## Machine Learning Features

**Model Types:**
```
- Regression (linear, logistic)
- Classification (random forest, SVM)
- Clustering (k-means)
- Ensemble methods (XGBoost)
```

**Evaluation Metrics:**
```
- Accuracy, precision, recall, F1
- ROC-AUC, confusion matrix
- Cross-validation scores
- Feature importance rankings
```

## Integration with Other Managers

The Science Manager integrates with:

- **Memory Manager**: Save analysis results and models
- **Planning Manager**: Track data science projects
- **Guide Manager**: Learning resources for data science

## Statistics

Access usage statistics:

```typescript
const stats = scienceManager.getStatistics();
console.log(stats.toolsAvailable);
console.log(stats.features.statistics);
console.log(stats.features.machine_learning);
console.log(stats.features.export_formats);
```

## Resource Cleanup

Always close the manager when done:

```typescript
scienceManager.close();
```

## Example Workflow

```typescript
// 1. Create manager with dependencies
const scienceManager = new ScienceManager({
  memoryManager: memoryMgr,
  planningManager: planningMgr
});

// 2. Get available tools
const tools = scienceManager.getToolDefinitions();

// 3. Handle tool calls from Claude
const result = await scienceManager.handleToolCall(
  'science_stats',
  { /* analysis parameters */ }
);

// 4. Process results
console.log(result.content[0].text);

// 5. Cleanup
scienceManager.close();
```

See individual tool documentation for detailed usage examples.
