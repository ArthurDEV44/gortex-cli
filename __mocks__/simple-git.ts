/**
 * Mock implementation of simple-git for testing
 * This allows us to test git-related functions without actually using git
 */

import { vi } from 'vitest';
import type { SimpleGit, StatusResult, LogResult, BranchSummary, RemoteWithRefs } from 'simple-git';

/**
 * Creates a mock status result
 */
export const createMockStatus = (files: Array<{ path: string; working_dir?: string; index?: string }> = []): StatusResult => ({
  not_added: [],
  conflicted: [],
  created: [],
  deleted: [],
  modified: files.filter(f => f.working_dir === 'M' || f.index === 'M').map(f => f.path),
  renamed: [],
  staged: files.filter(f => f.index).map(f => f.path),
  files: files.map(f => ({
    path: f.path,
    index: f.index || ' ',
    working_dir: f.working_dir || ' ',
  })),
  ahead: 0,
  behind: 0,
  current: 'main',
  tracking: 'origin/main',
  detached: false,
  isClean: () => files.length === 0,
});

/**
 * Creates a mock log result
 */
export const createMockLog = (commits: Array<{ hash: string; message: string; date?: string; author_name?: string }> = []): LogResult => ({
  all: commits.map(c => ({
    hash: c.hash,
    date: c.date || '2024-01-01',
    message: c.message,
    refs: '',
    body: '',
    author_name: c.author_name || 'Test User',
    author_email: 'test@example.com',
  })),
  total: commits.length,
  latest: commits[0] ? {
    hash: commits[0].hash,
    date: commits[0].date || '2024-01-01',
    message: commits[0].message,
    refs: '',
    body: '',
    author_name: commits[0].author_name || 'Test User',
    author_email: 'test@example.com',
  } : null,
});

/**
 * Creates a mock branch summary
 */
export const createMockBranchSummary = (branches: string[] = ['main'], current = 'main'): BranchSummary => ({
  all: branches,
  branches: branches.reduce((acc, branch) => {
    acc[branch] = {
      current: branch === current,
      name: branch,
      commit: 'abc123',
      label: branch,
    };
    return acc;
  }, {} as any),
  current,
  detached: false,
});

/**
 * Creates a mock remote
 */
export const createMockRemote = (name: string, fetchUrl: string, pushUrl?: string): RemoteWithRefs => ({
  name,
  refs: {
    fetch: fetchUrl,
    push: pushUrl || fetchUrl,
  },
});

/**
 * Mock SimpleGit instance with all commonly used methods
 */
export const mockGit: Partial<SimpleGit> = {
  // Status operations
  status: vi.fn().mockResolvedValue(createMockStatus()),

  // Staging operations
  add: vi.fn().mockResolvedValue(undefined),

  // Commit operations
  commit: vi.fn().mockResolvedValue({ commit: 'abc123' }),

  // Log operations
  log: vi.fn().mockResolvedValue(createMockLog()),

  // Diff operations
  diff: vi.fn().mockResolvedValue(''),

  // Branch operations
  revparse: vi.fn().mockResolvedValue('main'),
  branchLocal: vi.fn().mockResolvedValue(createMockBranchSummary()),
  checkout: vi.fn().mockResolvedValue(undefined),
  checkoutLocalBranch: vi.fn().mockResolvedValue(undefined),

  // Remote operations
  getRemotes: vi.fn().mockResolvedValue([createMockRemote('origin', 'https://github.com/test/repo.git')]),
  push: vi.fn().mockResolvedValue(undefined),

  // Raw operations
  raw: vi.fn().mockResolvedValue(''),
};

/**
 * Factory function that returns the mock git instance
 */
export const simpleGit = vi.fn(() => mockGit as SimpleGit);

/**
 * Reset all mocks to their default state
 */
export const resetMocks = () => {
  Object.values(mockGit).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
  });
};

/**
 * Helper to set up specific mock scenarios
 */
export const setupMockScenario = {
  /**
   * Repository with no changes
   */
  cleanRepo: () => {
    (mockGit.status as any).mockResolvedValue(createMockStatus([]));
    (mockGit.revparse as any).mockResolvedValue('.git');
  },

  /**
   * Repository with uncommitted changes
   */
  dirtyRepo: (files: string[] = ['file1.ts', 'file2.ts']) => {
    (mockGit.status as any).mockResolvedValue(
      createMockStatus(files.map(path => ({ path, working_dir: 'M' })))
    );
  },

  /**
   * Repository with staged changes
   */
  stagedChanges: (files: string[] = ['file1.ts']) => {
    (mockGit.status as any).mockResolvedValue(
      createMockStatus(files.map(path => ({ path, index: 'M' })))
    );
    (mockGit.diff as any).mockResolvedValue(`diff --git a/${files[0]} b/${files[0]}\n+new content`);
  },

  /**
   * Not a git repository
   */
  notARepo: () => {
    (mockGit.revparse as any).mockRejectedValue(new Error('not a git repository'));
  },

  /**
   * Repository with commit history
   */
  withHistory: (commits: Array<{ hash: string; message: string }>) => {
    (mockGit.log as any).mockResolvedValue(createMockLog(commits));
  },

  /**
   * Repository with specific branch
   */
  onBranch: (branchName: string) => {
    (mockGit.revparse as any).mockImplementation((args: string[]) => {
      if (args.includes('--abbrev-ref')) {
        return Promise.resolve(branchName);
      }
      return Promise.resolve('.git');
    });
    (mockGit.branchLocal as any).mockResolvedValue(createMockBranchSummary([branchName, 'main'], branchName));
  },

  /**
   * Repository with remote
   */
  withRemote: (name = 'origin', url = 'https://github.com/test/repo.git') => {
    (mockGit.getRemotes as any).mockResolvedValue([createMockRemote(name, url)]);
  },

  /**
   * Repository without remote
   */
  noRemote: () => {
    (mockGit.getRemotes as any).mockResolvedValue([]);
  },
};

export default simpleGit;
