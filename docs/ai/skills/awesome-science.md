---
name: awesome-science
description: Statistical analysis, ML, and data export
triggers:
  - science
  - statistics
  - machine learning
  - data analysis
---

# Awesome Science

Statistical analysis, machine learning, and data export capabilities.

## When to Use
- Perform statistical hypothesis testing
- Train and evaluate ML models
- Export analysis results to various formats

## Commands

### Statistical Analysis
```bash
npx awesome-plugin science stats <operation> --data <json> [--json]
```

**Operations:** ttest, anova, chi_square, correlation, regression, mann_whitney

### Machine Learning
```bash
npx awesome-plugin science ml <operation> --data <json> [--json]
```

**Operations:** linear_regression, logistic_regression, random_forest, xgboost, svm, kmeans

### Export Data
```bash
npx awesome-plugin science export <format> --data <json> --output <path> [--json]
```

**Formats:** csv, excel, json, parquet, html, pdf, notebook

## Examples

### Statistical Test (T-Test)
```bash
npx awesome-plugin science stats ttest \
  --data '{"group1":[1,2,3,4,5],"group2":[2,3,4,5,6]}' \
  --json
```

### Machine Learning (Random Forest)
```bash
npx awesome-plugin science ml random_forest \
  --data '{"X":[[1,2],[3,4],[5,6]],"y":[0,1,0]}' \
  --json
```

### Export Results
```bash
npx awesome-plugin science export csv \
  --data '{"results":[{"name":"test1","value":0.95}]}' \
  --output ./results.csv
```
