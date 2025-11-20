/**
 * Repository interface for AI Provider operations
 * Defines the contract for AI-powered commit message generation
 * Part of the Domain layer - contains no implementation details
 */

import type { CommitMessage } from "../entities/CommitMessage.js";

export interface AIGenerationContext {
  diff: string;
  files: string[];
  branch: string;
  recentCommits?: string[];
  availableTypes: string[];
  availableScopes?: string[];
}

export interface AIGenerationResult {
  message: CommitMessage;
  confidence?: number;
  reasoning?: string;
}

/**
 * AI Provider interface
 * All AI-related operations go through this interface
 */
export interface IAIProvider {
  /**
   * Gets the name of this AI provider
   */
  getName(): string;

  /**
   * Checks if this provider is available and configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Generates a commit message based on the given context
   * @throws Error if generation fails or provider is not available
   */
  generateCommitMessage(
    context: AIGenerationContext,
  ): Promise<AIGenerationResult>;

  /**
   * Validates provider configuration
   * @returns true if configuration is valid, false otherwise
   */
  validateConfiguration(): Promise<boolean>;
}
