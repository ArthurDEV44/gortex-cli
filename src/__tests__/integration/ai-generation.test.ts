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
      expect(provider.getName()).toBe('Mistral');
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
      }).toThrow('Provider not available: API key manquante. Configurez "ai.openai.apiKey" dans .gortexrc ou définissez OPENAI_API_KEY');
    });
  });

  describe('Mock AI Provider Integration', () => {
    let mockAIProvider: IAIProvider;
    let useCase: GenerateAICommitUseCase;

    beforeEach(() => {
      // Create a comprehensive mock AI provider
      const mockCommitMessage = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('implement user authentication'),
        scope: Scope.create('auth'),
      });

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
      useCase = new GenerateAICommitUseCase(mockGitRepository);
    });

    it('should generate commit message from diff', async () => {
      const result = await useCase.execute({
        provider: mockAIProvider,
        includeScope: true,
      });

      expect(result.success).toBe(true);
      expect(result.commit).toBeDefined();
      expect(result.commit?.type).toBe('feat');
      expect(result.commit?.subject).toBe('implement user authentication');
      expect(result.commit?.scope).toBe('auth');
      expect(result.confidence).toBe(0.92);
    });

    it('should fail when AI provider is not available', async () => {
      vi.mocked(mockAIProvider.isAvailable).mockResolvedValue(false);

      const result = await useCase.execute({
        provider: mockAIProvider,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should handle AI generation errors gracefully', async () => {
      vi.mocked(mockAIProvider.generateCommitMessage).mockRejectedValue(
        new Error('AI service error')
      );

      const result = await useCase.execute({
        provider: mockAIProvider,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service error');
    });

    it('should pass context to AI provider', async () => {
      await useCase.execute({
        provider: mockAIProvider,
        includeScope: true,
      });

      expect(mockAIProvider.generateCommitMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          diff: '+function newFeature() {\n+  return true;\n+}',
          files: ['src/feature.ts'],
          branch: 'main',
          recentCommits: ['feat: previous feature', 'fix: bug fix'],
        })
      );
    });
  });

  describe('Multiple Provider Types', () => {
    it('should handle different provider types', () => {
      const providers: Array<{ type: string; name: string }> = [
        { type: 'ollama', name: 'Ollama' },
        { type: 'mistral', name: 'Mistral' },
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
      expect(mistralProvider.getName()).toBe('Mistral');
      expect(openaiProvider.getName()).toBe('OpenAI');
    });
  });

  describe('AI Provider Validation', () => {
    it('should validate provider configuration', async () => {
      const mockCommitMessage = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('test'),
        scope: Scope.empty(),
      });

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
      const mockCommitMessage = CommitMessage.create({
        type: CommitType.create('refactor'),
        subject: CommitSubject.create('improve code structure'),
        scope: Scope.create('core'),
      });

      const mockProvider: IAIProvider = {
        getName: () => 'TestAI',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockCommitMessage,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      const useCase = new GenerateAICommitUseCase(mockGitRepository);

      const result = await useCase.execute({
        provider: mockProvider,
      });

      expect(result.success).toBe(true);
      expect(mockGitRepository.getStagedChangesContext).toHaveBeenCalled();
    });
  });

  describe('Confidence Levels', () => {
    it('should handle high confidence suggestions', async () => {
      const mockMessage = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add new feature'),
        scope: Scope.empty(),
      });

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
      const useCase = new GenerateAICommitUseCase(mockGitRepository);

      const result = await useCase.execute({
        provider,
      });

      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle low confidence suggestions', async () => {
      const mockMessage = CommitMessage.create({
        type: CommitType.create('chore'),
        subject: CommitSubject.create('update dependencies'),
        scope: Scope.empty(),
      });

      const provider: IAIProvider = {
        getName: () => 'LowConfidenceAI',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockMessage,
          confidence: 0.45,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      const useCase = new GenerateAICommitUseCase(mockGitRepository);

      const result = await useCase.execute({
        provider,
      });

      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle undefined confidence', async () => {
      const mockMessage = CommitMessage.create({
        type: CommitType.create('fix'),
        subject: CommitSubject.create('resolve issue'),
        scope: Scope.empty(),
      });

      const provider: IAIProvider = {
        getName: () => 'NoConfidenceAI',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateCommitMessage: vi.fn().mockResolvedValue({
          message: mockMessage,
          confidence: undefined,
        }),
        validateConfiguration: vi.fn().mockResolvedValue(true),
      };

      const useCase = new GenerateAICommitUseCase(mockGitRepository);

      const result = await useCase.execute({
        provider,
      });

      expect(result.confidence).toBeUndefined();
    });
  });
});
