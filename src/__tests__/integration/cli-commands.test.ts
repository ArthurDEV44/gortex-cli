/**
 * Integration Test: CLI Commands with DI
 * Tests the CLI command infrastructure and DI integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CompositionRoot } from '../../infrastructure/di/CompositionRoot.js';
import { ServiceIdentifiers } from '../../infrastructure/di/ServiceRegistry.js';
import type { IGitRepository } from '../../domain/repositories/IGitRepository.js';
import type { IAIProvider } from '../../domain/repositories/IAIProvider.js';
import type { CreateCommitUseCase } from '../../application/use-cases/CreateCommitUseCase.js';
import type { GetRepositoryStatusUseCase } from '../../application/use-cases/GetRepositoryStatusUseCase.js';
import type { AnalyzeCommitHistoryUseCase } from '../../application/use-cases/AnalyzeCommitHistoryUseCase.js';
import type { BranchOperationsUseCase } from '../../application/use-cases/BranchOperationsUseCase.js';
import type { PushOperationsUseCase } from '../../application/use-cases/PushOperationsUseCase.js';

describe('Integration: CLI Commands with DI', () => {
  let root: CompositionRoot;
  let mockGitRepository: IGitRepository;

  beforeEach(() => {
    // Create comprehensive mock repository
    mockGitRepository = {
      isRepository: vi.fn().mockResolvedValue(true),
      getGitDirectory: vi.fn().mockResolvedValue('/test/repo/.git'),
      hasChanges: vi.fn().mockResolvedValue(true),
      getModifiedFiles: vi.fn().mockResolvedValue(['file1.ts', 'file2.ts']),
      getModifiedFilesWithStatus: vi.fn().mockResolvedValue([
        { path: 'file1.ts', status: 'modified' },
        { path: 'file2.ts', status: 'added' },
      ]),
      stageAll: vi.fn().mockResolvedValue(undefined),
      stageFiles: vi.fn().mockResolvedValue(undefined),
      createCommit: vi.fn().mockResolvedValue(undefined),
      getCommitHistory: vi.fn().mockResolvedValue([
        {
          hash: 'abc123',
          message: 'feat: previous feature',
          date: '2024-01-01',
          author: 'Test User',
        },
        {
          hash: 'def456',
          message: 'fix: bug fix',
          date: '2024-01-02',
          author: 'Test User',
        },
      ]),
      getStagedChangesContext: vi.fn().mockResolvedValue({
        diff: 'test diff',
        files: ['file1.ts'],
        branch: 'main',
        recentCommits: ['feat: previous'],
      }),
      getCurrentBranch: vi.fn().mockResolvedValue('main'),
      getAllBranches: vi.fn().mockResolvedValue(['main', 'develop', 'feature/test']),
      branchExists: vi.fn().mockResolvedValue(true),
      checkoutBranch: vi.fn().mockResolvedValue(undefined),
      createAndCheckoutBranch: vi.fn().mockResolvedValue(undefined),
      hasRemote: vi.fn().mockResolvedValue(true),
      getRemoteUrl: vi.fn().mockResolvedValue('https://github.com/user/repo.git'),
      getDefaultRemote: vi.fn().mockResolvedValue('origin'),
      hasUpstream: vi.fn().mockResolvedValue(true),
      pushToRemote: vi.fn().mockResolvedValue(undefined),
    };

    root = new CompositionRoot();
  });

  afterEach(() => {
    root.dispose();
  });

  describe('CompositionRoot Lifecycle', () => {
    it('should create and initialize CompositionRoot', () => {
      expect(root).toBeDefined();
      expect(root.getContainer()).toBeDefined();
    });

    it('should register all required services', () => {
      const container = root.getContainer();

      expect(container.isRegistered(ServiceIdentifiers.GitRepository)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.CreateCommitUseCase)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.GetRepositoryStatusUseCase)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.StageFilesUseCase)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.AnalyzeCommitHistoryUseCase)).toBe(true);
    });

    it('should resolve use cases from container', () => {
      const createCommit = root.getContainer().resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase
      );
      const getStatus = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );

      expect(createCommit).toBeDefined();
      expect(getStatus).toBeDefined();
    });

    it('should dispose and cleanup container', () => {
      const container = root.getContainer();
      expect(container.size).toBeGreaterThan(0);

      root.dispose();

      expect(container.size).toBe(0);
    });

    it('should allow multiple dispose calls safely', () => {
      expect(() => {
        root.dispose();
        root.dispose();
        root.dispose();
      }).not.toThrow();
    });
  });

  describe('Commit Command Integration', () => {
    beforeEach(() => {
      root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    });

    it('should check repository validity', async () => {
      const container = root.getContainer();
      const repo = container.resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

      const isRepo = await repo.isRepository();

      expect(isRepo).toBe(true);
      expect(mockGitRepository.isRepository).toHaveBeenCalled();
    });

    it('should check for changes before committing', async () => {
      const container = root.getContainer();
      const repo = container.resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

      const hasChanges = await repo.hasChanges();

      expect(hasChanges).toBe(true);
      expect(mockGitRepository.hasChanges).toHaveBeenCalled();
    });

    it('should create commit through use case', async () => {
      const useCase = root.getContainer().resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase
      );

      const result = await useCase.execute({
        message: {
          type: 'feat',
          subject: 'add new feature',
          scope: 'cli',
        },
      });

      expect(result.success).toBe(true);
      expect(result.formattedMessage).toBe('feat(cli): add new feature');
    });
  });

  describe('Stats Command Integration', () => {
    beforeEach(() => {
      root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    });

    it('should analyze commit history', async () => {
      const useCase = root.getContainer().resolve<AnalyzeCommitHistoryUseCase>(
        ServiceIdentifiers.AnalyzeCommitHistoryUseCase
      );

      const result = await useCase.execute({ maxCount: 100 });

      expect(result.success).toBe(true);
      expect(result.commits).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(mockGitRepository.getCommitHistory).toHaveBeenCalledWith(100);
    });

    it('should generate statistics from commits', async () => {
      const useCase = root.getContainer().resolve<AnalyzeCommitHistoryUseCase>(
        ServiceIdentifiers.AnalyzeCommitHistoryUseCase
      );

      const result = await useCase.execute();

      expect(result.success).toBe(true);
      expect(result.stats?.totalCommits).toBe(2);
      expect(result.stats?.conventionalCommits).toBeGreaterThan(0);
    });

    it('should handle different maxCount parameters', async () => {
      const useCase = root.getContainer().resolve<AnalyzeCommitHistoryUseCase>(
        ServiceIdentifiers.AnalyzeCommitHistoryUseCase
      );

      await useCase.execute({ maxCount: 50 });
      expect(mockGitRepository.getCommitHistory).toHaveBeenCalledWith(50);

      await useCase.execute({ maxCount: 200 });
      expect(mockGitRepository.getCommitHistory).toHaveBeenCalledWith(200);
    });
  });

  describe('Hooks Command Integration', () => {
    beforeEach(() => {
      root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    });

    it('should get git directory for hooks', async () => {
      const repo = root.getContainer().resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

      const gitDir = await repo.getGitDirectory();

      expect(gitDir).toBe('/test/repo/.git');
      expect(mockGitRepository.getGitDirectory).toHaveBeenCalled();
    });

    it('should verify repository before installing hooks', async () => {
      const repo = root.getContainer().resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

      const isRepo = await repo.isRepository();

      expect(isRepo).toBe(true);
    });
  });

  describe('Branch Operations Integration', () => {
    beforeEach(() => {
      root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    });

    it('should get current branch', async () => {
      const useCase = root.getContainer().resolve<BranchOperationsUseCase>(
        ServiceIdentifiers.BranchOperationsUseCase
      );

      const result = await useCase.getCurrentBranch();

      expect(result.success).toBe(true);
      expect(result.branch).toBe('main');
    });

    it('should get all branches', async () => {
      const useCase = root.getContainer().resolve<BranchOperationsUseCase>(
        ServiceIdentifiers.BranchOperationsUseCase
      );

      const result = await useCase.getAllBranches();

      expect(result.success).toBe(true);
      expect(result.branches).toHaveLength(3);
      expect(result.branches).toContain('main');
      expect(result.branches).toContain('develop');
    });

    it('should checkout existing branch', async () => {
      const useCase = root.getContainer().resolve<BranchOperationsUseCase>(
        ServiceIdentifiers.BranchOperationsUseCase
      );

      const result = await useCase.checkoutBranch({ branchName: 'develop' });

      expect(result.success).toBe(true);
      expect(mockGitRepository.checkoutBranch).toHaveBeenCalledWith('develop');
    });

    it('should create and checkout new branch', async () => {
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);

      const useCase = root.getContainer().resolve<BranchOperationsUseCase>(
        ServiceIdentifiers.BranchOperationsUseCase
      );

      const result = await useCase.createBranch({ branchName: 'feature/new' });

      expect(result.success).toBe(true);
      expect(mockGitRepository.createAndCheckoutBranch).toHaveBeenCalledWith('feature/new');
    });
  });

  describe('Push Operations Integration', () => {
    beforeEach(() => {
      root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    });

    it('should check for remote', async () => {
      const useCase = root.getContainer().resolve<PushOperationsUseCase>(
        ServiceIdentifiers.PushOperationsUseCase
      );

      const result = await useCase.checkRemote();

      expect(result.success).toBe(true);
      expect(result.hasRemote).toBe(true);
      expect(result.remoteName).toBe('origin');
    });

    it('should push to remote', async () => {
      const useCase = root.getContainer().resolve<PushOperationsUseCase>(
        ServiceIdentifiers.PushOperationsUseCase
      );

      const result = await useCase.pushToRemote({ setUpstream: false });

      expect(result.success).toBe(true);
      expect(mockGitRepository.pushToRemote).toHaveBeenCalled();
    });

    it('should handle push with upstream', async () => {
      vi.mocked(mockGitRepository.hasUpstream).mockResolvedValue(false);

      const useCase = root.getContainer().resolve<PushOperationsUseCase>(
        ServiceIdentifiers.PushOperationsUseCase
      );

      const result = await useCase.pushToRemote({ setUpstream: true });

      expect(result.success).toBe(true);
      expect(mockGitRepository.pushToRemote).toHaveBeenCalledWith('origin', 'main', true);
    });
  });

  describe('Repository Status Integration', () => {
    beforeEach(() => {
      root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    });

    it('should get full repository status', async () => {
      const useCase = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );

      const result = await useCase.execute();

      expect(result.success).toBe(true);
      expect(result.status?.branch).toBe('main');
      expect(result.status?.modifiedFiles).toHaveLength(2);
      expect(result.status?.hasChanges).toBe(true);
    });

    it('should detect repository without changes', async () => {
      vi.mocked(mockGitRepository.hasChanges).mockResolvedValue(false);

      const useCase = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );

      const result = await useCase.execute();

      expect(result.success).toBe(true);
      expect(result.status?.hasChanges).toBe(false);
    });
  });

  describe('Error Handling in Commands', () => {
    beforeEach(() => {
      root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    });

    it('should handle non-repository error', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const useCase = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );

      const result = await useCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a git repository');
    });

    it('should handle git operation failures', async () => {
      vi.mocked(mockGitRepository.getCurrentBranch).mockRejectedValue(
        new Error('Git error: not a repository')
      );

      const useCase = root.getContainer().resolve<BranchOperationsUseCase>(
        ServiceIdentifiers.BranchOperationsUseCase
      );

      const result = await useCase.getCurrentBranch();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors during push', async () => {
      vi.mocked(mockGitRepository.pushToRemote).mockRejectedValue(
        new Error('Network error: connection timeout')
      );

      const useCase = root.getContainer().resolve<PushOperationsUseCase>(
        ServiceIdentifiers.PushOperationsUseCase
      );

      const result = await useCase.pushToRemote({ setUpstream: false });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('DI Container Isolation', () => {
    it('should create independent containers for different commands', () => {
      const root1 = new CompositionRoot();
      const root2 = new CompositionRoot();

      const mock1 = { ...mockGitRepository };
      const mock2 = { ...mockGitRepository };

      root1.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mock1);
      root2.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mock2);

      const repo1 = root1.getContainer().resolve<IGitRepository>(ServiceIdentifiers.GitRepository);
      const repo2 = root2.getContainer().resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

      expect(repo1).not.toBe(repo2);

      root1.dispose();
      root2.dispose();
    });

    it('should not share state between containers', () => {
      const root1 = new CompositionRoot();
      const root2 = new CompositionRoot();

      // Register a specific mock instance in root1
      const mockRepoInstance = { ...mockGitRepository, name: 'mockForRoot1' };
      root1.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockRepoInstance);

      // Resolve from both containers
      const repoFromRoot1 = root1.getContainer().resolve<IGitRepository>(ServiceIdentifiers.GitRepository);
      const repoFromRoot2 = root2.getContainer().resolve<IGitRepository>(ServiceIdentifiers.GitRepository);
      
      // root1 should have the specific instance
      expect(repoFromRoot1).toBe(mockRepoInstance);

      // root2 should have resolved its own default instance, which is NOT the one from root1
      expect(repoFromRoot2).not.toBe(mockRepoInstance);

      root1.dispose();
      root2.dispose();
    });
  });
});
