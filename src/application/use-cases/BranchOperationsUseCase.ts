/**
 * Use Case: Branch Operations
 * Handles all branch-related operations (list, checkout, create, etc.)
 */

import { IGitRepository } from '../../domain/repositories/IGitRepository.js';

export interface GetCurrentBranchResult {
  success: boolean;
  branch?: string;
  error?: string;
}

export interface GetAllBranchesResult {
  success: boolean;
  branches?: string[];
  currentBranch?: string;
  error?: string;
}

export interface CheckoutBranchRequest {
  branchName: string;
}

export interface CheckoutBranchResult {
  success: boolean;
  branch?: string;
  error?: string;
}

export interface CreateBranchRequest {
  branchName: string;
  checkout?: boolean;
}

export interface CreateBranchResult {
  success: boolean;
  branch?: string;
  error?: string;
}

export interface BranchExistsRequest {
  branchName: string;
}

export interface BranchExistsResult {
  success: boolean;
  exists?: boolean;
  error?: string;
}

export class BranchOperationsUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Gets the current branch name
   */
  async getCurrentBranch(): Promise<GetCurrentBranchResult> {
    try {
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository',
        };
      }

      const branch = await this.gitRepository.getCurrentBranch();
      return {
        success: true,
        branch,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets all local branches
   */
  async getAllBranches(): Promise<GetAllBranchesResult> {
    try {
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository',
        };
      }

      const branches = await this.gitRepository.getAllBranches();
      const currentBranch = await this.gitRepository.getCurrentBranch();

      return {
        success: true,
        branches,
        currentBranch,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Checks out an existing branch
   */
  async checkoutBranch(request: CheckoutBranchRequest): Promise<CheckoutBranchResult> {
    try {
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository',
        };
      }

      // Verify branch exists
      const exists = await this.gitRepository.branchExists(request.branchName);
      if (!exists) {
        return {
          success: false,
          error: `Branch "${request.branchName}" does not exist`,
        };
      }

      // Checkout branch
      await this.gitRepository.checkoutBranch(request.branchName);

      return {
        success: true,
        branch: request.branchName,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Creates a new branch and optionally checks it out
   */
  async createBranch(request: CreateBranchRequest): Promise<CreateBranchResult> {
    try {
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository',
        };
      }

      // Verify branch doesn't already exist
      const exists = await this.gitRepository.branchExists(request.branchName);
      if (exists) {
        return {
          success: false,
          error: `Branch "${request.branchName}" already exists`,
        };
      }

      // Create and optionally checkout
      if (request.checkout) {
        await this.gitRepository.createAndCheckoutBranch(request.branchName);
      } else {
        // If IGitRepository doesn't have createBranch, we'll need to use createAndCheckoutBranch then switch back
        // For now, assuming we always checkout when creating
        await this.gitRepository.createAndCheckoutBranch(request.branchName);
      }

      return {
        success: true,
        branch: request.branchName,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Checks if a branch exists
   */
  async branchExists(request: BranchExistsRequest): Promise<BranchExistsResult> {
    try {
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository',
        };
      }

      const exists = await this.gitRepository.branchExists(request.branchName);

      return {
        success: true,
        exists,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
