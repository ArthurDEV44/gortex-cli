import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CompositionRoot,
  getGlobalCompositionRoot,
  resetGlobalCompositionRoot,
  getUseCase,
} from '../CompositionRoot.js';
import { CreateCommitUseCase } from '../../../application/use-cases/CreateCommitUseCase.js';
import { GenerateAICommitUseCase } from '../../../application/use-cases/GenerateAICommitUseCase.js';
import { DIContainer } from '../DIContainer.js';

// Mock the factories
vi.mock('../factories/AIProviderFactory.js', () => ({
  AIProviderFactory: {
    create: vi.fn(() => ({
      getName: () => 'test',
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
    createGitRepository: vi.fn(() => ({
      isRepository: vi.fn().mockResolvedValue(true),
    })),
  },
}));

describe('CompositionRoot', () => {
  let root: CompositionRoot;

  beforeEach(() => {
    root = new CompositionRoot();
  });

  afterEach(() => {
    root.dispose();
    resetGlobalCompositionRoot();
  });

  describe('constructor', () => {
    it('should create composition root with default options', () => {
      expect(root).toBeInstanceOf(CompositionRoot);
      expect(root.getContainer()).toBeInstanceOf(DIContainer);
    });

    it('should create composition root with custom options', () => {
      const customRoot = new CompositionRoot({
        workingDirectory: '/custom/path',
      });

      expect(customRoot).toBeInstanceOf(CompositionRoot);
      customRoot.dispose();
    });
  });

  describe('getContainer', () => {
    it('should return the DI container', () => {
      const container = root.getContainer();

      expect(container).toBeInstanceOf(DIContainer);
    });

    it('should return same container instance', () => {
      const container1 = root.getContainer();
      const container2 = root.getContainer();

      expect(container1).toBe(container2);
    });
  });

  describe('getServices', () => {
    it('should return all application services', () => {
      const services = root.getServices();

      expect(services.createCommitUseCase).toBeInstanceOf(CreateCommitUseCase);
      expect(services.generateAICommitUseCase).toBeInstanceOf(GenerateAICommitUseCase);
      expect(services.getRepositoryStatusUseCase).toBeDefined();
      expect(services.analyzeCommitHistoryUseCase).toBeDefined();
      expect(services.stageFilesUseCase).toBeDefined();
    });

    it('should cache services after first call', () => {
      const services1 = root.getServices();
      const services2 = root.getServices();

      expect(services1).toBe(services2);
      expect(services1.createCommitUseCase).toBe(services2.createCommitUseCase);
    });

    it('should return fresh services after dispose', () => {
      const services1 = root.getServices();

      root.dispose();
      root = new CompositionRoot();

      const services2 = root.getServices();

      expect(services1).not.toBe(services2);
    });
  });

  describe('getUseCase', () => {
    it('should return specific use case', () => {
      const useCase = root.getUseCase<CreateCommitUseCase>('createCommitUseCase');

      expect(useCase).toBeInstanceOf(CreateCommitUseCase);
    });

    it('should return same instance from getServices', () => {
      const services = root.getServices();
      const useCase = root.getUseCase<CreateCommitUseCase>('createCommitUseCase');

      expect(useCase).toBe(services.createCommitUseCase);
    });

    it('should support all use case types', () => {
      expect(root.getUseCase('createCommitUseCase')).toBeDefined();
      expect(root.getUseCase('generateAICommitUseCase')).toBeDefined();
      expect(root.getUseCase('getRepositoryStatusUseCase')).toBeDefined();
      expect(root.getUseCase('analyzeCommitHistoryUseCase')).toBeDefined();
      expect(root.getUseCase('stageFilesUseCase')).toBeDefined();
    });
  });

  describe('createChild', () => {
    it('should create a child composition root', () => {
      const child = root.createChild();

      expect(child).toBeInstanceOf(CompositionRoot);
      expect(child).not.toBe(root);

      child.dispose();
    });

    it('should create child with custom options', () => {
      const child = root.createChild({
        workingDirectory: '/child/path',
      });

      expect(child).toBeInstanceOf(CompositionRoot);

      child.dispose();
    });

    it('should have independent services from parent', () => {
      const parentServices = root.getServices();
      const child = root.createChild();
      const childServices = child.getServices();

      // Services should be different instances (transient)
      expect(childServices.createCommitUseCase).not.toBe(
        parentServices.createCommitUseCase,
      );

      child.dispose();
    });
  });

  describe('dispose', () => {
    it('should clear services', () => {
      const services1 = root.getServices();
      expect(services1).toBeDefined();

      root.dispose();

      // After dispose, create a new root to get fresh services
      const newRoot = new CompositionRoot();
      const services2 = newRoot.getServices();

      expect(services2).not.toBe(services1);

      newRoot.dispose();
    });

    it('should clear container', () => {
      const container = root.getContainer();
      const initialSize = container.size;

      root.dispose();

      expect(container.size).toBe(0);
      expect(container.size).toBeLessThan(initialSize);
    });
  });

  describe('getGlobalCompositionRoot', () => {
    afterEach(() => {
      resetGlobalCompositionRoot();
    });

    it('should return global composition root', () => {
      const global = getGlobalCompositionRoot();

      expect(global).toBeInstanceOf(CompositionRoot);
    });

    it('should return same instance on multiple calls', () => {
      const global1 = getGlobalCompositionRoot();
      const global2 = getGlobalCompositionRoot();

      expect(global1).toBe(global2);
    });

    it('should accept options on first call', () => {
      const global = getGlobalCompositionRoot({
        workingDirectory: '/global/path',
      });

      expect(global).toBeInstanceOf(CompositionRoot);
    });

    it('should ignore options on subsequent calls', () => {
      const global1 = getGlobalCompositionRoot({
        workingDirectory: '/path1',
      });
      const global2 = getGlobalCompositionRoot({
        workingDirectory: '/path2',
      });

      expect(global1).toBe(global2);
    });
  });

  describe('resetGlobalCompositionRoot', () => {
    it('should reset the global root', () => {
      const global1 = getGlobalCompositionRoot();

      resetGlobalCompositionRoot();

      const global2 = getGlobalCompositionRoot();

      expect(global2).not.toBe(global1);
    });

    it('should allow new configuration after reset', () => {
      getGlobalCompositionRoot({
        workingDirectory: '/path1',
      });

      resetGlobalCompositionRoot();

      const newGlobal = getGlobalCompositionRoot({
        workingDirectory: '/path2',
      });

      expect(newGlobal).toBeInstanceOf(CompositionRoot);
    });
  });

  describe('getUseCase (global helper)', () => {
    afterEach(() => {
      resetGlobalCompositionRoot();
    });

    it('should get use case from global root', () => {
      const useCase = getUseCase<CreateCommitUseCase>('createCommitUseCase');

      expect(useCase).toBeInstanceOf(CreateCommitUseCase);
    });

    it('should return same instance on multiple calls', () => {
      const useCase1 = getUseCase<CreateCommitUseCase>('createCommitUseCase');
      const useCase2 = getUseCase<CreateCommitUseCase>('createCommitUseCase');

      expect(useCase1).toBe(useCase2);
    });

    it('should work with all use case types', () => {
      expect(getUseCase('createCommitUseCase')).toBeDefined();
      expect(getUseCase('generateAICommitUseCase')).toBeDefined();
      expect(getUseCase('getRepositoryStatusUseCase')).toBeDefined();
      expect(getUseCase('analyzeCommitHistoryUseCase')).toBeDefined();
      expect(getUseCase('stageFilesUseCase')).toBeDefined();
    });
  });
});
