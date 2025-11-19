import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockGit, setupMockScenario, resetMocks, createMockStatus, createMockLog } from '../../__mocks__/simple-git.js';

// Mock simple-git before importing functions
vi.mock('simple-git');

import { analyzeStagedChanges, detectScopeFromFiles } from './analyzer.js';
import { SIZE_LIMITS, GIT_LIMITS } from '../shared/constants/index.js';

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

    it('should truncate diff when exceeding max size', async () => {
      const stagedFiles = ['src/test.ts'];
      const branch = 'main';

      // Create a diff that exceeds SIZE_LIMITS.MAX_DIFF_SIZE
      const longDiff = 'a'.repeat(SIZE_LIMITS.MAX_DIFF_SIZE + 1000);

      (mockGit.status as any).mockResolvedValue(
        createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })))
      );
      (mockGit.diff as any).mockResolvedValue(longDiff);
      (mockGit.revparse as any).mockResolvedValue(branch);
      (mockGit.log as any).mockResolvedValue(createMockLog([]));

      const result = await analyzeStagedChanges();

      // Diff should be truncated
      expect(result.diff.length).toBeLessThan(longDiff.length);
      expect(result.diff).toContain('lignes tronquées pour économiser les tokens');
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

  describe('detectScopeFromFiles', () => {
    it('should detect api scope from api files', () => {
      const files = ['src/api/users.ts', 'src/api/posts.ts'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('api');
    });

    it('should detect ui scope from component files', () => {
      const files = ['src/components/Button.tsx', 'src/ui/Card.tsx'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('ui');
    });

    it('should detect auth scope from auth files', () => {
      const files = ['src/auth/login.ts', 'src/authentication/oauth.ts'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('auth');
    });

    it('should detect database scope from db files', () => {
      const files = ['src/db/migrations/001.ts', 'src/models/User.ts'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('database');
    });

    it('should detect config scope from config files', () => {
      const files = ['config/app.ts', '.env', '.config.json'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('config');
    });

    it('should detect test scope from test files', () => {
      const files = ['src/utils/helpers.test.ts', 'src/api/users.spec.tsx'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('test');
    });

    it('should detect docs scope from documentation files', () => {
      const files = ['docs/api.md', 'README.md', 'documentation/guide.txt'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('docs');
    });

    it('should detect ci scope from CI/CD files', () => {
      const files = ['.github/workflows/test.yml', '.gitlab-ci.yml'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('ci');
    });

    it('should detect build scope from build config files', () => {
      const files = ['webpack.config.js', 'tsconfig.json', 'package.json'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('build');
    });

    it('should return most common scope when multiple scopes match', () => {
      const files = [
        'src/api/users.ts',
        'src/api/posts.ts',
        'src/api/comments.ts',
        'src/components/Button.tsx', // ui scope
      ];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('api'); // api appears 3 times, ui only once
    });

    it('should return undefined when no patterns match', () => {
      const files = ['random/file.txt', 'another/unknown.data'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBeUndefined();
    });

    it('should return undefined for empty file list', () => {
      const scope = detectScopeFromFiles([]);
      expect(scope).toBeUndefined();
    });

    it('should handle case-insensitive matching', () => {
      const files = ['SRC/API/users.ts', 'LIB/ROUTES/posts.ts'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('api');
    });

    it('should handle files with lib prefix', () => {
      const files = ['lib/components/Button.tsx', 'lib/ui/Card.tsx'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('ui');
    });

    it('should count same file only once per scope', () => {
      // A file that matches multiple patterns should still count once per pattern
      const files = ['src/api/test.test.ts']; // Matches both api and test
      const scope = detectScopeFromFiles(files);
      // Should match both patterns, but we're testing the counting logic
      expect(scope).toBeDefined();
    });

    it('should handle files at root level', () => {
      const files = ['package.json', 'tsconfig.json'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('build');
    });

    it('should detect routes and endpoints as api', () => {
      const files = ['src/routes/users.ts', 'src/endpoints/auth.ts'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('api');
    });

    it('should detect views and pages as ui', () => {
      const files = ['src/views/Home.tsx', 'src/pages/About.tsx'];
      const scope = detectScopeFromFiles(files);
      expect(scope).toBe('ui');
    });
  });

  describe('truncateDiff (via analyzeStagedChanges)', () => {
    it('should not truncate diff when under max size', async () => {
      const stagedFiles = ['src/test.ts'];
      const shortDiff = 'a'.repeat(100); // Way under SIZE_LIMITS.MAX_DIFF_SIZE

      (mockGit.status as any).mockResolvedValue(
        createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })))
      );
      (mockGit.diff as any).mockResolvedValue(shortDiff);
      (mockGit.revparse as any).mockResolvedValue('main');
      (mockGit.log as any).mockResolvedValue(createMockLog([]));

      const result = await analyzeStagedChanges();

      expect(result.diff).toBe(shortDiff);
      expect(result.diff).not.toContain('tronquées');
    });

    it('should preserve start and end of diff when truncating', async () => {
      const stagedFiles = ['src/test.ts'];
      const startMarker = 'START_OF_DIFF';
      const endMarker = 'END_OF_DIFF';
      const middleContent = 'x'.repeat(SIZE_LIMITS.MAX_DIFF_SIZE);
      const longDiff = startMarker + middleContent + endMarker;

      (mockGit.status as any).mockResolvedValue(
        createMockStatus(stagedFiles.map(path => ({ path, index: 'M' })))
      );
      (mockGit.diff as any).mockResolvedValue(longDiff);
      (mockGit.revparse as any).mockResolvedValue('main');
      (mockGit.log as any).mockResolvedValue(createMockLog([]));

      const result = await analyzeStagedChanges();

      expect(result.diff).toContain(startMarker);
      expect(result.diff).toContain(endMarker);
      expect(result.diff).toContain('lignes tronquées');
    });
  });
});
