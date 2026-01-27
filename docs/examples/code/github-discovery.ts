/**
 * GitHub Discovery Example
 *
 * This example demonstrates discovering and evaluating MCP servers from GitHub:
 * 1. Search for MCP servers on GitHub
 * 2. Evaluate their quality
 * 3. Display results with recommendations
 */

import { GitHubExplorer, QualityEvaluator } from '../../../src/index.js';

async function main() {
  console.log('🚀 Awesome MCP Meta Plugin - GitHub Discovery Example\n');

  // Check for GitHub token
  if (!process.env.GITHUB_TOKEN) {
    console.log('⚠️  GITHUB_TOKEN not set. You have 60 requests/hour limit.');
    console.log('   Set GITHUB_TOKEN for 5000 requests/hour:');
    console.log('   export GITHUB_TOKEN=ghp_your_token_here\n');
  }

  // 1. Create explorer and evaluator
  console.log('1️⃣  Setting up GitHub explorer and quality evaluator...');
  const explorer = new GitHubExplorer({
    githubToken: process.env.GITHUB_TOKEN,
    enableCache: true,
    cacheExpiry: 3600000, // 1 hour
  });

  const evaluator = new QualityEvaluator({
    minScore: 70, // Only show repos with score >= 70
    weights: {
      popularity: 1.0,
      maintenance: 1.2,  // Prioritize maintained projects
      documentation: 1.0,
      reliability: 1.0,
    },
  });
  console.log('✅ Ready\n');

  // 2. Check rate limit
  console.log('2️⃣  Checking GitHub API rate limit...');
  try {
    const rateLimit = await explorer.getRateLimitInfo();
    console.log(`  ${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
    console.log(`  Resets at: ${rateLimit.reset.toLocaleString()}\n`);
  } catch (error) {
    console.log('  Could not fetch rate limit info\n');
  }

  // 3. Search for MCP servers
  console.log('3️⃣  Searching for MCP servers on GitHub...');
  console.log('  Search criteria:');
  console.log('    - Minimum stars: 50');
  console.log('    - Maximum results: 50');
  console.log('    - Topics: mcp-server, mcp, model-context-protocol');
  console.log('    - Language: TypeScript');
  console.log();

  const repos = await explorer.searchMCPServers({
    minStars: 50,
    maxResults: 50,
    topics: ['mcp-server', 'mcp', 'model-context-protocol'],
    language: 'typescript',
  });

  console.log(`✅ Found ${repos.length} repositories\n`);

  // 4. Evaluate all repositories
  console.log('4️⃣  Evaluating repository quality...');
  const evaluated = evaluator.evaluateAll(repos);
  console.log(`✅ Evaluated ${evaluated.length} repositories\n`);

  // 5. Display top 10 plugins
  console.log('5️⃣  Top 10 MCP Plugins:\n');
  console.log('═'.repeat(80));

  evaluated.slice(0, 10).forEach(({ repo, score }, index) => {
    console.log(`\n${index + 1}. ${repo.fullName}`);
    console.log(`   Score: ${score.total}/100 (Grade: ${score.grade})`);
    console.log(`   ⭐ ${repo.stars} stars | 🍴 ${repo.forks} forks`);
    console.log(`   🔧 Updated: ${repo.updatedAt.toLocaleDateString()}`);
    console.log(`   📜 ${repo.description || 'No description'}`);
    console.log(`   Recommendation: ${score.recommendation.replace(/_/g, ' ')}`);
    console.log(`   Reasons:`);
    score.reasons.forEach(reason => {
      console.log(`     • ${reason}`);
    });
    console.log(`   URL: ${repo.url}`);
  });

  console.log('\n' + '═'.repeat(80) + '\n');

  // 6. Filter and display by grade
  console.log('6️⃣  Breakdown by grade:');
  const gradeA = evaluated.filter(e => e.score.grade === 'A');
  const gradeB = evaluated.filter(e => e.score.grade === 'B');
  const gradeC = evaluated.filter(e => e.score.grade === 'C');
  const gradeD = evaluated.filter(e => e.score.grade === 'D');
  const gradeF = evaluated.filter(e => e.score.grade === 'F');

  console.log(`  Grade A (90-100): ${gradeA.length} plugins - Highly recommended`);
  console.log(`  Grade B (80-89):  ${gradeB.length} plugins - Recommended`);
  console.log(`  Grade C (70-79):  ${gradeC.length} plugins - Acceptable`);
  console.log(`  Grade D (60-69):  ${gradeD.length} plugins - Use with caution`);
  console.log(`  Grade F (<60):    ${gradeF.length} plugins - Not recommended`);
  console.log();

  // 7. Show recommended plugins
  const recommended = evaluated.filter(e => e.score.total >= 70);
  console.log(`7️⃣  ${recommended.length} plugins meet quality threshold (≥70):\n`);

  recommended.slice(0, 5).forEach(({ repo, score }, index) => {
    console.log(`  ${index + 1}. ${repo.fullName} (${score.total}/100)`);
  });
  console.log();

  // 8. Display statistics
  console.log('8️⃣  Quality statistics:');
  const avgScore = evaluated.reduce((sum, e) => sum + e.score.total, 0) / evaluated.length;
  const avgPopularity = evaluated.reduce((sum, e) => sum + e.score.breakdown.popularity, 0) / evaluated.length;
  const avgMaintenance = evaluated.reduce((sum, e) => sum + e.score.breakdown.maintenance, 0) / evaluated.length;
  const avgDocumentation = evaluated.reduce((sum, e) => sum + e.score.breakdown.documentation, 0) / evaluated.length;
  const avgReliability = evaluated.reduce((sum, e) => sum + e.score.breakdown.reliability, 0) / evaluated.length;

  console.log(`  Average overall score: ${avgScore.toFixed(1)}/100`);
  console.log(`  Average breakdown:`);
  console.log(`    Popularity:    ${avgPopularity.toFixed(1)}/25`);
  console.log(`    Maintenance:   ${avgMaintenance.toFixed(1)}/25`);
  console.log(`    Documentation: ${avgDocumentation.toFixed(1)}/25`);
  console.log(`    Reliability:   ${avgReliability.toFixed(1)}/25`);
  console.log();

  // 9. Installation instructions
  if (recommended.length > 0) {
    const topRepo = recommended[0].repo;
    console.log('9️⃣  How to install the top plugin:\n');
    console.log(`  # Clone repository`);
    console.log(`  git clone ${topRepo.url}.git`);
    console.log(`  cd ${topRepo.name}`);
    console.log();
    console.log(`  # Install dependencies`);
    console.log(`  npm install`);
    console.log();
    console.log(`  # Add to Awesome Plugin gateway`);
    console.log(`  await gateway.connectToServer({`);
    console.log(`    id: '${topRepo.name}',`);
    console.log(`    name: '${topRepo.name}',`);
    console.log(`    command: 'node',`);
    console.log(`    args: ['./dist/index.js'],`);
    console.log(`  });`);
    console.log();
  }

  console.log('✨ GitHub discovery example completed successfully!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
