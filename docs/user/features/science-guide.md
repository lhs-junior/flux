---
slug: science-guide
title: Science Tools - Complete User Guide
category: feature
difficulty: intermediate
estimatedTime: 15
tags: [science, analysis, visualization, python, data, statistics, ml]
relatedGuides: [agents-guide, memory-guide]
version: 2.0.0
excerpt: Analyze data, create visualizations, and perform scientific computing directly within FLUX.
---

# Science Tools User Guide

The Science feature gives you a Python REPL for data analysis, visualization, and scientific computing. Write Python code, analyze datasets, create charts, and perform machine learning—all integrated with your development workflow.

## What are Science Tools?

Science tools let you run Python code in a safe, sandboxed environment. You can analyze data, create visualizations, perform statistics, and do machine learning without leaving FLUX.

**Key benefits:**
- Run Python code directly
- Analyze datasets and find patterns
- Create visualizations and charts
- Perform statistical analysis
- Build and test machine learning models
- Export results for use in your projects

## Main Operations

### Execute Python Code

Run Python code and get results:

```
You: "Analyze this dataset - find the average, min, max"
FLUX: Executes Python code, returns results
```

### Visualize Data

Create charts and graphs:

```
You: "Create a bar chart showing sales by month"
FLUX: Generates visualization you can see
```

### Statistical Analysis

Perform statistical operations:

```
You: "Calculate correlation between temperature and sales"
FLUX: Returns correlation coefficient and analysis
```

### Machine Learning

Build and test models:

```
You: "Build a classifier to predict user churn"
FLUX: Trains model, shows accuracy and results
```

### Export Results

Save analysis output:

```
You: "Export this visualization as PNG"
FLUX: Saves chart file you can use elsewhere
```

## Key Use Cases

### 1. Data Analysis

Understand your data:

```
Dataset: User activity logs with timestamps, actions, duration

Analysis:
"How many unique users? What's the average session duration?
What's the most common action? Create a histogram of session lengths"

FLUX performs analysis and shows results
```

### 2. Performance Analysis

Analyze system metrics:

```
Data: API response times, database query times, cache hit rates

Analysis:
"Find the correlation between cache hit rate and response time.
Create a scatter plot showing the relationship. What's the improvement
if we increase cache hit rate from 60% to 80%?"

FLUX analyzes and visualizes performance patterns
```

### 3. A/B Testing

Evaluate experiment results:

```
Data: Two variants' conversion rates and user counts

Analysis:
"Is variant B statistically significantly better than variant A?
Calculate the confidence level. What's the minimum sample size needed?"

FLUX performs statistical test and shows significance
```

### 4. Exploratory Data Analysis

Discover patterns:

```
Data: Customer purchase history with items, amounts, dates

Analysis:
"What products sell together? What's the seasonal pattern?
Which customer segments have highest lifetime value?"

FLUX explores and visualizes patterns
```

### 5. Model Building

Create predictive models:

```
Data: Historical data with features and target variable

Analysis:
"Train a model to predict Y from these features.
Show feature importance. What's the accuracy? What are predictions for [new data]?"

FLUX builds model and shows predictions
```

## Example Workflows

### Analyzing Customer Data

#### Step 1: Load and Explore

```
You: "Load customer data from CSV. Show me:
- Total customers
- Average purchase amount
- Most common purchase category
- Date range of data"

FLUX: Loads data, performs analysis, shows results
```

#### Step 2: Segment Customers

```
You: "Segment customers by purchase amount into low/medium/high.
How many in each segment? What's the revenue contribution of each?"

FLUX: Segments and analyzes value of each group
```

#### Step 3: Visualize

```
You: "Create a pie chart showing revenue by segment
and a line chart showing purchases over time"

FLUX: Creates both visualizations
```

#### Step 4: Export

```
You: "Export both charts as PNG for the presentation"

FLUX: Saves images you can use in presentations
```

### Building a Prediction Model

#### Step 1: Prepare Data

