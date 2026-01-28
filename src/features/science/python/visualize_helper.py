#!/usr/bin/env python3
"""
Data Visualization Helper for science_visualize tool

Provides matplotlib/seaborn-based plotting:
- Line charts, bar charts, scatter plots
- Histograms, heatmaps, boxplots
- Custom plots with code execution
- Multiple output formats (PNG, SVG, HTML/Plotly)
- Style customization
"""

import sys
import json
import base64
import io
from pathlib import Path
from typing import Dict, Any, Optional, List
import traceback

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

# Try to import plotly for interactive plots
try:
    import plotly.express as px
    import plotly.graph_objects as go
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False


def load_data(source: str, source_type: str, options: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
    """Load data from various sources"""
    options = options or {}

    try:
        if source_type == 'csv':
            df = pd.read_csv(source, **options)
        elif source_type == 'json':
            df = pd.read_json(source, **options)
        elif source_type == 'parquet':
            df = pd.read_parquet(source, **options)
        elif source_type == 'dict':
            data = json.loads(source)
            df = pd.DataFrame(data)
        elif source_type == 'memory':
            data = json.loads(source)
            df = pd.DataFrame(data)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

        return df
    except Exception as e:
        raise RuntimeError(f"Failed to load data: {str(e)}")


def apply_style(theme: str = 'default', style_options: Optional[Dict[str, Any]] = None):
    """
    Apply matplotlib/seaborn style

    Args:
        theme: Theme name ('default', 'dark', 'whitegrid', 'darkgrid', 'minimal')
        style_options: Additional style options
    """
    style_options = style_options or {}

    # Apply seaborn theme
    if theme == 'dark':
        sns.set_style('darkgrid')
        plt.style.use('dark_background')
    elif theme == 'whitegrid':
        sns.set_style('whitegrid')
    elif theme == 'darkgrid':
        sns.set_style('darkgrid')
    elif theme == 'minimal':
        sns.set_style('white')
    else:
        sns.set_style('darkgrid')

    # Apply color palette if specified
    if 'palette' in style_options:
        sns.set_palette(style_options['palette'])

    # Apply figure size if specified
    if 'figsize' in style_options:
        plt.rcParams['figure.figsize'] = style_options['figsize']


def create_line_chart(df: pd.DataFrame, config: Dict[str, Any]) -> plt.Figure:
    """Create a line chart"""
    fig, ax = plt.subplots(figsize=config.get('figsize', (10, 6)))

    x = config.get('x')
    y = config.get('y')
    hue = config.get('hue')

    if isinstance(y, list):
        # Multiple y columns
        for y_col in y:
            ax.plot(df[x], df[y_col], marker='o', label=y_col)
        ax.legend()
    else:
        # Single y column
        if hue:
            for label, group in df.groupby(hue):
                ax.plot(group[x], group[y], marker='o', label=label)
            ax.legend()
        else:
            ax.plot(df[x], df[y], marker='o')

    ax.set_xlabel(config.get('xlabel', x))
    ax.set_ylabel(config.get('ylabel', y if not isinstance(y, list) else 'Value'))
    ax.set_title(config.get('title', 'Line Chart'))
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    return fig


def create_bar_chart(df: pd.DataFrame, config: Dict[str, Any]) -> plt.Figure:
    """Create a bar chart"""
    fig, ax = plt.subplots(figsize=config.get('figsize', (10, 6)))

    x = config.get('x')
    y = config.get('y')
    hue = config.get('hue')
    orientation = config.get('orientation', 'vertical')

    if hue:
        sns.barplot(data=df, x=x, y=y, hue=hue, ax=ax)
    else:
        if orientation == 'horizontal':
            ax.barh(df[x], df[y])
        else:
            ax.bar(df[x], df[y])

    ax.set_xlabel(config.get('xlabel', x))
    ax.set_ylabel(config.get('ylabel', y))
    ax.set_title(config.get('title', 'Bar Chart'))

    if config.get('rotate_labels'):
        plt.xticks(rotation=45, ha='right')

    plt.tight_layout()
    return fig


def create_scatter_plot(df: pd.DataFrame, config: Dict[str, Any]) -> plt.Figure:
    """Create a scatter plot"""
    fig, ax = plt.subplots(figsize=config.get('figsize', (10, 6)))

    x = config.get('x')
    y = config.get('y')
    hue = config.get('hue')
    size = config.get('size')

    if hue:
        for label, group in df.groupby(hue):
            sizes = group[size] if size else 50
            ax.scatter(group[x], group[y], s=sizes, label=label, alpha=0.6)
        ax.legend()
    else:
        sizes = df[size] if size else 50
        ax.scatter(df[x], df[y], s=sizes, alpha=0.6)

    ax.set_xlabel(config.get('xlabel', x))
    ax.set_ylabel(config.get('ylabel', y))
    ax.set_title(config.get('title', 'Scatter Plot'))
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    return fig


def create_histogram(df: pd.DataFrame, config: Dict[str, Any]) -> plt.Figure:
    """Create a histogram"""
    fig, ax = plt.subplots(figsize=config.get('figsize', (10, 6)))

    column = config.get('column')
    bins = config.get('bins', 30)
    hue = config.get('hue')

    if hue:
        for label, group in df.groupby(hue):
            ax.hist(group[column], bins=bins, alpha=0.5, label=label)
        ax.legend()
    else:
        ax.hist(df[column], bins=bins, alpha=0.7)

    ax.set_xlabel(config.get('xlabel', column))
    ax.set_ylabel(config.get('ylabel', 'Frequency'))
    ax.set_title(config.get('title', 'Histogram'))
    ax.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    return fig


def create_heatmap(df: pd.DataFrame, config: Dict[str, Any]) -> plt.Figure:
    """Create a heatmap"""
    fig, ax = plt.subplots(figsize=config.get('figsize', (12, 8)))

    # If specific columns are specified, use them
    columns = config.get('columns')
    if columns:
        data = df[columns]
    else:
        # Use all numeric columns
        data = df.select_dtypes(include=[np.number])

    # Compute correlation if requested
    if config.get('correlation', False):
        data = data.corr()

    sns.heatmap(
        data,
        annot=config.get('annot', True),
        fmt=config.get('fmt', '.2f'),
        cmap=config.get('cmap', 'coolwarm'),
        center=config.get('center', 0),
        ax=ax
    )

    ax.set_title(config.get('title', 'Heatmap'))
    plt.tight_layout()
    return fig


def create_boxplot(df: pd.DataFrame, config: Dict[str, Any]) -> plt.Figure:
    """Create a boxplot"""
    fig, ax = plt.subplots(figsize=config.get('figsize', (10, 6)))

    x = config.get('x')
    y = config.get('y')
    hue = config.get('hue')

    sns.boxplot(data=df, x=x, y=y, hue=hue, ax=ax)

    ax.set_xlabel(config.get('xlabel', x))
    ax.set_ylabel(config.get('ylabel', y))
    ax.set_title(config.get('title', 'Box Plot'))

    if config.get('rotate_labels'):
        plt.xticks(rotation=45, ha='right')

    plt.tight_layout()
    return fig


def create_custom_plot(df: pd.DataFrame, code: str) -> plt.Figure:
    """
    Execute custom plotting code

    The code should create a figure and assign it to 'fig' variable.
    DataFrame is available as 'df', and all imports are available.
    """
    # Create execution context
    context = {
        'df': df,
        'pd': pd,
        'np': np,
        'plt': plt,
        'sns': sns,
        'fig': None
    }

    # Execute code
    exec(code, context)

    # Return figure
    if context['fig'] is None:
        # If no fig was assigned, try to get current figure
        context['fig'] = plt.gcf()

    return context['fig']


def create_plotly_chart(df: pd.DataFrame, chart_type: str, config: Dict[str, Any]) -> str:
    """
    Create interactive Plotly chart

    Returns HTML string
    """
    if not PLOTLY_AVAILABLE:
        raise RuntimeError("Plotly is not available. Install with: pip install plotly")

    x = config.get('x')
    y = config.get('y')
    color = config.get('hue') or config.get('color')
    title = config.get('title', f'{chart_type.title()} Chart')

    if chart_type == 'line':
        fig = px.line(df, x=x, y=y, color=color, title=title)
    elif chart_type == 'bar':
        fig = px.bar(df, x=x, y=y, color=color, title=title)
    elif chart_type == 'scatter':
        size = config.get('size')
        fig = px.scatter(df, x=x, y=y, color=color, size=size, title=title)
    elif chart_type == 'histogram':
        column = config.get('column')
        fig = px.histogram(df, x=column, color=color, title=title)
    else:
        raise ValueError(f"Unsupported Plotly chart type: {chart_type}")

    # Return HTML
    return fig.to_html(include_plotlyjs='cdn')


def save_figure(fig: plt.Figure, output_format: str, output_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Save figure to file or encode as base64

    Args:
        fig: Matplotlib figure
        output_format: 'png', 'svg', or 'html'
        output_path: Optional file path to save to

    Returns:
        Dictionary with format, data (base64 or path), and metadata
    """
    if output_format == 'png':
        # Save as PNG
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=config.get('dpi', 100), bbox_inches='tight')
        buf.seek(0)

        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buf.getvalue())
            return {
                'format': 'png',
                'path': output_path,
                'size_bytes': len(buf.getvalue())
            }
        else:
            # Encode as base64
            encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
            return {
                'format': 'png',
                'data': encoded,
                'size_bytes': len(buf.getvalue())
            }

    elif output_format == 'svg':
        # Save as SVG
        buf = io.StringIO()
        fig.savefig(buf, format='svg', bbox_inches='tight')
        buf.seek(0)
        svg_data = buf.getvalue()

        if output_path:
            with open(output_path, 'w') as f:
                f.write(svg_data)
            return {
                'format': 'svg',
                'path': output_path,
                'size_bytes': len(svg_data)
            }
        else:
            return {
                'format': 'svg',
                'data': svg_data,
                'size_bytes': len(svg_data)
            }

    else:
        raise ValueError(f"Unsupported output format: {output_format}")


def main():
    """
    Main entry point for CLI usage

    Expects JSON input via stdin with:
    {
        "chart_type": "line" | "bar" | "scatter" | "histogram" | "heatmap" | "boxplot" | "custom" | "plotly",
        "source": "file_path_or_data",
        "source_type": "csv" | "json" | "parquet" | "dict" | "memory",
        "config": {
            "x": "column_name",
            "y": "column_name",
            "title": "Chart Title",
            "xlabel": "X Label",
            "ylabel": "Y Label",
            ...
        },
        "style": {
            "theme": "default" | "dark" | "whitegrid" | "darkgrid" | "minimal",
            "palette": "color_palette_name",
            "figsize": [width, height]
        },
        "output": {
            "format": "png" | "svg" | "html",
            "path": "optional_output_path"
        },
        "code": "custom_python_code"
    }
    """
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())

        chart_type = input_data.get('chart_type')
        source = input_data.get('source')
        source_type = input_data.get('source_type')
        config = input_data.get('config', {})
        style = input_data.get('style', {})
        output = input_data.get('output', {})
        code = input_data.get('code')

        # Load data
        df = load_data(source, source_type)

        # Apply style
        theme = style.get('theme', 'default')
        apply_style(theme, style)

        # Create chart
        if chart_type == 'plotly':
            # Plotly chart (HTML output)
            plotly_type = config.get('plotly_type', 'line')
            html_output = create_plotly_chart(df, plotly_type, config)

            output_path = output.get('path')
            if output_path:
                with open(output_path, 'w') as f:
                    f.write(html_output)
                result = {
                    'format': 'html',
                    'path': output_path,
                    'size_bytes': len(html_output)
                }
            else:
                result = {
                    'format': 'html',
                    'data': html_output,
                    'size_bytes': len(html_output)
                }

        else:
            # Matplotlib/Seaborn chart
            if chart_type == 'line':
                fig = create_line_chart(df, config)
            elif chart_type == 'bar':
                fig = create_bar_chart(df, config)
            elif chart_type == 'scatter':
                fig = create_scatter_plot(df, config)
            elif chart_type == 'histogram':
                fig = create_histogram(df, config)
            elif chart_type == 'heatmap':
                fig = create_heatmap(df, config)
            elif chart_type == 'boxplot':
                fig = create_boxplot(df, config)
            elif chart_type == 'custom':
                if not code:
                    raise ValueError("Custom chart requires 'code' parameter")
                fig = create_custom_plot(df, code)
            else:
                raise ValueError(f"Unsupported chart type: {chart_type}")

            # Save figure
            output_format = output.get('format', 'png')
            output_path = output.get('path')
            result = save_figure(fig, output_format, output_path)

            # Close figure to free memory
            plt.close(fig)

        # Add metadata
        result['chart_type'] = chart_type
        result['data_shape'] = {
            'rows': int(df.shape[0]),
            'columns': int(df.shape[1])
        }

        print(json.dumps({
            'success': True,
            'result': result
        }))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
