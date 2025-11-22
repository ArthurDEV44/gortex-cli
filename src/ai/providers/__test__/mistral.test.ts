import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MistralProvider } from '../mistral.js';
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

describe('MistralProvider', () => {
  const defaultConfig: AIConfig = {
    provider: 'mistral',
    mistral: {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.mistral.ai',
      model: 'mistral-small-latest',
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
    // Reset process.env
    delete process.env.MISTRAL_API_KEY;
  });

  describe('constructor', () => {
    it('should throw error when apiKey is missing', () => {
      const config: AIConfig = {
        provider: 'mistral',
      };

      expect(() => new MistralProvider(config)).toThrow(ProviderNotAvailableError);
    });

    it('should use apiKey from config', () => {
      const provider = new MistralProvider(defaultConfig);
      expect(provider.getName()).toBe('Mistral AI');
    });

    it('should use apiKey from environment variable', () => {
      process.env.MISTRAL_API_KEY = 'env-api-key';
      const config: AIConfig = {
        provider: 'mistral',
      };

      const provider = new MistralProvider(config);
      expect(provider.getName()).toBe('Mistral AI');
    });

    it('should prefer config apiKey over environment variable', () => {
      process.env.MISTRAL_API_KEY = 'env-api-key';
      const config: AIConfig = {
        provider: 'mistral',
        mistral: {
          apiKey: 'config-api-key',
        },
      };

      const provider = new MistralProvider(config);
      expect(provider.getName()).toBe('Mistral AI');
    });

    it('should use default values when config is minimal', () => {
      const config: AIConfig = {
        provider: 'mistral',
        mistral: {
          apiKey: 'test-key',
        },
      };

      const provider = new MistralProvider(config);
      expect(provider.getName()).toBe('Mistral AI');
    });

    it('should use custom config values', () => {
      const customConfig: AIConfig = {
        provider: 'mistral',
        mistral: {
          apiKey: 'custom-key',
          baseUrl: 'https://custom.mistral.ai',
          model: 'mistral-large-latest',
        },
        temperature: 0.5,
        maxTokens: 1000,
      };

      const provider = new MistralProvider(customConfig);
      expect(provider.getName()).toBe('Mistral AI');
    });
  });

  describe('getName', () => {
    it('should return "Mistral AI"', () => {
      const provider = new MistralProvider(defaultConfig);
      expect(provider.getName()).toBe('Mistral AI');
    });
  });

  describe('isAvailable', () => {
    it('should return true when API is available', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const provider = new MistralProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/models',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-api-key',
          },
        })
      );
    });

    it('should return false when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const provider = new MistralProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false on fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const provider = new MistralProvider(defaultConfig);
      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });

    it('should use custom baseUrl from config', async () => {
      const customConfig: AIConfig = {
        ...defaultConfig,
        mistral: {
          ...defaultConfig.mistral!,
          baseUrl: 'https://custom.mistral.ai',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const provider = new MistralProvider(customConfig);
      await provider.isAvailable();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.mistral.ai/v1/models',
        expect.any(Object)
      );
    });
  });

  describe('generateCommitMessage', () => {
    it('should throw ProviderNotAvailableError when API is not available', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const provider = new MistralProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow(ProviderNotAvailableError);
    });

    it('should generate commit message successfully', async () => {
      // Mock isAvailable
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      // Mock generateCommitMessage API call
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
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
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);
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
        'https://api.mistral.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
          body: expect.stringContaining('"model"'),
        })
      );
    });

    it('should handle response without optional fields', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'fix',
                subject: 'fix bug',
                breaking: false,
                confidence: 70,
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);
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

    it('should throw error when API returns non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const provider = new MistralProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow('Mistral API error (500): Internal server error');
    });

    it('should throw error when choices array is empty', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow('Aucune réponse de Mistral AI');
    });

    it('should throw error when choices is missing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow('Aucune réponse de Mistral AI');
    });

    it('should throw GenerationError when validation fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'invalid-type', // Type non valide
                subject: 'test',
                breaking: false,
                confidence: 50,
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow(GenerationError);
    });

    it('should throw GenerationError when subject is missing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'feat',
                // subject manquant
                breaking: false,
                confidence: 50,
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);

      await expect(
        provider.generateCommitMessage('diff content', defaultContext)
      ).rejects.toThrow(GenerationError);
    });

    it('should handle breaking changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
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
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(result.breaking).toBe(true);
      expect(result.breakingDescription).toBe('API signature changed');
    });

    it('should use custom temperature and maxTokens from config', async () => {
      const customConfig: AIConfig = {
        ...defaultConfig,
        temperature: 0.7,
        maxTokens: 1000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'feat',
                subject: 'test',
                breaking: false,
                confidence: 50,
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(customConfig);
      await provider.generateCommitMessage('diff content', defaultContext);

      const lastCall = (global.fetch as any).mock.calls.find(
        (call: any[]) => call[0] === 'https://api.mistral.ai/v1/chat/completions'
      );
      const requestBody = JSON.parse(lastCall[1].body);

      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.max_tokens).toBe(1000);
    });

    it('should use default confidence when not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'feat',
                subject: 'test',
                breaking: false,
                // confidence manquant
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(result.confidence).toBe(50);
    });

    it('should use custom model from config', async () => {
      const customConfig: AIConfig = {
        ...defaultConfig,
        mistral: {
          ...defaultConfig.mistral!,
          model: 'mistral-large-latest',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-large-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'feat',
                subject: 'test',
                breaking: false,
                confidence: 50,
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(customConfig);
      await provider.generateCommitMessage('diff content', defaultContext);

      const lastCall = (global.fetch as any).mock.calls.find(
        (call: any[]) => call[0] === 'https://api.mistral.ai/v1/chat/completions'
      );
      const requestBody = JSON.parse(lastCall[1].body);

      expect(requestBody.model).toBe('mistral-large-latest');
    });

    it('should use parseAIResponse for parsing', async () => {
      vi.mocked(commitMessageModule.parseAIResponse).mockReturnValueOnce({
        type: 'feat',
        subject: 'parsed subject',
        breaking: false,
        confidence: 50,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Some text content',
            },
            finish_reason: 'stop',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider(defaultConfig);
      const result = await provider.generateCommitMessage('diff content', defaultContext);

      expect(commitMessageModule.parseAIResponse).toHaveBeenCalledWith('Some text content');
      expect(result.subject).toBe('parsed subject');
    });
  });
});