```
You: "Load user data. Show me:
- Data shape (rows, columns)
- Missing values
- Data types
- Basic statistics"

FLUX: Loads and analyzes data structure
```

#### Step 2: Build Model

```
You: "Train a logistic regression model to predict user churn
using features: account_age, logins_per_month, support_tickets.
Show accuracy, precision, recall"

FLUX: Trains model, shows performance metrics
```

#### Step 3: Feature Analysis

```
You: "Show feature importance. Which features matter most
for predicting churn?"

FLUX: Analyzes and ranks feature importance
```

#### Step 4: Make Predictions

```
You: "For these new users, predict if they'll churn:
[user_data]

What's the confidence? Who's at highest risk?"

FLUX: Makes predictions with confidence scores
```

## Core Analysis Types

### Descriptive Statistics

Understand your data:

```
"Summarize the data - mean, median, std dev, min, max for each column"

FLUX returns:
- Central tendency (mean, median, mode)
- Spread (std dev, variance, range)
- Distribution (quartiles, percentiles)
```

### Correlation Analysis

Find relationships:

```
"Calculate correlation between all numeric columns.
Which pairs are most correlated?"

FLUX returns correlation matrix and insights
```

### Time Series Analysis

Analyze trends over time:

```
"Analyze sales data over the past year.
Show: trend, seasonality, growth rate, forecast for next 3 months"

FLUX performs time series analysis and forecasting
```

### Distribution Analysis

Understand data distribution:

```
"Is the data normally distributed? Create histograms
for each numeric column showing the distribution"

FLUX tests normality and visualizes distributions
```

### Hypothesis Testing

Test statistical assumptions:

```
"Is there a significant difference in conversion rate between groups A and B?
Calculate p-value and effect size"

FLUX performs statistical test and shows results
```

## Visualization Types

### Charts You Can Create

**Bar Charts**
```
"Create bar chart: X-axis = months, Y-axis = revenue"
```

**Line Charts**
```
"Create line chart showing sales trend over time"
```

**Scatter Plots**
```
"Create scatter plot: X = marketing spend, Y = revenue"
```

**Histograms**
```
"Create histogram of user age distribution"
```

**Pie Charts**
```
"Create pie chart showing revenue by product category"
```

**Heatmaps**
```
"Create correlation heatmap between all numeric features"
```

**Box Plots**
```
"Create box plots showing sales distribution by region"
```

### Customization

```
"Create line chart with:
- Title 'Monthly Revenue Trend'
- X-axis label 'Month'
- Y-axis label 'Revenue ($)'
- Grid lines
- Legend if multiple lines"

FLUX: Creates customized visualization
```

## Machine Learning Examples

### Classification

Predict categories:

```
"Train a decision tree classifier to predict customer segment (A/B/C)
from purchase history. Show accuracy and confusion matrix"
```

### Regression

Predict numeric values:

```
"Train linear regression to predict house prices from features:
size, bedrooms, bathrooms, age. Show R-squared and predictions"
```

### Clustering

Group similar data:

```
"Use K-means clustering to find customer groups. Test k=2,3,4,5.
Show silhouette scores. Visualize clusters"
```

### NLP Analysis

Text analysis:

```
"Analyze customer reviews. Count sentiment distribution.
Find most common positive and negative words"
```

## Best Practices

### Data Preparation

**Start by exploring:**
```
"First, show me: data shape, column names, types,
missing values, first few rows"

This tells you what you're working with
```

**Clean before analyzing:**
```
"Remove rows with missing values, convert date columns,
normalize numeric columns"

Clean data = accurate analysis
```

### Analysis Approach

**Start simple:**
```
1. Understand individual variables
2. Look at relationships
3. Build models
4. Make predictions

Build complexity gradually
```

**Verify assumptions:**
```
Before using a statistical test:
- Check if data is normally distributed
- Check for outliers
- Verify independence of observations
```

### Visualization Best Practices

