import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MistralProviderAdapter } from '../MistralProviderAdapter.js';
import { MistralProvider } from '../../../ai/providers/mistral.js';
import type { AIConfig } from '../../../types.js';

vi.mock('../../../ai/providers/mistral.js', () => ({
  MistralProvider: vi.fn(),
}));

describe('MistralProviderAdapter', () => {
  let adapter: MistralProviderAdapter;
  let mockMistralProvider: any;
  const mockConfig: AIConfig = {
    provider: 'mistral',
    mistral: {
      apiKey: 'test-api-key',
      model: 'mistral-large-latest',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockMistralProvider = {
      isAvailable: vi.fn(),
      generateCommitMessage: vi.fn(),
    };

    // Mock as a constructor function
    (MistralProvider as unknown as Mock).mockImplementation(function(this: any) {
      return mockMistralProvider;
    });

    adapter = new MistralProviderAdapter(mockConfig);
  });

  describe('getName', () => {
    it('should return provider name', () => {
      expect(adapter.getName()).toBe('Mistral');
    });
  });

  describe('isAvailable', () => {
    it('should return true when provider is available', async () => {
      mockMistralProvider.isAvailable.mockResolvedValue(true);

      const result = await adapter.isAvailable();

      expect(result).toBe(true);
      expect(mockMistralProvider.isAvailable).toHaveBeenCalled();
    });

    it('should return false when provider is not available', async () => {
      mockMistralProvider.isAvailable.mockResolvedValue(false);

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

      mockMistralProvider.generateCommitMessage.mockResolvedValue({
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

      mockMistralProvider.generateCommitMessage.mockResolvedValue({
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

      mockMistralProvider.generateCommitMessage.mockResolvedValue({
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

      mockMistralProvider.generateCommitMessage.mockResolvedValue({
        type: 'feat',
        subject: 'test',
      });

      await adapter.generateCommitMessage(context);

      expect(mockMistralProvider.generateCommitMessage).toHaveBeenCalledWith(
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

      mockMistralProvider.generateCommitMessage.mockRejectedValue(
        new Error('API error')
      );

      await expect(adapter.generateCommitMessage(context)).rejects.toThrow('API error');
    });

    it('should handle API authentication errors', async () => {
      const context = {
        diff: 'diff',
        files: ['file.ts'],
        branch: 'main',
        recentCommits: [],
        availableTypes: ['feat'],
      };

      mockMistralProvider.generateCommitMessage.mockRejectedValue(
        new Error('Invalid API key')
      );

      await expect(adapter.generateCommitMessage(context)).rejects.toThrow('Invalid API key');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration using isAvailable', async () => {
      mockMistralProvider.isAvailable.mockResolvedValue(true);

      const result = await adapter.validateConfiguration();

      expect(result).toBe(true);
      expect(mockMistralProvider.isAvailable).toHaveBeenCalled();
    });

    it('should return false for invalid configuration', async () => {
      mockMistralProvider.isAvailable.mockResolvedValue(false);

      const result = await adapter.validateConfiguration();

      expect(result).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should create provider with config', () => {
      const customConfig: AIConfig = {
        provider: 'mistral',
        mistral: {
          apiKey: 'custom-key',
          model: 'mistral-small-latest',
        },
      };

      const customAdapter = new MistralProviderAdapter(customConfig);

      expect(customAdapter).toBeInstanceOf(MistralProviderAdapter);
      expect(MistralProvider).toHaveBeenCalledWith(customConfig);
    });
  });
});
