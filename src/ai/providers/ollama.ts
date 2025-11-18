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

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
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
export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;
  private timeout: number;
  private temperature: number;
  private maxTokens: number;

  constructor(config: AIConfig) {
    this.baseUrl = config.ollama?.baseUrl || 'http://localhost:11434';
    this.model = config.ollama?.model || 'mistral:7b';
    this.timeout = config.ollama?.timeout || 30000;
    this.temperature = config.temperature ?? 0.3;
    this.maxTokens = config.maxTokens ?? 500;
  }

  getName(): string {
    return 'Ollama';
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

      const data = (await response.json()) as { models?: any[] };

      // Vérifie si le modèle est disponible
      if (data.models) {
        const modelExists = data.models.some((m: any) =>
          m.name.includes(this.model.split(':')[0]),
        );
        return modelExists;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Génère un message de commit avec Ollama
   */
  async generateCommitMessage(
    diff: string,
    context: CommitContext,
  ): Promise<AIGeneratedCommit> {
    // Vérifie la disponibilité
    const available = await this.isAvailable();
    if (!available) {
      throw new ProviderNotAvailableError(
        'Ollama',
        `Serveur Ollama non accessible à ${this.baseUrl} ou modèle ${this.model} non trouvé. Lancez 'ollama pull ${this.model}' pour l'installer.`,
      );
    }

    try {
      // Construit la requête
      const request: OllamaRequest = {
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
        stream: false,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      };

      // Appel à l'API Ollama
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Ollama API error (${response.status}): ${errorText}`,
        );
      }

      const data = (await response.json()) as OllamaResponse;

      // Parse la réponse
      const parsed = parseAIResponse(data.message.content);

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
      throw new GenerationError('Ollama', error);
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
