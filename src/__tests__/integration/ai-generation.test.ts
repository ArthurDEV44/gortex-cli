/**
 * Integration Test: AI Commit Message Generation
 * Tests AI providers and their integration with the DI system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DIContainer } from '../../infrastructure/di/DIContainer.js';
import { ServiceIdentifiers } from '../../infrastructure/di/ServiceRegistry.js';
import { AIProviderFactory } from '../../infrastructure/factories/AIProviderFactory.js';
import type { IAIProvider, AIGenerationContext } from '../../domain/repositories/IAIProvider.js';
import { GenerateAICommitUseCase } from '../../application/use-cases/GenerateAICommitUseCase.js';
import type { IGitRepository } from '../../domain/repositories/IGitRepository.js';
import { CommitMessage } from '../../domain/entities/CommitMessage.js';
import { CommitType } from '../../domain/value-objects/CommitType.js';
import { CommitSubject } from '../../domain/value-objects/CommitSubject.js';
import { Scope } from '../../domain/value-objects/Scope.js';

describe('Integration: AI Commit Message Generation', () => {
  let container: DIContainer;
  let mockGitRepository: IGitRepository;

  beforeEach(() => {
    container = new DIContainer();

    // Mock Git repository
    mockGitRepository = {
      isRepository: vi.fn().mockResolvedValue(true),
      getStagedChangesContext: vi.fn().mockResolvedValue({
        diff: '+function newFeature() {\n+  return true;\n+}',
        files: ['src/feature.ts'],
        branch: 'main',
        recentCommits: ['feat: previous feature', 'fix: bug fix'],
      }),
    } as any;

    container.registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
  });

  describe('AI Provider Factory', () => {
    it('should get supported providers list', () => {
      const providers = AIProviderFactory.getSupportedProviders();

      expect(providers).toContain('ollama');
      expect(providers).toContain('mistral');
      expect(providers).toContain('openai');
      expect(providers).toHaveLength(3);
    });

    it('should create Ollama provider', () => {
      const provider = AIProviderFactory.create('ollama', {});

      expect(provider).toBeDefined();
      expect(provider.getName()).toBe('Ollama');
    });

    it('should create Mistral provider with config', () => {
      const provider = AIProviderFactory.create('mistral', {
        mistral: { apiKey: 'test-key' },
      });

      expect(provider).toBeDefined();
      expect(provider.getName()).toBe('Mistral AI');
    });

    it('should create OpenAI provider with config', () => {
      const provider = AIProviderFactory.create('openai', {
        openai: { apiKey: 'test-key' },
      });

      expect(provider).toBeDefined();
      expect(provider.getName()).toBe('OpenAI');
    });

    it('should throw for unsupported provider', () => {
      expect(() => {
        AIProviderFactory.create('unsupported' as any, {});
      }).toThrow('Unsupported AI provider');
    });

    it('should throw for OpenAI without API key', () => {
      expect(() => {
        AIProviderFactory.create('openai', {});
      }).toThrow('OpenAI API key is required');
    });
  });

  describe('Mock AI Provider Integration', () => {
    let mockAIProvider: IAIProvider;
    let useCase: GenerateAICommitUseCase;

    beforeEach(() => {
      // Create a comprehensive mock AI provider
      const mockCommitMessage = new CommitMessage(
        CommitType.create('feat'),
        CommitSubject.create('implement user authentication'),
        Scope.create('auth')
      );

      mockAIProvider = {
        getName: vi.fn().mockReturnValue('MockAI'),
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockCommitMessage,
          confidence: 0.92,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      container.registerInstance(ServiceIdentifiers.AIProvider, mockAIProvider);
      useCase = new GenerateAICommitUseCase(mockGitRepository, mockAIProvider);
    });

    it('should generate commit message from diff', async () => {
      const result = await useCase.execute({
        diff: '+function auth() {}',
        context: {
          files: ['src/auth.ts'],
          branch: 'feature/auth',
          recentCommits: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message?.type).toBe('feat');
      expect(result.message?.subject).toBe('implement user authentication');
      expect(result.message?.scope?.toString()).toBe('auth');
      expect(result.confidence).toBe(0.92);
    });

    it('should fail when AI provider is not available', async () => {
      vi.mocked(mockAIProvider.isAvailable).mockResolvedValue(false);

      const result = await useCase.execute({
        diff: 'test diff',
        context: {
          files: ['test.ts'],
          branch: 'main',
          recentCommits: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should handle AI generation errors gracefully', async () => {
      vi.mocked(mockAIProvider.generateCommitMessage).mockRejectedValue(
        new Error('AI service error')
      );

      const result = await useCase.execute({
        diff: 'test diff',
        context: {
          files: ['test.ts'],
          branch: 'main',
          recentCommits: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service error');
    });

    it('should pass context to AI provider', async () => {
      const context: AIGenerationContext = {
        diff: '+new code',
        files: ['src/file1.ts', 'src/file2.ts'],
        branch: 'feature/new',
        recentCommits: ['feat: add feature', 'fix: bug'],
        availableTypes: ['feat', 'fix', 'docs'],
        availableScopes: ['api', 'ui', 'core'],
      };

      await useCase.execute({
        diff: context.diff,
        context,
      });

      expect(mockAIProvider.generateCommitMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          diff: '+new code',
          files: ['src/file1.ts', 'src/file2.ts'],
          branch: 'feature/new',
          recentCommits: ['feat: add feature', 'fix: bug'],
        })
      );
    });
  });

  describe('Multiple Provider Types', () => {
    it('should handle different provider types', () => {
      const providers: Array<{ type: string; name: string }> = [
        { type: 'ollama', name: 'Ollama' },
        { type: 'mistral', name: 'Mistral AI' },
        { type: 'openai', name: 'OpenAI' },
      ];

      for (const { type, name } of providers) {
        const config = type === 'ollama' ? {} : { [type]: { apiKey: 'test-key' } };

        const provider = AIProviderFactory.create(type as any, config);
        expect(provider.getName()).toBe(name);
      }
    });

    it('should create providers with different configurations', () => {
      const ollamaProvider = AIProviderFactory.create('ollama', {
        ollama: {
          baseUrl: 'http://localhost:11434',
          model: 'custom-model',
        },
      });

      const mistralProvider = AIProviderFactory.create('mistral', {
        mistral: {
          apiKey: 'test-mistral-key',
          model: 'mistral-large',
        },
      });

      const openaiProvider = AIProviderFactory.create('openai', {
        openai: {
          apiKey: 'test-openai-key',
          model: 'gpt-4',
        },
      });

      expect(ollamaProvider.getName()).toBe('Ollama');
      expect(mistralProvider.getName()).toBe('Mistral AI');
      expect(openaiProvider.getName()).toBe('OpenAI');
    });
  });

  describe('AI Provider Validation', () => {
    it('should validate provider configuration', async () => {
      const mockCommitMessage = new CommitMessage(
        CommitType.create('feat'),
        CommitSubject.create('test'),
        Scope.empty()
      );

      const provider: IAIProvider = {
        getName: () => 'TestProvider',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockCommitMessage,
          confidence: 0.8,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      const isValid = await provider.validateConfiguration();
      expect(isValid).toBe(true);
    });

    it('should detect invalid configuration', async () => {
      const provider: IAIProvider = {
        getName: () => 'TestProvider',
        isAvailable: vi.fn().mockResolvedValue(false),
        generateCommitMessage: vi.fn(),
        validateConfiguration: vi.fn().mockResolvedValue(false),
      };

      const isValid = await provider.validateConfiguration();
      expect(isValid).toBe(false);
    });
  });

  describe('AI with Git Repository Integration', () => {
    it('should use staged changes from repository', async () => {
      const mockCommitMessage = new CommitMessage(
        CommitType.create('refactor'),
        CommitSubject.create('improve code structure'),
        Scope.create('core')
      );

      const mockProvider: IAIProvider = {
        getName: () => 'TestAI',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockCommitMessage,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      const useCase = new GenerateAICommitUseCase(mockGitRepository, mockProvider);

      const result = await useCase.execute({
        diff: '', // Will use git repository
        context: {
          files: [],
          branch: '',
          recentCommits: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockGitRepository.getStagedChangesContext).toHaveBeenCalled();
    });
  });

  describe('Confidence Levels', () => {
    it('should handle high confidence suggestions', async () => {
      const mockMessage = new CommitMessage(
        CommitType.create('feat'),
        CommitSubject.create('add new feature'),
        Scope.empty()
      );

      const provider: IAIProvider = {
        getName: () => 'HighConfidenceAI',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockMessage,
          confidence: 0.98,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      container.registerInstance(ServiceIdentifiers.AIProvider, provider);
      const useCase = new GenerateAICommitUseCase(mockGitRepository, provider);

      const result = await useCase.execute({
        diff: 'test',
        context: { files: [], branch: 'main', recentCommits: [] },
      });

      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle low confidence suggestions', async () => {
      const mockMessage = new CommitMessage(
        CommitType.create('chore'),
        CommitSubject.create('update dependencies'),
        Scope.empty()
      );

      const provider: IAIProvider = {
        getName: () => 'LowConfidenceAI',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockMessage,
          confidence: 0.45,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      const useCase = new GenerateAICommitUseCase(mockGitRepository, provider);

      const result = await useCase.execute({
        diff: 'ambiguous changes',
        context: { files: [], branch: 'main', recentCommits: [] },
      });

      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle undefined confidence', async () => {
      const mockMessage = new CommitMessage(
        CommitType.create('fix'),
        CommitSubject.create('resolve issue'),
        Scope.empty()
      );

      const provider: IAIProvider = {
        getName: () => 'NoConfidenceAI',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockMessage,
          confidence: undefined,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      const useCase = new GenerateAICommitUseCase(mockGitRepository, provider);

      const result = await useCase.execute({
        diff: 'test',
        context: { files: [], branch: 'main', recentCommits: [] },
      });

      expect(result.confidence).toBeUndefined();
    });
  });
});
