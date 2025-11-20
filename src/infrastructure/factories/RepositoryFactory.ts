/**
 * Factory for creating Repository instances
 * Handles instantiation of repository implementations
 */

import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import { GitRepositoryImpl } from "../repositories/GitRepositoryImpl.js";

export class RepositoryFactory {
  /**
   * Creates a Git repository instance
   * @param workingDir Optional working directory path (defaults to current directory)
   * @returns An instance implementing IGitRepository
   */
  static createGitRepository(workingDir?: string): IGitRepository {
    return new GitRepositoryImpl(workingDir);
  }

  /**
   * Creates a Git repository instance with validation
   * @param workingDir Optional working directory path
   * @returns An instance implementing IGitRepository if the directory is a valid git repo
   * @throws Error if the directory is not a git repository
   */
  static async createValidatedGitRepository(
    workingDir?: string,
  ): Promise<IGitRepository> {
    const repository = new GitRepositoryImpl(workingDir);
    const isRepo = await repository.isRepository();

    if (!isRepo) {
      throw new Error(
        `Directory is not a git repository: ${workingDir || process.cwd()}`,
      );
    }

    return repository;
  }

  /**
   * Creates a Git repository instance with availability checking
   * @param workingDir Optional working directory path
   * @returns An instance implementing IGitRepository if valid, null otherwise
   */
  static async createGitRepositoryIfValid(
    workingDir?: string,
  ): Promise<IGitRepository | null> {
    try {
      return await RepositoryFactory.createValidatedGitRepository(workingDir);
    } catch {
      return null;
    }
  }
}
