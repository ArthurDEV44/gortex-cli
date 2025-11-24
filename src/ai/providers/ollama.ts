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

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
  format?: "json" | object; // 'json' for basic JSON mode, or JSON Schema object for structured outputs
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  model: string;
}

/**
 * Provider pour Ollama (LLM local)
 */
export class OllamaProvider extends BaseAIProvider {
  private baseUrl: string;
  private timeout: number;

  constructor(config: AIConfig) {
    super();
    this.baseUrl = config.ollama?.baseUrl || "http://localhost:11434";
    this.model = config.ollama?.model || "magistral:24b";
    this.timeout = config.ollama?.timeout || 30000;
    this.temperature = config.temperature ?? 0.5;
    this.topP = config.topP ?? 0.9;
    this.maxTokens = config.maxTokens ?? 500;
  }

  getName(): string {
    return "Ollama";
  }

  /**
   * Vérifie si Ollama est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };

      // Vérifie si le modèle est disponible
      if (data.models) {
        const modelExists = data.models.some((m) =>
          m.name.includes(this.model.split(":")[0]),
        );
        return modelExists;
      }

      return false;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Génère un message de commit avec Ollama
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
        "Ollama",
        `Serveur Ollama non accessible à ${this.baseUrl} ou modèle ${this.model} non trouvé. Lancez 'ollama pull ${this.model}' pour l'installer.`,
      );
    }

    try {
      // Définit le JSON Schema pour la structure de réponse attendue
      const jsonSchema = {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: context.availableTypes,
            description: `The commit type - MUST be exactly one of: ${context.availableTypes.join(", ")}. NO variations like "refactoring" (use "refactor"), "feature" (use "feat"), etc.`,
          },
          scope: {
            type: "string",
            description: "The optional scope of the commit",
          },
          subject: {
            type: "string",
            description:
              "The commit subject (imperative, max 50 chars, MUST start with lowercase letter)",
          },
          body: {
            type: "string",
            description:
              "Detailed description explaining WHY this change was made and WHAT it introduces architecturally. Include if the change is complex (multiple files, new system, refactoring). Explain benefits and impacts.",
          },
          breaking: {
            type: "boolean",
            description: "Whether this is a breaking change",
          },
          breakingDescription: {
            type: "string",
            description: "Description of the breaking change if applicable",
          },
          confidence: {
            type: "integer",
            description:
              "Confidence level (0-100). IMPORTANT: Use 70-90 for clear changes, 50-69 for uncertain ones. NEVER use 0.",
            minimum: 50,
            maximum: 100,
          },
          reasoning: {
            type: "string",
            description: "Explanation of the choices made",
          },
        },
        required: ["type", "subject", "breaking", "confidence"],
      };

      // Construit la requête avec l'analyse du diff, le raisonnement CoT, les exemples few-shot, le résumé sémantique, le style du projet et les guidelines
      const userPrompt = generateUserPrompt(
        diff,
        context,
        analysis,
        context.reasoning,
        context.fewShotExamples,
        context.semanticSummary,
        context.projectStyle,
        context.projectGuidelines,
      );

      const request: OllamaRequest = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: generateSystemPrompt(context.availableTypes),
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        stream: false,
        format: jsonSchema, // Utilise JSON Schema pour forcer la structure
        options: {
          temperature: this.temperature,
          top_p: this.topP,
          num_predict: this.maxTokens,
        },
      };

      // Appel à l'API Ollama
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OllamaResponse;

      // Avec JSON Schema, la réponse devrait déjà être structurée
      // Essaie d'abord de parser directement le contenu
      let parsed: AIGeneratedCommit;

      try {
        // Si le contenu est déjà un objet JSON (grâce au schema)
        parsed = JSON.parse(data.message.content) as AIGeneratedCommit;
      } catch (_parseError) {
        // Fallback sur notre parsing robuste si nécessaire
        parsed = parseAIResponse(data.message.content);
      }

      // Validation avec vérification stricte du type
      try {
        this.validateResponse(parsed, context.availableTypes);
      } catch (validationError) {
        throw new Error(
          `${validationError instanceof Error ? validationError.message : String(validationError)}\n\nRéponse AI reçue: ${JSON.stringify(parsed, null, 2)}`,
        );
      }

      // Ensure subject starts with lowercase (safety measure)
      let subject = parsed.subject;
      if (subject && subject.length > 0) {
        subject = subject.charAt(0).toLowerCase() + subject.slice(1);
      }

      return {
        type: parsed.type,
        scope: parsed.scope || undefined,
        subject: subject,
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
      throw new GenerationError("Ollama", error);
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
        "Ollama",
        `Serveur Ollama non accessible à ${this.baseUrl} ou modèle ${this.model} non trouvé.`,
      );
    }

    try {
      const request: OllamaRequest = {
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
        stream: false,
        format: options?.format === "json" ? "json" : undefined,
        options: {
          temperature: options?.temperature ?? this.temperature,
          top_p: this.topP,
          num_predict: options?.maxTokens ?? this.maxTokens,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OllamaResponse;
      return data.message.content;
    } catch (error) {
      if (error instanceof ProviderNotAvailableError) {
        throw error;
      }
      throw new GenerationError("Ollama", error);
    }
  }
}
