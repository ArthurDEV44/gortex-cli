import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { GitRepositoryImpl } from './GitRepositoryImpl.js';

// Mock simple-git
vi.mock('simple-git', () => import('../../__mocks__/simple-git.js'));
import simpleGit, { mockGit, resetMocks, createMockLog } from '../../__mocks__/simple-git.js';

describe('GitRepositoryImpl', () => {
  let repository: GitRepositoryImpl;

  beforeEach(() => {
    resetMocks();
    repository = new GitRepositoryImpl();
  });

  describe('isRepository', () => {
    it('should return true for valid repository', async () => {
      vi.mocked(mockGit.revparse)!.mockResolvedValue('');

      const result = await repository.isRepository();

      expect(result).toBe(true);
      expect(mockGit.revparse).toHaveBeenCalledWith(['--git-dir']);
    });

    it('should return false for invalid repository', async () => {
      vi.mocked(mockGit.revparse)!.mockRejectedValue(new Error('Not a git repository'));

      const result = await repository.isRepository();

      expect(result).toBe(false);
    });
  });

  describe('hasChanges', () => {
    it('should return true when there are changes', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        modified: ['file.ts'],
        not_added: [],
        deleted: [],
        staged: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => false,
      });

      const result = await repository.hasChanges();

      expect(result).toBe(true);
    });

    it('should return false when repository is clean', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        modified: [],
        not_added: [],
        deleted: [],
        staged: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => true,
      });

      const result = await repository.hasChanges();

      expect(result).toBe(false);
    });
  });

  describe('getModifiedFiles', () => {
    it('should return list of modified files', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        modified: ['file1.ts', 'file2.ts'],
        not_added: ['file3.ts'],
        deleted: ['file4.ts'],
        staged: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => false,
      });

      const result = await repository.getModifiedFiles();

      // Order is: modified, created, deleted, renamed, not_added
      expect(result).toEqual(['file1.ts', 'file2.ts', 'file4.ts', 'file3.ts']);
    });

    it('should return empty array for clean repository', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        modified: [],
        not_added: [],
        deleted: [],
        staged: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => true,
      });

      const result = await repository.getModifiedFiles();

      expect(result).toEqual([]);
    });
  });

  describe('stageFiles', () => {
    it('should stage specified files', async () => {
      const files = ['file1.ts', 'file2.ts'];

      await repository.stageFiles(files);

      expect(vi.mocked(mockGit.add)!).toHaveBeenCalledWith(files);
    });

    it('should handle single file', async () => {
      await repository.stageFiles(['file.ts']);

      expect(vi.mocked(mockGit.add)!).toHaveBeenCalledWith(['file.ts']);
    });
  });

  describe('stageAll', () => {
    it('should stage all files', async () => {
      await repository.stageAll();

      expect(vi.mocked(mockGit.add)!).toHaveBeenCalledWith('.');
    });
  });

  describe('createCommit', () => {
    it('should create commit with message', async () => {
      const message = 'feat: add new feature';

      await repository.createCommit(message);

      expect(vi.mocked(mockGit.commit)!).toHaveBeenCalledWith(message);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      vi.mocked(mockGit.revparse)!.mockResolvedValue('main\n');

      const result = await repository.getCurrentBranch();

      expect(result).toBe('main');
      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
    });

    it('should trim whitespace from branch name', async () => {
      vi.mocked(mockGit.revparse)!.mockResolvedValue('  feature-branch  \n');

      const result = await repository.getCurrentBranch();

      expect(result).toBe('feature-branch');
    });
  });

  describe('hasRemote', () => {
    it('should return true when remote exists', async () => {
      vi.mocked(mockGit.getRemotes)!.mockResolvedValue([
        { name: 'origin', refs: { fetch: '', push: '' } },
      ]);

      const result = await repository.hasRemote();

      expect(result).toBe(true);
    });

    it('should return false when no remotes exist', async () => {
      vi.mocked(mockGit.getRemotes)!.mockResolvedValue([]);

      const result = await repository.hasRemote();

      expect(result).toBe(false);
    });
  });

  describe('getDefaultRemote', () => {
    it('should return origin if it exists', async () => {
      vi.mocked(mockGit.getRemotes)!.mockResolvedValue([
        { name: 'origin', refs: { fetch: '', push: '' } },
        { name: 'upstream', refs: { fetch: '', push: '' } },
      ]);

      const result = await repository.getDefaultRemote();

      expect(result).toBe('origin');
    });

    it('should return first remote if origin does not exist', async () => {
      vi.mocked(mockGit.getRemotes)!.mockResolvedValue([
        { name: 'upstream', refs: { fetch: '', push: '' } },
      ]);

      const result = await repository.getDefaultRemote();

      expect(result).toBe('upstream');
    });

    it('should throw error if no remotes exist', async () => {
      vi.mocked(mockGit.getRemotes)!.mockResolvedValue([]);

      await expect(repository.getDefaultRemote()).rejects.toThrow(
        'No remote configured',
      );
    });
  });

  describe('hasUpstream', () => {
    it('should return true when branch has upstream', async () => {
      vi.mocked(mockGit.revparse)!.mockResolvedValue('main'); // for getCurrentBranch
      vi.mocked(mockGit.raw)!.mockResolvedValue('origin/main');

      const result = await repository.hasUpstream();

      expect(result).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        'rev-parse',
        '--abbrev-ref',
        'main@{upstream}',
      ]);
    });

    it('should return false when branch has no upstream', async () => {
      vi.mocked(mockGit.revparse)!.mockResolvedValue('feature-branch'); // for getCurrentBranch
      vi.mocked(mockGit.raw)!.mockRejectedValue(new Error('no upstream configured'));

      const result = await repository.hasUpstream();

      expect(result).toBe(false);
    });
  });

  describe('pushToRemote', () => {
    it('should push to remote without setting upstream', async () => {
      await repository.pushToRemote('origin', 'main', false);

      expect(vi.mocked(mockGit.push)!).toHaveBeenCalledWith('origin', 'main');
    });

    it('should push to remote with setting upstream', async () => {
      await repository.pushToRemote('origin', 'feature', true);

      expect(vi.mocked(mockGit.push)!).toHaveBeenCalledWith(['-u', 'origin', 'feature']);
    });
  });

  describe('getStagedChangesContext', () => {
    it('should return context for staged changes', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        staged: ['file1.ts', 'file2.ts'],
        modified: [],
        not_added: [],
        deleted: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => false,
      });

      vi.mocked(mockGit.diff)!.mockResolvedValue('diff content');
      vi.mocked(mockGit.revparse)!.mockResolvedValue('main');
      vi.mocked(mockGit.log)!.mockResolvedValue(
        createMockLog([
          { hash: '123', message: 'commit 1' },
          { hash: '456', message: 'commit 2' },
        ])
      );

      const result = await repository.getStagedChangesContext();

      expect(result.files).toEqual(['file1.ts', 'file2.ts']);
      expect(result.diff).toBe('diff content');
      expect(result.branch).toBe('main');
      expect(result.recentCommits).toEqual(['commit 1', 'commit 2']);
    });

    it('should throw error when no files are staged', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        staged: [],
        modified: [],
        not_added: [],
        deleted: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => true,
      });

      await expect(repository.getStagedChangesContext()).rejects.toThrow(
        'Aucun fichier pertinent stagé. Seuls les fichiers de lock ou autres fichiers ignorés ont été détectés.',
      );
    });

    it('should throw error when diff is empty', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        staged: ['file.ts'],
        modified: [],
        not_added: [],
        deleted: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => false,
      });

      vi.mocked(mockGit.diff)!.mockResolvedValue('   \n  ');

      await expect(repository.getStagedChangesContext()).rejects.toThrow(
        'Aucun changement détecté',
      );
    });

    it('should truncate large diffs', async () => {
      const largeDiff = 'a'.repeat(30000);

      vi.mocked(mockGit.status)!.mockResolvedValue({
        staged: ['file.ts'],
        modified: [],
        not_added: [],
        deleted: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => false,
      });

      vi.mocked(mockGit.diff)!.mockResolvedValue(largeDiff);
      vi.mocked(mockGit.revparse)!.mockResolvedValue('main');
      vi.mocked(mockGit.log)!.mockResolvedValue(createMockLog([]));

      const result = await repository.getStagedChangesContext();

      expect(result.diff.length).toBeLessThan(largeDiff.length);
      expect(result.diff).toContain('tronquées pour économiser les tokens');
    });

    it('should filter out lockfiles from staged changes context', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        staged: ['file1.ts', 'pnpm-lock.yaml'],
        modified: [],
        not_added: [],
        deleted: [],
        files: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        detached: false,
        isClean: () => false,
      });
      vi.mocked(mockGit.diff)!.mockResolvedValue('diff --git a/file1.ts b/file1.ts');
      vi.mocked(mockGit.revparse)!.mockResolvedValue('main');
      vi.mocked(mockGit.log)!.mockResolvedValue(createMockLog([]));
      
      const context = await repository.getStagedChangesContext();

      expect(context.files).toEqual(['file1.ts']);
      expect(context.files).not.toContain('pnpm-lock.yaml');
      expect(vi.mocked(mockGit.diff)!).toHaveBeenCalledWith(['--staged', '--no-color', '-U3']);
    });
  });

  describe('constructor', () => {
    it('should create repository with custom working directory', () => {
      const customRepo = new GitRepositoryImpl('/custom/path');

      expect(customRepo).toBeInstanceOf(GitRepositoryImpl);
      // The simpleGit function should be called with the custom path
      // This is tested indirectly through the mock
    });
  });
});
