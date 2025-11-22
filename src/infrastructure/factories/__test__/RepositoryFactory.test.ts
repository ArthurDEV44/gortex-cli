import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepositoryFactory } from '../RepositoryFactory.js';
import { GitRepositoryImpl } from '../../repositories/GitRepositoryImpl.js';

// Mock the repository implementation
vi.mock('../../repositories/GitRepositoryImpl.js', () => ({
  GitRepositoryImpl: vi.fn().mockImplementation(function (this: any) {
    this.isRepository = vi.fn().mockResolvedValue(true);
    return this;
  }),
}));

describe('RepositoryFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock to default implementation
    vi.mocked(GitRepositoryImpl).mockImplementation(function (this: any) {
      this.isRepository = vi.fn().mockResolvedValue(true);
      return this;
    });
  });

  describe('createGitRepository', () => {
    it('should create repository with default working directory', () => {
      const repository = RepositoryFactory.createGitRepository();

      expect(repository).toBeInstanceOf(GitRepositoryImpl);
      expect(GitRepositoryImpl).toHaveBeenCalledWith(undefined);
    });

    it('should create repository with custom working directory', () => {
      const workingDir = '/path/to/repo';
      const repository = RepositoryFactory.createGitRepository(workingDir);

      expect(repository).toBeInstanceOf(GitRepositoryImpl);
      expect(GitRepositoryImpl).toHaveBeenCalledWith(workingDir);
    });
  });

  describe('createValidatedGitRepository', () => {
    it('should return repository if valid', async () => {
      const repository =
        await RepositoryFactory.createValidatedGitRepository();

      expect(repository).toBeInstanceOf(GitRepositoryImpl);
      expect(repository.isRepository).toHaveBeenCalled();
    });

    it('should throw error if not a valid repository', async () => {
      vi.mocked(GitRepositoryImpl).mockImplementationOnce(function (this: any) {
        this.isRepository = vi.fn().mockResolvedValue(false);
        return this;
      });

      await expect(
        RepositoryFactory.createValidatedGitRepository(),
      ).rejects.toThrow('Directory is not a git repository');
    });

    it('should include working directory in error message', async () => {
      vi.mocked(GitRepositoryImpl).mockImplementationOnce(function (this: any) {
        this.isRepository = vi.fn().mockResolvedValue(false);
        return this;
      });

      const workingDir = '/custom/path';

      await expect(
        RepositoryFactory.createValidatedGitRepository(workingDir),
      ).rejects.toThrow(`Directory is not a git repository: ${workingDir}`);
    });

    it('should include current directory in error if no working dir specified', async () => {
      vi.mocked(GitRepositoryImpl).mockImplementationOnce(function (this: any) {
        this.isRepository = vi.fn().mockResolvedValue(false);
        return this;
      });

      await expect(
        RepositoryFactory.createValidatedGitRepository(),
      ).rejects.toThrow(process.cwd());
    });
  });

  describe('createGitRepositoryIfValid', () => {
    it('should return repository if valid', async () => {
      const repository =
        await RepositoryFactory.createGitRepositoryIfValid();

      expect(repository).toBeInstanceOf(GitRepositoryImpl);
    });

    it('should return null if not valid', async () => {
      vi.mocked(GitRepositoryImpl).mockImplementationOnce(function (this: any) {
        this.isRepository = vi.fn().mockResolvedValue(false);
        return this;
      });

      const repository =
        await RepositoryFactory.createGitRepositoryIfValid();

      expect(repository).toBeNull();
    });

    it('should return null if repository check throws', async () => {
      vi.mocked(GitRepositoryImpl).mockImplementationOnce(function (this: any) {
        this.isRepository = vi.fn().mockRejectedValue(new Error('Git error'));
        return this;
      });

      const repository =
        await RepositoryFactory.createGitRepositoryIfValid();

      expect(repository).toBeNull();
    });

    it('should handle custom working directory', async () => {
      const workingDir = '/custom/path';
      const repository =
        await RepositoryFactory.createGitRepositoryIfValid(workingDir);

      expect(repository).toBeInstanceOf(GitRepositoryImpl);
      expect(GitRepositoryImpl).toHaveBeenCalledWith(workingDir);
    });
  });
});
