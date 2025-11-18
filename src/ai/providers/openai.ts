import type { AIGeneratedCommit, AIConfig } from '../../types.js';
import type { AIProvider, CommitContext } from './base.js';
import {
  ProviderNotAvailableError,
  GenerationError,
} from './base.js';
import {
  generateSystemPrompt,
  generateUserPrompt,
  parseAIResponse,
} from '../prompts/commit-message.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
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
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: AIConfig) {
    const apiKey = config.openai?.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ProviderNotAvailableError(
        'OpenAI',
        'API key manquante. Configurez "ai.openai.apiKey" dans .gortexrc ou définissez OPENAI_API_KEY',
      );
    }

    this.apiKey = apiKey;
    this.baseUrl =
      config.openai?.baseUrl || 'https://api.openai.com';
    this.model = config.openai?.model || 'gpt-4o-mini';
    this.temperature = config.temperature ?? 0.3;
    this.maxTokens = config.maxTokens ?? 500;
  }

  getName(): string {
    return 'OpenAI';
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
    } catch (error) {
      return false;
    }
  }

  /**
   * Génère un message de commit avec OpenAI
   */
  async generateCommitMessage(
    diff: string,
    context: CommitContext,
  ): Promise<AIGeneratedCommit> {
    // Vérifie la disponibilité
    const available = await this.isAvailable();
    if (!available) {
      throw new ProviderNotAvailableError(
        'OpenAI',
        'API OpenAI non accessible. Vérifiez votre clé API et votre connexion internet.',
      );
    }

    try {
      // Construit la requête
      const request: OpenAIRequest = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: generateSystemPrompt(context.availableTypes),
          },
          {
            role: 'user',
            content: generateUserPrompt(diff, context),
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      };

      // Appel à l'API OpenAI
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI API error (${response.status}): ${errorText}`,
        );
      }

      const data = (await response.json()) as OpenAIResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('Aucune réponse de OpenAI');
      }

      // Parse la réponse
      const parsed = parseAIResponse(data.choices[0].message.content);

      // Validation basique
      this.validateResponse(parsed);

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
      throw new GenerationError('OpenAI', error);
    }
  }

  /**
   * Valide la réponse de l'AI
   */
  private validateResponse(response: any): void {
    if (!response.type || typeof response.type !== 'string') {
      throw new Error('Réponse invalide: "type" manquant ou invalide');
    }

    if (!response.subject || typeof response.subject !== 'string') {
      throw new Error('Réponse invalide: "subject" manquant ou invalide');
    }

    if (response.subject.length > 100) {
      throw new Error('Réponse invalide: "subject" trop long (>100 chars)');
    }
  }
}
