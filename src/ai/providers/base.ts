import type { AIGeneratedCommit } from '../../types.js';

/**
 * Interface commune pour tous les providers AI
 */
export interface AIProvider {
  /**
   * Génère un message de commit basé sur les changements
   * @param diff Le diff git des changements
   * @param context Contexte additionnel (fichiers modifiés, branche, etc.)
   */
  generateCommitMessage(
    diff: string,
    context: CommitContext,
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

export interface CommitContext {
  files: string[];
  branch: string;
  availableTypes: string[];
  availableScopes?: string[];
  recentCommits?: string[];
}

/**
 * Erreur lancée quand un provider n'est pas disponible
 */
export class ProviderNotAvailableError extends Error {
  constructor(
    providerName: string,
    reason: string,
  ) {
    super(`Provider ${providerName} n'est pas disponible: ${reason}`);
    this.name = 'ProviderNotAvailableError';
  }
}

/**
 * Erreur lancée lors de la génération
 */
export class GenerationError extends Error {
  constructor(
    providerName: string,
    originalError: unknown,
  ) {
    const message =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);
    super(`Erreur lors de la génération avec ${providerName}: ${message}`);
    this.name = 'GenerationError';
  }
}
