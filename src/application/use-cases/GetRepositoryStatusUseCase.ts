/**
 * Use Case: Get repository status
 * Retrieves current git status and file information
 */

import { IGitRepository } from '../../domain/repositories/IGitRepository.js';
import { GitDataMapper } from '../mappers/GitDataMapper.js';
import { GitStatusDTO, FileStatusDTO } from '../dto/GitStatusDTO.js';

export interface RepositoryStatusResult {
  success: boolean;
  status?: GitStatusDTO;
  files?: FileStatusDTO[];
  error?: string;
}

export class GetRepositoryStatusUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Executes the get repository status use case
   */
  async execute(): Promise<RepositoryStatusResult> {
    try {
      // Validate the repository
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository',
        };
      }

      // Get repository status
      const hasChanges = await this.gitRepository.hasChanges();
      const modifiedFiles = await this.gitRepository.getModifiedFiles();
      const branch = await this.gitRepository.getCurrentBranch();

      // Get file status details
      const filesWithStatus = await this.gitRepository.getModifiedFilesWithStatus();
      const filesDTO = filesWithStatus.map(file => GitDataMapper.fileStatusToDTO(file));

      const statusDTO: GitStatusDTO = {
        hasChanges,
        modifiedFiles,
        stagedFiles: [], // Will be populated if needed
        branch,
      };

      return {
        success: true,
        status: statusDTO,
        files: filesDTO,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
