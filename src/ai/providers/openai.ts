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

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface OpenAIResponse {
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
 * Provider pour OpenAI API
 */
export class OpenAIProvider extends BaseAIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIConfig) {
    super();
    const apiKey = config.openai?.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ProviderNotAvailableError(
        "OpenAI",
        'API key manquante. Configurez "ai.openai.apiKey" dans .gortexrc ou définissez OPENAI_API_KEY',
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = config.openai?.baseUrl || "https://api.openai.com";
    this.model = config.openai?.model || "gpt-4o-mini";
    this.temperature = config.temperature ?? 0.5;
    this.topP = config.topP ?? 0.9;
    this.maxTokens = config.maxTokens ?? 500;
  }

  getName(): string {
    return "OpenAI";
  }

  /**
   * Vérifie si l'API OpenAI est accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test simple avec l'endpoint models
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
   * Génère un message de commit avec OpenAI
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
        "OpenAI",
        "API OpenAI non accessible. Vérifiez votre clé API et votre connexion internet.",
      );
    }

    try {
      // Construit la requête avec l'analyse du diff
      const request: OpenAIRequest = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: generateSystemPrompt(context.availableTypes),
          },
          {
            role: "user",
            content: generateUserPrompt(
              diff,
              context,
              analysis,
              context.reasoning,
              context.fewShotExamples,
              context.semanticSummary,
              context.projectStyle,
              context.projectGuidelines,
            ),
          },
        ],
        temperature: this.temperature,
        top_p: this.topP,
        max_tokens: this.maxTokens,
      };

      // Appel à l'API OpenAI
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
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OpenAIResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error("Aucune réponse de OpenAI");
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
      throw new GenerationError("OpenAI", error);
    }
  }

  /**
   * Generates text from custom prompts (for Chain-of-Thought and other patterns)
   */
  async generateText(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      format?: "json" | "text";
    },
  ): Promise<string> {
    const available = await this.isAvailable();
    if (!available) {
      throw new ProviderNotAvailableError(
        "OpenAI",
        "API OpenAI non accessible. Vérifiez votre clé API et votre connexion internet.",
      );
    }

    try {
      const request: OpenAIRequest = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: options?.temperature ?? this.temperature,
        top_p: this.topP,
        max_tokens: options?.maxTokens ?? this.maxTokens,
      };

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
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OpenAIResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error("Aucune réponse de OpenAI");
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof ProviderNotAvailableError) {
        throw error;
      }
      throw new GenerationError("OpenAI", error);
    }
  }
}
