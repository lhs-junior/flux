#!/usr/bin/env python3
"""
Data Analysis Helper for science_analyze tool

Provides pandas-based data operations:
- Loading data from various sources (CSV, JSON, Parquet)
- Data transformations and cleaning
- Statistical analysis
- Query execution
- DataFrame inspection
"""

import sys
import json
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List
import traceback


def load_data(source: str, source_type: str, options: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
    """
    Load data from various sources into a pandas DataFrame

    Args:
        source: File path or data string
        source_type: One of 'csv', 'json', 'parquet', 'dict', 'memory'
        options: Additional options for loading (e.g., separator, encoding)

    Returns:
        pandas DataFrame
    """
    options = options or {}

    try:
        if source_type == 'csv':
            df = pd.read_csv(source, **options)
        elif source_type == 'json':
            df = pd.read_json(source, **options)
        elif source_type == 'parquet':
            df = pd.read_parquet(source, **options)
        elif source_type == 'dict':
            # Parse JSON string to dict
            data = json.loads(source)
            df = pd.DataFrame(data)
        elif source_type == 'memory':
            # Memory data passed as JSON string
            data = json.loads(source)
            df = pd.DataFrame(data)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

        return df
    except Exception as e:
        raise RuntimeError(f"Failed to load data: {str(e)}")


def describe_data(df: pd.DataFrame, include_percentiles: bool = True) -> Dict[str, Any]:
    """
    Get comprehensive description of DataFrame

    Returns:
        Dictionary with shape, dtypes, statistics, missing values, etc.
    """
    result = {
        'shape': {
            'rows': int(df.shape[0]),
            'columns': int(df.shape[1])
        },
        'columns': list(df.columns),
        'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
        'missing_values': {col: int(df[col].isna().sum()) for col in df.columns},
        'memory_usage': {
            'total_bytes': int(df.memory_usage(deep=True).sum()),
            'per_column': {col: int(size) for col, size in df.memory_usage(deep=True).items()}
        }
    }

    # Add statistics for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if numeric_cols:
        stats_df = df[numeric_cols].describe()
        result['statistics'] = {
            col: {
                'count': float(stats_df[col]['count']),
                'mean': float(stats_df[col]['mean']),
                'std': float(stats_df[col]['std']),
                'min': float(stats_df[col]['min']),
                '25%': float(stats_df[col]['25%']),
                '50%': float(stats_df[col]['50%']),
                '75%': float(stats_df[col]['75%']),
                'max': float(stats_df[col]['max'])
            }
            for col in numeric_cols
        }

    # Add sample data (first 5 rows)
    result['preview'] = df.head(5).to_dict(orient='records')

    return result


def transform_data(df: pd.DataFrame, transformations: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Apply transformations to DataFrame

    Supported transformations:
    - filter: Filter rows by condition
    - select: Select specific columns
    - sort: Sort by columns
    - groupby: Group and aggregate
    - rename: Rename columns
    - drop: Drop columns or rows
    - fillna: Fill missing values
    - astype: Convert column types
    """
    df_result = df.copy()

    for transform in transformations:
        operation = transform.get('operation')

        if operation == 'filter':
            # Filter rows using query string
            query = transform.get('query')
            df_result = df_result.query(query)

        elif operation == 'select':
            # Select specific columns
            columns = transform.get('columns', [])
            df_result = df_result[columns]

        elif operation == 'sort':
            # Sort by columns
            by = transform.get('by', [])
            ascending = transform.get('ascending', True)
            df_result = df_result.sort_values(by=by, ascending=ascending)

        elif operation == 'groupby':
            # Group and aggregate
            by = transform.get('by', [])
            agg = transform.get('agg', {})
            df_result = df_result.groupby(by).agg(agg).reset_index()

        elif operation == 'rename':
            # Rename columns
            columns = transform.get('columns', {})
            df_result = df_result.rename(columns=columns)

        elif operation == 'drop':
            # Drop columns or rows
            columns = transform.get('columns')
            index = transform.get('index')
            if columns:
                df_result = df_result.drop(columns=columns)
            if index:
                df_result = df_result.drop(index=index)

        elif operation == 'fillna':
            # Fill missing values
            value = transform.get('value')
            method = transform.get('method')
            if value is not None:
                df_result = df_result.fillna(value)
            elif method:
                df_result = df_result.fillna(method=method)

        elif operation == 'astype':
            # Convert column types
            dtypes = transform.get('dtypes', {})
            df_result = df_result.astype(dtypes)

        else:
            raise ValueError(f"Unsupported transformation: {operation}")

    return df_result


def execute_query(df: pd.DataFrame, query: str) -> pd.DataFrame:
    """
    Execute a pandas query on the DataFrame

    Args:
        df: Input DataFrame
        query: Pandas query string

    Returns:
        Filtered DataFrame
    """
    return df.query(query)


def execute_code(df: pd.DataFrame, code: str) -> Any:
    """
    Execute arbitrary Python code with DataFrame in scope

    WARNING: This executes arbitrary code. Use with caution.

    Args:
        df: Input DataFrame available as 'df' in code
        code: Python code to execute

    Returns:
        Result of code execution (or modified df)
    """
    # Create execution context with df and common libraries
    context = {
        'df': df,
        'pd': pd,
        'np': np,
        'result': None
    }

    # Execute code
    exec(code, context)

    # Return result or modified df
    if context['result'] is not None:
        return context['result']
    return context['df']


def serialize_dataframe(df: pd.DataFrame, max_rows: int = 100) -> Dict[str, Any]:
    """
    Serialize DataFrame to JSON-compatible format

    Args:
        df: DataFrame to serialize
        max_rows: Maximum rows to include in preview

    Returns:
        Dictionary with shape, dtypes, and data preview
    """
    return {
        'shape': {
            'rows': int(df.shape[0]),
            'columns': int(df.shape[1])
        },
        'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
        'columns': list(df.columns),
        'data': df.head(max_rows).to_dict(orient='records'),
        'truncated': df.shape[0] > max_rows
    }


def main():
    """
    Main entry point for CLI usage

    Expects JSON input via stdin with:
    {
        "action": "load" | "describe" | "transform" | "query" | "execute",
        "source": "file_path_or_data",
        "source_type": "csv" | "json" | "parquet" | "dict" | "memory",
        "options": {},
        "transformations": [],
        "query": "pandas query string",
        "code": "python code"
    }
    """
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())

        action = input_data.get('action')

        if action == 'load':
            source = input_data.get('source')
            source_type = input_data.get('source_type')
            options = input_data.get('options', {})

            df = load_data(source, source_type, options)
            result = serialize_dataframe(df)

            print(json.dumps({
                'success': True,
                'result': result
            }))

        elif action == 'describe':
            source = input_data.get('source')
            source_type = input_data.get('source_type')
            options = input_data.get('options', {})

            df = load_data(source, source_type, options)
            result = describe_data(df)

            print(json.dumps({
                'success': True,
                'result': result
            }))

        elif action == 'transform':
            source = input_data.get('source')
            source_type = input_data.get('source_type')
            options = input_data.get('options', {})
            transformations = input_data.get('transformations', [])

            df = load_data(source, source_type, options)
            df_transformed = transform_data(df, transformations)
            result = serialize_dataframe(df_transformed)

            print(json.dumps({
                'success': True,
                'result': result
            }))

        elif action == 'query':
            source = input_data.get('source')
            source_type = input_data.get('source_type')
            options = input_data.get('options', {})
            query = input_data.get('query')

            df = load_data(source, source_type, options)
            df_result = execute_query(df, query)
            result = serialize_dataframe(df_result)

            print(json.dumps({
                'success': True,
                'result': result
            }))

        elif action == 'execute':
            source = input_data.get('source')
            source_type = input_data.get('source_type')
            options = input_data.get('options', {})
            code = input_data.get('code')

            df = load_data(source, source_type, options)
            result = execute_code(df, code)

            # Serialize result based on type
            if isinstance(result, pd.DataFrame):
                output = serialize_dataframe(result)
            elif isinstance(result, (pd.Series, np.ndarray)):
                output = {
                    'type': 'series' if isinstance(result, pd.Series) else 'array',
                    'data': result.tolist()
                }
            else:
                output = result

            print(json.dumps({
                'success': True,
                'result': output
            }))

        else:
            print(json.dumps({
                'success': False,
                'error': f"Unknown action: {action}"
            }))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
