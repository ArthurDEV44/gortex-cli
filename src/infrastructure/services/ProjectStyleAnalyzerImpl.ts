/**
 * Implementation of Project Style Analyzer
 * Analyzes commit history to extract project-specific style patterns
 */

import { CommitMessageMapper } from "../../application/mappers/CommitMessageMapper.js";
import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import type {
  IProjectStyleAnalyzer,
  ProjectStyle,
} from "../../domain/services/ProjectStyleAnalyzer.js";
import {
  isConventionalCommit,
  parseConventionalCommit,
} from "../../utils/validate.js";

interface ParsedCommit {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  isConventional: boolean;
}

/**
 * Implementation of ProjectStyleAnalyzer
 */
export class ProjectStyleAnalyzerImpl implements IProjectStyleAnalyzer {
  /**
   * Analyzes the project's commit history to extract style patterns
   */
  async analyzeProjectStyle(
    gitRepository: IGitRepository,
    maxCommits = 100,
  ): Promise<ProjectStyle> {
    // Get commit history
    const commits = await gitRepository.getCommitHistory(maxCommits);

    if (commits.length === 0) {
      // Return default style if no commits found
      return {
        preferredTypes: ["feat", "fix", "chore"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 0,
      };
    }

    // Parse all commits
    const parsedCommits = commits.map((commit) =>
      this.parseCommit(commit.message),
    );

    // Analyze patterns
    const typeDistribution = this.analyzeTypeDistribution(parsedCommits);
    const avgSubjectLength = this.calculateAvgSubjectLength(parsedCommits);
    const scopeUsagePatterns = this.analyzeScopePatterns(parsedCommits);
    const bodyUsageFrequency = this.analyzeBodyUsage(parsedCommits);
    const conventionCompliance = this.checkConventionalCommits(parsedCommits);
    const subjectTemplates = this.extractCommonTemplates(parsedCommits);
    const detailLevel = bodyUsageFrequency > 0.5 ? "detailed" : "concise";

    return {
      preferredTypes: typeDistribution.slice(0, 3),
      avgSubjectLength,
      commonScopes: scopeUsagePatterns,
      detailLevel,
      templates: subjectTemplates,
      conventionCompliance,
    };
  }

  /**
   * Parses a commit message into structured components
   */
  private parseCommit(message: string): ParsedCommit {
    const isConventional = isConventionalCommit(message);
    const parsed = parseConventionalCommit(message);

    if (parsed) {
      // Try to extract body using CommitMessageMapper
      let body: string | undefined;
      try {
        const dto = CommitMessageMapper.fromFormattedString(message);
        body = dto.body;
      } catch {
        // If parsing fails, try simple extraction
        const lines = message.split("\n");
        if (lines.length > 1) {
          const restOfMessage = lines.slice(1).join("\n").trim();
          // Remove BREAKING CHANGE section if present
          const bodyPart = restOfMessage.split("BREAKING CHANGE:")[0].trim();
          body = bodyPart || undefined;
        }
      }

      return {
        type: parsed.type,
        scope: parsed.scope,
        subject: parsed.subject,
        body,
        isConventional,
      };
    }

    // Non-conventional commit - extract first line as subject
    const firstLine = message.split("\n")[0] || "";
    return {
      type: "chore",
      scope: undefined,
      subject: firstLine.trim() || "commit",
      body: undefined,
      isConventional: false,
    };
  }

  /**
   * Analyzes the distribution of commit types
   */
  private analyzeTypeDistribution(commits: ParsedCommit[]): string[] {
    const typeCounts: Record<string, number> = {};

    for (const commit of commits) {
      typeCounts[commit.type] = (typeCounts[commit.type] || 0) + 1;
    }

    // Sort by frequency (descending)
    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);
  }

  /**
   * Calculates the average subject length
   */
  private calculateAvgSubjectLength(commits: ParsedCommit[]): number {
    if (commits.length === 0) {
      return 50; // Default
    }

    const totalLength = commits.reduce(
      (sum, commit) => sum + commit.subject.length,
      0,
    );
    return Math.round(totalLength / commits.length);
  }

  /**
   * Analyzes scope usage patterns
   */
  private analyzeScopePatterns(commits: ParsedCommit[]): string[] {
    const scopeCounts: Record<string, number> = {};

    for (const commit of commits) {
      if (commit.scope) {
        scopeCounts[commit.scope] = (scopeCounts[commit.scope] || 0) + 1;
      }
    }

    // Sort by frequency (descending) and return top 5
    return Object.entries(scopeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([scope]) => scope);
  }

  /**
   * Analyzes body usage frequency
   */
  private analyzeBodyUsage(commits: ParsedCommit[]): number {
    if (commits.length === 0) {
      return 0;
    }

    const commitsWithBody = commits.filter(
      (commit) => commit.body && commit.body.trim().length > 0,
    ).length;

    return commitsWithBody / commits.length;
  }

  /**
   * Checks conventional commit compliance
   */
  private checkConventionalCommits(commits: ParsedCommit[]): number {
    if (commits.length === 0) {
      return 0;
    }

    const conventionalCount = commits.filter(
      (commit) => commit.isConventional,
    ).length;

    return Math.round((conventionalCount / commits.length) * 100);
  }

  /**
   * Extracts common subject templates/patterns
   */
  private extractCommonTemplates(commits: ParsedCommit[]): string[] {
    const patterns: string[] = [];

    for (const commit of commits) {
      if (!commit.isConventional) {
        continue;
      }

      const tokens = commit.subject.split(" ");
      if (tokens.length < 2) {
        continue;
      }

      // Create a pattern: first word + "X" for remaining words
      // Example: "add new feature" -> "add X"
      // Example: "fix bug" -> "fix bug"
      const pattern =
        tokens.length > 2 ? `${tokens[0]} X` : `${tokens[0]} ${tokens[1]}`;
      patterns.push(pattern);
    }

    // Group by frequency
    const patternCounts: Record<string, number> = {};
    for (const pattern of patterns) {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }

    // Sort by frequency (descending) and return top 5
    return Object.entries(patternCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }
}
