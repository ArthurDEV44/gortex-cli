/**
 * Implementation of IGitRepository using simple-git
 * Adapts simple-git library to our domain interface
 */

import simpleGit, { type SimpleGit } from "simple-git";
import type {
  CommitInfo,
  DiffContext,
  FileStatus,
  IGitRepository,
} from "../../domain/repositories/IGitRepository.js";
import { GIT_LIMITS } from "../../shared/constants/index.js";

export class GitRepositoryImpl implements IGitRepository {
  private readonly git: SimpleGit;

  constructor(workingDir?: string) {
    this.git = simpleGit(workingDir);
  }

  async isRepository(): Promise<boolean> {
    try {
      await this.git.revparse(["--git-dir"]);
      return true;
    } catch {
      return false;
    }
  }

  async getGitDirectory(): Promise<string> {
    const gitDir = await this.git.revparse(["--git-dir"]);
    return gitDir.trim();
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
      ...status.renamed.map((r) => r.to || r.from),
      ...status.not_added,
    ];
  }

  async getModifiedFilesWithStatus(): Promise<FileStatus[]> {
    const status = await this.git.status();
    const files: FileStatus[] = [];

    // Modified files
    status.modified.forEach((path) => {
      files.push({ path, status: "modified" });
    });

    // Created files
    status.created.forEach((path) => {
      files.push({ path, status: "added" });
    });

    // Deleted files
    status.deleted.forEach((path) => {
      files.push({ path, status: "deleted" });
    });

    // Renamed files
    status.renamed.forEach((r) => {
      files.push({ path: r.to || r.from, status: "renamed" });
    });

    // Untracked files
    status.not_added.forEach((path) => {
      files.push({ path, status: "untracked" });
    });

    return files;
  }

  async stageAll(): Promise<void> {
    await this.git.add(".");
  }

  async stageFiles(files: string[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    // Get the status to determine which files are deleted
    const status = await this.git.status();
    const deletedFiles = new Set(status.deleted);

    // Separate files into deleted and non-deleted
    const filesToAdd: string[] = [];
    const filesToRemove: string[] = [];

    for (const file of files) {
      if (deletedFiles.has(file)) {
        filesToRemove.push(file);
      } else {
        filesToAdd.push(file);
      }
    }

    // Stage non-deleted files with git add
    if (filesToAdd.length > 0) {
      await this.git.add(filesToAdd);
    }

    // Stage deleted files with git rm
    if (filesToRemove.length > 0) {
      await this.git.rm(filesToRemove);
    }
  }

  async createCommit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  async getCommitHistory(maxCount?: number): Promise<CommitInfo[]> {
    const log = await this.git.log({
      maxCount: maxCount || GIT_LIMITS.RECENT_COMMITS_COUNT,
    });

    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      date: commit.date,
      author: commit.author_name,
    }));
  }

  async getStagedChangesContext(): Promise<DiffContext> {
    // Get staged files
    const status = await this.git.status();
    let stagedFiles = [
      ...status.staged,
      ...status.modified.filter((f) => status.staged.includes(f)),
    ];

    // Filter out non-relevant files for AI context
    const ignoredFiles = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock"];
    stagedFiles = stagedFiles.filter(
      (file) => !ignoredFiles.some((ignored) => file.endsWith(ignored)),
    );

    if (stagedFiles.length === 0) {
      // If only ignored files were staged, treat as no changes
      throw new Error(
        "Aucun fichier pertinent stagé. Seuls les fichiers de lock ou autres fichiers ignorés ont été détectés.",
      );
    }

    // Get diff of staged files with MORE context lines for better AI understanding
    const diff = await this.git.diff(["--staged", "--no-color", "-U5"]);

    if (!diff || diff.trim().length === 0) {
      throw new Error("Aucun changement détecté dans les fichiers stagés.");
    }

    // Get current branch
    const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);

    // Get recent commits for context
    const recentCommitsLog = await this.git.log({
      maxCount: GIT_LIMITS.RECENT_COMMITS_COUNT,
    });
    const recentCommits = recentCommitsLog.all.map((commit) => commit.message);

    return {
      diff: diff,
      files: stagedFiles,
      branch: branch.trim(),
      recentCommits,
    };
  }

  async getExistingScopes(): Promise<string[]> {
    const log = await this.git.log({ maxCount: 200 });
    const scopes = new Set<string>();

    for (const commit of log.all) {
      const match = commit.message.match(/^(?:\w+)\(([^)]+)\)/);
      if (match?.[1]) {
        scopes.add(match[1]);
      }
    }

    return Array.from(scopes);
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);
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

  async checkoutBranch(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
  }

  async createAndCheckoutBranch(branchName: string): Promise<void> {
    await this.git.checkoutLocalBranch(branchName);
  }

  async hasRemote(): Promise<boolean> {
    const remotes = await this.git.getRemotes();
    return remotes.length > 0;
  }

  async getRemoteUrl(remoteName: string): Promise<string> {
    const remotes = await this.git.getRemotes(true);
    const remote = remotes.find((r) => r.name === remoteName);
    if (!remote) {
      throw new Error(`Remote "${remoteName}" not found`);
    }
    return remote.refs.fetch || remote.refs.push || "";
  }

  async getDefaultRemote(): Promise<string> {
    const remotes = await this.git.getRemotes();
    if (remotes.length === 0) {
      throw new Error("No remote configured");
    }
    return remotes[0].name;
  }

  async hasUpstream(): Promise<boolean> {
    try {
      const branch = await this.getCurrentBranch();
      const result = await this.git.raw([
        "rev-parse",
        "--abbrev-ref",
        `${branch}@{upstream}`,
      ]);
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  async pushToRemote(
    remote: string,
    branch: string,
    setUpstream?: boolean,
  ): Promise<void> {
    if (setUpstream) {
      await this.git.push(["-u", remote, branch]);
    } else {
      await this.git.push(remote, branch);
    }
  }

  /**
   * Intelligently truncates diff by file priority
   * Keeps complete file diffs when possible, prioritizing smaller changes
   */
  smartTruncateDiff(diff: string, maxChars: number): string {
    if (diff.length <= maxChars) {
      return diff;
    }

    // Split diff into file chunks
    const fileChunks = this.splitDiffByFile(diff);

    // Sort by size (smaller files first - likely more focused changes)
    const sortedChunks = fileChunks.sort(
      (a, b) => a.content.length - b.content.length,
    );

    let result = "";
    let totalLength = 0;
    const includedFiles: string[] = [];
    const excludedFiles: string[] = [];

    // Include complete file diffs until we hit the limit
    for (const chunk of sortedChunks) {
      if (totalLength + chunk.content.length <= maxChars) {
        result += `${chunk.content}\n`;
        totalLength += chunk.content.length + 1;
        includedFiles.push(chunk.filename);
      } else {
        excludedFiles.push(chunk.filename);
      }
    }

    // Add truncation message with file list
    if (excludedFiles.length > 0) {
      const truncationMsg =
        `\n... [Diff tronqué: ${excludedFiles.length} fichier(s) omis pour économiser les tokens] ...\n` +
        `Fichiers omis: ${excludedFiles.join(", ")}\n` +
        `Fichiers inclus (${includedFiles.length}): ${includedFiles.join(", ")}\n`;
      result = truncationMsg + result;
    }

    return result;
  }

  /**
   * Splits a unified diff into chunks per file
   */
  private splitDiffByFile(
    diff: string,
  ): Array<{ filename: string; content: string }> {
    const chunks: Array<{ filename: string; content: string }> = [];
    const lines = diff.split("\n");

    let currentFile = "";
    let currentContent: string[] = [];

    for (const line of lines) {
      // New file marker
      if (line.startsWith("diff --git")) {
        // Save previous file
        if (currentFile && currentContent.length > 0) {
          chunks.push({
            filename: currentFile,
            content: currentContent.join("\n"),
          });
        }

        // Extract filename
        const match = line.match(/diff --git a\/(.+?) b\//);
        currentFile = match ? match[1] : "unknown";
        currentContent = [line];
      } else {
        currentContent.push(line);
      }
    }

    // Save last file
    if (currentFile && currentContent.length > 0) {
      chunks.push({
        filename: currentFile,
        content: currentContent.join("\n"),
      });
    }

    return chunks;
  }
}
