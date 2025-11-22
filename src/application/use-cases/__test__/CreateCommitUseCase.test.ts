import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateCommitUseCase } from '../CreateCommitUseCase.js';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository.js';
import { CommitMessageDTO } from '../../dto/CommitMessageDTO.js';

describe('CreateCommitUseCase', () => {
  let useCase: CreateCommitUseCase;
  let mockGitRepository: IGitRepository;

  beforeEach(() => {
    // Create mock repository
    mockGitRepository = {
      isRepository: vi.fn(),
      createCommit: vi.fn(),
      hasRemote: vi.fn(),
      getDefaultRemote: vi.fn(),
      getCurrentBranch: vi.fn(),
      hasUpstream: vi.fn(),
      pushToRemote: vi.fn(),
    } as any;

    useCase = new CreateCommitUseCase(mockGitRepository);
  });

  describe('execute', () => {
    const validCommitDTO: CommitMessageDTO = {
      type: 'feat',
      subject: 'add new feature',
      scope: 'api',
    };

    it('should create a commit successfully', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockResolvedValue(undefined);

      const result = await useCase.execute({ message: validCommitDTO });

      expect(result.success).toBe(true);
      expect(result.formattedMessage).toBe('feat(api): add new feature');
      expect(mockGitRepository.createCommit).toHaveBeenCalledWith('feat(api): add new feature');
    });

    it('should fail if not a git repository', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);

      const result = await useCase.execute({ message: validCommitDTO });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a git repository');
      expect(mockGitRepository.createCommit).not.toHaveBeenCalled();
    });

    it('should fail for invalid commit message', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);

      const invalidDTO: CommitMessageDTO = {
        type: 'feat',
        subject: 'ab', // Too short
      };

      const result = await useCase.execute({ message: invalidDTO });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid commit message');
      expect(mockGitRepository.createCommit).not.toHaveBeenCalled();
    });

    it('should push to remote when requested', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockResolvedValue(undefined);
      vi.mocked(mockGitRepository.hasRemote).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getDefaultRemote).mockResolvedValue('origin');
      vi.mocked(mockGitRepository.getCurrentBranch).mockResolvedValue('main');
      vi.mocked(mockGitRepository.hasUpstream).mockResolvedValue(true);
      vi.mocked(mockGitRepository.pushToRemote).mockResolvedValue(undefined);

      const result = await useCase.execute({ message: validCommitDTO, push: true });

      expect(result.success).toBe(true);
      expect(result.pushed).toBe(true);
      expect(mockGitRepository.pushToRemote).toHaveBeenCalledWith('origin', 'main', false);
    });

    it('should warn if push requested but no remote exists', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockResolvedValue(undefined);
      vi.mocked(mockGitRepository.hasRemote).mockResolvedValue(false);

      const result = await useCase.execute({ message: validCommitDTO, push: true });

      expect(result.success).toBe(true);
      expect(result.pushed).toBe(false);
      expect(result.error).toContain('no remote configured');
      expect(mockGitRepository.pushToRemote).not.toHaveBeenCalled();
    });

    it('should set upstream if branch has no upstream', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockResolvedValue(undefined);
      vi.mocked(mockGitRepository.hasRemote).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getDefaultRemote).mockResolvedValue('origin');
      vi.mocked(mockGitRepository.getCurrentBranch).mockResolvedValue('feature-branch');
      vi.mocked(mockGitRepository.hasUpstream).mockResolvedValue(false);
      vi.mocked(mockGitRepository.pushToRemote).mockResolvedValue(undefined);

      const result = await useCase.execute({ message: validCommitDTO, push: true });

      expect(result.success).toBe(true);
      expect(mockGitRepository.pushToRemote).toHaveBeenCalledWith('origin', 'feature-branch', true);
    });

    it('should use custom remote when specified', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockResolvedValue(undefined);
      vi.mocked(mockGitRepository.hasRemote).mockResolvedValue(true);
      vi.mocked(mockGitRepository.getCurrentBranch).mockResolvedValue('main');
      vi.mocked(mockGitRepository.hasUpstream).mockResolvedValue(true);
      vi.mocked(mockGitRepository.pushToRemote).mockResolvedValue(undefined);

      const result = await useCase.execute({
        message: validCommitDTO,
        push: true,
        remote: 'upstream',
      });

      expect(result.success).toBe(true);
      expect(mockGitRepository.pushToRemote).toHaveBeenCalledWith('upstream', 'main', false);
    });

    it('should handle breaking changes correctly', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockResolvedValue(undefined);

      const breakingCommit: CommitMessageDTO = {
        type: 'feat',
        subject: 'change API',
        breaking: true,
        breakingChangeDescription: 'API endpoint changed',
      };

      const result = await useCase.execute({ message: breakingCommit });

      expect(result.success).toBe(true);
      expect(result.formattedMessage).toContain('feat!: change API');
      expect(result.formattedMessage).toContain('BREAKING CHANGE: API endpoint changed');
    });

    it('should handle commit with body', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockResolvedValue(undefined);

      const commitWithBody: CommitMessageDTO = {
        type: 'feat',
        subject: 'add feature',
        body: 'This is a detailed description of the feature',
      };

      const result = await useCase.execute({ message: commitWithBody });

      expect(result.success).toBe(true);
      expect(result.formattedMessage).toContain('feat: add feature');
      expect(result.formattedMessage).toContain('This is a detailed description');
    });

    it('should handle repository errors gracefully', async () => {
      vi.mocked(mockGitRepository.isRepository).mockResolvedValue(true);
      vi.mocked(mockGitRepository.createCommit).mockRejectedValue(new Error('Git error'));

      const result = await useCase.execute({ message: validCommitDTO });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Git error');
    });
  });
});
