/**
 * Use Case: Analyze commit history
 * Analyzes repository commit history and generates statistics
 */

import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import type {
  CommitHistoryDTO,
  RepositoryStatsDTO,
} from "../dto/GitStatusDTO.js";
import { GitDataMapper } from "../mappers/GitDataMapper.js";

export interface AnalyzeCommitHistoryRequest {
  maxCount?: number;
}

export interface AnalyzeCommitHistoryResult {
  success: boolean;
  commits?: CommitHistoryDTO[];
  stats?: RepositoryStatsDTO;
  error?: string;
}

export class AnalyzeCommitHistoryUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Executes the analyze commit history use case
   */
  async execute(
    request: AnalyzeCommitHistoryRequest = {},
  ): Promise<AnalyzeCommitHistoryResult> {
    try {
      // Validate the repository
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: "Not a git repository",
        };
      }

      // Get commit history
      const commitHistory = await this.gitRepository.getCommitHistory(
        request.maxCount,
      );

      // Convert to DTOs
      const commitsDTO = commitHistory.map((commit) =>
        GitDataMapper.commitInfoToDTO(commit),
      );

      // Generate statistics
      const messages = commitHistory.map((c) => c.message);
      const statsDTO = GitDataMapper.commitsToStatsDTO(messages);

      return {
        success: true,
        commits: commitsDTO,
        stats: statsDTO,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
