/**
 * Use Case: Create a commit with a conventional commit message
 * Orchestrates the flow of creating and committing changes
 */

import { IGitRepository } from '../../domain/repositories/IGitRepository.js';
import { CommitMessageMapper } from '../mappers/CommitMessageMapper.js';
import { CommitMessageDTO } from '../dto/CommitMessageDTO.js';

export interface CreateCommitRequest {
  message: CommitMessageDTO;
  push?: boolean;
  remote?: string;
}

export interface CreateCommitResult {
  success: boolean;
  formattedMessage: string;
  error?: string;
  pushed?: boolean;
}

export class CreateCommitUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Executes the create commit use case
   */
  async execute(request: CreateCommitRequest): Promise<CreateCommitResult> {
    try {
      // Validate the repository
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          formattedMessage: '',
          error: 'Not a git repository',
        };
      }

      // Validate the commit message DTO
      const validation = CommitMessageMapper.validateDTO(request.message);
      if (!validation.valid) {
        return {
          success: false,
          formattedMessage: '',
          error: `Invalid commit message: ${validation.errors.join(', ')}`,
        };
      }

      // Convert DTO to domain entity
      const commitMessage = CommitMessageMapper.toDomain(request.message);

      // Format the commit message
      const formattedMessage = commitMessage.format();

      // Create the commit
      await this.gitRepository.createCommit(formattedMessage);

      // Push if requested
      let pushed = false;
      if (request.push) {
        const hasRemote = await this.gitRepository.hasRemote();
        if (!hasRemote) {
          return {
            success: true,
            formattedMessage,
            error: 'Commit created but no remote configured for push',
            pushed: false,
          };
        }

        const remote = request.remote || (await this.gitRepository.getDefaultRemote());
        const branch = await this.gitRepository.getCurrentBranch();
        const hasUpstream = await this.gitRepository.hasUpstream();

        await this.gitRepository.pushToRemote(remote, branch, !hasUpstream);
        pushed = true;
      }

      return {
        success: true,
        formattedMessage,
        pushed,
      };
    } catch (error) {
      return {
        success: false,
        formattedMessage: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
