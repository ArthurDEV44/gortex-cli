/**
 * Data Transfer Object for commit message data
 * Used to transfer data between layers without exposing domain entities
 */

export interface CommitMessageDTO {
  readonly type: string;
  readonly subject: string;
  readonly scope?: string;
  readonly body?: string;
  readonly breaking?: boolean;
  readonly breakingChangeDescription?: string;
}

export interface FormattedCommitDTO {
  readonly message: string;
  readonly type: string;
  readonly scope?: string;
  readonly subject: string;
}
