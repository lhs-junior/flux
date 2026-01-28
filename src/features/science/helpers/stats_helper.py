#!/usr/bin/env python3
"""
Statistical analysis helper using scipy.stats
Performs various statistical tests and returns results in JSON format
"""

import sys
import json
import numpy as np
from scipy import stats
from typing import Dict, Any, List, Optional


def calculate_effect_size(test_type: str, data1: List[float], data2: Optional[List[float]] = None,
                         statistic: Optional[float] = None, n: Optional[int] = None) -> Dict[str, Any]:
    """Calculate effect size for different test types"""
    try:
        if test_type == 'ttest':
            # Cohen's d for t-test
            n1, n2 = len(data1), len(data2) if data2 else 0
            var1, var2 = np.var(data1, ddof=1), np.var(data2, ddof=1) if data2 else 0
            pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
            cohens_d = (np.mean(data1) - np.mean(data2)) / pooled_std if data2 and pooled_std > 0 else 0
            return {
                'type': 'cohens_d',
                'value': float(cohens_d),
                'interpretation': interpret_cohens_d(cohens_d)
            }
        elif test_type == 'correlation':
            # r value is the effect size for correlation
            return {
                'type': 'r',
                'value': float(statistic) if statistic else 0,
                'interpretation': interpret_correlation(statistic if statistic else 0)
            }
        elif test_type == 'chi_square':
            # Cramér's V for chi-square
            if statistic and n:
                cramers_v = np.sqrt(statistic / n)
                return {
                    'type': 'cramers_v',
                    'value': float(cramers_v),
                    'interpretation': interpret_cramers_v(cramers_v)
                }
        elif test_type == 'mann_whitney':
            # Calculate rank-biserial correlation
            n1, n2 = len(data1), len(data2) if data2 else 0
            if statistic and n1 and n2:
                r = 1 - (2 * statistic) / (n1 * n2)
                return {
                    'type': 'rank_biserial',
                    'value': float(r),
                    'interpretation': interpret_rank_biserial(r)
                }

        return {'type': 'none', 'value': None, 'interpretation': 'Not calculated'}
    except Exception as e:
        return {'type': 'error', 'value': None, 'interpretation': str(e)}


def interpret_cohens_d(d: float) -> str:
    """Interpret Cohen's d effect size"""
    abs_d = abs(d)
    if abs_d < 0.2:
        return 'negligible'
    elif abs_d < 0.5:
        return 'small'
    elif abs_d < 0.8:
        return 'medium'
    else:
        return 'large'


def interpret_correlation(r: float) -> str:
    """Interpret correlation coefficient"""
    abs_r = abs(r)
    if abs_r < 0.3:
        return 'weak'
    elif abs_r < 0.7:
        return 'moderate'
    else:
        return 'strong'


def interpret_cramers_v(v: float) -> str:
    """Interpret Cramér's V effect size"""
    if v < 0.1:
        return 'negligible'
    elif v < 0.3:
        return 'small'
    elif v < 0.5:
        return 'medium'
    else:
        return 'large'


def interpret_rank_biserial(r: float) -> str:
    """Interpret rank-biserial correlation"""
    abs_r = abs(r)
    if abs_r < 0.2:
        return 'negligible'
    elif abs_r < 0.5:
        return 'small'
    elif abs_r < 0.8:
        return 'medium'
    else:
        return 'large'


def interpret_pvalue(pvalue: float, alpha: float = 0.05) -> str:
    """Interpret p-value"""
    if pvalue < 0.001:
        return f'highly significant (p < 0.001, α = {alpha})'
    elif pvalue < alpha:
        return f'significant (p = {pvalue:.4f}, α = {alpha})'
    else:
        return f'not significant (p = {pvalue:.4f}, α = {alpha})'


