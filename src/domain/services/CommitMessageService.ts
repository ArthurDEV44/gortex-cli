/**
 * Domain Service for commit message operations
 * Contains pure business logic with no infrastructure dependencies
 */

import {
  CommitMessage,
  type CommitMessageProps,
} from "../entities/CommitMessage.js";
import { CommitSubject } from "../value-objects/CommitSubject.js";
import { CommitType } from "../value-objects/CommitType.js";
import { Scope } from "../value-objects/Scope.js";

export interface ParsedCommit {
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
}

/**
 * Creates a CommitMessage from AI-generated data
 * Validates and converts raw data into domain entities
 */
export function createFromAIGenerated(data: {
  type: string;
  subject: string;
  scope?: string;
  body?: string;
  breaking?: boolean;
  breakingChangeDescription?: string;
}): CommitMessage {
  const props: CommitMessageProps = {
    type: CommitType.create(data.type),
    subject: CommitSubject.create(data.subject),
    scope: data.scope ? Scope.create(data.scope) : undefined,
    body: data.body,
    breaking: data.breaking,
    breakingChangeDescription: data.breakingChangeDescription,
  };

  return CommitMessage.create(props);
}

/**
 * Creates a CommitMessage from user input
 */
export function createFromUserInput(
  type: string,
  subject: string,
  scope?: string,
  body?: string,
  breaking?: boolean,
  breakingChangeDescription?: string,
): CommitMessage {
  const props: CommitMessageProps = {
    type: CommitType.create(type),
    subject: CommitSubject.create(subject),
    scope: scope ? Scope.create(scope) : undefined,
    body,
    breaking,
    breakingChangeDescription,
  };

  return CommitMessage.create(props);
}

/**
 * Parses a conventional commit message string
 * Returns null if the message is not a valid conventional commit
 */
export function parseConventionalCommit(message: string): ParsedCommit | null {
  // Regex to match conventional commit format
  const regex = /^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/;
  const match = message.trim().match(regex);

  if (!match) {
    return null;
  }

  const [, type, scope, breaking, subject] = match;

  // Validate minimum subject length
  if (subject.trim().length < 3) {
    return null;
  }

  return {
    type,
    scope: scope || undefined,
    breaking: breaking === "!",
    subject: subject.trim(),
  };
}

/**
 * Validates if a commit message follows conventional commits
 */
export function isConventional(message: string): boolean {
  return parseConventionalCommit(message) !== null;
}

/**
 * Analyzes commit statistics from a history of messages
 */
export function analyzeCommitStats(messages: string[]): {
  total: number;
  conventional: number;
  nonConventional: number;
  percentage: number;
  typeBreakdown: Record<string, number>;
} {
  const total = messages.length;
  let conventional = 0;
  const typeBreakdown: Record<string, number> = {};

  for (const message of messages) {
    const parsed = parseConventionalCommit(message);
    if (parsed) {
      conventional++;
      typeBreakdown[parsed.type] = (typeBreakdown[parsed.type] || 0) + 1;
    }
  }

  return {
    total,
    conventional,
    nonConventional: total - conventional,
    percentage: total > 0 ? Math.round((conventional / total) * 100) : 0,
    typeBreakdown,
  };
}

/**
 * @deprecated Use individual exported functions instead
 * @see {createFromAIGenerated}, {createFromUserInput}, {parseConventionalCommit}, {isConventional}, {analyzeCommitStats}
 */
export const CommitMessageService = {
  createFromAIGenerated,
  createFromUserInput,
  parseConventionalCommit,
  isConventional,
  analyzeCommitStats,
};
