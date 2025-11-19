/**
 * Integration Test: Complete Commit Workflow with DI
 * Tests the end-to-end commit workflow using the DI container
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DIContainer } from '../../infrastructure/di/DIContainer.js';
import { ServiceIdentifiers } from '../../infrastructure/di/ServiceRegistry.js';
import { CompositionRoot } from '../../infrastructure/di/CompositionRoot.js';
import type { IGitRepository, FileStatus } from '../../domain/repositories/IGitRepository.js';
import type { IAIProvider } from '../../domain/repositories/IAIProvider.js';
import type { CreateCommitUseCase } from '../../application/use-cases/CreateCommitUseCase.js';
import type { GetRepositoryStatusUseCase } from '../../application/use-cases/GetRepositoryStatusUseCase.js';
import type { StageFilesUseCase } from '../../application/use-cases/StageFilesUseCase.js';
import type { GenerateAICommitUseCase } from '../../application/use-cases/GenerateAICommitUseCase.js';
import { CommitMessage } from '../../domain/entities/CommitMessage.js';
import { CommitType } from '../../domain/value-objects/CommitType.js';
import { CommitSubject } from '../../domain/value-objects/CommitSubject.js';
import { Scope } from '../../domain/value-objects/Scope.js';

describe('Integration: Complete Commit Workflow', () => {
  let root: CompositionRoot;
  let mockGitRepository: IGitRepository;
  let mockAIProvider: IAIProvider;

  beforeEach(() => {
    // Create mock Git repository
    mockGitRepository = {
      isRepository: vi.fn().mockResolvedValue(true),
      getGitDirectory: vi.fn().mockResolvedValue('/fake/path/.git'),
      hasChanges: vi.fn().mockResolvedValue(true),
      getModifiedFiles: vi.fn().mockResolvedValue(['file1.ts', 'file2.ts']),
      getModifiedFilesWithStatus: vi.fn().mockResolvedValue([
        { path: 'file1.ts', status: 'modified' as const },
        { path: 'file2.ts', status: 'added' as const },
      ] as FileStatus[]),
      stageAll: vi.fn().mockResolvedValue(undefined),
      stageFiles: vi.fn().mockResolvedValue(undefined),
      createCommit: vi.fn().mockResolvedValue(undefined),
      getCommitHistory: vi.fn().mockResolvedValue([]),
      getStagedChangesContext: vi.fn().mockResolvedValue({
        diff: 'fake diff',
        files: ['file1.ts'],
        branch: 'main',
        recentCommits: [],
      }),
      getCurrentBranch: vi.fn().mockResolvedValue('main'),
      getAllBranches: vi.fn().mockResolvedValue(['main', 'dev']),
      branchExists: vi.fn().mockResolvedValue(true),
      checkoutBranch: vi.fn().mockResolvedValue(undefined),
      createAndCheckoutBranch: vi.fn().mockResolvedValue(undefined),
      hasRemote: vi.fn().mockResolvedValue(true),
      getRemoteUrl: vi.fn().mockResolvedValue('https://github.com/user/repo.git'),
      getDefaultRemote: vi.fn().mockResolvedValue('origin'),
      hasUpstream: vi.fn().mockResolvedValue(true),
      pushToRemote: vi.fn().mockResolvedValue(undefined),
    };

    // Create mock AI provider
    const mockCommitMessage = new CommitMessage(
      CommitType.create('feat'),
      CommitSubject.create('add integration tests'),
      Scope.create('tests')
    );

    mockAIProvider = {
      getName: vi.fn().mockReturnValue('MockAI'),
      isAvailable: vi.fn().mockResolvedValue(true),
      generateCommitMessage: vi.fn().mockResolvedValue({
        message: mockCommitMessage,
        confidence: 0.95,
      }),
      validateConfiguration: vi.fn().mockResolvedValue(true),
    };

    // Create CompositionRoot and override with mocks
    root = new CompositionRoot();
    root.getContainer().registerInstance(ServiceIdentifiers.GitRepository, mockGitRepository);
    root.getContainer().registerInstance(ServiceIdentifiers.AIProvider, mockAIProvider);
  });

  afterEach(() => {
    root.dispose();
  });

  describe('Manual Commit Workflow', () => {
    it('should complete full workflow: status → stage → commit', async () => {
      // 1. Get repository status
      const statusUseCase = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );
      const statusResult = await statusUseCase.execute();

      expect(statusResult.success).toBe(true);
      expect(statusResult.status?.modifiedFiles).toHaveLength(2);
      expect(statusResult.status?.branch).toBe('main');

      // 2. Stage files
      const stageUseCase = root.getContainer().resolve<StageFilesUseCase>(
        ServiceIdentifiers.StageFilesUseCase
      );
      const stageResult = await stageUseCase.execute({ filePaths: ['file1.ts', 'file2.ts'] });

      expect(stageResult.success).toBe(true);
      expect(mockGitRepository.stageFiles).toHaveBeenCalledWith(['file1.ts', 'file2.ts']);

      // 3. Create commit
      const commitUseCase = root.getContainer().resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase
      );
      const commitResult = await commitUseCase.execute({
        message: {
          type: 'feat',
          subject: 'add new feature',
          scope: 'api',
        },
      });

      expect(commitResult.success).toBe(true);
      expect(commitResult.formattedMessage).toBe('feat(api): add new feature');
      expect(mockGitRepository.createCommit).toHaveBeenCalledWith('feat(api): add new feature');
    });

    it('should handle errors gracefully when repository is invalid', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const statusUseCase = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );
      const result = await statusUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a git repository');
    });

    it('should stage all files when no specific files provided', async () => {
      const stageUseCase = root.getContainer().resolve<StageFilesUseCase>(
        ServiceIdentifiers.StageFilesUseCase
      );
      const result = await stageUseCase.execute({ stageAll: true });

      expect(result.success).toBe(true);
      expect(mockGitRepository.stageAll).toHaveBeenCalled();
      expect(mockGitRepository.stageFiles).not.toHaveBeenCalled();
    });
  });

  describe('AI-Assisted Commit Workflow', () => {
    it('should generate commit message with AI and create commit', async () => {
      // 1. Generate AI commit message
      const aiUseCase = root.getContainer().resolve<GenerateAICommitUseCase>(
        ServiceIdentifiers.GenerateAICommitUseCase
      );
      const aiResult = await aiUseCase.execute({
        diff: 'fake diff',
        context: {
          files: ['file1.ts'],
          branch: 'main',
          recentCommits: [],
        },
      });

      expect(aiResult.success).toBe(true);
      expect(aiResult.message?.type).toBe('feat');
      expect(aiResult.message?.subject).toBe('add integration tests');
      expect(aiResult.confidence).toBe(0.95);

      // 2. Create commit with AI-generated message
      const commitUseCase = root.getContainer().resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase
      );
      const commitResult = await commitUseCase.execute({
        message: {
          type: aiResult.message!.type,
          subject: aiResult.message!.subject,
          scope: aiResult.message!.scope?.toString(),
        },
      });

      expect(commitResult.success).toBe(true);
      expect(commitResult.formattedMessage).toBe('feat(tests): add integration tests');
    });

    it('should handle AI provider unavailability', async () => {
      vi.mocked(mockAIProvider.isAvailable).mockResolvedValue(false);

      const aiUseCase = root.getContainer().resolve<GenerateAICommitUseCase>(
        ServiceIdentifiers.GenerateAICommitUseCase
      );
      const result = await aiUseCase.execute({
        diff: 'fake diff',
        context: {
          files: ['file1.ts'],
          branch: 'main',
          recentCommits: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });
  });

  describe('DI Container Integration', () => {
    it('should resolve all use cases from container', () => {
      const createCommit = root.getContainer().resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase
      );
      const getStatus = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );
      const stageFiles = root.getContainer().resolve<StageFilesUseCase>(
        ServiceIdentifiers.StageFilesUseCase
      );
      const generateAI = root.getContainer().resolve<GenerateAICommitUseCase>(
        ServiceIdentifiers.GenerateAICommitUseCase
      );

      expect(createCommit).toBeDefined();
      expect(getStatus).toBeDefined();
      expect(stageFiles).toBeDefined();
      expect(generateAI).toBeDefined();
    });

    it('should use the same Git repository instance across use cases', () => {
      const statusUseCase = root.getContainer().resolve<GetRepositoryStatusUseCase>(
        ServiceIdentifiers.GetRepositoryStatusUseCase
      );
      const stageUseCase = root.getContainer().resolve<StageFilesUseCase>(
        ServiceIdentifiers.StageFilesUseCase
      );

      // Both should use the same mock repository instance
      expect(mockGitRepository.isRepository).toHaveBeenCalledTimes(0);

      // Execute both
      statusUseCase.execute();
      stageUseCase.execute({ stageAll: true });

      // Should use same repository (calls should accumulate)
      expect(mockGitRepository.isRepository).toHaveBeenCalled();
    });

    it('should cleanup properly when disposed', () => {
      expect(() => root.dispose()).not.toThrow();

      // After dispose, container should be cleared
      expect(root.getContainer()['registrations'].size).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle commit creation failure', async () => {
      vi.mocked(mockGitRepository.createCommit).mockRejectedValue(
        new Error('Git commit failed')
      );

      const commitUseCase = root.getContainer().resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase
      );
      const result = await commitUseCase.execute({
        message: {
          type: 'feat',
          subject: 'test feature',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Git commit failed');
    });

    it('should validate commit message format', async () => {
      const commitUseCase = root.getContainer().resolve<CreateCommitUseCase>(
        ServiceIdentifiers.CreateCommitUseCase
      );
      const result = await commitUseCase.execute({
        message: {
          type: 'feat',
          subject: 'ab', // Too short
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid commit message');
    });

    it('should handle empty file list for staging', async () => {
      const stageUseCase = root.getContainer().resolve<StageFilesUseCase>(
        ServiceIdentifiers.StageFilesUseCase
      );
      const result = await stageUseCase.execute({ filePaths: [] });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No files specified');
    });
  });
});
