import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import {
  useCreateCommit,
  useGenerateAICommit,
  useRepositoryStatus,
  useCommitHistory,
  useStageFiles,
  useBranchOperations,
  usePushOperations,
  useGitRepository,
  useAIProvider,
} from '../hooks.js';
import { DIProvider } from '../DIContext.js';
import { CompositionRoot } from '../CompositionRoot.js';
import { ServiceIdentifiers } from '../ServiceRegistry.js';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository.js';
import type { IAIProvider } from '../../../domain/repositories/IAIProvider.js';

// Mock DIContext
const mockUseUseCase = vi.fn();
const mockUseCompositionRoot = vi.fn();

vi.mock('../DIContext.js', async () => {
  const actual = await vi.importActual('../DIContext.js');
  return {
    ...actual,
    useUseCase: (...args: any[]) => mockUseUseCase(...args),
    useCompositionRoot: (...args: any[]) => mockUseCompositionRoot(...args),
  };
});

describe('hooks', () => {
  let mockCreateCommitUseCase: any;
  let mockGenerateAICommitUseCase: any;
  let mockGetRepositoryStatusUseCase: any;
  let mockAnalyzeCommitHistoryUseCase: any;
  let mockStageFilesUseCase: any;
  let mockBranchOperationsUseCase: any;
  let mockPushOperationsUseCase: any;
  let mockGitRepository: IGitRepository;
  let mockAIProvider: IAIProvider | null;
  let mockCompositionRoot: any;
  let mockContainer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock use cases
    mockCreateCommitUseCase = { execute: vi.fn() };
    mockGenerateAICommitUseCase = { execute: vi.fn() };
    mockGetRepositoryStatusUseCase = { execute: vi.fn() };
    mockAnalyzeCommitHistoryUseCase = { execute: vi.fn() };
    mockStageFilesUseCase = { execute: vi.fn() };
    mockBranchOperationsUseCase = { getAllBranches: vi.fn() };
    mockPushOperationsUseCase = { checkRemote: vi.fn() };

    // Mock repository
    mockGitRepository = {
      isRepository: vi.fn(),
      getCurrentBranch: vi.fn(),
    } as any;

    // Mock AI provider
    mockAIProvider = {
      generateCommitMessage: vi.fn(),
      isAvailable: vi.fn(),
    } as any;

    // Mock container
    mockContainer = {
      resolve: vi.fn((identifier: string) => {
        if (identifier === ServiceIdentifiers.GitRepository) {
          return mockGitRepository;
        }
        if (identifier === ServiceIdentifiers.AIProvider) {
          return mockAIProvider;
        }
        return null;
      }),
    };

    // Mock composition root
    mockCompositionRoot = {
      getContainer: vi.fn(() => mockContainer),
    };

    // Setup mocks
    mockUseUseCase.mockImplementation((name: string) => {
      const useCaseMap: Record<string, any> = {
        createCommitUseCase: mockCreateCommitUseCase,
        generateAICommitUseCase: mockGenerateAICommitUseCase,
        getRepositoryStatusUseCase: mockGetRepositoryStatusUseCase,
        analyzeCommitHistoryUseCase: mockAnalyzeCommitHistoryUseCase,
        stageFilesUseCase: mockStageFilesUseCase,
        branchOperationsUseCase: mockBranchOperationsUseCase,
        pushOperationsUseCase: mockPushOperationsUseCase,
      };
      return useCaseMap[name];
    });

    mockUseCompositionRoot.mockReturnValue(mockCompositionRoot);
  });

  describe('useCreateCommit', () => {
    it('should return CreateCommitUseCase', () => {
      const TestComponent = () => {
        const useCase = useCreateCommit();
        expect(useCase).toBe(mockCreateCommitUseCase);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseUseCase).toHaveBeenCalledWith('createCommitUseCase');
    });
  });

  describe('useGenerateAICommit', () => {
    it('should return GenerateAICommitUseCase', () => {
      const TestComponent = () => {
        const useCase = useGenerateAICommit();
        expect(useCase).toBe(mockGenerateAICommitUseCase);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseUseCase).toHaveBeenCalledWith('generateAICommitUseCase');
    });
  });

  describe('useRepositoryStatus', () => {
    it('should return GetRepositoryStatusUseCase', () => {
      const TestComponent = () => {
        const useCase = useRepositoryStatus();
        expect(useCase).toBe(mockGetRepositoryStatusUseCase);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseUseCase).toHaveBeenCalledWith('getRepositoryStatusUseCase');
    });
  });

  describe('useCommitHistory', () => {
    it('should return AnalyzeCommitHistoryUseCase', () => {
      const TestComponent = () => {
        const useCase = useCommitHistory();
        expect(useCase).toBe(mockAnalyzeCommitHistoryUseCase);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseUseCase).toHaveBeenCalledWith('analyzeCommitHistoryUseCase');
    });
  });

  describe('useStageFiles', () => {
    it('should return StageFilesUseCase', () => {
      const TestComponent = () => {
        const useCase = useStageFiles();
        expect(useCase).toBe(mockStageFilesUseCase);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseUseCase).toHaveBeenCalledWith('stageFilesUseCase');
    });
  });

  describe('useBranchOperations', () => {
    it('should return BranchOperationsUseCase', () => {
      const TestComponent = () => {
        const useCase = useBranchOperations();
        expect(useCase).toBe(mockBranchOperationsUseCase);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseUseCase).toHaveBeenCalledWith('branchOperationsUseCase');
    });
  });

  describe('usePushOperations', () => {
    it('should return PushOperationsUseCase', () => {
      const TestComponent = () => {
        const useCase = usePushOperations();
        expect(useCase).toBe(mockPushOperationsUseCase);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseUseCase).toHaveBeenCalledWith('pushOperationsUseCase');
    });
  });

  describe('useGitRepository', () => {
    it('should return IGitRepository from container', () => {
      const TestComponent = () => {
        const repository = useGitRepository();
        expect(repository).toBe(mockGitRepository);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseCompositionRoot).toHaveBeenCalled();
      expect(mockCompositionRoot.getContainer).toHaveBeenCalled();
      expect(mockContainer.resolve).toHaveBeenCalledWith(ServiceIdentifiers.GitRepository);
    });
  });

  describe('useAIProvider', () => {
    it('should return IAIProvider when available', () => {
      const TestComponent = () => {
        const provider = useAIProvider();
        expect(provider).toBe(mockAIProvider);
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockUseCompositionRoot).toHaveBeenCalled();
      expect(mockCompositionRoot.getContainer).toHaveBeenCalled();
      expect(mockContainer.resolve).toHaveBeenCalledWith(ServiceIdentifiers.AIProvider);
    });

    it('should return null when AIProvider is not available', () => {
      mockContainer.resolve.mockImplementation((identifier: string) => {
        if (identifier === ServiceIdentifiers.AIProvider) {
          throw new Error('Service not found');
        }
        return null;
      });

      const TestComponent = () => {
        const provider = useAIProvider();
        expect(provider).toBeNull();
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );

      expect(mockContainer.resolve).toHaveBeenCalledWith(ServiceIdentifiers.AIProvider);
    });

    it('should return null when container throws any error', () => {
      mockContainer.resolve.mockImplementation((identifier: string) => {
        if (identifier === ServiceIdentifiers.AIProvider) {
          throw new Error('Any error');
        }
        return null;
      });

      const TestComponent = () => {
        const provider = useAIProvider();
        expect(provider).toBeNull();
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );
    });

    it('should return null when container throws non-Error exception', () => {
      mockContainer.resolve.mockImplementation((identifier: string) => {
        if (identifier === ServiceIdentifiers.AIProvider) {
          throw 'String error';
        }
        return null;
      });

      const TestComponent = () => {
        const provider = useAIProvider();
        expect(provider).toBeNull();
        return React.createElement(Text, null, 'Test');
      };

      render(
        React.createElement(DIProvider, null, React.createElement(TestComponent))
      );
    });
  });
});

