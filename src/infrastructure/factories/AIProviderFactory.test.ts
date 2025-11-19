import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIProviderFactory } from './AIProviderFactory.js';
import { OllamaProviderAdapter } from '../ai/OllamaProviderAdapter.js';
import { MistralProviderAdapter } from '../ai/MistralProviderAdapter.js';
import { OpenAIProviderAdapter } from '../ai/OpenAIProviderAdapter.js';

// Mock the provider adapters
vi.mock('../ai/OllamaProviderAdapter.js', () => ({
  OllamaProviderAdapter: vi.fn().mockImplementation(function (this: any) {
    this.getName = () => 'Ollama';
    this.isAvailable = vi.fn().mockResolvedValue(true);
    return this;
  }),
}));

vi.mock('../ai/MistralProviderAdapter.js', () => ({
  MistralProviderAdapter: vi.fn().mockImplementation(function (this: any) {
    this.getName = () => 'Mistral';
    this.isAvailable = vi.fn().mockResolvedValue(true);
    return this;
  }),
}));

vi.mock('../ai/OpenAIProviderAdapter.js', () => ({
  OpenAIProviderAdapter: vi.fn().mockImplementation(function (this: any) {
    this.getName = () => 'OpenAI';
    this.isAvailable = vi.fn().mockResolvedValue(true);
    return this;
  }),
}));

describe('AIProviderFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mocks to default implementations
    vi.mocked(OllamaProviderAdapter).mockImplementation(function (this: any) {
      this.getName = () => 'Ollama';
      this.isAvailable = vi.fn().mockResolvedValue(true);
      return this;
    });

    vi.mocked(MistralProviderAdapter).mockImplementation(function (this: any) {
      this.getName = () => 'Mistral';
      this.isAvailable = vi.fn().mockResolvedValue(true);
      return this;
    });

    vi.mocked(OpenAIProviderAdapter).mockImplementation(function (this: any) {
      this.getName = () => 'OpenAI';
      this.isAvailable = vi.fn().mockResolvedValue(true);
      return this;
    });
  });

  describe('create', () => {
    it('should create Ollama provider', () => {
      const provider = AIProviderFactory.create('ollama');

      expect(provider).toBeInstanceOf(OllamaProviderAdapter);
      expect(OllamaProviderAdapter).toHaveBeenCalledWith();
    });

    it('should create Mistral provider', () => {
      const provider = AIProviderFactory.create('mistral');

      expect(provider).toBeInstanceOf(MistralProviderAdapter);
      expect(MistralProviderAdapter).toHaveBeenCalledWith();
    });

    it('should create OpenAI provider with config', () => {
      const config = {
        provider: 'openai' as const,
        openai: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const provider = AIProviderFactory.create('openai', config);

      expect(provider).toBeInstanceOf(OpenAIProviderAdapter);
      expect(OpenAIProviderAdapter).toHaveBeenCalledWith(config);
    });

    it('should throw error for OpenAI without config', () => {
      expect(() => AIProviderFactory.create('openai')).toThrow(
        'OpenAI provider requires configuration with API key',
      );
    });

    it('should throw error for unsupported provider', () => {
      expect(() => AIProviderFactory.create('invalid' as any)).toThrow(
        'Unsupported AI provider type: invalid',
      );
    });

    it('should be case insensitive', () => {
      const provider = AIProviderFactory.create('OLLAMA' as any);
      expect(provider).toBeInstanceOf(OllamaProviderAdapter);
    });
  });

  describe('createIfAvailable', () => {
    it('should return provider if available', async () => {
      const provider = await AIProviderFactory.createIfAvailable('ollama');

      expect(provider).not.toBeNull();
      expect(provider).toBeInstanceOf(OllamaProviderAdapter);
    });

    it('should return null if provider not available', async () => {
      vi.mocked(OllamaProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Ollama';
        this.isAvailable = vi.fn().mockResolvedValue(false);
        return this;
      });

      const provider = await AIProviderFactory.createIfAvailable('ollama');

      expect(provider).toBeNull();
    });

    it('should return null if provider creation throws', async () => {
      vi.mocked(OpenAIProviderAdapter).mockImplementationOnce(() => {
        throw new Error('No API key');
      });

      const provider = await AIProviderFactory.createIfAvailable('openai');

      expect(provider).toBeNull();
    });
  });

  describe('getSupportedProviders', () => {
    it('should return all supported provider types', () => {
      const providers = AIProviderFactory.getSupportedProviders();

      expect(providers).toEqual(['ollama', 'mistral', 'openai']);
      expect(providers).toHaveLength(3);
    });
  });

  describe('findFirstAvailable', () => {
    it('should return first available provider', async () => {
      vi.mocked(OllamaProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Ollama';
        this.isAvailable = vi.fn().mockResolvedValue(false);
        return this;
      });

      vi.mocked(MistralProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Mistral';
        this.isAvailable = vi.fn().mockResolvedValue(true);
        return this;
      });

      const provider = await AIProviderFactory.findFirstAvailable([
        'ollama',
        'mistral',
      ]);

      expect(provider).not.toBeNull();
      expect(provider).toBeInstanceOf(MistralProviderAdapter);
    });

    it('should return null if no providers available', async () => {
      vi.mocked(OllamaProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Ollama';
        this.isAvailable = vi.fn().mockResolvedValue(false);
        return this;
      });

      vi.mocked(MistralProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Mistral';
        this.isAvailable = vi.fn().mockResolvedValue(false);
        return this;
      });

      const provider = await AIProviderFactory.findFirstAvailable([
        'ollama',
        'mistral',
      ]);

      expect(provider).toBeNull();
    });

    it('should check providers in order of preference', async () => {
      const checkOrder: string[] = [];

      vi.mocked(OllamaProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Ollama';
        this.isAvailable = vi.fn().mockImplementation(async () => {
          checkOrder.push('ollama');
          return false;
        });
        return this;
      });

      vi.mocked(MistralProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Mistral';
        this.isAvailable = vi.fn().mockImplementation(async () => {
          checkOrder.push('mistral');
          return false;
        });
        return this;
      });

      await AIProviderFactory.findFirstAvailable(['ollama', 'mistral']);

      expect(checkOrder).toEqual(['ollama', 'mistral']);
    });

    it('should stop checking after finding available provider', async () => {
      const mockOllamaIsAvailable = vi.fn().mockResolvedValue(true);
      const mockMistralIsAvailable = vi.fn().mockResolvedValue(true);

      vi.mocked(OllamaProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Ollama';
        this.isAvailable = mockOllamaIsAvailable;
        return this;
      });

      vi.mocked(MistralProviderAdapter).mockImplementationOnce(function (this: any) {
        this.getName = () => 'Mistral';
        this.isAvailable = mockMistralIsAvailable;
        return this;
      });

      const provider = await AIProviderFactory.findFirstAvailable([
        'ollama',
        'mistral',
      ]);

      expect(provider).toBeInstanceOf(OllamaProviderAdapter);
      expect(mockOllamaIsAvailable).toHaveBeenCalled();
      expect(mockMistralIsAvailable).not.toHaveBeenCalled();
    });
  });
});
