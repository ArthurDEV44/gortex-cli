/**
 * Use Case: Generate a commit message using AI
 * Orchestrates AI generation with context from git repository
 */

import { IGitRepository } from '../../domain/repositories/IGitRepository.js';
import { IAIProvider, AIGenerationContext } from '../../domain/repositories/IAIProvider.js';
import { CommitMessageMapper } from '../mappers/CommitMessageMapper.js';
import { AIGenerationResultDTO } from '../dto/AIGenerationDTO.js';
import { getCommitTypeValues } from '../../shared/constants/commit-types.js';
import { detectScopeFromFiles } from '../../ai/analyzer.js';

export interface GenerateAICommitRequest {
  provider: IAIProvider;
  includeScope?: boolean;
}

export class GenerateAICommitUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  /**
   * Executes the AI commit generation use case
   */
  async execute(request: GenerateAICommitRequest): Promise<AIGenerationResultDTO> {
    try {
      // Validate the repository
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          provider: request.provider.getName(),
          error: 'Not a git repository',
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

      // Detect potential scopes
      const availableScopes = request.includeScope
        ? [detectScopeFromFiles(diffContext.files)].filter((s): s is string => s !== undefined)
        : undefined;

      // Build AI generation context
      const aiContext: AIGenerationContext = {
        diff: diffContext.diff,
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
        error: error instanceof Error ? error.message : 'Unknown error during AI generation',
      };
    }
  }
}
