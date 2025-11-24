/**
 * Repository interface for AI Provider operations
 * Defines the contract for AI-powered commit message generation
 * Part of the Domain layer - contains no implementation details
 */

import type { CommitExample } from "../../ai/examples/commit-samples.js";
import type { CommitMessage } from "../entities/CommitMessage.js";
import type { DiffAnalysis } from "../services/DiffAnalyzer.js";

export interface ReasoningContext {
  architecturalContext: string;
  changeIntention: string;
  changeNature: string;
  keySymbols?: string[]; // Optionnel car l'AI peut ne pas toujours le retourner
  suggestedType: string;
}

import type { ProjectStyle } from "../services/ProjectStyleAnalyzer.js";

export interface AIGenerationContext {
  diff: string;
  files: string[];
  branch: string;
  recentCommits?: string[];
  availableTypes: string[];
  availableScopes?: string[];
  analysis?: DiffAnalysis; // Optional structured analysis of the diff
  reasoning?: ReasoningContext; // Optional Chain-of-Thought reasoning analysis
  fewShotExamples?: CommitExample[]; // Optional few-shot learning examples
  semanticSummary?: string; // Optional semantic summary for large diffs
  projectStyle?: ProjectStyle; // Optional project style analysis from commit history
  projectGuidelines?: string; // Optional project-specific commit guidelines
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
   * Generates text from a custom prompt (for Chain-of-Thought and other advanced patterns)
   * @param systemPrompt The system prompt/instructions
   * @param userPrompt The user prompt/question
   * @param options Optional generation parameters
   * @returns The generated text response
   * @throws Error if generation fails or provider is not available
   */
  generateText(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      format?: "json" | "text";
    },
  ): Promise<string>;

  /**
   * Validates provider configuration
   * @returns true if configuration is valid, false otherwise
   */
  validateConfiguration(): Promise<boolean>;
}
