import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateAICommitUseCase } from '../GenerateAICommitUseCase.js';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository.js';
import type { IAIProvider } from '../../../domain/repositories/IAIProvider.js';
import { SIZE_LIMITS } from '../../../shared/constants/limits.js';
import { CommitMessage } from '../../../domain/entities/CommitMessage.js';
import { CommitType } from '../../../domain/value-objects/CommitType.js';
import { CommitSubject } from '../../../domain/value-objects/CommitSubject.js';

describe('GenerateAICommitUseCase', () => {
  let useCase: GenerateAICommitUseCase;
  let mockGitRepository: IGitRepository;
  let mockAiProvider: IAIProvider;

  beforeEach(() => {
    mockGitRepository = {
      isRepository: vi.fn().mockResolvedValue(true),
      getStagedChangesContext: vi.fn().mockResolvedValue({
        diff: 'short diff',
        files: ['file1.ts'],
        branch: 'main',
        recentCommits: [],
      }),
      getExistingScopes: vi.fn().mockResolvedValue(['scope1', 'scope2']),
    } as any;

    const mockCommitMessage = CommitMessage.create({
      type: CommitType.create('feat'),
      subject: CommitSubject.create('test subject'),
    });

    mockAiProvider = {
      isAvailable: vi.fn().mockResolvedValue(true),
      getName: vi.fn().mockReturnValue('mock-ai'),
      generateCommitMessage: vi.fn().mockResolvedValue({ message: mockCommitMessage }),
    } as any;

    useCase = new GenerateAICommitUseCase(mockGitRepository);
  });

  it('should generate a commit message successfully for a small diff', async () => {
    const result = await useCase.execute({ provider: mockAiProvider });

    expect(result.success).toBe(true);
    expect(result.commit?.subject).toBe('test subject');
    expect(mockAiProvider.generateCommitMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        diff: 'short diff',
      })
    );
  });

  it('should truncate a large diff before generating commit message', async () => {
    const largeDiff = 'a'.repeat(SIZE_LIMITS.MAX_DIFF_LENGTH + 1);
    vi.mocked(mockGitRepository.getStagedChangesContext).mockResolvedValue({
      diff: largeDiff,
      files: ['large-file.ts'],
      branch: 'main',
      recentCommits: [],
    });

    const result = await useCase.execute({ provider: mockAiProvider });

    expect(result.success).toBe(true);

    // Verify that generateCommitMessage was called and the diff was truncated
    const callArgs = vi.mocked(mockAiProvider.generateCommitMessage).mock.calls[0][0];
    expect(callArgs.diff.length).toBeLessThanOrEqual(SIZE_LIMITS.MAX_DIFF_LENGTH + 500); // Allow some overhead for truncation message
    expect(callArgs.diff).toContain('tronqué'); // Check for truncation message in French
  });

  it('should not truncate a diff that is exactly at the threshold', async () => {
    const thresholdDiff = 'a'.repeat(SIZE_LIMITS.MAX_DIFF_LENGTH);
    vi.mocked(mockGitRepository.getStagedChangesContext).mockResolvedValue({
      diff: thresholdDiff,
      files: ['file.ts'],
      branch: 'main',
      recentCommits: [],
    });

    await useCase.execute({ provider: mockAiProvider });

    expect(mockAiProvider.generateCommitMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        diff: thresholdDiff,
      })
    );
  });

  it('should return an error if the provider is not available', async () => {
    vi.mocked(mockAiProvider.isAvailable).mockResolvedValue(false);

    const result = await useCase.execute({ provider: mockAiProvider });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not available or not configured');
  });

  it('should return an error if not in a git repository', async () => {
    vi.mocked(mockGitRepository.isRepository).mockResolvedValue(false);
    
    const result = await useCase.execute({ provider: mockAiProvider });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not a git repository');
  });
});
