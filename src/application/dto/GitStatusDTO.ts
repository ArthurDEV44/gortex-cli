/**
 * Data Transfer Objects for Git status and file information
 */

export interface FileStatusDTO {
  readonly path: string;
  readonly status: "modified" | "added" | "deleted" | "renamed" | "untracked";
  readonly label?: string;
}

export interface GitStatusDTO {
  readonly hasChanges: boolean;
  readonly modifiedFiles: string[];
  readonly stagedFiles: string[];
  readonly branch: string;
}

export interface CommitHistoryDTO {
  readonly hash: string;
  readonly message: string;
  readonly date: string;
  readonly author: string;
  readonly isConventional: boolean;
  readonly type?: string;
}

export interface RepositoryStatsDTO {
  readonly totalCommits: number;
  readonly conventionalCommits: number;
  readonly conventionalPercentage: number;
  readonly typeBreakdown: Record<string, number>;
  readonly mostUsedType?: string;
}
