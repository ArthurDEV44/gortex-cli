/**
 * Use Case: Generate a commit message using AI
 * Orchestrates AI generation with context from git repository
 */

import { selectRelevantExamples } from "../../ai/examples/commit-samples.js";
import type {
  AIGenerationContext,
  IAIProvider,
} from "../../domain/repositories/IAIProvider.js";
import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import type { IASTDiffAnalyzer } from "../../domain/services/ASTDiffAnalyzer.js";
import { DiffAnalyzer } from "../../domain/services/DiffAnalyzer.js";
import type { IProjectStyleAnalyzer } from "../../domain/services/ProjectStyleAnalyzer.js";
import { GitRepositoryImpl } from "../../infrastructure/repositories/GitRepositoryImpl.js";
import { getCommitTypeValues } from "../../shared/constants/commit-types.js";
import { SIZE_LIMITS } from "../../shared/constants/limits.js";
import { loadProjectCommitGuidelines } from "../../utils/projectGuidelines.js";
import type { AIGenerationResultDTO } from "../dto/AIGenerationDTO.js";
import { CommitMessageMapper } from "../mappers/CommitMessageMapper.js";

export interface GenerateAICommitRequest {
  provider: IAIProvider;
  includeScope?: boolean;
}

export class GenerateAICommitUseCase {
  private readonly diffAnalyzer: DiffAnalyzer;

  constructor(
    private readonly gitRepository: IGitRepository,
    astAnalyzer?: IASTDiffAnalyzer,
    private readonly projectStyleAnalyzer?: IProjectStyleAnalyzer,
  ) {
    this.diffAnalyzer = new DiffAnalyzer();
    // Configure AST analyzer if available
    if (astAnalyzer) {
      this.diffAnalyzer.setASTAnalyzer(astAnalyzer);
    }
  }

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

      // OPTIMIZATION: Parallelize all independent async operations with Promise.all
      // This reduces waiting time from sequential ~25-40s to parallel ~10-15s
      const [availableScopes, diffAnalysis, projectStyle, projectGuidelines] =
        await Promise.all([
          // Get existing scopes from commit history
          request.includeScope
            ? this.gitRepository.getExistingScopes()
            : Promise.resolve(undefined),

          // Analyze the diff to extract structured metadata
          // This analysis guides the AI to generate more precise commit messages
          this.diffAnalyzer.analyze(diffForAI, diffContext.files),

          // Analyze project style from commit history
          this.projectStyleAnalyzer
            ? this.projectStyleAnalyzer
                .analyzeProjectStyle(this.gitRepository, 100)
                .catch((error) => {
                  // If style analysis fails, continue without it (graceful degradation)
                  console.warn(
                    `Project style analysis failed: ${error instanceof Error ? error.message : String(error)}. Continuing without project style.`,
                  );
                  return undefined;
                })
            : Promise.resolve(undefined),

          // Load project-specific commit guidelines
          loadProjectCommitGuidelines(process.cwd()).catch((error) => {
            // If guidelines loading fails, continue without them (graceful degradation)
            console.warn(
              `Failed to load project commit guidelines: ${error instanceof Error ? error.message : String(error)}. Continuing without guidelines.`,
            );
            return undefined;
          }),
        ]);

      // Select relevant few-shot examples based on analysis (synchronous, fast)
      const fewShotExamples = selectRelevantExamples(diffAnalysis, 5);

      // Build AI generation context with diff analysis and few-shot examples
      const aiContext: AIGenerationContext = {
        diff: diffForAI,
        files: diffContext.files,
        branch: diffContext.branch,
        recentCommits: diffContext.recentCommits,
        availableTypes: getCommitTypeValues(),
        availableScopes,
        analysis: diffAnalysis,
        reasoning: undefined, // Removed: Chain-of-Thought disabled for performance
        fewShotExamples,
        semanticSummary: undefined, // Removed: Semantic summary disabled for performance
        projectStyle,
        projectGuidelines,
      };

      // Generate commit message with AI provider
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
