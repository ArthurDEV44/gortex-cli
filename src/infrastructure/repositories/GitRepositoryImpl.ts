/**
 * Implementation of IGitRepository using simple-git
 * Adapts simple-git library to our domain interface
 */

import simpleGit, { SimpleGit } from 'simple-git';
import {
  IGitRepository,
  FileStatus,
  CommitInfo,
  DiffContext,
} from '../../domain/repositories/IGitRepository.js';
import { SIZE_LIMITS, GIT_LIMITS } from '../../shared/constants/index.js';

export class GitRepositoryImpl implements IGitRepository {
  private readonly git: SimpleGit;

  constructor(workingDir?: string) {
    this.git = simpleGit(workingDir);
  }

  async isRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async hasChanges(): Promise<boolean> {
    const status = await this.git.status();
    return !status.isClean();
  }

  async getModifiedFiles(): Promise<string[]> {
    const status = await this.git.status();
    return [
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.renamed.map(r => r.to || r.from),
      ...status.not_added,
    ];
  }

  async getModifiedFilesWithStatus(): Promise<FileStatus[]> {
    const status = await this.git.status();
    const files: FileStatus[] = [];

    // Modified files
    status.modified.forEach(path => {
      files.push({ path, status: 'modified' });
    });

    // Created files
    status.created.forEach(path => {
      files.push({ path, status: 'added' });
    });

    // Deleted files
    status.deleted.forEach(path => {
      files.push({ path, status: 'deleted' });
    });

    // Renamed files
    status.renamed.forEach(r => {
      files.push({ path: r.to || r.from, status: 'renamed' });
    });

    // Untracked files
    status.not_added.forEach(path => {
      files.push({ path, status: 'untracked' });
    });

    return files;
  }

  async stageAll(): Promise<void> {
    await this.git.add('.');
  }

  async stageFiles(files: string[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    try {
      await this.git.add(files);
    } catch (error) {
      // If files were deleted, we need to use 'git add -u'
      if (error instanceof Error && error.message.includes('did not match any files')) {
        await this.git.add(['-u', ...files]);
      } else {
        throw error;
      }
    }
  }

  async createCommit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  async getCommitHistory(maxCount?: number): Promise<CommitInfo[]> {
    const log = await this.git.log({
      maxCount: maxCount || GIT_LIMITS.RECENT_COMMITS_COUNT,
    });

    return log.all.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      date: commit.date,
      author: commit.author_name,
    }));
  }

  async getStagedChangesContext(): Promise<DiffContext> {
    // Get staged files
    const status = await this.git.status();
    const stagedFiles = [
      ...status.staged,
      ...status.modified.filter(f => status.staged.includes(f)),
    ];

    if (stagedFiles.length === 0) {
      throw new Error('Aucun fichier stagé. Utilisez "git add" pour stager des fichiers.');
    }

    // Get diff of staged files
    const diff = await this.git.diff(['--staged', '--no-color']);

    if (!diff || diff.trim().length === 0) {
      throw new Error('Aucun changement détecté dans les fichiers stagés.');
    }

    // Truncate diff if too large
    const truncatedDiff = this.truncateDiff(diff, SIZE_LIMITS.MAX_DIFF_SIZE);

    // Get current branch
    const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);

    // Get recent commits for context
    const recentCommitsLog = await this.git.log({ maxCount: GIT_LIMITS.RECENT_COMMITS_COUNT });
    const recentCommits = recentCommitsLog.all.map(commit => commit.message);

    return {
      diff: truncatedDiff,
      files: stagedFiles,
      branch: branch.trim(),
      recentCommits,
    };
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  }

  async getAllBranches(): Promise<string[]> {
    const summary = await this.git.branchLocal();
    return summary.all;
  }

  async branchExists(branchName: string): Promise<boolean> {
    const branches = await this.getAllBranches();
    return branches.includes(branchName);
  }

  async hasRemote(): Promise<boolean> {
    const remotes = await this.git.getRemotes();
    return remotes.length > 0;
  }

  async getDefaultRemote(): Promise<string> {
    const remotes = await this.git.getRemotes();
    if (remotes.length === 0) {
      throw new Error('No remote configured');
    }
    return remotes[0].name;
  }

  async hasUpstream(): Promise<boolean> {
    try {
      const branch = await this.getCurrentBranch();
      const result = await this.git.raw(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`]);
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  async pushToRemote(remote: string, branch: string, setUpstream?: boolean): Promise<void> {
    if (setUpstream) {
      await this.git.push(['-u', remote, branch]);
    } else {
      await this.git.push(remote, branch);
    }
  }

  /**
   * Truncates diff if too long (keeps beginning and end)
   */
  private truncateDiff(diff: string, maxChars: number): string {
    if (diff.length <= maxChars) {
      return diff;
    }

    const keepChars = Math.floor(maxChars / 2);
    const start = diff.slice(0, keepChars);
    const end = diff.slice(-keepChars);

    const truncatedLines =
      diff.split('\n').length - start.split('\n').length - end.split('\n').length;

    return `${start}\n\n... [${truncatedLines} lignes tronquées pour économiser les tokens] ...\n\n${end}`;
  }
}
