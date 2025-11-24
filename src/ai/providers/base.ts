import type { DiffAnalysis } from "../../domain/services/DiffAnalyzer.js";
import {
  AIGenerationError,
  AIProviderError,
} from "../../shared/errors/index.js";
import type { AIGeneratedCommit } from "../../types.js";

/**
 * Interface commune pour tous les providers AI
 */
export interface AIProvider {
  /**
   * Génère un message de commit basé sur les changements
   * @param diff Le diff git des changements
   * @param context Contexte additionnel (fichiers modifiés, branche, etc.)
   * @param analysis Analyse structurée du diff (optionnel mais recommandé)
   */
  generateCommitMessage(
    diff: string,
    context: CommitContext,
    analysis?: DiffAnalysis,
  ): Promise<AIGeneratedCommit>;

  /**
   * Vérifie si le provider est disponible et configuré
   */
  isAvailable(): Promise<boolean>;

  /**
   * Retourne le nom du provider
   */
  getName(): string;
}

import type { ProjectStyle } from "../../domain/services/ProjectStyleAnalyzer.js";
import type { CommitExample } from "../examples/commit-samples.js";
import type { ReasoningAnalysis } from "../prompts/commit-message.js";

export interface CommitContext {
  files: string[];
  branch: string;
  availableTypes: string[];
  availableScopes?: string[];
  recentCommits?: string[];
  reasoning?: ReasoningAnalysis; // Optional Chain-of-Thought reasoning
  fewShotExamples?: CommitExample[]; // Optional few-shot learning examples
  semanticSummary?: string; // Optional semantic summary for large diffs
  projectStyle?: ProjectStyle; // Optional project style analysis from commit history
  projectGuidelines?: string; // Optional project-specific commit guidelines
}

/**
 * @deprecated Use AIProviderError from shared/errors instead
 * Kept for backward compatibility
 */
export class ProviderNotAvailableError extends AIProviderError {
  constructor(providerName: string, reason: string) {
    super(providerName, `Provider not available: ${reason}`, reason);
  }
}

/**
 * @deprecated Use AIGenerationError from shared/errors instead
 * Kept for backward compatibility
 */
export class GenerationError extends AIGenerationError {
  constructor(providerName: string, originalError: unknown) {
    const message =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);
    super(providerName, message);
  }
}
