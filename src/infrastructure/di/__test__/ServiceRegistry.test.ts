import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DIContainer } from '../DIContainer.js';
import { ServiceRegistry, ServiceIdentifiers } from '../ServiceRegistry.js';
import { IGitRepository } from '../../../domain/repositories/IGitRepository.js';
import { IAIProvider } from '../../../domain/repositories/IAIProvider.js';
import { CreateCommitUseCase } from '../../../application/use-cases/CreateCommitUseCase.js';

// Mock the factories
vi.mock('../factories/AIProviderFactory.js', () => ({
  AIProviderFactory: {
    create: vi.fn((type) => ({
      getName: () => type,
      isAvailable: vi.fn().mockResolvedValue(true),
    })),
    findFirstAvailable: vi.fn().mockResolvedValue({
      getName: () => 'ollama',
      isAvailable: vi.fn().mockResolvedValue(true),
    }),
  },
}));

vi.mock('../factories/RepositoryFactory.js', () => ({
  RepositoryFactory: {
    createGitRepository: vi.fn((workingDir) => ({
      workingDirectory: workingDir,
      isRepository: vi.fn().mockResolvedValue(true),
    })),
  },
}));

describe('ServiceRegistry', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
    vi.clearAllMocks();
  });

  describe('registerServices', () => {
    it('should register all services', () => {
      ServiceRegistry.registerServices(container);

      expect(container.isRegistered(ServiceIdentifiers.GitRepository)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.CreateCommitUseCase)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.GenerateAICommitUseCase)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.GetRepositoryStatusUseCase)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.AnalyzeCommitHistoryUseCase)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.StageFilesUseCase)).toBe(true);
    });

    it('should register configuration when provided', () => {
      const workingDir = '/test/path';
      const aiConfig = {
        provider: 'ollama' as const,
        temperature: 0.5,
        maxTokens: 1000,
      };

      ServiceRegistry.registerServices(container, {
        workingDirectory: workingDir,
        aiConfig,
      });

      expect(container.isRegistered(ServiceIdentifiers.WorkingDirectory)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.AIConfig)).toBe(true);

      expect(container.resolve(ServiceIdentifiers.WorkingDirectory)).toBe(workingDir);
      expect(container.resolve(ServiceIdentifiers.AIConfig)).toBe(aiConfig);
    });

    it('should use provided git repository instance', () => {
      const mockRepo: Partial<IGitRepository> = {
        isRepository: vi.fn().mockResolvedValue(true),
      };

      ServiceRegistry.registerServices(container, {
        gitRepository: mockRepo as IGitRepository,
      });

      const resolved = container.resolve<IGitRepository>(ServiceIdentifiers.GitRepository);
      expect(resolved).toBe(mockRepo);
    });

    it('should use provided AI provider instance', () => {
      const mockProvider: Partial<IAIProvider> = {
        getName: () => 'test-provider',
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      ServiceRegistry.registerServices(container, {
        aiProvider: mockProvider as IAIProvider,
      });

      const resolved = container.resolve<IAIProvider>(ServiceIdentifiers.AIProvider);
      expect(resolved).toBe(mockProvider);
    });
  });

  describe('createContainer', () => {
    it('should create a fully configured container', () => {
      const newContainer = ServiceRegistry.createContainer();

      expect(newContainer).toBeInstanceOf(DIContainer);
      expect(newContainer.isRegistered(ServiceIdentifiers.GitRepository)).toBe(true);
      expect(newContainer.isRegistered(ServiceIdentifiers.CreateCommitUseCase)).toBe(true);
    });

    it('should create container with options', () => {
      const workingDir = '/custom/path';
      const newContainer = ServiceRegistry.createContainer({
        workingDirectory: workingDir,
      });

      expect(newContainer.resolve(ServiceIdentifiers.WorkingDirectory)).toBe(workingDir);
    });
  });

  describe('Use Case Resolution', () => {
    beforeEach(() => {
      ServiceRegistry.registerServices(container);
    });

    it('should resolve CreateCommitUseCase with dependencies', () => {
      const useCase = container.resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase,
      );

      expect(useCase).toBeInstanceOf(CreateCommitUseCase);
    });

    it('should create new instance for transient use cases', () => {
      const useCase1 = container.resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase,
      );
      const useCase2 = container.resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase,
      );

      expect(useCase1).not.toBe(useCase2);
    });

    it('should share singleton repository across use cases', () => {
      const useCase1 = container.resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase,
      );
      const useCase2 = container.resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase,
      );

      // Both should use the same repository instance (singleton)
      const repo1 = container.resolve<IGitRepository>(ServiceIdentifiers.GitRepository);
      const repo2 = container.resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

      expect(repo1).toBe(repo2);
    });
  });

  describe('ServiceIdentifiers', () => {
    it('should have unique identifier for each service', () => {
      const identifiers = Object.values(ServiceIdentifiers);
      const uniqueIdentifiers = new Set(identifiers);

      expect(uniqueIdentifiers.size).toBe(identifiers.length);
    });

    it('should use string identifiers', () => {
      Object.values(ServiceIdentifiers).forEach(id => {
        expect(typeof id).toBe('string');
      });
    });
  });
});
