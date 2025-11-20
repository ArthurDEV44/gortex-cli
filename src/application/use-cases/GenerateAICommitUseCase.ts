/**
 * Use Case: Generate a commit message using AI
 * Orchestrates AI generation with context from git repository
 */

import type {
  AIGenerationContext,
  IAIProvider,
} from "../../domain/repositories/IAIProvider.js";
import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import { GitRepositoryImpl } from "../../infrastructure/repositories/GitRepositoryImpl.js";
import { getCommitTypeValues } from "../../shared/constants/commit-types.js";
import { SIZE_LIMITS } from "../../shared/constants/limits.js";
import type { AIGenerationResultDTO } from "../dto/AIGenerationDTO.js";
import { CommitMessageMapper } from "../mappers/CommitMessageMapper.js";

export interface GenerateAICommitRequest {
  provider: IAIProvider;
  includeScope?: boolean;
}

export class GenerateAICommitUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Executes the AI commit generation use case
   */
  async execute(
    request: GenerateAICommitRequest,
  ): Promise<AIGenerationResultDTO> {
    try {
      // Validate the repository
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          provider: request.provider.getName(),
          error: "Not a git repository",
        };
      }

      // Check if provider is available
      const isAvailable = await request.provider.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          provider: request.provider.getName(),
          error: `AI provider ${request.provider.getName()} is not available or not configured`,
        };
      }

      // Get staged changes context
      const diffContext = await this.gitRepository.getStagedChangesContext();

      // Intelligently truncate diff if it's too large
      let diffForAI = diffContext.diff;
      if (diffForAI.length > SIZE_LIMITS.MAX_DIFF_LENGTH) {
        // Use smart truncation if repository implements it
        if (this.gitRepository instanceof GitRepositoryImpl) {
          diffForAI = this.gitRepository.smartTruncateDiff(
            diffForAI,
            SIZE_LIMITS.MAX_DIFF_LENGTH,
          );
        } else {
          // Fallback to simple truncation
          diffForAI = diffForAI.substring(0, SIZE_LIMITS.MAX_DIFF_LENGTH);
          diffForAI +=
            "\n\n[... Diff tronqué en raison de limitations de taille ...]";
        }
      }

      // Get existing scopes from commit history
      const availableScopes = request.includeScope
        ? await this.gitRepository.getExistingScopes()
        : undefined;

      // Build AI generation context
      const aiContext: AIGenerationContext = {
        diff: diffForAI,
        files: diffContext.files,
        branch: diffContext.branch,
        recentCommits: diffContext.recentCommits,
        availableTypes: getCommitTypeValues(),
        availableScopes,
      };

      // Generate commit message with AI
      const result = await request.provider.generateCommitMessage(aiContext);

      // Convert to DTO
      const commitDTO = CommitMessageMapper.toDTO(result.message);
      const formattedDTO = CommitMessageMapper.toFormattedDTO(result.message);

      return {
        success: true,
        commit: commitDTO,
        formattedMessage: formattedDTO.message,
        provider: request.provider.getName(),
        confidence: result.confidence,
      };
    } catch (error) {
      return {
        success: false,
        provider: request.provider.getName(),
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during AI generation",
      };
    }
  }
}
