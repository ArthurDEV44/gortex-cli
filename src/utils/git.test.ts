import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock simple-git before importing functions
vi.mock('simple-git', () => import('../__mocks__/simple-git.js'));

import {
  mockGit,
  setupMockScenario,
  resetMocks,
  createMockStatus,
  createMockLog,
} from '../__mocks__/simple-git.js';

import {
  isGitRepository,
  hasChanges,
  getModifiedFiles,
  stageAll,
  createCommit,
  getCommitHistory,
  analyzeCommitStats,
  getGitDir,
  getCurrentBranch,
  getAllBranches,
  checkoutBranch,
  createAndCheckoutBranch,
  branchExists,
  getModifiedFilesWithStatus,
  stageFiles,
  hasRemote,
  getDefaultRemote,
  getRemoteUrl,
  pushToRemote,
  hasUpstream,
} from './git.js';

describe('git.ts', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when in a git repository', async () => {
      setupMockScenario.cleanRepo();
      const result = await isGitRepository();
      expect(result).toBe(true);
    });

    it('should return false when not in a git repository', async () => {
      setupMockScenario.notARepo();
      const result = await isGitRepository();
      expect(result).toBe(false);
    });
  });

  describe('hasChanges', () => {
    it('should return true when there are changes', async () => {
      setupMockScenario.dirtyRepo(['file1.ts', 'file2.ts']);
      const result = await hasChanges();
      expect(result).toBe(true);
    });

    it('should return false when there are no changes', async () => {
      setupMockScenario.cleanRepo();
      const result = await hasChanges();
      expect(result).toBe(false);
    });
  });

  describe('getModifiedFiles', () => {
    it('should return list of modified files', async () => {
      const files = ['file1.ts', 'file2.ts', 'file3.md'];
      setupMockScenario.dirtyRepo(files);

      const result = await getModifiedFiles();
      expect(result).toEqual(files);
    });

    it('should return empty array when no files are modified', async () => {
      setupMockScenario.cleanRepo();
      const result = await getModifiedFiles();
      expect(result).toEqual([]);
    });
  });

  describe('stageAll', () => {
    it('should call git.add with dot to stage all files', async () => {
      await stageAll();
      expect(mockGit.add).toHaveBeenCalledWith('.');
    });
  });

  describe('createCommit', () => {
    it('should create a commit with the given message', async () => {
      const message = 'feat: add new feature';
      await createCommit(message);
      expect(mockGit.commit).toHaveBeenCalledWith(message);
    });
  });

  describe('getCommitHistory', () => {
    it('should return commit history with default maxCount', async () => {
      const commits = [
        { hash: 'abc123', message: 'feat: add feature' },
        { hash: 'def456', message: 'fix: resolve bug' },
      ];
      setupMockScenario.withHistory(commits);

      const result = await getCommitHistory();
      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: 100 });
      expect(result.all).toHaveLength(2);
    });

    it('should return commit history with custom maxCount', async () => {
      const commits = [{ hash: 'abc123', message: 'feat: add feature' }];
      setupMockScenario.withHistory(commits);

      await getCommitHistory(50);
      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: 50 });
    });
  });

  describe('analyzeCommitStats', () => {
    it('should analyze conventional commits correctly', async () => {
      const commits = [
        { hash: 'abc123', message: 'feat: add new feature' },
        { hash: 'def456', message: 'fix: resolve bug' },
        { hash: 'ghi789', message: 'non-conventional commit' },
        { hash: 'jkl012', message: 'feat: another feature' },
      ];
      setupMockScenario.withHistory(commits);

      const result = await analyzeCommitStats();

      expect(result.total).toBe(4);
      expect(result.conventional).toBe(3);
      expect(result.nonConventional).toBe(1);
      expect(result.percentage).toBe(75);
      expect(result.typeBreakdown).toEqual({
        feat: 2,
        fix: 1,
      });
    });

    it('should handle empty commit history', async () => {
      setupMockScenario.withHistory([]);

      const result = await analyzeCommitStats();

      expect(result.total).toBe(0);
      expect(result.conventional).toBe(0);
      expect(result.nonConventional).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.typeBreakdown).toEqual({});
    });

    it('should handle all non-conventional commits', async () => {
      const commits = [
        { hash: 'abc123', message: 'random commit' },
        { hash: 'def456', message: 'another random' },
      ];
      setupMockScenario.withHistory(commits);

      const result = await analyzeCommitStats();

      expect(result.total).toBe(2);
      expect(result.conventional).toBe(0);
      expect(result.nonConventional).toBe(2);
      expect(result.percentage).toBe(0);
    });
  });

  describe('getGitDir', () => {
    it('should return the git directory path', async () => {
      (mockGit.revparse as any).mockResolvedValue('.git\n');
      const result = await getGitDir();
      expect(result).toBe('.git');
    });

    it('should trim whitespace from git directory path', async () => {
      (mockGit.revparse as any).mockResolvedValue('  .git  \n');
      const result = await getGitDir();
      expect(result).toBe('.git');
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      setupMockScenario.onBranch('feature/test');
      const result = await getCurrentBranch();
      expect(result).toBe('feature/test');
    });

    it('should trim whitespace from branch name', async () => {
      (mockGit.revparse as any).mockResolvedValue('  main  \n');
      const result = await getCurrentBranch();
      expect(result).toBe('main');
    });
  });

  describe('getAllBranches', () => {
    it('should return all local branches', async () => {
      const branches = ['main', 'develop', 'feature/test'];
      (mockGit.branchLocal as any).mockResolvedValue({
        all: branches,
        branches: {},
        current: 'main',
      });

      const result = await getAllBranches();
      expect(result).toEqual(branches);
    });
  });

  describe('checkoutBranch', () => {
    it('should checkout the specified branch', async () => {
      await checkoutBranch('develop');
      expect(mockGit.checkout).toHaveBeenCalledWith('develop');
    });
  });

  describe('createAndCheckoutBranch', () => {
    it('should create and checkout new branch', async () => {
      await createAndCheckoutBranch('feature/new-feature');
      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith('feature/new-feature');
    });
  });

  describe('branchExists', () => {
    beforeEach(() => {
      (mockGit.branchLocal as any).mockResolvedValue({
        all: ['main', 'develop', 'feature/test'],
        branches: {},
        current: 'main',
      });
    });

    it('should return true when branch exists', async () => {
      const result = await branchExists('develop');
      expect(result).toBe(true);
    });

    it('should return false when branch does not exist', async () => {
      const result = await branchExists('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getModifiedFilesWithStatus', () => {
    it('should return files with their status labels', async () => {
      (mockGit.status as any).mockResolvedValue(
        createMockStatus([
          { path: 'file1.ts', index: 'M' },
          { path: 'file2.ts', index: 'A' },
          { path: 'file3.ts', index: 'D' },
        ])
      );

      const result = await getModifiedFilesWithStatus();

      expect(result).toEqual([
        { path: 'file1.ts', status: 'modifié' },
        { path: 'file2.ts', status: 'nouveau' },
        { path: 'file3.ts', status: 'supprimé' },
      ]);
    });

    it('should handle working directory changes', async () => {
      (mockGit.status as any).mockResolvedValue(
        createMockStatus([
          { path: 'file1.ts', working_dir: 'M' },
          { path: 'file2.ts', working_dir: '?' },
        ])
      );

      const result = await getModifiedFilesWithStatus();

      expect(result).toContainEqual({ path: 'file1.ts', status: 'modifié' });
      expect(result).toContainEqual({ path: 'file2.ts', status: 'non suivi' });
    });
  });

  describe('stageFiles', () => {
    it('should stage specified files', async () => {
      await stageFiles(['file1.ts', 'file2.ts']);
      expect(mockGit.add).toHaveBeenCalledWith('file1.ts');
      expect(mockGit.add).toHaveBeenCalledWith('file2.ts');
    });

    it('should handle empty file list', async () => {
      await stageFiles([]);
      expect(mockGit.add).not.toHaveBeenCalled();
    });

    it('should handle deleted files by calling git add -u', async () => {
      (mockGit.add as any).mockRejectedValueOnce(new Error('did not match any files'));

      await stageFiles(['deleted-file.ts']);

      expect(mockGit.raw).toHaveBeenCalledWith(['add', '-u', '.']);
    });

    it('should rethrow errors that are not about missing files', async () => {
      (mockGit.add as any).mockRejectedValueOnce(new Error('permission denied'));

      await expect(stageFiles(['file.ts'])).rejects.toThrow('permission denied');
    });
  });

  describe('hasRemote', () => {
    it('should return true when remotes exist', async () => {
      setupMockScenario.withRemote();
      const result = await hasRemote();
      expect(result).toBe(true);
    });

    it('should return false when no remotes exist', async () => {
      setupMockScenario.noRemote();
      const result = await hasRemote();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (mockGit.getRemotes as any).mockRejectedValue(new Error('failed'));
      const result = await hasRemote();
      expect(result).toBe(false);
    });
  });

  describe('getDefaultRemote', () => {
    it('should return origin when it exists', async () => {
      (mockGit.getRemotes as any).mockResolvedValue([
        { name: 'upstream', refs: {} },
        { name: 'origin', refs: {} },
      ]);

      const result = await getDefaultRemote();
      expect(result).toBe('origin');
    });

    it('should return first remote when origin does not exist', async () => {
      (mockGit.getRemotes as any).mockResolvedValue([
        { name: 'upstream', refs: {} },
        { name: 'other', refs: {} },
      ]);

      const result = await getDefaultRemote();
      expect(result).toBe('upstream');
    });

    it('should throw error when no remotes exist', async () => {
      setupMockScenario.noRemote();

      await expect(getDefaultRemote()).rejects.toThrow('Aucun remote configuré');
    });
  });

  describe('getRemoteUrl', () => {
    it('should return remote URL for specified remote', async () => {
      (mockGit.getRemotes as any).mockResolvedValue([
        {
          name: 'origin',
          refs: { push: 'https://github.com/test/repo.git' },
        },
      ]);

      const result = await getRemoteUrl('origin');
      expect(result).toBe('https://github.com/test/repo.git');
    });

    it('should return null when remote does not exist', async () => {
      setupMockScenario.noRemote();
      const result = await getRemoteUrl('origin');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (mockGit.getRemotes as any).mockRejectedValue(new Error('failed'));
      const result = await getRemoteUrl();
      expect(result).toBeNull();
    });
  });

  describe('pushToRemote', () => {
    it('should push with upstream flag when setUpstream is true', async () => {
      await pushToRemote('origin', 'main', true);
      expect(mockGit.push).toHaveBeenCalledWith(['-u', 'origin', 'main']);
    });

    it('should push without upstream flag when setUpstream is false', async () => {
      await pushToRemote('origin', 'main', false);
      expect(mockGit.push).toHaveBeenCalledWith('origin', 'main');
    });

    it('should push without upstream flag by default', async () => {
      await pushToRemote('origin', 'main');
      expect(mockGit.push).toHaveBeenCalledWith('origin', 'main');
    });
  });

  describe('hasUpstream', () => {
    it('should return true when branch has upstream', async () => {
      (mockGit.revparse as any).mockResolvedValue('origin/main');
      const result = await hasUpstream();
      expect(result).toBe(true);
    });

    it('should return false when branch has no upstream', async () => {
      (mockGit.revparse as any).mockRejectedValue(new Error('no upstream configured'));
      const result = await hasUpstream();
      expect(result).toBe(false);
    });
  });
});
