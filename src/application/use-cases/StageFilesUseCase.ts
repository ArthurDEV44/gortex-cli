/**
 * Use Case: Stage files for commit
 * Handles staging of files with validation
 */

import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";

export interface StageFilesRequest {
  files?: string[]; // If undefined, stage all files
}

export interface StageFilesResult {
  success: boolean;
  stagedFiles: string[];
  error?: string;
}

export class StageFilesUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Executes the stage files use case
   */
  async execute(request: StageFilesRequest = {}): Promise<StageFilesResult> {
    try {
      // Validate the repository
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          stagedFiles: [],
          error: "Not a git repository",
        };
      }

      // Check if there are changes to stage
      const hasChanges = await this.gitRepository.hasChanges();
      if (!hasChanges) {
        return {
          success: false,
          stagedFiles: [],
          error: "No changes to stage",
        };
      }

      // Stage files
      if (!request.files || request.files.length === 0) {
        // Stage all files
        await this.gitRepository.stageAll();
        const allModified = await this.gitRepository.getModifiedFiles();
        return {
          success: true,
          stagedFiles: allModified,
        };
      }
      // Stage specific files
      await this.gitRepository.stageFiles(request.files);
      return {
        success: true,
        stagedFiles: request.files,
      };
    } catch (error) {
      return {
        success: false,
        stagedFiles: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
