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

/**
 * Validates a ProjectStyle object to ensure it conforms to the interface contract
 * @param style The ProjectStyle object to validate
 * @returns true if valid, false otherwise
 */
export function isValidProjectStyle(style: unknown): style is ProjectStyle {
  if (!style || typeof style !== "object") {
    return false;
  }

  const s = style as Record<string, unknown>;

  // Check required properties
  if (!Array.isArray(s.preferredTypes)) {
    return false;
  }
  if (
    typeof s.avgSubjectLength !== "number" ||
    !Number.isFinite(s.avgSubjectLength)
  ) {
    return false;
  }
  if (!Array.isArray(s.commonScopes)) {
    return false;
  }
  if (s.detailLevel !== "detailed" && s.detailLevel !== "concise") {
    return false;
  }
  if (!Array.isArray(s.templates)) {
    return false;
  }
  if (
    typeof s.conventionCompliance !== "number" ||
    !Number.isFinite(s.conventionCompliance) ||
    s.conventionCompliance < 0 ||
    s.conventionCompliance > 100
  ) {
    return false;
  }

  // Validate array contents
  if (!s.preferredTypes.every((item: unknown) => typeof item === "string")) {
    return false;
  }
  if (!s.commonScopes.every((item: unknown) => typeof item === "string")) {
    return false;
  }
  if (!s.templates.every((item: unknown) => typeof item === "string")) {
    return false;
  }

  return true;
}

/**
 * Creates a default ProjectStyle object
 * @returns A default ProjectStyle with safe default values
 */
export function createDefaultProjectStyle(): ProjectStyle {
  return {
    preferredTypes: ["feat", "fix", "chore"],
    avgSubjectLength: 50,
    commonScopes: [],
    detailLevel: "concise",
    templates: [],
    conventionCompliance: 0,
  };
}