def ttest(data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform t-test (independent samples or one-sample)"""
    try:
        group1 = np.array(data['group1'])
        group2 = np.array(data.get('group2', []))
        alternative = data.get('alternative', 'two-sided')

        if len(group2) > 0:
            # Independent samples t-test
            result = stats.ttest_ind(group1, group2, alternative=alternative)
            effect = calculate_effect_size('ttest', group1.tolist(), group2.tolist())
            df = len(group1) + len(group2) - 2
        else:
            # One-sample t-test
            mu = data.get('mu', 0)
            result = stats.ttest_1samp(group1, mu, alternative=alternative)
            effect = calculate_effect_size('ttest', group1.tolist(), [mu] * len(group1))
            df = len(group1) - 1

        return {
            'test': 't-test',
            'statistic': float(result.statistic),
            'pvalue': float(result.pvalue),
            'degrees_of_freedom': df,
            'effect_size': effect,
            'interpretation': interpret_pvalue(result.pvalue),
            'success': True
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def anova(data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform one-way ANOVA"""
    try:
        groups = [np.array(g) for g in data['groups']]
        result = stats.f_oneway(*groups)

        # Calculate eta-squared as effect size
        grand_mean = np.mean(np.concatenate(groups))
        ss_between = sum(len(g) * (np.mean(g) - grand_mean) ** 2 for g in groups)
        ss_total = sum(sum((x - grand_mean) ** 2 for x in g) for g in groups)
        eta_squared = ss_between / ss_total if ss_total > 0 else 0

        df_between = len(groups) - 1
        df_within = sum(len(g) for g in groups) - len(groups)

        return {
            'test': 'ANOVA',
            'statistic': float(result.statistic),
            'pvalue': float(result.pvalue),
            'degrees_of_freedom': {
                'between': df_between,
                'within': df_within
            },
            'effect_size': {
                'type': 'eta_squared',
                'value': float(eta_squared),
                'interpretation': 'small' if eta_squared < 0.06 else ('medium' if eta_squared < 0.14 else 'large')
            },
            'interpretation': interpret_pvalue(result.pvalue),
            'success': True
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def chi_square(data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform chi-square test of independence"""
    try:
        observed = np.array(data['observed'])
        result = stats.chi2_contingency(observed)

        n = np.sum(observed)
        effect = calculate_effect_size('chi_square', [], None, result.statistic, n)

        return {
            'test': 'chi-square',
            'statistic': float(result.statistic),
            'pvalue': float(result.pvalue),
            'degrees_of_freedom': int(result.dof),
            'expected': result.expected_freq.tolist(),
            'effect_size': effect,
            'interpretation': interpret_pvalue(result.pvalue),
            'success': True
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def correlation(data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform correlation analysis (Pearson or Spearman)"""
    try:
        x = np.array(data['x'])
        y = np.array(data['y'])
        method = data.get('method', 'pearson')

        if method == 'spearman':
            result = stats.spearmanr(x, y)
        else:
            result = stats.pearsonr(x, y)

        effect = calculate_effect_size('correlation', x.tolist(), y.tolist(), result.statistic)

        return {
            'test': f'{method} correlation',
            'statistic': float(result.statistic),
            'pvalue': float(result.pvalue),
            'effect_size': effect,
            'interpretation': interpret_pvalue(result.pvalue),
            'success': True
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def regression(data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform linear regression"""
    try:
        x = np.array(data['x'])
        y = np.array(data['y'])

        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

        # Calculate R-squared
        r_squared = r_value ** 2

        # Predict y values
        y_pred = slope * x + intercept

        return {
            'test': 'linear regression',
            'slope': float(slope),
            'intercept': float(intercept),
            'r_value': float(r_value),
            'r_squared': float(r_squared),
            'pvalue': float(p_value),
            'std_err': float(std_err),
            'predictions': y_pred.tolist(),
            'interpretation': interpret_pvalue(p_value),
            'success': True
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def mann_whitney(data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform Mann-Whitney U test (non-parametric alternative to t-test)"""
    try:
        group1 = np.array(data['group1'])
        group2 = np.array(data['group2'])
        alternative = data.get('alternative', 'two-sided')

        result = stats.mannwhitneyu(group1, group2, alternative=alternative)
        effect = calculate_effect_size('mann_whitney', group1.tolist(), group2.tolist(), result.statistic)

        return {
            'test': 'Mann-Whitney U',
            'statistic': float(result.statistic),
            'pvalue': float(result.pvalue),
            'effect_size': effect,
            'interpretation': interpret_pvalue(result.pvalue),
            'success': True
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        test_type = input_data.get('test')
        data = input_data.get('data', {})

        # Route to appropriate test
        if test_type == 'ttest':
            result = ttest(data)
        elif test_type == 'anova':
            result = anova(data)
        elif test_type == 'chi_square':
            result = chi_square(data)
        elif test_type == 'correlation':
            result = correlation(data)
        elif test_type == 'regression':
            result = regression(data)
        elif test_type == 'mann_whitney':
            result = mann_whitney(data)
        else:
            result = {
                'success': False,
                'error': f'Unknown test type: {test_type}'
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
