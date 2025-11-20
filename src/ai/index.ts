import type { AIConfig, AIGeneratedCommit, CommitConfig } from "../types.js";
import type { AIProvider, CommitContext } from "./providers/base.js";
import { ProviderNotAvailableError } from "./providers/base.js";
import { MistralProvider } from "./providers/mistral.js";
import { OllamaProvider } from "./providers/ollama.js";
import { OpenAIProvider } from "./providers/openai.js";

/**
 * Factory pour créer le bon provider
 */
export function createAIProvider(config: AIConfig): AIProvider {
  const provider = config.provider || "ollama";

  switch (provider) {
    case "ollama":
      return new OllamaProvider(config);

    case "mistral":
      return new MistralProvider(config);

    case "openai":
      return new OpenAIProvider(config);

    case "disabled":
      throw new ProviderNotAvailableError(
        "disabled",
        "AI désactivé dans la configuration",
      );

    default:
      throw new Error(`Provider inconnu: ${provider}`);
  }
}

/**
 * Service principal pour générer des commits avec AI
 */
export class AICommitService {
  private provider: AIProvider;
  private config: CommitConfig;

  constructor(config: CommitConfig) {
    if (!config.ai?.enabled) {
      throw new Error("AI non activé dans la configuration");
    }

    this.config = config;
    this.provider = createAIProvider(config.ai);
  }

  /**
   * Génère un message de commit basé sur le diff
   */
  async generateCommitMessage(
    diff: string,
    context: Omit<CommitContext, "availableTypes" | "availableScopes">,
  ): Promise<AIGeneratedCommit> {
    const availableTypes = (this.config.types || []).map((t) => t.value);
    const availableScopes = this.config.scopes || [];

    const fullContext: CommitContext = {
      ...context,
      availableTypes,
      availableScopes,
    };

    return this.provider.generateCommitMessage(diff, fullContext);
  }

  /**
   * Vérifie si le provider est disponible
   */
  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  /**
   * Retourne le nom du provider utilisé
   */
  getProviderName(): string {
    return this.provider.getName();
  }
}

// Export des providers pour usage direct si nécessaire
export { OllamaProvider, MistralProvider, OpenAIProvider };
export { analyzeStagedChanges } from "./analyzer.js";
export type { AIProvider, CommitContext } from "./providers/base.js";
