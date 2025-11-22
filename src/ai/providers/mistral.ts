import type { DiffAnalysis } from "../../domain/services/DiffAnalyzer.js";
import type { AIConfig, AIGeneratedCommit } from "../../types.js";
import {
  generateSystemPrompt,
  generateUserPrompt,
  parseAIResponse,
} from "../prompts/commit-message.js";
import { BaseAIProvider } from "./BaseAIProvider.js";
import type { CommitContext } from "./base.js";
import { GenerationError, ProviderNotAvailableError } from "./base.js";

interface MistralMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

/**
 * Provider pour Mistral AI API
 */
export class MistralProvider extends BaseAIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIConfig) {
    const apiKey = config.mistral?.apiKey || process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      throw new ProviderNotAvailableError(
        "Mistral",
        'API key manquante. Configurez "ai.mistral.apiKey" dans .gortexrc ou définissez MISTRAL_API_KEY',
      );
    }

    super();
    this.apiKey = apiKey;
    this.baseUrl = config.mistral?.baseUrl || "https://api.mistral.ai";
    this.model = config.mistral?.model || "mistral-small-latest";
    this.temperature = config.temperature ?? 0.3;
    this.maxTokens = config.maxTokens ?? 500;
  }

  getName(): string {
    return "Mistral AI";
  }

  /**
   * Vérifie si l'API Mistral est accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test simple avec un petit message
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Génère un message de commit avec Mistral AI
   */
  async generateCommitMessage(
    diff: string,
    context: CommitContext,
    analysis?: DiffAnalysis,
  ): Promise<AIGeneratedCommit> {
    // Vérifie la disponibilité
    const available = await this.isAvailable();
    if (!available) {
      throw new ProviderNotAvailableError(
        "Mistral AI",
        "API Mistral non accessible. Vérifiez votre clé API et votre connexion internet.",
      );
    }

    try {
      // Construit la requête avec l'analyse du diff
      const request: MistralRequest = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: generateSystemPrompt(context.availableTypes),
          },
          {
            role: "user",
            content: generateUserPrompt(diff, context, analysis),
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      };

      // Appel à l'API Mistral
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as MistralResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error("Aucune réponse de Mistral AI");
      }

      // Parse la réponse
      const parsed = parseAIResponse(data.choices[0].message.content);

      // Validation avec vérification stricte du type
      this.validateResponse(parsed, context.availableTypes);

      return {
        type: parsed.type,
        scope: parsed.scope || undefined,
        subject: parsed.subject,
        body: parsed.body || undefined,
        breaking: parsed.breaking || false,
        breakingDescription: parsed.breakingDescription || undefined,
        confidence: parsed.confidence || 50,
        reasoning: parsed.reasoning || undefined,
      };
    } catch (error) {
      if (error instanceof ProviderNotAvailableError) {
        throw error;
      }
      throw new GenerationError("Mistral AI", error);
    }
  }
}
