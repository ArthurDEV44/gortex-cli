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

import { analyzeStagedChanges } from './analyzer.js';
import { GIT_LIMITS } from '../shared/constants/index.js';

describe('analyzer.ts', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('analyzeStagedChanges', () => {
    it('should analyze staged changes and return diff with context', async () => {
      const stagedFiles = ['src/utils/test.ts', 'src/components/Button.tsx'];
      const diffContent = 'diff --git a/src/utils/test.ts\n+new content';
      const branch = 'feature/test';
      const commits = [
        { hash: 'abc123', message: 'feat: add feature' },
        { hash: 'def456', message: 'fix: resolve bug' },
      ];

      // Mock git status with staged files only (not in modified)
      const mockStatus = createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })));
      // Override modified to be empty since these are only staged, not modified in working dir
      mockStatus.modified = [];
      (mockGit.status as any).mockResolvedValue(mockStatus);

      // Mock git diff
      (mockGit.diff as any).mockResolvedValue(diffContent);

      // Mock git revparse for branch
      (mockGit.revparse as any).mockResolvedValue(branch);

      // Mock git log for recent commits
      (mockGit.log as any).mockResolvedValue(createMockLog(commits));

      const result = await analyzeStagedChanges();

      expect(result.diff).toBe(diffContent);
      expect(result.context).toEqual({
        files: stagedFiles,
        branch: branch,
        recentCommits: ['feat: add feature', 'fix: resolve bug'],
      });

      expect(mockGit.status).toHaveBeenCalled();
      expect(mockGit.diff).toHaveBeenCalledWith(['--staged', '--no-color']);
      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: GIT_LIMITS.RECENT_COMMITS_COUNT });
    });

    it('should throw error when no staged files', async () => {
      setupMockScenario.cleanRepo();

      await expect(analyzeStagedChanges()).rejects.toThrow(
        'Aucun fichier stagé. Utilisez "git add" pour stager des fichiers.'
      );
    });

    it('should throw error when diff is empty', async () => {
      const stagedFiles = ['src/test.ts'];

      (mockGit.status as any).mockResolvedValue(
        createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })))
      );

      // Empty diff
      (mockGit.diff as any).mockResolvedValue('');

      await expect(analyzeStagedChanges()).rejects.toThrow(
        'Aucun changement détecté dans les fichiers stagés.'
      );
    });

    it('should throw error when diff is only whitespace', async () => {
      const stagedFiles = ['src/test.ts'];

      (mockGit.status as any).mockResolvedValue(
        createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })))
      );

      // Whitespace-only diff
      (mockGit.diff as any).mockResolvedValue('   \n\n  \t  ');

      await expect(analyzeStagedChanges()).rejects.toThrow(
        'Aucun changement détecté dans les fichiers stagés.'
      );
    });

    it('should handle modified files that are also staged', async () => {
      const stagedFiles = ['file1.ts', 'file2.ts'];

      (mockGit.status as any).mockResolvedValue({
        ...createMockStatus([]),
        staged: stagedFiles,
        modified: ['file1.ts'], // file1 is both staged and modified
      });

      (mockGit.diff as any).mockResolvedValue('diff content');
      (mockGit.revparse as any).mockResolvedValue('main');
      (mockGit.log as any).mockResolvedValue(createMockLog([]));

      const result = await analyzeStagedChanges();

      expect(result.context.files).toContain('file1.ts');
      expect(result.context.files).toContain('file2.ts');
    });

    it('should trim whitespace from branch name', async () => {
      const stagedFiles = ['src/test.ts'];

      (mockGit.status as any).mockResolvedValue(
        createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })))
      );
      (mockGit.diff as any).mockResolvedValue('diff content');
      (mockGit.revparse as any).mockResolvedValue('  feature/test  \n');
      (mockGit.log as any).mockResolvedValue(createMockLog([]));

      const result = await analyzeStagedChanges();

      expect(result.context.branch).toBe('feature/test');
    });

    it('should include recent commits in context', async () => {
      const stagedFiles = ['src/test.ts'];
      const commits = [
        { hash: '1', message: 'first commit' },
        { hash: '2', message: 'second commit' },
        { hash: '3', message: 'third commit' },
      ];

      (mockGit.status as any).mockResolvedValue(
        createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })))
      );
      (mockGit.diff as any).mockResolvedValue('diff content');
      (mockGit.revparse as any).mockResolvedValue('main');
      (mockGit.log as any).mockResolvedValue(createMockLog(commits));

      const result = await analyzeStagedChanges();

      expect(result.context.recentCommits).toEqual([
        'first commit',
        'second commit',
        'third commit',
      ]);
    });
  });
});
