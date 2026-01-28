/**
 * Science System Test
 * Demonstrates science tools: stats, ML, export with Memory integration
 */

import { ScienceManager } from '../src/features/science/index.js';
import { MemoryManager } from '../src/features/memory/memory-manager.js';
import { PlanningManager } from '../src/features/planning/planning-manager.js';

async function testScienceSystem() {
  console.log('='.repeat(70));
  console.log('Science System Test - Statistics, ML, Export, and Integration');
  console.log('='.repeat(70));

  // Initialize managers
  const memoryManager = new MemoryManager(':memory:');
  const planningManager = new PlanningManager(':memory:');
  const scienceManager = new ScienceManager({
    memoryManager,
    planningManager,
  });

  try {
    // =========================================================================
    // 1. Science Stats Tool
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('1. Testing science_stats - Statistical Analysis');
    console.log('='.repeat(70));

    console.log('\n📊 T-Test Analysis');
    const ttestResult = await scienceManager.handleToolCall('science_stats', {
      test: 'ttest',
      sample1: [23, 25, 27, 29, 31, 33, 35],
      sample2: [18, 20, 22, 24, 26, 28, 30],
      options: { alternative: 'two-sided' },
    });
    console.log(JSON.stringify(JSON.parse(ttestResult.content[0].text), null, 2));

    console.log('\n📊 Correlation Analysis');
    const correlationResult = await scienceManager.handleToolCall('science_stats', {
      test: 'correlation',
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [2.1, 4.3, 5.8, 8.2, 10.5, 12.1, 14.3, 16.2, 18.5, 20.1],
      options: { method: 'pearson' },
    });
    console.log(JSON.stringify(JSON.parse(correlationResult.content[0].text), null, 2));

    console.log('\n📊 ANOVA (Analysis of Variance)');
    const anovaResult = await scienceManager.handleToolCall('science_stats', {
      test: 'anova',
      groups: [
        [23, 25, 27, 29, 31],
        [18, 20, 22, 24, 26],
        [28, 30, 32, 34, 36],
      ],
      options: {},
    });
    console.log(JSON.stringify(JSON.parse(anovaResult.content[0].text), null, 2));

    console.log('\n📊 Linear Regression');
    const regressionResult = await scienceManager.handleToolCall('science_stats', {
      test: 'regression',
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [2.1, 4.3, 5.8, 8.2, 10.5, 12.1, 14.3, 16.2, 18.5, 20.1],
      options: { degree: 1 },
    });
    console.log(JSON.stringify(JSON.parse(regressionResult.content[0].text), null, 2));

    console.log('\n📊 Chi-Square Test');
    const chiSquareResult = await scienceManager.handleToolCall('science_stats', {
      test: 'chi_square',
      observed: [
        [10, 15, 20],
        [12, 18, 22],
      ],
      expected: [
        [11, 16.5, 21],
        [11, 16.5, 21],
      ],
      options: {},
    });
    console.log(JSON.stringify(JSON.parse(chiSquareResult.content[0].text), null, 2));

    console.log('\n📊 Mann-Whitney U Test (non-parametric)');
    const mannWhitneyResult = await scienceManager.handleToolCall('science_stats', {
      test: 'mann_whitney',
      sample1: [1.2, 2.3, 3.4, 4.5, 5.6],
      sample2: [2.1, 3.2, 4.3, 5.4, 6.5],
      options: { alternative: 'two-sided' },
    });
    console.log(JSON.stringify(JSON.parse(mannWhitneyResult.content[0].text), null, 2));

    // =========================================================================
    // 2. Science ML Tool
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('2. Testing science_ml - Machine Learning Models');
    console.log('='.repeat(70));

    console.log('\n🤖 Linear Regression Model');
    const linearRegResult = await scienceManager.handleToolCall('science_ml', {
      algorithm: 'linear_regression',
      X_train: [
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ],
      y_train: [3, 5, 7, 9, 11],
      X_test: [
        [6, 7],
        [7, 8],
      ],
      options: {},
    });
    console.log(JSON.stringify(JSON.parse(linearRegResult.content[0].text), null, 2));

    console.log('\n🤖 Logistic Regression (Classification)');
    const logisticRegResult = await scienceManager.handleToolCall('science_ml', {
      algorithm: 'logistic_regression',
      X_train: [
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
      ],
      y_train: [0, 0, 0, 1, 1, 1],
      X_test: [
        [2.5, 3.5],
        [5.5, 6.5],
      ],
      options: { max_iter: 1000 },
    });
    console.log(JSON.stringify(JSON.parse(logisticRegResult.content[0].text), null, 2));

    console.log('\n🤖 K-Means Clustering');
    const kmeansResult = await scienceManager.handleToolCall('science_ml', {
      algorithm: 'kmeans',
      X_train: [
        [1, 2],
        [1.5, 1.8],
        [5, 8],
        [8, 8],
        [1, 0.6],
        [9, 11],
      ],
      y_train: [], // Unsupervised
      X_test: [],
      options: { n_clusters: 2, random_state: 42 },
    });
    console.log(JSON.stringify(JSON.parse(kmeansResult.content[0].text), null, 2));

    console.log('\n🤖 Random Forest (with feature importance)');
    const randomForestResult = await scienceManager.handleToolCall('science_ml', {
      algorithm: 'random_forest',
      X_train: [
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5],
        [4, 5, 6],
        [5, 6, 7],
        [6, 7, 8],
      ],
      y_train: [0, 0, 0, 1, 1, 1],
      X_test: [
        [2.5, 3.5, 4.5],
        [5.5, 6.5, 7.5],
      ],
      options: { n_estimators: 10, random_state: 42 },
    });
    console.log(JSON.stringify(JSON.parse(randomForestResult.content[0].text), null, 2));

    console.log('\n🤖 SVM (Support Vector Machine)');
    const svmResult = await scienceManager.handleToolCall('science_ml', {
      algorithm: 'svm',
      X_train: [
        [1, 2],
        [2, 3],
        [3, 4],
        [8, 9],
        [9, 10],
        [10, 11],
      ],
      y_train: [0, 0, 0, 1, 1, 1],
      X_test: [
        [4, 5],
        [7, 8],
      ],
      options: { kernel: 'rbf', C: 1.0 },
    });
    console.log(JSON.stringify(JSON.parse(svmResult.content[0].text), null, 2));

    // =========================================================================
    // 3. Science Export Tool
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('3. Testing science_export - Data Export Formats');
    console.log('='.repeat(70));

    const sampleData = {
      columns: ['Name', 'Age', 'Score'],
      data: [
        ['Alice', 25, 95],
        ['Bob', 30, 87],
        ['Charlie', 35, 92],
        ['Diana', 28, 88],
      ],
    };

    console.log('\n💾 Export to CSV');
    const csvResult = await scienceManager.handleToolCall('science_export', {
      format: 'csv',
      data: sampleData,
      output: '/tmp/science-test-output.csv',
      options: { index: false },
    });
    console.log(JSON.stringify(JSON.parse(csvResult.content[0].text), null, 2));

    console.log('\n💾 Export to JSON (pretty print)');
    const jsonResult = await scienceManager.handleToolCall('science_export', {
      format: 'json',
      data: sampleData,
      output: '/tmp/science-test-output.json',
      options: { orient: 'records', indent: 2 },
    });
    console.log(JSON.stringify(JSON.parse(jsonResult.content[0].text), null, 2));

    console.log('\n💾 Export to HTML (styled table)');
    const htmlResult = await scienceManager.handleToolCall('science_export', {
      format: 'html',
      data: sampleData,
      output: '/tmp/science-test-output.html',
      options: {
        title: 'Science Test Results',
        style: 'bootstrap',
        index: false,
      },
    });
    console.log(JSON.stringify(JSON.parse(htmlResult.content[0].text), null, 2));

    console.log('\n💾 Export to Excel (multi-sheet)');
    const excelResult = await scienceManager.handleToolCall('science_export', {
      format: 'excel',
      data: sampleData,
      output: '/tmp/science-test-output.xlsx',
      options: {
        sheet_name: 'Results',
        index: false,
      },
    });
    console.log(JSON.stringify(JSON.parse(excelResult.content[0].text), null, 2));

    console.log('\n💾 Export to Parquet (columnar format)');
    const parquetResult = await scienceManager.handleToolCall('science_export', {
      format: 'parquet',
      data: sampleData,
      output: '/tmp/science-test-output.parquet',
      options: { compression: 'snappy' },
    });
    console.log(JSON.stringify(JSON.parse(parquetResult.content[0].text), null, 2));

    // =========================================================================
    // 4. Memory Integration
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('4. Memory Integration - Saving Analysis Results');
    console.log('='.repeat(70));

    console.log('\n💾 Saving t-test results to memory...');
    const memoryResult1 = memoryManager.save({
      key: 'ttest-analysis-2024',
      value: ttestResult.content[0].text,
      metadata: {
        category: 'statistical-analysis',
        tags: ['science', 'ttest', 'statistics'],
      },
    });
    console.log(`✅ Saved to memory with ID: ${memoryResult1.id}`);

    console.log('\n💾 Saving ML model results to memory...');
    const memoryResult2 = memoryManager.save({
      key: 'random-forest-model-results',
      value: randomForestResult.content[0].text,
      metadata: {
        category: 'machine-learning',
        tags: ['science', 'ml', 'random-forest'],
      },
    });
    console.log(`✅ Saved to memory with ID: ${memoryResult2.id}`);

    console.log('\n📖 Recalling science results from memory...');
    const recalled = memoryManager.recall({
      query: 'random forest machine learning',
      limit: 5,
    });
    console.log(`Found ${recalled.results.length} relevant memories:`);
    recalled.results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.key} (relevance: ${r.relevance.toFixed(2)})`);
    });

    // =========================================================================
    // 5. Planning Integration
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('5. Planning Integration - Creating Analysis Tasks');
    console.log('='.repeat(70));

    console.log('\n📋 Creating TODO for follow-up analysis...');
    const todoResult = planningManager.create({
      content: 'Analyze correlation between variables X and Y with larger dataset',
      tags: ['science', 'analysis', 'follow-up'],
    });
    console.log(`✅ Created TODO with ID: ${todoResult.todo.id}`);
    console.log(`   Content: ${todoResult.todo.content}`);

    console.log('\n📋 Creating TODO for model improvement...');
    const todoResult2 = planningManager.create({
      content: 'Improve Random Forest model accuracy by tuning hyperparameters',
      tags: ['science', 'ml', 'optimization'],
    });
    console.log(`✅ Created TODO with ID: ${todoResult2.todo.id}`);

    console.log('\n📋 Listing all science-related TODOs...');
    const allTodos = planningManager.list({ status: 'pending' });
    const scienceTodos = allTodos.todos.filter((t) =>
      t.tags.some((tag) => ['science', 'analysis', 'ml'].includes(tag))
    );
    console.log(`Found ${scienceTodos.length} science TODOs:`);
    scienceTodos.forEach((todo, i) => {
      console.log(`  ${i + 1}. ${todo.content}`);
      console.log(`     Tags: [${todo.tags.join(', ')}]`);
    });

    // =========================================================================
    // 6. Complete Workflow Example
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('6. Complete Workflow - Setup → Analyze → Visualize → Stats → ML → Export');
    console.log('='.repeat(70));

    console.log('\nWorkflow: Analyzing customer purchase data');
    console.log('─'.repeat(70));

    // Step 1: Statistical analysis
    console.log('\n✓ Step 1: Statistical summary');
    const customerData = {
      purchases: [100, 150, 200, 180, 220, 190, 210, 170, 230, 195],
      satisfaction: [4.2, 4.5, 4.8, 4.3, 4.9, 4.4, 4.7, 4.1, 4.9, 4.6],
    };

    const summaryStats = await scienceManager.handleToolCall('science_stats', {
      test: 'correlation',
      x: customerData.purchases,
      y: customerData.satisfaction,
      options: { method: 'pearson' },
    });
    console.log('  Correlation analysis complete');

    // Step 2: ML prediction model
    console.log('\n✓ Step 2: Build prediction model');
    const X_features = customerData.purchases.map((p) => [p, p / 100]);
    const y_labels = customerData.satisfaction;

    const predictionModel = await scienceManager.handleToolCall('science_ml', {
      algorithm: 'linear_regression',
      X_train: X_features.slice(0, 8),
      y_train: y_labels.slice(0, 8),
      X_test: X_features.slice(8),
      options: {},
    });
    console.log('  Prediction model trained');

    // Step 3: Export results
    console.log('\n✓ Step 3: Export results');
    const exportData = {
      columns: ['Purchase', 'Satisfaction'],
      data: customerData.purchases.map((p, i) => [p, customerData.satisfaction[i]]),
    };

    const finalExport = await scienceManager.handleToolCall('science_export', {
      format: 'csv',
      data: exportData,
      output: '/tmp/customer-analysis-results.csv',
      options: { index: false },
    });
    console.log('  Results exported to CSV');

    // Step 4: Save to memory and create follow-up task
    console.log('\n✓ Step 4: Save to memory and create task');
    memoryManager.save({
      key: 'customer-purchase-analysis-complete',
      value: JSON.stringify({
        summary: summaryStats.content[0].text,
        model: predictionModel.content[0].text,
        export: finalExport.content[0].text,
      }),
      metadata: {
        category: 'business-analysis',
        tags: ['customer', 'analysis', 'complete'],
      },
    });
    console.log('  Analysis saved to memory');

    planningManager.create({
      content: 'Present customer analysis findings to stakeholders',
      tags: ['presentation', 'business', 'priority'],
    });
    console.log('  Follow-up task created');

    console.log('\n✅ Complete workflow finished successfully!');

    // =========================================================================
    // 7. Statistics
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('7. Science System Statistics');
    console.log('='.repeat(70));

    const stats = scienceManager.getStatistics();
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n✅ All science system tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    memoryManager.close();
    planningManager.close();
    scienceManager.close();
  }
}

testScienceSystem();
