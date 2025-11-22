import { describe, it, expect, vi, beforeEach } from 'vitest';

// Créer mockGit avec vi.hoisted() pour éviter les problèmes de hoisting
const { mockGit } = vi.hoisted(() => {
  return {
    mockGit: {
      status: vi.fn(),
      diff: vi.fn(),
      revparse: vi.fn(),
      log: vi.fn(),
    },
  };
});

// Mock simple-git - doit être défini avant les imports
vi.mock('simple-git', () => {
  return {
    default: vi.fn(() => mockGit),
  };
});

// Imports après les mocks
import { analyzeStagedChanges } from '../analyzer.js';
import simpleGit from 'simple-git';

describe('analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeStagedChanges', () => {
    it('should analyze staged changes successfully', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts', 'file2.ts'],
        modified: [],
      });
      mockGit.diff.mockResolvedValue('diff content');
      mockGit.revparse.mockResolvedValue('main');
      mockGit.log.mockResolvedValue({
        all: [
          { message: 'feat: previous commit' },
          { message: 'fix: another commit' },
        ],
      });

      const result = await analyzeStagedChanges();

      expect(result).toEqual({
        diff: 'diff content',
        context: {
          files: ['file1.ts', 'file2.ts'],
          branch: 'main',
          recentCommits: ['feat: previous commit', 'fix: another commit'],
        },
      });

      expect(mockGit.status).toHaveBeenCalled();
      expect(mockGit.diff).toHaveBeenCalledWith(['--staged', '--no-color']);
      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
      expect(mockGit.log).toHaveBeenCalled();
    });

    it('should throw error when no files are staged', async () => {
      mockGit.status.mockResolvedValue({
        staged: [],
        modified: [],
      });

      await expect(analyzeStagedChanges()).rejects.toThrow(
        'Aucun fichier stagé. Utilisez "git add" pour stager des fichiers.',
      );
    });

    it('should throw error when diff is empty', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts'],
        modified: [],
      });
      mockGit.diff.mockResolvedValue('');

      await expect(analyzeStagedChanges()).rejects.toThrow(
        'Aucun changement détecté dans les fichiers stagés.',
      );
    });

    it('should throw error when diff is only whitespace', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts'],
        modified: [],
      });
      mockGit.diff.mockResolvedValue('   \n\t  \n  ');

      await expect(analyzeStagedChanges()).rejects.toThrow(
        'Aucun changement détecté dans les fichiers stagés.',
      );
    });

    it('should include modified files that are also staged', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts'],
        modified: ['file1.ts', 'file2.ts'],
      });
      mockGit.diff.mockResolvedValue('diff content');
      mockGit.revparse.mockResolvedValue('main');
      mockGit.log.mockResolvedValue({ all: [] });

      const result = await analyzeStagedChanges();

      expect(result.context.files).toContain('file1.ts');
      expect(result.context.files.length).toBeGreaterThanOrEqual(1);
    });

    it('should trim whitespace from branch name', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts'],
        modified: [],
      });
      mockGit.diff.mockResolvedValue('diff content');
      mockGit.revparse.mockResolvedValue('  main  ');
      mockGit.log.mockResolvedValue({ all: [] });

      const result = await analyzeStagedChanges();

      expect(result.context.branch).toBe('main');
    });

    it('should include recent commits in context', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts'],
        modified: [],
      });
      mockGit.diff.mockResolvedValue('diff content');
      mockGit.revparse.mockResolvedValue('feature-branch');
      mockGit.log.mockResolvedValue({
        all: [
          { message: 'feat: first commit' },
          { message: 'fix: second commit' },
          { message: 'docs: third commit' },
        ],
      });

      const result = await analyzeStagedChanges();

      expect(result.context.recentCommits).toEqual([
        'feat: first commit',
        'fix: second commit',
        'docs: third commit',
      ]);
    });

    it('should handle empty commit history', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts'],
        modified: [],
      });
      mockGit.diff.mockResolvedValue('diff content');
      mockGit.revparse.mockResolvedValue('main');
      mockGit.log.mockResolvedValue({ all: [] });

      const result = await analyzeStagedChanges();

      expect(result.context.recentCommits).toEqual([]);
    });

    it('should handle multiple staged files', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts', 'file2.ts', 'file3.ts'],
        modified: [],
      });
      mockGit.diff.mockResolvedValue('diff content');
      mockGit.revparse.mockResolvedValue('main');
      mockGit.log.mockResolvedValue({ all: [] });

      const result = await analyzeStagedChanges();

      expect(result.context.files).toEqual(['file1.ts', 'file2.ts', 'file3.ts']);
    });
  });
});
