/**
 * Few-shot learning examples for commit message generation
 * These annotated examples guide the AI to generate high-quality semantic commit messages
 */

import type { DiffAnalysis } from "../../domain/services/DiffAnalyzer.js";

/**
 * Annotated commit example with quality metadata
 */
export interface CommitExample {
  /** Brief description of the changes (simplified diff summary) */
  diffSummary: string;
  /** The commit message (what we want the AI to learn from) */
  message: {
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    breaking?: boolean;
  };
  /** Quality score (1-5, 5 being best) */
  qualityScore: number;
  /** Why this example is high quality */
  reasoning: string;
  /** Project context (optional) */
  projectContext?: string;
  /** Analysis metadata matching this example */
  analysis: {
    changePattern: DiffAnalysis["changePatterns"][0]["type"];
    complexity: "simple" | "moderate" | "complex";
    filesChanged: number;
    hasBody: boolean;
  };
}

/**
 * Curated examples of high-quality commit messages
 * These examples demonstrate semantic, informative commit messages
 */
export const COMMIT_EXAMPLES: CommitExample[] = [
  {
    diffSummary:
      "Added new UserValidator class with email and password validation methods. Created validation rules and error handling.",
    message: {
      type: "feat",
      scope: "auth",
      subject: "add user validation with email and password rules",
      body: "Introduce UserValidator class to centralize validation logic for user registration.\n\nImplements:\n- Email format validation\n- Password strength requirements\n- Custom validation error messages\n\nThis improves code reusability and ensures consistent validation across the authentication flow.",
    },
    qualityScore: 5,
    reasoning:
      "Semantic subject (mentions 'user validation' not 'add validator class'), clear scope, detailed body explaining WHAT and WHY, mentions key components (UserValidator)",
    analysis: {
      changePattern: "feature_addition",
      complexity: "moderate",
      filesChanged: 3,
      hasBody: true,
    },
  },
  {
    diffSummary:
      "Fixed timeout issue in API requests. Added retry logic and increased timeout duration for large payloads.",
    message: {
      type: "fix",
      scope: "api",
      subject: "resolve timeout errors on large request payloads",
      body: "Add retry mechanism and increase timeout duration to handle large payloads gracefully.\n\nPreviously, requests with payloads >10MB would timeout. Now implements:\n- Exponential backoff retry (3 attempts)\n- Configurable timeout per endpoint\n- Better error messages for timeout scenarios",
    },
    qualityScore: 5,
    reasoning:
      "Semantic subject (describes the problem solved), explains WHY (large payloads), mentions WHAT was implemented (retry, timeout)",
    analysis: {
      changePattern: "bug_fix",
      complexity: "moderate",
      filesChanged: 2,
      hasBody: true,
    },
  },
  {
    diffSummary:
      "Refactored UserService to extract UserRepository. Moved database queries to repository pattern.",
    message: {
      type: "refactor",
      scope: "domain",
      subject: "extract UserRepository from UserService",
      body: "Separate data access logic from business logic by introducing UserRepository.\n\nBenefits:\n- Better separation of concerns\n- Easier testing (mock repository)\n- Follows repository pattern\n\nUserService now delegates all database operations to UserRepository.",
    },
    qualityScore: 5,
    reasoning:
      "Clear transformation (extract X from Y), explains architectural benefit, mentions both components involved",
    analysis: {
      changePattern: "refactoring",
      complexity: "moderate",
      filesChanged: 4,
      hasBody: true,
    },
  },
  {
    diffSummary:
      "Added unit tests for authentication error handling. Tests cover invalid credentials, expired tokens, and network errors.",
    message: {
      type: "test",
      scope: "auth",
      subject: "add tests for authentication error scenarios",
      body: "Cover edge cases in authentication flow:\n- Invalid credentials\n- Expired tokens\n- Network failures\n\nImproves test coverage from 65% to 85% for auth module.",
    },
    qualityScore: 4,
    reasoning:
      "Semantic subject, mentions what scenarios are tested, includes coverage improvement metric",
    analysis: {
      changePattern: "test_addition",
      complexity: "simple",
      filesChanged: 2,
      hasBody: true,
    },
  },
  {
    diffSummary:
      "Updated README with installation instructions and API usage examples.",
    message: {
      type: "docs",
      subject: "add installation guide and API examples to README",
    },
    qualityScore: 4,
    reasoning:
      "Semantic subject, clear about what documentation was added, appropriate for simple docs change (no body needed)",
    analysis: {
      changePattern: "documentation",
      complexity: "simple",
      filesChanged: 1,
      hasBody: false,
    },
  },
  {
    diffSummary:
      "Optimized database query in UserRepository.findByEmail. Added index and changed query to use prepared statements.",
    message: {
      type: "perf",
      scope: "database",
      subject: "optimize user email lookup query performance",
      body: "Improve query performance by adding database index and using prepared statements.\n\nResults:\n- Query time reduced from 150ms to 15ms\n- Added index on users.email column\n- Prevents SQL injection vulnerabilities",
    },
    qualityScore: 5,
    reasoning:
      "Semantic subject, mentions specific component (UserRepository.findByEmail), includes performance metrics, explains HOW",
    analysis: {
      changePattern: "performance",
      complexity: "moderate",
      filesChanged: 2,
      hasBody: true,
    },
  },
  {
    diffSummary:
      "Added error handling middleware. Catches unhandled exceptions and returns formatted error responses.",
    message: {
      type: "feat",
      scope: "api",
      subject: "add global error handling middleware",
      body: "Implement centralized error handling to catch unhandled exceptions and return consistent error responses.\n\nFeatures:\n- Catches all unhandled errors\n- Formats errors as JSON with status codes\n- Logs errors for debugging\n- Prevents sensitive data leakage",
    },
    qualityScore: 5,
    reasoning:
      "Semantic subject (describes the feature, not implementation), detailed body with features list, explains benefits",
    analysis: {
      changePattern: "error_handling",
      complexity: "moderate",
      filesChanged: 3,
      hasBody: true,
    },
  },
  {
    diffSummary:
      "Renamed validateUser function to validateUserCredentials for clarity.",
    message: {
      type: "refactor",
      scope: "auth",
      subject: "rename validateUser to validateUserCredentials",
    },
    qualityScore: 3,
    reasoning:
      "Simple refactoring, clear rename, no body needed for simple rename",
    analysis: {
      changePattern: "refactoring",
      complexity: "simple",
      filesChanged: 1,
      hasBody: false,
    },
  },
  {
    diffSummary:
      "Added TypeScript types for API responses. Created interfaces for User, Product, and Order responses.",
    message: {
      type: "feat",
      scope: "types",
      subject: "add TypeScript interfaces for API response types",
      body: "Introduce type definitions for API responses to improve type safety.\n\nAdded interfaces:\n- UserResponse\n- ProductResponse\n- OrderResponse\n\nThis enables better IDE autocomplete and compile-time error checking.",
    },
    qualityScore: 5,
    reasoning:
      "Semantic subject, mentions specific types created, explains WHY (type safety, IDE support)",
    analysis: {
      changePattern: "type_definition",
      complexity: "simple",
      filesChanged: 1,
      hasBody: true,
    },
  },
  {
    diffSummary:
      "Fixed bug where user profile updates were not persisted. Added missing save() call.",
    message: {
      type: "fix",
      scope: "user",
      subject: "persist user profile updates correctly",
      body: "Add missing save() call after profile updates to ensure changes are persisted to database.\n\nPreviously, profile updates were lost on page refresh. Now properly saves changes.",
    },
    qualityScore: 4,
    reasoning:
      "Semantic subject (describes the fix, not implementation), explains the bug and solution",
    analysis: {
      changePattern: "bug_fix",
      complexity: "simple",
      filesChanged: 1,
      hasBody: true,
    },
  },
];

