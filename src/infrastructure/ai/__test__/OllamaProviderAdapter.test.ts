import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { OllamaProviderAdapter } from '../OllamaProviderAdapter.js';
import { OllamaProvider } from '../../../ai/providers/ollama.js';
import type { AIConfig } from '../../../types.js';

vi.mock('../../../ai/providers/ollama.js', () => ({
  OllamaProvider: vi.fn(),
}));

describe('OllamaProviderAdapter', () => {
  let adapter: OllamaProviderAdapter;
  let mockOllamaProvider: any;
  const mockConfig: AIConfig = {
    provider: 'ollama',
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockOllamaProvider = {
      isAvailable: vi.fn(),
      generateCommitMessage: vi.fn(),
    };

    // Mock as a constructor function
    (OllamaProvider as unknown as Mock).mockImplementation(function(this: any) {
      return mockOllamaProvider;
    });

    adapter = new OllamaProviderAdapter(mockConfig);
  });

  describe('getName', () => {
    it('should return provider name', () => {
      expect(adapter.getName()).toBe('Ollama');
    });
  });

  describe('isAvailable', () => {
    it('should return true when provider is available', async () => {
      mockOllamaProvider.isAvailable.mockResolvedValue(true);

      const result = await adapter.isAvailable();

      expect(result).toBe(true);
      expect(mockOllamaProvider.isAvailable).toHaveBeenCalled();
    });

    it('should return false when provider is not available', async () => {
      mockOllamaProvider.isAvailable.mockResolvedValue(false);

      const result = await adapter.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('generateCommitMessage', () => {
    it('should generate commit message successfully', async () => {
      const context = {
        diff: 'diff content',
        files: ['file1.ts', 'file2.ts'],
        branch: 'feature/test',
        recentCommits: ['commit 1', 'commit 2'],
        availableTypes: ['feat', 'fix'],
        availableScopes: ['api', 'ui'],
      };

      mockOllamaProvider.generateCommitMessage.mockResolvedValue({
        type: 'feat',
        subject: 'add new feature',
        scope: 'api',
        body: 'This is a detailed description',
        breaking: false,
      });

      const result = await adapter.generateCommitMessage(context);

      expect(result.message.getType().getValue()).toBe('feat');
      expect(result.message.getSubject().getValue()).toBe('add new feature');
      expect(result.message.getScope()?.getValue()).toBe('api');
      expect(result.message.getBody()).toBe('This is a detailed description');
      expect(result.confidence).toBeUndefined();
    });

    it('should handle commit message without scope', async () => {
      const context = {
        diff: 'diff content',
        files: ['file1.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat', 'fix'],
      };

      mockOllamaProvider.generateCommitMessage.mockResolvedValue({
        type: 'fix',
        subject: 'fix bug',
        body: undefined,
        breaking: false,
      });

      const result = await adapter.generateCommitMessage(context);

      expect(result.message.getType().getValue()).toBe('fix');
      expect(result.message.getSubject().getValue()).toBe('fix bug');
      const scope = result.message.getScope();
      expect(scope === undefined || scope.getValue() === undefined).toBe(true);
    });

    it('should handle breaking changes', async () => {
      const context = {
        diff: 'diff content',
        files: ['api.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat', 'fix'],
      };

      mockOllamaProvider.generateCommitMessage.mockResolvedValue({
        type: 'feat',
        subject: 'change API',
        breaking: true,
        breakingDescription: 'API signature changed',
      });

      const result = await adapter.generateCommitMessage(context);

      expect(result.message.isBreaking()).toBe(true);
    });

    it('should convert context correctly', async () => {
      const context = {
        diff: 'test diff',
        files: ['a.ts', 'b.ts'],
        branch: 'develop',
        recentCommits: ['recent 1'],
        availableTypes: ['feat'],
        availableScopes: ['core'],
      };

      mockOllamaProvider.generateCommitMessage.mockResolvedValue({
        type: 'feat',
        subject: 'test',
      });

      await adapter.generateCommitMessage(context);

      expect(mockOllamaProvider.generateCommitMessage).toHaveBeenCalledWith(
        'test diff',
        {
          files: ['a.ts', 'b.ts'],
          branch: 'develop',
          recentCommits: ['recent 1'],
          availableTypes: ['feat'],
          availableScopes: ['core'],
        },
        undefined // analysis parameter (optional)
      );
    });

    it('should handle provider errors', async () => {
      const context = {
        diff: 'diff',
        files: ['file.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat'],
      };

      mockOllamaProvider.generateCommitMessage.mockRejectedValue(
        new Error('API error')
      );

      await expect(adapter.generateCommitMessage(context)).rejects.toThrow('API error');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration using isAvailable', async () => {
      mockOllamaProvider.isAvailable.mockResolvedValue(true);

      const result = await adapter.validateConfiguration();

      expect(result).toBe(true);
      expect(mockOllamaProvider.isAvailable).toHaveBeenCalled();
    });

    it('should return false for invalid configuration', async () => {
      mockOllamaProvider.isAvailable.mockResolvedValue(false);

      const result = await adapter.validateConfiguration();

      expect(result).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should create provider with config', () => {
      const customConfig: AIConfig = {
        provider: 'ollama',
        ollama: {
          baseUrl: 'http://custom:11434',
          model: 'custom-model',
        },
      };

      const customAdapter = new OllamaProviderAdapter(customConfig);

      expect(customAdapter).toBeInstanceOf(OllamaProviderAdapter);
      expect(OllamaProvider).toHaveBeenCalledWith(customConfig);
    });
  });
});
