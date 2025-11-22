import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { OpenAIProviderAdapter } from '../OpenAIProviderAdapter.js';
import { OpenAIProvider } from '../../../ai/providers/openai.js';
import type { AIConfig } from '../../../types.js';

vi.mock('../../../ai/providers/openai.js', () => ({
  OpenAIProvider: vi.fn(),
}));

describe('OpenAIProviderAdapter', () => {
  let adapter: OpenAIProviderAdapter;
  let mockOpenAIProvider: any;
  const mockConfig: AIConfig = {
    provider: 'openai',
    openai: {
      apiKey: 'test-api-key',
      model: 'gpt-4',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockOpenAIProvider = {
      isAvailable: vi.fn(),
      generateCommitMessage: vi.fn(),
    };

    // Mock as a constructor function
    (OpenAIProvider as unknown as Mock).mockImplementation(function(this: any) {
      return mockOpenAIProvider;
    });

    adapter = new OpenAIProviderAdapter(mockConfig);
  });

  describe('getName', () => {
    it('should return provider name', () => {
      expect(adapter.getName()).toBe('OpenAI');
    });
  });

  describe('isAvailable', () => {
    it('should return true when provider is available', async () => {
      mockOpenAIProvider.isAvailable.mockResolvedValue(true);

      const result = await adapter.isAvailable();

      expect(result).toBe(true);
      expect(mockOpenAIProvider.isAvailable).toHaveBeenCalled();
    });

    it('should return false when provider is not available', async () => {
      mockOpenAIProvider.isAvailable.mockResolvedValue(false);

      const result = await adapter.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('generateCommitMessage', () => {
    it('should generate commit message successfully with confidence', async () => {
      const context = {
        diff: 'diff content',
        files: ['file1.ts', 'file2.ts'],
        branch: 'feature/test',
        recentCommits: ['commit 1', 'commit 2'],
        availableTypes: ['feat', 'fix'],
        availableScopes: ['api', 'ui'],
      };

      mockOpenAIProvider.generateCommitMessage.mockResolvedValue({
        type: 'feat',
        subject: 'add new feature',
        scope: 'api',
        body: 'This is a detailed description',
        breaking: false,
        confidence: 85,
      });

      const result = await adapter.generateCommitMessage(context);

      expect(result.message.getType().getValue()).toBe('feat');
      expect(result.message.getSubject().getValue()).toBe('add new feature');
      expect(result.message.getScope()?.getValue()).toBe('api');
      expect(result.message.getBody()).toBe('This is a detailed description');
      expect(result.confidence).toBe(85);
    });

    it('should handle commit message without scope', async () => {
      const context = {
        diff: 'diff content',
        files: ['file1.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat', 'fix'],
      };

      mockOpenAIProvider.generateCommitMessage.mockResolvedValue({
        type: 'fix',
        subject: 'fix bug',
        body: undefined,
        breaking: false,
        confidence: 90,
      });

      const result = await adapter.generateCommitMessage(context);

      expect(result.message.getType().getValue()).toBe('fix');
      expect(result.message.getSubject().getValue()).toBe('fix bug');
      const scope = result.message.getScope();
      expect(scope === undefined || scope.getValue() === undefined).toBe(true);
      expect(result.confidence).toBe(90);
    });

    it('should handle breaking changes with description', async () => {
      const context = {
        diff: 'diff content',
        files: ['api.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat', 'fix'],
      };

      mockOpenAIProvider.generateCommitMessage.mockResolvedValue({
        type: 'feat',
        subject: 'change API',
        breaking: true,
        breakingDescription: 'API signature changed completely',
        confidence: 75,
      });

      const result = await adapter.generateCommitMessage(context);

      expect(result.message.isBreaking()).toBe(true);
      expect(result.message.getBreakingChangeDescription()).toBe('API signature changed completely');
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

      mockOpenAIProvider.generateCommitMessage.mockResolvedValue({
        type: 'feat',
        subject: 'test',
        confidence: 80,
      });

      await adapter.generateCommitMessage(context);

      expect(mockOpenAIProvider.generateCommitMessage).toHaveBeenCalledWith(
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

      mockOpenAIProvider.generateCommitMessage.mockRejectedValue(
        new Error('API error')
      );

      await expect(adapter.generateCommitMessage(context)).rejects.toThrow('API error');
    });

    it('should handle rate limit errors', async () => {
      const context = {
        diff: 'diff',
        files: ['file.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat'],
      };

      mockOpenAIProvider.generateCommitMessage.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await expect(adapter.generateCommitMessage(context)).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid API key errors', async () => {
      const context = {
        diff: 'diff',
        files: ['file.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat'],
      };

      mockOpenAIProvider.generateCommitMessage.mockRejectedValue(
        new Error('Invalid API key')
      );

      await expect(adapter.generateCommitMessage(context)).rejects.toThrow('Invalid API key');
    });

    it('should handle low confidence results', async () => {
      const context = {
        diff: 'diff content',
        files: ['file1.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat', 'fix'],
      };

      mockOpenAIProvider.generateCommitMessage.mockResolvedValue({
        type: 'chore',
        subject: 'update dependencies',
        confidence: 30,
      });

      const result = await adapter.generateCommitMessage(context);

      expect(result.confidence).toBe(30);
      expect(result.message.getType().getValue()).toBe('chore');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration using isAvailable', async () => {
      mockOpenAIProvider.isAvailable.mockResolvedValue(true);

      const result = await adapter.validateConfiguration();

      expect(result).toBe(true);
      expect(mockOpenAIProvider.isAvailable).toHaveBeenCalled();
    });

    it('should return false for invalid configuration', async () => {
      mockOpenAIProvider.isAvailable.mockResolvedValue(false);

      const result = await adapter.validateConfiguration();

      expect(result).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should create provider with config', () => {
      const customConfig: AIConfig = {
        provider: 'openai',
        openai: {
          apiKey: 'custom-key',
          model: 'gpt-3.5-turbo',
        },
      };

      const customAdapter = new OpenAIProviderAdapter(customConfig);

      expect(customAdapter).toBeInstanceOf(OpenAIProviderAdapter);
      expect(OpenAIProvider).toHaveBeenCalledWith(customConfig);
    });
  });
});
