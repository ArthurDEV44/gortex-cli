import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BranchOperationsUseCase } from '../BranchOperationsUseCase.js';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository.js';

describe('BranchOperationsUseCase', () => {
  let useCase: BranchOperationsUseCase;
  let mockGitRepository: IGitRepository;

  beforeEach(() => {
    // Create mock repository
    mockGitRepository = {
      isRepository: vi.fn(),
      getCurrentBranch: vi.fn(),
      getAllBranches: vi.fn(),
      branchExists: vi.fn(),
      checkoutBranch: vi.fn(),
      createAndCheckoutBranch: vi.fn(),
    } as any;

    useCase = new BranchOperationsUseCase(mockGitRepository);
  });

  describe('getCurrentBranch', () => {
    it('should return current branch successfully', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getCurrentBranch).mockResolvedValue('main');

      const result = await useCase.getCurrentBranch();

      expect(result.success).toBe(true);
      expect(result.branch).toBe('main');
      expect(mockGitRepository.isRepository).toHaveBeenCalled();
      expect(mockGitRepository.getCurrentBranch).toHaveBeenCalled();
    });

    it('should return error when not a git repository', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const result = await useCase.getCurrentBranch();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a git repository');
      expect(result.branch).toBeUndefined();
      expect(mockGitRepository.getCurrentBranch).not.toHaveBeenCalled();
    });

    it('should handle errors and return error message', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getCurrentBranch).mockRejectedValue(new Error('Git error'));

      const result = await useCase.getCurrentBranch();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Git error');
      expect(result.branch).toBeUndefined();
    });

    it('should handle unknown errors', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getCurrentBranch).mockRejectedValue('Unknown error');

      const result = await useCase.getCurrentBranch();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('getAllBranches', () => {
    it('should return all branches successfully', async () => {
      const branches = ['main', 'feature/test', 'develop'];
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getAllBranches).mockResolvedValue(branches);
      vi.mocked(mockGitRepository.getCurrentBranch).mockResolvedValue('main');

      const result = await useCase.getAllBranches();

      expect(result.success).toBe(true);
      expect(result.branches).toEqual(branches);
      expect(result.currentBranch).toBe('main');
      expect(mockGitRepository.isRepository).toHaveBeenCalled();
      expect(mockGitRepository.getAllBranches).toHaveBeenCalled();
      expect(mockGitRepository.getCurrentBranch).toHaveBeenCalled();
    });

    it('should return error when not a git repository', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const result = await useCase.getAllBranches();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a git repository');
      expect(result.branches).toBeUndefined();
      expect(result.currentBranch).toBeUndefined();
      expect(mockGitRepository.getAllBranches).not.toHaveBeenCalled();
    });

    it('should handle errors and return error message', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getAllBranches).mockRejectedValue(new Error('Git error'));

      const result = await useCase.getAllBranches();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Git error');
      expect(result.branches).toBeUndefined();
    });

    it('should handle errors in getCurrentBranch', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getAllBranches).mockResolvedValue(['main']);
      vi.mocked(mockGitRepository.getCurrentBranch).mockRejectedValue(new Error('Branch error'));

      const result = await useCase.getAllBranches();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Branch error');
    });

    it('should handle unknown errors in getAllBranches', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getAllBranches).mockRejectedValue('Unknown error');

      const result = await useCase.getAllBranches();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('checkoutBranch', () => {
    it('should checkout branch successfully', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(true);
      vi.mocked(mockGitRepository.checkoutBranch).mockResolvedValue(undefined);

      const result = await useCase.checkoutBranch({ branchName: 'feature/test' });

      expect(result.success).toBe(true);
      expect(result.branch).toBe('feature/test');
      expect(mockGitRepository.isRepository).toHaveBeenCalled();
      expect(mockGitRepository.branchExists).toHaveBeenCalledWith('feature/test');
      expect(mockGitRepository.checkoutBranch).toHaveBeenCalledWith('feature/test');
    });

    it('should return error when not a git repository', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const result = await useCase.checkoutBranch({ branchName: 'feature/test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a git repository');
      expect(result.branch).toBeUndefined();
      expect(mockGitRepository.branchExists).not.toHaveBeenCalled();
      expect(mockGitRepository.checkoutBranch).not.toHaveBeenCalled();
    });

    it('should return error when branch does not exist', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);

      const result = await useCase.checkoutBranch({ branchName: 'nonexistent' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Branch "nonexistent" does not exist');
      expect(result.branch).toBeUndefined();
      expect(mockGitRepository.checkoutBranch).not.toHaveBeenCalled();
    });

    it('should handle errors and return error message', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(true);
      vi.mocked(mockGitRepository.checkoutBranch).mockRejectedValue(new Error('Checkout failed'));

      const result = await useCase.checkoutBranch({ branchName: 'feature/test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Checkout failed');
    });

    it('should handle errors in branchExists', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockRejectedValue(new Error('Branch check failed'));

      const result = await useCase.checkoutBranch({ branchName: 'feature/test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Branch check failed');
    });

    it('should handle unknown errors in checkoutBranch', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(true);
      vi.mocked(mockGitRepository.checkoutBranch).mockRejectedValue('Unknown error');

      const result = await useCase.checkoutBranch({ branchName: 'feature/test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('createBranch', () => {
    it('should create branch successfully with checkout true', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);
      vi.mocked(mockGitRepository.createAndCheckoutBranch).mockResolvedValue(undefined);

      const result = await useCase.createBranch({
        branchName: 'feature/new',
        checkout: true,
      });

      expect(result.success).toBe(true);
      expect(result.branch).toBe('feature/new');
      expect(mockGitRepository.isRepository).toHaveBeenCalled();
      expect(mockGitRepository.branchExists).toHaveBeenCalledWith('feature/new');
      expect(mockGitRepository.createAndCheckoutBranch).toHaveBeenCalledWith('feature/new');
    });

    it('should create branch successfully with checkout false', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);
      vi.mocked(mockGitRepository.createAndCheckoutBranch).mockResolvedValue(undefined);

      const result = await useCase.createBranch({
        branchName: 'feature/new',
        checkout: false,
      });

      expect(result.success).toBe(true);
      expect(result.branch).toBe('feature/new');
      expect(mockGitRepository.createAndCheckoutBranch).toHaveBeenCalledWith('feature/new');
    });

    it('should create branch successfully with checkout undefined (defaults to true)', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);
      vi.mocked(mockGitRepository.createAndCheckoutBranch).mockResolvedValue(undefined);

      const result = await useCase.createBranch({
        branchName: 'feature/new',
      });

      expect(result.success).toBe(true);
      expect(result.branch).toBe('feature/new');
      expect(mockGitRepository.createAndCheckoutBranch).toHaveBeenCalledWith('feature/new');
    });

    it('should return error when not a git repository', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const result = await useCase.createBranch({ branchName: 'feature/new' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a git repository');
      expect(result.branch).toBeUndefined();
      expect(mockGitRepository.branchExists).not.toHaveBeenCalled();
      expect(mockGitRepository.createAndCheckoutBranch).not.toHaveBeenCalled();
    });

    it('should return error when branch already exists', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(true);

      const result = await useCase.createBranch({ branchName: 'existing-branch' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Branch "existing-branch" already exists');
      expect(result.branch).toBeUndefined();
      expect(mockGitRepository.createAndCheckoutBranch).not.toHaveBeenCalled();
    });

    it('should handle errors and return error message', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);
      vi.mocked(mockGitRepository.createAndCheckoutBranch).mockRejectedValue(new Error('Create failed'));

      const result = await useCase.createBranch({ branchName: 'feature/new' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Create failed');
    });

    it('should handle errors in branchExists', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockRejectedValue(new Error('Branch check failed'));

      const result = await useCase.createBranch({ branchName: 'feature/new' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Branch check failed');
    });

    it('should handle unknown errors in createBranch', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);
      vi.mocked(mockGitRepository.createAndCheckoutBranch).mockRejectedValue('Unknown error');

      const result = await useCase.createBranch({ branchName: 'feature/new' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('branchExists', () => {
    it('should return true when branch exists', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(true);

      const result = await useCase.branchExists({ branchName: 'main' });

      expect(result.success).toBe(true);
      expect(result.exists).toBe(true);
      expect(mockGitRepository.isRepository).toHaveBeenCalled();
      expect(mockGitRepository.branchExists).toHaveBeenCalledWith('main');
    });

    it('should return false when branch does not exist', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockResolvedValue(false);

      const result = await useCase.branchExists({ branchName: 'nonexistent' });

      expect(result.success).toBe(true);
      expect(result.exists).toBe(false);
      expect(mockGitRepository.branchExists).toHaveBeenCalledWith('nonexistent');
    });

    it('should return error when not a git repository', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const result = await useCase.branchExists({ branchName: 'main' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a git repository');
      expect(result.exists).toBeUndefined();
      expect(mockGitRepository.branchExists).not.toHaveBeenCalled();
    });

    it('should handle errors and return error message', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockRejectedValue(new Error('Git error'));

      const result = await useCase.branchExists({ branchName: 'main' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Git error');
      expect(result.exists).toBeUndefined();
    });

    it('should handle unknown errors', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.branchExists).mockRejectedValue('Unknown error');

      const result = await useCase.branchExists({ branchName: 'main' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });
});

