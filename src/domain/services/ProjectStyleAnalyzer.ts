/**
 * Domain interface for Project Style Analysis
 * Analyzes commit history to extract project-specific style patterns
 * Part of the Domain layer - contains no implementation details
 */

import type { IGitRepository } from "../repositories/IGitRepository.js";

/**
 * Represents the style patterns extracted from project commit history
 */
export interface ProjectStyle {
  /**
   * Most frequently used commit types (top 3)
   */
  preferredTypes: string[];

  /**
   * Average subject length in characters
   */
  avgSubjectLength: number;

  /**
   * Most commonly used scopes
   */
  commonScopes: string[];

  /**
   * Detail level preference: "detailed" if bodies are frequently used, "concise" otherwise
   */
  detailLevel: "detailed" | "concise";

  /**
   * Common subject templates/patterns found in commits
   */
  templates: string[];

  /**
   * Percentage of commits that follow conventional commit format (0-100)
   */
  conventionCompliance: number;
}

/**
 * Interface for analyzing project commit style
 */
export interface IProjectStyleAnalyzer {
  /**
   * Analyzes the project's commit history to extract style patterns
   * @param gitRepository The git repository to analyze
   * @param maxCommits Maximum number of commits to analyze (default: 100)
   * @returns Project style analysis results
   */
  analyzeProjectStyle(
    gitRepository: IGitRepository,
    maxCommits?: number,
  ): Promise<ProjectStyle>;
}
