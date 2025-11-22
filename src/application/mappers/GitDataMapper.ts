/**
 * Mapper to convert between Git domain data and DTOs
 */

import type {
  CommitInfo,
  FileStatus,
} from "../../domain/repositories/IGitRepository.js";
import { CommitMessageService } from "../../domain/services/CommitMessageService.js";
import type {
  CommitHistoryDTO,
  FileStatusDTO,
  RepositoryStatsDTO,
} from "../dto/GitStatusDTO.js";

/**
 * Gets a human-readable label for file status
 */
function getStatusLabel(status: FileStatus["status"]): string {
  const labels: Record<FileStatus["status"], string> = {
    modified: "Modified",
    added: "Added",
    deleted: "Deleted",
    renamed: "Renamed",
    untracked: "Untracked",
  };

  return labels[status];
}

/**
 * Converts FileStatus domain data to DTO
 */
export function fileStatusToDTO(fileStatus: FileStatus): FileStatusDTO {
  return {
    path: fileStatus.path,
    status: fileStatus.status,
    label: getStatusLabel(fileStatus.status),
  };
}

/**
 * Converts CommitInfo to DTO with conventional commit analysis
 */
export function commitInfoToDTO(commitInfo: CommitInfo): CommitHistoryDTO {
  const parsed = CommitMessageService.parseConventionalCommit(
    commitInfo.message,
  );

  return {
    hash: commitInfo.hash,
    message: commitInfo.message,
    date: commitInfo.date,
    author: commitInfo.author,
    isConventional: parsed !== null,
    type: parsed?.type,
  };
}

/**
 * Converts commit messages array to repository stats DTO
 */
export function commitsToStatsDTO(messages: string[]): RepositoryStatsDTO {
  const stats = CommitMessageService.analyzeCommitStats(messages);

  // Find most used type
  let mostUsedType: string | undefined;
  let maxCount = 0;
  for (const [type, count] of Object.entries(stats.typeBreakdown)) {
    if (count > maxCount) {
      maxCount = count;
      mostUsedType = type;
    }
  }

  return {
    totalCommits: stats.total,
    conventionalCommits: stats.conventional,
    conventionalPercentage: stats.percentage,
    typeBreakdown: stats.typeBreakdown,
    mostUsedType,
  };
}

/**
 * @deprecated Use individual exported functions instead
 * @see {fileStatusToDTO}, {commitInfoToDTO}, {commitsToStatsDTO}
 */
export const GitDataMapper = {
  fileStatusToDTO,
  commitInfoToDTO,
  commitsToStatsDTO,
};