/**
 * Selects relevant examples based on current diff analysis
 * Prioritizes examples that match:
 * 1. Change pattern type
 * 2. Complexity level
 * 3. Number of files changed (similar scale)
 */
export function selectRelevantExamples(
  currentAnalysis: DiffAnalysis,
  count: number = 5,
): CommitExample[] {
  const dominantPattern = currentAnalysis.changePatterns[0];
  const complexity = currentAnalysis.complexity;
  const filesChanged = currentAnalysis.summary.filesChanged;

  // Score each example based on relevance
  const scoredExamples = COMMIT_EXAMPLES.map((example) => {
    let score = 0;

    // Pattern match (highest priority)
    if (
      dominantPattern &&
      example.analysis.changePattern === dominantPattern.type
    ) {
      score += 10;
    }

    // Complexity match
    if (example.analysis.complexity === complexity) {
      score += 5;
    }

    // File count similarity (within 2 files)
    const fileDiff = Math.abs(example.analysis.filesChanged - filesChanged);
    if (fileDiff === 0) {
      score += 3;
    } else if (fileDiff <= 2) {
      score += 1;
    }

    // Quality score bonus (prefer high-quality examples)
    score += example.qualityScore;

    return { example, score };
  });

  // Sort by score (descending) and take top N
  return scoredExamples
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.example);
}