**Choose appropriate chart:**
```
Comparing values → Bar chart
Showing trends → Line chart
Distribution → Histogram
Relationship → Scatter plot
Composition → Pie chart
```

**Make it clear:**
```
✓ Descriptive title
✓ Labeled axes
✓ Legend if multiple series
✓ Reasonable scale
✓ Color-blind friendly colors
```

### Model Evaluation

**Use appropriate metrics:**
```
Classification: Accuracy, Precision, Recall, F1-score
Regression: R-squared, MAE, RMSE
```

**Watch for overfitting:**
```
High training accuracy but low test accuracy = overfitting
Use cross-validation to get realistic estimates
```

## Integration Tips

### With Agents

Have agents analyze data:

```
Create data or analysis question

Use specialist_analyst: "Analyze this dataset and find key insights.
What patterns do you see? What's actionable?"

Agent performs comprehensive analysis
```

### With Memory

Save analysis findings:

```
Perform analysis: "Correlation between cache hit rate and performance is 0.92"

Save: "Performance insight: Cache hit rate strongly correlates with
API response time. Improving from 60% to 80% reduces latency by ~40%"

Recall later when optimizing performance
```

### With Planning

Organize data projects:

```
Create TODO: "Analyze customer churn patterns"

Subtasks:
├─ Load and explore data
├─ Perform statistical analysis
├─ Build prediction model
├─ Create visualizations
└─ Export results and present
```

## Common Patterns

### Quick Data Summary

```
"Summarize data: row count, columns, data types,
missing values, numeric statistics"

Quick overview of what you're working with
```

### Correlation Matrix

```
"Show correlation between all numeric columns.
Highlight correlations > 0.7"

Find relationships in your data
```

### Compare Groups

```
"Compare metric X between groups A, B, C.
Show: average, std dev, min, max for each group"

Understand differences between groups
```

### Time Trend Analysis

```
"Analyze metric over time: trend, moving average,
growth rate, seasonality"

Understand how metric changes over time
```

### Feature Engineering

```
"Create new features: date components (day, month, quarter),
ratios between metrics, aggregations"

Build better features for modeling
```

## Tips & Tricks

### Iterative Analysis

```
Don't write all code at once

Instead: Build analysis step by step

"Step 1: Load data"
Results: Shows data structure

"Step 2: Basic statistics"
Results: Mean, median, std dev

"Step 3: Create visualization"
Results: Chart

Each step builds on understanding
```

### Sampling Large Datasets

```
If data is huge:
"Show results for random sample of 10,000 rows"

Faster analysis, still representative results
```

### Comparing Approaches

```
"Train multiple models: linear regression, decision tree, random forest
Compare accuracy and feature importance"

See which approach works best
```

### Sensitivity Analysis

```
"How does output change if we vary input parameter?
Show results for different values: 10, 20, 30, 40, 50"

Understand impact of parameters
```

### Reproducible Analysis

```
Save analysis code:
"Export this analysis as a Python script I can run later"

Rerun with updated data anytime
```

## Troubleshooting

**Data loading failed:**
- Check file path is correct
- Check file format (CSV, JSON, etc.)
- Verify file exists and is readable

**Analysis is slow:**
- Try with smaller dataset sample first
- Check for inefficient code loops
- Profile code to find bottleneck

**Results don't make sense:**
- Verify data was loaded correctly
- Check for missing or corrupt data
- Verify assumptions (data type, scale, etc.)

**Can't create visualization:**
- Check you have data to visualize
- Verify column names are correct
- Try simpler visualization first

**Model accuracy is low:**
- Check data quality
- Try different features
- Try different algorithms
- Verify target variable is correct

## Next Steps

- Learn **Agents Guide** to delegate analysis to specialists
- Explore **Memory Guide** to save important findings
- Check **Planning Guide** to organize data projects

---

Science tools let you perform any data analysis or scientific computing right within FLUX. Start simple with exploration, build up to modeling and predictions.
