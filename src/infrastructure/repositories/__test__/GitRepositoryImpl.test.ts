import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitRepositoryImpl } from '../GitRepositoryImpl.js';

// Mock simple-git
vi.mock('simple-git', () => import('../../../__mocks__/simple-git.js'));
import { mockGit, resetMocks, createMockLog } from '../../../__mocks__/simple-git.js';

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
      vi.mocked(mockGit.status)!.mockResolvedValue({
        modified: ['file1.ts', 'file2.ts'],
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

      const files = ['file1.ts', 'file2.ts'];
      await repository.stageFiles(files);

      expect(vi.mocked(mockGit.add)!).toHaveBeenCalledWith(files);
      expect(vi.mocked(mockGit.rm)!).not.toHaveBeenCalled();
    });

    it('should handle single file', async () => {
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

      await repository.stageFiles(['file.ts']);

      expect(vi.mocked(mockGit.add)!).toHaveBeenCalledWith(['file.ts']);
      expect(vi.mocked(mockGit.rm)!).not.toHaveBeenCalled();
    });

    it('should handle deleted files', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        modified: [],
        not_added: [],
        deleted: ['deleted1.ts', 'deleted2.ts'],
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

      const files = ['deleted1.ts', 'deleted2.ts'];
      await repository.stageFiles(files);

      expect(vi.mocked(mockGit.rm)!).toHaveBeenCalledWith(files);
      expect(vi.mocked(mockGit.add)!).not.toHaveBeenCalled();
    });

    it('should handle mix of modified and deleted files', async () => {
      vi.mocked(mockGit.status)!.mockResolvedValue({
        modified: ['modified.ts'],
        not_added: ['added.ts'],
        deleted: ['deleted.ts'],
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

      const files = ['modified.ts', 'deleted.ts', 'added.ts'];
      await repository.stageFiles(files);

      expect(vi.mocked(mockGit.add)!).toHaveBeenCalledWith(['modified.ts', 'added.ts']);
      expect(vi.mocked(mockGit.rm)!).toHaveBeenCalledWith(['deleted.ts']);
    });

    it('should not call git add when files array is empty', async () => {
      await repository.stageFiles([]);

      expect(vi.mocked(mockGit.add)!).not.toHaveBeenCalled();
      expect(vi.mocked(mockGit.rm)!).not.toHaveBeenCalled();
      expect(vi.mocked(mockGit.status)!).not.toHaveBeenCalled();
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
      expect(vi.mocked(mockGit.diff)!).toHaveBeenCalledWith(['--staged', '--no-color', '-U5']);
    });
  });

  describe('getExistingScopes', () => {
    it('should return unique scopes from commit history', async () => {
      const commits = [
        { hash: '1', message: 'feat(api): first feature' },
        { hash: '2', message: 'fix(ui): fix button' },
        { hash: '3', message: 'feat(api): another feature' },
        { hash: '4', message: 'docs: update README' },
        { hash: '5', message: 'refactor(db)!: breaking change' },
      ];
      vi.mocked(mockGit.log)!.mockResolvedValue(createMockLog(commits));

      const scopes = await repository.getExistingScopes();
      
      expect(scopes).toHaveLength(3);
      expect(scopes.sort()).toEqual(['api', 'db', 'ui'].sort());
      expect(vi.mocked(mockGit.log)!).toHaveBeenCalledWith({ maxCount: 200 });
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

  describe('smartTruncateDiff', () => {
    it('should return full diff when under limit', () => {
      const repository = new GitRepositoryImpl();
      const shortDiff = 'diff --git a/file.ts b/file.ts\n+new content';

      const result = repository.smartTruncateDiff(shortDiff, 1000);

      expect(result).toBe(shortDiff);
    });

    it('should prioritize smaller files when truncating', () => {
      const repository = new GitRepositoryImpl();

      // Create a diff with 3 files: small, medium, large
      const smallFile = 'diff --git a/small.ts b/small.ts\n+small change\n';
      const mediumFile = 'diff --git a/medium.ts b/medium.ts\n' + '+'.repeat(100) + '\n';
      const largeFile = 'diff --git a/large.ts b/large.ts\n' + '+'.repeat(500) + '\n';

      const fullDiff = largeFile + mediumFile + smallFile;
      const maxChars = smallFile.length + mediumFile.length + 50; // Only room for small + medium

      const result = repository.smartTruncateDiff(fullDiff, maxChars);

      expect(result).toContain('small.ts');
      expect(result).toContain('medium.ts');
      expect(result).toContain('Fichiers omis');
      expect(result).toContain('large.ts');
    });

    it('should include all files when they all fit', () => {
      const repository = new GitRepositoryImpl();

      const file1 = 'diff --git a/file1.ts b/file1.ts\n+change1\n';
      const file2 = 'diff --git a/file2.ts b/file2.ts\n+change2\n';
      const file3 = 'diff --git a/file3.ts b/file3.ts\n+change3\n';

      const fullDiff = file1 + file2 + file3;
      const maxChars = fullDiff.length + 100; // Plenty of room

      const result = repository.smartTruncateDiff(fullDiff, maxChars);

      expect(result).toContain('file1.ts');
      expect(result).toContain('file2.ts');
      expect(result).toContain('file3.ts');
      expect(result).not.toContain('Fichiers omis');
    });

    it('should provide informative truncation message', () => {
      const repository = new GitRepositoryImpl();

      const file1 = 'diff --git a/included.ts b/included.ts\n+small\n';
      const file2 = 'diff --git a/excluded.ts b/excluded.ts\n' + '+'.repeat(500) + '\n';

      const fullDiff = file1 + file2;
      const maxChars = file1.length + 50;

      const result = repository.smartTruncateDiff(fullDiff, maxChars);

      expect(result).toContain('Fichiers omis: excluded.ts');
      expect(result).toContain('Fichiers inclus (1): included.ts');
    });

    it('should handle single file diff', () => {
      const repository = new GitRepositoryImpl();

      const singleFile = 'diff --git a/only.ts b/only.ts\n+content\n';

      const result = repository.smartTruncateDiff(singleFile, 100);

      expect(result).toBe(singleFile);
    });

    it('should handle diff with no file markers gracefully', () => {
      const repository = new GitRepositoryImpl();

      const weirdDiff = 'Some random content without proper diff format';

      const result = repository.smartTruncateDiff(weirdDiff, 10);

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
    });

    it('should keep complete file diffs instead of partial', () => {
      const repository = new GitRepositoryImpl();

      const file1 = 'diff --git a/file1.ts b/file1.ts\nindex abc..def\n--- a/file1.ts\n+++ b/file1.ts\n@@ -1,3 +1,3 @@\n line1\n-old\n+new\n line3\n';
      const file2 = 'diff --git a/file2.ts b/file2.ts\nindex ghi..jkl\n--- a/file2.ts\n+++ b/file2.ts\n@@ -1,3 +1,3 @@\n line1\n-old2\n+new2\n line3\n';

      const fullDiff = file1 + file2;
      const maxChars = file1.length + 10; // Not enough for file2

      const result = repository.smartTruncateDiff(fullDiff, maxChars);

      // file1 should be complete
      expect(result).toContain('diff --git a/file1.ts b/file1.ts');
      expect(result).toContain('line3');
      // file2 should be omitted entirely
      expect(result).toContain('file2.ts');
      expect(result).toContain('Fichiers omis');
    });

    it('should handle multiple files with same size', () => {
      const repository = new GitRepositoryImpl();

      const file1 = 'diff --git a/a.ts b/a.ts\n+change\n';
      const file2 = 'diff --git a/b.ts b/b.ts\n+change\n';
      const file3 = 'diff --git a/c.ts b/c.ts\n+change\n';

      const fullDiff = file1 + file2 + file3;
      const maxChars = (file1.length * 2) + 10;

      const result = repository.smartTruncateDiff(fullDiff, maxChars);

      // Should include 2 files and omit 1
      const includedCount = (result.match(/diff --git/g) || []).length;
      expect(includedCount).toBeLessThanOrEqual(2);
      expect(result).toContain('Fichiers omis');
    });
  });
});
