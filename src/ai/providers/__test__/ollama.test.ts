import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaProvider } from '../ollama.js';
import type { AIConfig } from '../../../types.js';
import type { CommitContext } from '../base.js';
import { ProviderNotAvailableError, GenerationError } from '../base.js';
import * as commitMessageModule from '../../prompts/commit-message.js';

// Mock fetch global
global.fetch = vi.fn();

// Mock des fonctions de prompt
vi.mock('../../prompts/commit-message.js', () => ({
  generateSystemPrompt: vi.fn((types: string[]) => `System prompt for types: ${types.join(', ')}`),
  generateUserPrompt: vi.fn((diff: string, context: CommitContext) => `User prompt with diff: ${diff}`),
  parseAIResponse: vi.fn((text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return { type: 'feat', subject: 'default', breaking: false, confidence: 50 };
    }
  }),
}));

describe('OllamaProvider', () => {
  const defaultConfig: AIConfig = {
    provider: 'ollama',
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'devstral:24b',
    },
    temperature: 0.3,
    maxTokens: 500,
  };

  const defaultContext: CommitContext = {
    files: ['test.ts'],
    branch: 'main',
    availableTypes: ['feat', 'fix', 'docs'],
    availableScopes: ['api', 'ui'],
    recentCommits: ['feat: previous commit'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should use default values when config is minimal', () => {
      const provider = new OllamaProvider({ provider: 'ollama' });
      expect(provider.getName()).toBe('Ollama');
    });

    it('should use custom config values', () => {
      const customConfig: AIConfig = {
        provider: 'ollama',
        ollama: {
          baseUrl: 'http://custom:11434',
          model: 'llama3',
          timeout: 60000,
        },
        temperature: 0.5,
        maxTokens: 1000,
      };

      const provider = new OllamaProvider(customConfig);
      expect(provider.getName()).toBe('Ollama');
    });
  });

  describe('getName', () => {
    it('should return "Ollama"', () => {
      const provider = new OllamaProvider(defaultConfig);
      expect(provider.getName()).toBe('Ollama');
    });
  });

  describe('isAvailable', () => {
    it('should return true when Ollama is available and model exists', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'devstral:24b' },
            { name: 'llama3:8b' },
          ],
        }),
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('should return false when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when model is not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3:8b' },
          ],
        }),
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when models array is empty', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [],
        }),
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when models property is missing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false on fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should handle timeout', async () => {
      // Simuler un AbortError (ce qui se passe lors d'un timeout)
      (global.fetch as any).mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should match model by prefix (before colon)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'devstral:24b-instruct' }, // Différent tag mais même modèle
          ],
        }),
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(true);
    });
  });

  describe('generateCommitMessage', () => {
    it('should throw ProviderNotAvailableError when Ollama is not available', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const provider = new OllamaProvider(defaultConfig);
      
      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow(ProviderNotAvailableError);
    });

    it('should generate commit message successfully with JSON Schema response', async () => {
      // Mock isAvailable
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      // Mock generateCommitMessage API call
      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            scope: 'api',
            subject: 'add new feature',
            body: 'Detailed description',
            breaking: false,
            confidence: 85,
            reasoning: 'Added new functionality',
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(result).toEqual({
        type: 'feat',
        scope: 'api',
        subject: 'add new feature',
        body: 'Detailed description',
        breaking: false,
        breakingDescription: undefined,
        confidence: 85,
        reasoning: 'Added new functionality',
      });

      // Vérifier que l'API a été appelée avec le bon format
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"format"'),
        })
      );
    });

    it('should handle response without optional fields', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'fix',
            subject: 'fix bug',
            breaking: false,
            confidence: 70,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(result).toEqual({
        type: 'fix',
        scope: undefined,
        subject: 'fix bug',
        body: undefined,
        breaking: false,
        breakingDescription: undefined,
        confidence: 70,
        reasoning: undefined,
      });
    });

    it('should convert subject to lowercase if it starts with uppercase', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            subject: 'Add new feature', // Commence par majuscule
            breaking: false,
            confidence: 80,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(result.subject).toBe('add new feature');
    });

    it('should use parseAIResponse fallback when JSON.parse fails', async () => {
      vi.mocked(commitMessageModule.parseAIResponse).mockReturnValueOnce({
        type: 'feat',
        subject: 'fallback subject',
        breaking: false,
        confidence: 50,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: 'Invalid JSON content', // Pas un JSON valide
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(commitMessageModule.parseAIResponse).toHaveBeenCalledWith('Invalid JSON content');
      expect(result.subject).toBe('fallback subject');
    });

    it('should throw error when API returns non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const provider = new OllamaProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow('Ollama API error (500): Internal server error');
    });

    it('should throw GenerationError when validation fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'invalid-type', // Type non valide
            subject: 'test',
            breaking: false,
            confidence: 50,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow(GenerationError);
    });

    it('should throw GenerationError when subject is missing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            // subject manquant
            breaking: false,
            confidence: 50,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow(GenerationError);
    });

    it('should handle timeout during generation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      // Simuler un AbortError (ce qui se passe lors d'un timeout)
      (global.fetch as any).mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      const provider = new OllamaProvider(defaultConfig);
      
      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow();
    });

    it('should handle breaking changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            subject: 'change API',
            breaking: true,
            breakingDescription: 'API signature changed',
            confidence: 90,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(result.breaking).toBe(true);
      expect(result.breakingDescription).toBe('API signature changed');
    });

    it('should use custom timeout from config', async () => {
      const customConfig: AIConfig = {
        ...defaultConfig,
        ollama: {
          ...defaultConfig.ollama!,
          timeout: 60000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            subject: 'test',
            breaking: false,
            confidence: 50,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(customConfig);
      await provider.generateCommitMessage('diff content', defaultContext);

      // Vérifier que le timeout est utilisé (via AbortSignal)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should use custom temperature and maxTokens from config', async () => {
      const customConfig: AIConfig = {
        ...defaultConfig,
        temperature: 0.7,
        maxTokens: 1000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            subject: 'test',
            breaking: false,
            confidence: 50,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(customConfig);
      await provider.generateCommitMessage('diff content', defaultContext);

      const lastCall = (global.fetch as any).mock.calls.find(
        (call: any[]) => call[0] === 'http://localhost:11434/api/chat'
      );
      const requestBody = JSON.parse(lastCall[1].body);

      expect(requestBody.options.temperature).toBe(0.7);
      expect(requestBody.options.num_predict).toBe(1000);
    });

    it('should throw error when subject is empty', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            subject: '', // Sujet vide - invalide
            breaking: false,
            confidence: 50,
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);
      
      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow(GenerationError);
    });

    it('should use default confidence when not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'devstral:24b' }],
        }),
      });

      const mockResponse = {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'feat',
            subject: 'test',
            breaking: false,
            // confidence manquant
          }),
        },
        done: true,
        model: 'devstral:24b',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OllamaProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(result.confidence).toBe(50);
    });
  });
});

