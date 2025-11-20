/**
 * Use Case: Push Operations
 * Handles all remote push-related operations
 */

import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";

export interface CheckRemoteResult {
  success: boolean;
  hasRemote?: boolean;
  remoteName?: string;
  remoteUrl?: string;
  hasUpstream?: boolean;
  error?: string;
}

export interface PushToRemoteRequest {
  remote?: string;
  branch?: string;
  setUpstream?: boolean;
}

export interface PushToRemoteResult {
  success: boolean;
  remote?: string;
  branch?: string;
  error?: string;
}

export class PushOperationsUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Checks remote configuration
   */
  async checkRemote(): Promise<CheckRemoteResult> {
    try {
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: "Not a git repository",
        };
      }

      const hasRemote = await this.gitRepository.hasRemote();
      if (!hasRemote) {
        return {
          success: true,
          hasRemote: false,
        };
      }

      const remoteName = await this.gitRepository.getDefaultRemote();
      const remoteUrl = await this.gitRepository.getRemoteUrl(remoteName);
      const hasUpstream = await this.gitRepository.hasUpstream();

      return {
        success: true,
        hasRemote: true,
        remoteName,
        remoteUrl,
        hasUpstream,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Pushes to remote
   */
  async pushToRemote(
    request: PushToRemoteRequest = {},
  ): Promise<PushToRemoteResult> {
    try {
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: "Not a git repository",
        };
      }

      // Check if remote exists
      const hasRemote = await this.gitRepository.hasRemote();
      if (!hasRemote) {
        return {
          success: false,
          error: "No remote configured",
        };
      }

      // Get remote name (use provided or default)
      const remoteName =
        request.remote || (await this.gitRepository.getDefaultRemote());

      // Get branch name (use provided or current)
      const branchName =
        request.branch || (await this.gitRepository.getCurrentBranch());

      // Determine if we need to set upstream
      const hasUpstream = await this.gitRepository.hasUpstream();
      const setUpstream =
        request.setUpstream !== undefined ? request.setUpstream : !hasUpstream;

      // Push
      await this.gitRepository.pushToRemote(
        remoteName,
        branchName,
        setUpstream,
      );

      return {
        success: true,
        remote: remoteName,
        branch: branchName,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
