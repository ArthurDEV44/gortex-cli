/**
 * Repository interface for Git operations
 * Defines the contract that infrastructure implementations must follow
 * Part of the Domain layer - contains no implementation details
 */

export interface FileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
}

export interface CommitInfo {
  hash: string;
  message: string;
  date: string;
  author: string;
}

export interface DiffContext {
  diff: string;
  files: string[];
  branch: string;
  recentCommits: string[];
}

/**
 * Git Repository interface
 * All git-related operations go through this interface
 */
export interface IGitRepository {
  /**
   * Checks if the current directory is a git repository
   */
  isRepository(): Promise<boolean>;

  /**
   * Checks if there are any uncommitted changes
   */
  hasChanges(): Promise<boolean>;

  /**
   * Gets the list of modified files
   */
  getModifiedFiles(): Promise<string[]>;

  /**
   * Gets the list of modified files with their status
   */
  getModifiedFilesWithStatus(): Promise<FileStatus[]>;

  /**
   * Stages all changes
   */
  stageAll(): Promise<void>;

  /**
   * Stages specific files
   */
  stageFiles(files: string[]): Promise<void>;

  /**
   * Creates a commit with the given message
   */
  createCommit(message: string): Promise<void>;

  /**
   * Gets the commit history
   */
  getCommitHistory(maxCount?: number): Promise<CommitInfo[]>;

  /**
   * Gets the staged changes with context for AI analysis
   */
  getStagedChangesContext(): Promise<DiffContext>;

  /**
   * Gets the current branch name
   */
  getCurrentBranch(): Promise<string>;

  /**
   * Gets all local branches
   */
  getAllBranches(): Promise<string[]>;

  /**
   * Checks if a branch exists
   */
  branchExists(branchName: string): Promise<boolean>;

  /**
   * Checks out an existing branch
   */
  checkoutBranch(branchName: string): Promise<void>;

  /**
   * Creates a new branch and checks it out
   */
  createAndCheckoutBranch(branchName: string): Promise<void>;

  /**
   * Checks if a remote exists
   */
  hasRemote(): Promise<boolean>;

  /**
   * Gets the URL of a remote
   */
  getRemoteUrl(remoteName: string): Promise<string>;

  /**
   * Gets the default remote name
   */
  getDefaultRemote(): Promise<string>;

  /**
   * Checks if current branch has upstream
   */
  hasUpstream(): Promise<boolean>;

  /**
   * Pushes to remote
   */
  pushToRemote(remote: string, branch: string, setUpstream?: boolean): Promise<void>;
}
