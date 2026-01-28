/**
 * Science System - Type Definitions
 *
 * Provides interactive Python execution for data analysis, ML experimentation,
 * and scientific computing within Claude workflows.
 */

/**
 * Science session representing a persistent Python environment
 */
export interface ScienceSession {
  id: string;
  namespace: string; // logical grouping (e.g., 'ml-experiment', 'data-analysis')
  createdAt: number;
  lastUsedAt: number;
  executionCount: number;
  variables: Record<string, any>; // serialized variable metadata
  packages: string[]; // installed packages in this session
  history: string[]; // code execution history
  pickleData?: Buffer; // serialized Python session state
}

/**
 * Result from a Python execution
 */
export interface ScienceResult {
  id: string;
  sessionId: string;
  toolName: string; // which tool produced this result
  resultType: 'success' | 'error' | 'partial';
  resultData: any; // stdout, return values, plots, etc.
  metadata: {
    executionTime?: number;
    memoryUsage?: number;
    outputSize?: number;
    [key: string]: any;
  };
  createdAt: number;
}

/**
 * Execution limits to prevent resource exhaustion
 */
export interface ExecutionLimits {
  timeoutMs: number; // max execution time
  maxMemoryMB: number; // max memory usage
  maxOutputSize: number; // max output size in bytes
  maxHistorySize: number; // max number of history entries
}

/**
 * Science system configuration
 */
export interface ScienceConfig {
  venvPath: string; // path to Python virtual environment
  pythonVersion: string; // required Python version
  defaultPackages: string[]; // packages to install by default
  limits: ExecutionLimits;
  enableGpu: boolean; // whether to enable GPU support
  enablePlotting: boolean; // whether to enable matplotlib/plotting
}

// ============================================================================
// Tool Input/Output Types
// ============================================================================

/**
 * science_setup tool - Initialize and manage Python environment
 */
export interface ScienceSetupInput {
  action: 'init' | 'install' | 'list' | 'reset' | 'status';
  packages?: string[]; // for 'install' action
  requirements?: string; // path to requirements.txt
  force?: boolean; // force reinstall for 'init'
}

export interface ScienceSetupOutput {
  success: boolean;
  message: string;
  venvPath?: string;
  pythonVersion?: string;
  packages?: Array<{ name: string; version: string }>;
  status?: {
    initialized: boolean;
    packagesInstalled: number;
    diskUsage: number;
  };
}

/**
 * science_exec tool - Execute Python code
 */
export interface ScienceExecInput {
  code: string; // Python code to execute
  sessionId?: string; // optional session to reuse
  namespace?: string; // logical namespace for new session
  captureOutput?: boolean; // capture stdout/stderr
  returnVars?: string[]; // variables to return
  timeout?: number; // override default timeout
}

export interface ScienceExecOutput {
  success: boolean;
  sessionId: string;
  stdout: string;
  stderr: string;
  returnValues?: Record<string, any>;
  executionTime: number;
  variables: Record<string, string>; // variable name -> type
  error?: string;
}

/**
 * science_data tool - Load and manipulate datasets
 */
export interface ScienceDataInput {
  action: 'load' | 'save' | 'describe' | 'transform' | 'query';
  sessionId: string;
  source?: string; // file path or URL for 'load'
  format?: 'csv' | 'json' | 'parquet' | 'excel' | 'sql';
  varName?: string; // variable name to store/retrieve data
  query?: string; // SQL query or pandas query for 'query'
  transformCode?: string; // Python code for 'transform'
  savePath?: string; // path for 'save'
}

export interface ScienceDataOutput {
  success: boolean;
  message: string;
  varName?: string;
  description?: {
    shape: [number, number];
    columns: string[];
    dtypes: Record<string, string>;
    nullCounts: Record<string, number>;
    memoryUsage: number;
  };
  preview?: any[][]; // first few rows
  queryResult?: any;
  error?: string;
}

/**
 * science_plot tool - Create visualizations
 */
export interface SciencePlotInput {
  sessionId: string;
  plotType: 'line' | 'scatter' | 'bar' | 'hist' | 'box' | 'heatmap' | 'custom';
  data: string; // variable name or inline data
  config?: {
    x?: string;
    y?: string;
    title?: string;
    xlabel?: string;
    ylabel?: string;
    color?: string;
    style?: string;
    figsize?: [number, number];
  };
  customCode?: string; // for 'custom' plot type
  savePath?: string; // path to save plot
  format?: 'png' | 'svg' | 'pdf';
}

export interface SciencePlotOutput {
  success: boolean;
  message: string;
  plotPath?: string; // path to saved plot
  plotData?: string; // base64 encoded image
  error?: string;
}

/**
 * science_model tool - ML model training and evaluation
 */
export interface ScienceModelInput {
  action: 'train' | 'predict' | 'evaluate' | 'save' | 'load';
  sessionId: string;
  modelType?: string; // 'sklearn.linear_model.LogisticRegression', etc.
  modelVar?: string; // variable name for model
  trainData?: string; // variable name for training data
  targetCol?: string; // target column name
  params?: Record<string, any>; // model hyperparameters
  predictData?: string; // data for prediction
  metrics?: string[]; // evaluation metrics
  savePath?: string; // path to save/load model
}

export interface ScienceModelOutput {
  success: boolean;
  message: string;
  modelVar?: string;
  metrics?: Record<string, number>;
  predictions?: any[];
  featureImportance?: Record<string, number>;
  error?: string;
}

/**
 * science_notebook tool - Export session as Jupyter notebook
 */
export interface ScienceNotebookInput {
  sessionId: string;
  outputPath: string;
  includeOutput?: boolean; // include execution outputs
  format?: 'ipynb' | 'html' | 'pdf';
  title?: string;
}

export interface ScienceNotebookOutput {
  success: boolean;
  message: string;
  notebookPath?: string;
  cellCount?: number;
  error?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_SCIENCE_CONFIG: ScienceConfig = {
  venvPath: '.venv-science',
  pythonVersion: '3.9',
  defaultPackages: [
    'numpy',
    'pandas',
    'matplotlib',
    'scikit-learn',
    'scipy',
    'jupyter',
    'ipython',
  ],
  limits: {
    timeoutMs: 300000, // 5 minutes
    maxMemoryMB: 2048, // 2GB
    maxOutputSize: 10 * 1024 * 1024, // 10MB
    maxHistorySize: 1000,
  },
  enableGpu: false,
  enablePlotting: true,
};

/**
 * Common error types
 */
export class ScienceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ScienceError';
  }
}

export class ScienceTimeoutError extends ScienceError {
  constructor(timeoutMs: number) {
    super(`Execution timed out after ${timeoutMs}ms`, 'TIMEOUT');
    this.name = 'ScienceTimeoutError';
  }
}

export class ScienceEnvironmentError extends ScienceError {
  constructor(message: string, details?: any) {
    super(message, 'ENV_ERROR', details);
    this.name = 'ScienceEnvironmentError';
  }
}
