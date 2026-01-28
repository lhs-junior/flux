import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { GuideStore } from './guide-store.js';
import type { BM25Indexer } from '../../search/bm25-indexer.js';
import type { GuideCategory, DifficultyLevel } from './guide-types.js';
import type { ToolMetadata } from '../../core/types.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse markdown frontmatter
 */
function parseFrontmatter(content: string): {
  metadata: Record<string, any>;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, body: content };
  }

  const [, frontmatter, body] = match;
  const metadata: Record<string, any> = {};

  // Parse YAML-like frontmatter
  const lines = (frontmatter || '').split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    // Parse arrays (e.g., tags: [a, b, c] or tags: ["a", "b", "c"])
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      metadata[key] = arrayContent
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter((item) => item.length > 0);
    } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      metadata[key] = value.toLowerCase() === 'true';
    } else if (!isNaN(Number(value))) {
      metadata[key] = Number(value);
    } else {
      // Remove quotes if present
      metadata[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return { metadata, body: (body ?? '').trim() };
}

/**
 * Extract excerpt from markdown content
 */
function extractExcerpt(content: string, maxLength: number = 200): string {
  // Remove markdown headers
  const withoutHeaders = content.replace(/^#+\s+.+$/gm, '');
  // Remove code blocks
  const withoutCode = withoutHeaders.replace(/```[\s\S]*?```/g, '');
  // Remove links
  const withoutLinks = withoutCode.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Get first paragraph
  const firstParagraph = (withoutLinks.split('\n\n')[0] || '')
    .trim()
    .replace(/\n/g, ' ');

  if (!firstParagraph) return '';

  return firstParagraph.length > maxLength
    ? firstParagraph.slice(0, maxLength) + '...'
    : firstParagraph;
}

/**
 * Parse tutorial steps from markdown
 */
function parseTutorialSteps(content: string): Array<{
  stepNumber: number;
  title: string;
  content: string;
  codeExample?: string;
  expectedOutput?: string;
  checkCommand?: string;
  hints?: string[];
}> {
  const steps: Array<{
    stepNumber: number;
    title: string;
    content: string;
    codeExample?: string;
    expectedOutput?: string;
    checkCommand?: string;
    hints?: string[];
  }> = [];

  // Match ## Step N: Title patterns
  const stepRegex = /^##\s+Step\s+(\d+):\s+(.+)$/gm;
  const matches = [...content.matchAll(stepRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const stepNumber = parseInt(match[1]!, 10);
    const title = match[2]!;
    const startIndex = match.index! + match[0].length;
    const endIndex = matches[i + 1]?.index ?? content.length;
    const stepContent = content.slice(startIndex, endIndex).trim();

    // Extract code examples
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [...stepContent.matchAll(codeBlockRegex)];
    const codeExample = codeBlocks[0]?.[1]?.trim();

    // Extract expected output (look for "Expected output:" or "Output:")
    const outputRegex = /(?:Expected output|Output):\s*\n```(?:\w+)?\n([\s\S]*?)```/i;
    const outputMatch = stepContent.match(outputRegex);
    const expectedOutput = outputMatch?.[1]?.trim();

    // Extract check command (look for "Check:" or "Validate:")
    const checkRegex = /(?:Check|Validate):\s*`([^`]+)`/i;
    const checkMatch = stepContent.match(checkRegex);
    const checkCommand = checkMatch?.[1]?.trim();

    // Extract hints (look for "Hint:" or "Hints:" followed by list items)
    const hintRegex = /(?:Hint|Hints?):\s*\n((?:[-*]\s+.+\n?)+)/i;
    const hintMatch = stepContent.match(hintRegex);
    const hints = hintMatch?.[1]
      ?.split('\n')
      .map((line) => line.replace(/^[-*]\s+/, '').trim())
      .filter((line) => line.length > 0);

    // Remove code blocks, output, check, and hints from content
    let cleanContent = stepContent
      .replace(codeBlockRegex, '')
      .replace(outputRegex, '')
      .replace(checkRegex, '')
      .replace(hintRegex, '')
      .trim();

    steps.push({
      stepNumber,
      title,
      content: cleanContent || stepContent,
      codeExample,
      expectedOutput,
      checkCommand,
      hints: hints && hints.length > 0 ? hints : undefined,
    });
  }

  return steps;
}

/**
 * Load guide from markdown file
 */
function loadGuideFromFile(filepath: string): {
  slug: string;
  title: string;
  category: GuideCategory;
  contentPath: string;
  excerpt: string;
  tags?: string[];
  relatedTools?: string[];
  relatedGuides?: string[];
  difficulty?: DifficultyLevel;
  estimatedTime?: number;
  prerequisites?: string[];
  version?: string;
  tutorialSteps?: Array<{
    stepNumber: number;
    title: string;
    content: string;
    codeExample?: string;
    expectedOutput?: string;
    checkCommand?: string;
    hints?: string[];
  }>;
} | null {
  try {
    if (!existsSync(filepath)) {
      console.warn(`Guide file not found: ${filepath}`);
      return null;
    }

    const content = readFileSync(filepath, 'utf-8');
    const { metadata, body } = parseFrontmatter(content);

    // Required fields
    const slug = metadata.slug as string;
    const title = metadata.title as string;
    const category = metadata.category as GuideCategory;

    if (!slug || !title || !category) {
      console.warn(`Missing required fields in guide: ${filepath}`);
      return null;
    }

    // Extract excerpt
    const excerpt = metadata.excerpt || extractExcerpt(body);

    // Parse tutorial steps if this is a tutorial
    let tutorialSteps: Array<{
      stepNumber: number;
      title: string;
      content: string;
      codeExample?: string;
      expectedOutput?: string;
      checkCommand?: string;
      hints?: string[];
    }> = [];
    if ((category === 'tutorial' || body?.includes('## Step')) && body) {
      tutorialSteps = parseTutorialSteps(body);
    }

    return {
      slug,
      title,
      category,
      contentPath: filepath,
      excerpt,
      tags: metadata.tags || [],
      relatedTools: metadata.relatedTools || metadata.related_tools || [],
      relatedGuides: metadata.relatedGuides || metadata.related_guides || [],
      difficulty: metadata.difficulty || 'beginner',
      estimatedTime: metadata.estimatedTime || metadata.estimated_time || 10,
      prerequisites: metadata.prerequisites || [],
      version: metadata.version || '1.0.0',
      tutorialSteps: tutorialSteps.length > 0 ? tutorialSteps : undefined,
    };
  } catch (error) {
    logger.error(`Failed to load guide from ${filepath}:`, error);
    return null;
  }
}

/**
 * Initialize guides by loading seed guide files
 */
export async function initializeGuides(
  store: GuideStore,
  indexer: BM25Indexer
): Promise<{ loaded: number; errors: number }> {
  // Check if guides already exist
  const existingGuides = store.listGuides({ limit: 1 });
  if (existingGuides.length > 0) {
    logger.info('Guides already initialized, skipping seed');
    return { loaded: 0, errors: 0 };
  }

  logger.info('Initializing guide database with seed content...');

  // Define seed guide files (relative to project root)
  const projectRoot = join(__dirname, '../../../');
  const guideFiles = [
    'guides/getting-started.md',
    'guides/memory-system.md',
    'guides/agent-orchestration.md',
    'guides/planning-workflow.md',
    'guides/tdd-integration.md',
  ];

  let loaded = 0;
  let errors = 0;

  for (const relativeFile of guideFiles) {
    const filepath = join(projectRoot, relativeFile);
    const guideData = loadGuideFromFile(filepath);

    if (!guideData) {
      errors++;
      continue;
    }

    try {
      // Create guide record
      const guide = store.createGuide(
        guideData.slug,
        guideData.title,
        guideData.category,
        guideData.contentPath,
        guideData.excerpt,
        {
          tags: guideData.tags,
          relatedTools: guideData.relatedTools,
          relatedGuides: guideData.relatedGuides,
          difficulty: guideData.difficulty,
          estimatedTime: guideData.estimatedTime,
          prerequisites: guideData.prerequisites,
          version: guideData.version,
        }
      );

      // Create tutorial steps if available
      if (guideData.tutorialSteps) {
        for (const step of guideData.tutorialSteps) {
          store.createStep(guide.id, step.stepNumber, step.title, step.content, {
            codeExample: step.codeExample,
            expectedOutput: step.expectedOutput,
            checkCommand: step.checkCommand,
            hints: step.hints,
          });
        }
      }

      // Index guide in BM25
      const toolMetadata: ToolMetadata = {
        name: `guide:${guide.id}`,
        description: `${guide.title}: ${guide.excerpt}`,
        category: 'guide',
        keywords: [
          ...guide.tags,
          guide.category,
          guide.difficulty,
          ...guide.relatedTools,
        ],
        serverId: 'internal:guide',
        inputSchema: { type: 'object' },
      };
      indexer.addDocument(toolMetadata);

      loaded++;
      logger.info(`Loaded guide: ${guide.title}`);
    } catch (error) {
      logger.error(`Failed to create guide from ${relativeFile}:`, error);
      errors++;
    }
  }

  logger.info(`Guide initialization complete: ${loaded} loaded, ${errors} errors`);
  return { loaded, errors };
}
