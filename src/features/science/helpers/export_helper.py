#!/usr/bin/env python3
"""
Export helper for generating scientific reports and exporting data
Supports CSV, Excel, JSON, Parquet, HTML, and PDF formats
"""

import sys
import json
import os
from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import datetime


def export_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Export data to various formats"""
    try:
        df = pd.DataFrame(data['data'])
        filepath = data['filepath']
        format_type = data.get('format', 'csv')

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)

        if format_type == 'csv':
            df.to_csv(filepath, index=False)
        elif format_type == 'excel':
            df.to_excel(filepath, index=False, engine='openpyxl')
        elif format_type == 'json':
            df.to_json(filepath, orient='records', indent=2)
        elif format_type == 'parquet':
            df.to_parquet(filepath, index=False, engine='pyarrow')
        else:
            return {'success': False, 'error': f'Unsupported format: {format_type}'}

        return {
            'success': True,
            'filepath': filepath,
            'format': format_type,
            'rows': len(df),
            'columns': len(df.columns)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_html_report(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate an HTML report with data and visualizations"""
    try:
        title = data.get('title', 'Data Analysis Report')
        sections = data.get('sections', [])
        filepath = data['filepath']

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)

        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }}
        .header {{
            background-color: #2c3e50;
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 2.5em;
        }}
        .timestamp {{
            margin-top: 10px;
            font-size: 0.9em;
            opacity: 0.8;
        }}
        .section {{
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-top: 0;
        }}
        .section h3 {{
            color: #34495e;
            margin-top: 20px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
        .metric {{
            display: inline-block;
            background: #ecf0f1;
            padding: 15px 20px;
            margin: 10px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }}
        .metric-label {{
            font-size: 0.9em;
            color: #7f8c8d;
            margin-bottom: 5px;
        }}
        .metric-value {{
            font-size: 1.8em;
            font-weight: bold;
            color: #2c3e50;
        }}
        .plot {{
            margin: 20px 0;
            text-align: center;
        }}
        .plot img {{
            max-width: 100%;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        pre {{
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 0.9em;
        }}
        code {{
            background: #ecf0f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        .alert {{
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid;
        }}
        .alert-info {{
            background-color: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }}
        .alert-success {{
            background-color: #d4edda;
            border-color: #28a745;
            color: #155724;
        }}
        .alert-warning {{
            background-color: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #7f8c8d;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{title}</h1>
        <div class="timestamp">Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
    </div>
"""

        # Add sections
        for section in sections:
            section_type = section.get('type', 'text')
            section_title = section.get('title', '')
            section_content = section.get('content', '')

            html_content += f'    <div class="section">\n'

            if section_title:
                html_content += f'        <h2>{section_title}</h2>\n'

            if section_type == 'text':
                html_content += f'        <p>{section_content}</p>\n'

            elif section_type == 'table':
                df = pd.DataFrame(section_content)
                html_content += '        ' + df.to_html(index=False, classes='data-table') + '\n'

            elif section_type == 'metrics':
                html_content += '        <div class="metrics">\n'
                for metric in section_content:
                    label = metric.get('label', 'Metric')
                    value = metric.get('value', 'N/A')
                    html_content += f'''            <div class="metric">
                <div class="metric-label">{label}</div>
                <div class="metric-value">{value}</div>
            </div>\n'''
                html_content += '        </div>\n'

            elif section_type == 'plot':
                plot_path = section_content
                html_content += f'        <div class="plot"><img src="{plot_path}" alt="Plot"></div>\n'

            elif section_type == 'code':
                html_content += f'        <pre><code>{section_content}</code></pre>\n'

            elif section_type == 'alert':
                alert_type = section.get('alert_type', 'info')
                html_content += f'        <div class="alert alert-{alert_type}">{section_content}</div>\n'

            html_content += '    </div>\n'

        # Footer
        html_content += """
    <div class="footer">
        <p>Generated with Awesome Plugin Science Tools</p>
    </div>
</body>
</html>
"""

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return {
            'success': True,
            'filepath': filepath,
            'format': 'html',
            'sections': len(sections)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_pdf_report(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a PDF report (requires reportlab)"""
    try:
        # Try to import reportlab
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        except ImportError:
            return {
                'success': False,
                'error': 'reportlab not installed. Install with: pip install reportlab'
            }

        title = data.get('title', 'Data Analysis Report')
        sections = data.get('sections', [])
        filepath = data['filepath']

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)

        # Create PDF document
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30,
        )
        story.append(Paragraph(title, title_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))

        # Add sections
        for section in sections:
            section_type = section.get('type', 'text')
            section_title = section.get('title', '')
            section_content = section.get('content', '')

            if section_title:
                story.append(Paragraph(section_title, styles['Heading2']))
                story.append(Spacer(1, 0.2*inch))

            if section_type == 'text':
                story.append(Paragraph(section_content, styles['Normal']))
                story.append(Spacer(1, 0.2*inch))

            elif section_type == 'table':
                df = pd.DataFrame(section_content)
                table_data = [df.columns.tolist()] + df.values.tolist()

                t = Table(table_data)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(t)
                story.append(Spacer(1, 0.3*inch))

            elif section_type == 'metrics':
                for metric in section_content:
                    label = metric.get('label', 'Metric')
                    value = metric.get('value', 'N/A')
                    story.append(Paragraph(f"<b>{label}:</b> {value}", styles['Normal']))
                story.append(Spacer(1, 0.2*inch))

        # Build PDF
        doc.build(story)

        return {
            'success': True,
            'filepath': filepath,
            'format': 'pdf',
            'sections': len(sections)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def export_notebook(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a Jupyter notebook with analysis code and results"""
    try:
        import nbformat
        from nbformat.v4 import new_notebook, new_code_cell, new_markdown_cell

        title = data.get('title', 'Data Analysis')
        cells_data = data.get('cells', [])
        filepath = data['filepath']

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)

        # Create notebook
        nb = new_notebook()
        cells = []

        # Add title
        cells.append(new_markdown_cell(f"# {title}\n\nGenerated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"))

        # Add cells
        for cell_data in cells_data:
            cell_type = cell_data.get('type', 'markdown')
            content = cell_data.get('content', '')

            if cell_type == 'markdown':
                cells.append(new_markdown_cell(content))
            elif cell_type == 'code':
                cells.append(new_code_cell(content))

        nb['cells'] = cells

        # Write notebook
        with open(filepath, 'w', encoding='utf-8') as f:
            nbformat.write(nb, f)

        return {
            'success': True,
            'filepath': filepath,
            'format': 'notebook',
            'cells': len(cells)
        }

    except ImportError:
        return {
            'success': False,
            'error': 'nbformat not installed. Install with: pip install nbformat'
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        export_type = input_data.get('type')
        data = input_data.get('data', {})

        # Route to appropriate export function
        if export_type == 'data':
            result = export_data(data)
        elif export_type == 'html':
            result = generate_html_report(data)
        elif export_type == 'pdf':
            result = generate_pdf_report(data)
        elif export_type == 'notebook':
            result = export_notebook(data)
        else:
            result = {
                'success': False,
                'error': f'Unknown export type: {export_type}'
            }

        # Output result as JSON
        print(json.dumps(result, indent=2))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()
