/**
 * Use Case: Generate a commit message using AI
 * Orchestrates AI generation with context from git repository
 */

import { selectRelevantExamples } from "../../ai/examples/commit-samples.js";
import {
  generateReasoningSystemPrompt,
  generateReasoningUserPrompt,
  type ReasoningAnalysis,
} from "../../ai/prompts/commit-message.js";
import type {
  AIGenerationContext,
  IAIProvider,
} from "../../domain/repositories/IAIProvider.js";
import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import type { IASTDiffAnalyzer } from "../../domain/services/ASTDiffAnalyzer.js";
import {
  type DiffAnalysis,
  DiffAnalyzer,
  type ModifiedSymbol,
} from "../../domain/services/DiffAnalyzer.js";
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
  private readonly diffAnalyzer: DiffAnalyzer;

  constructor(
    private readonly gitRepository: IGitRepository,
    astAnalyzer?: IASTDiffAnalyzer,
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

      // Get existing scopes from commit history
      const availableScopes = request.includeScope
        ? await this.gitRepository.getExistingScopes()
        : undefined;

      // Analyze the diff to extract structured metadata
      // This analysis guides the AI to generate more precise commit messages
      const diffAnalysis = await this.diffAnalyzer.analyze(
        diffForAI,
        diffContext.files,
      );

      // Select relevant few-shot examples based on analysis
      const fewShotExamples = selectRelevantExamples(diffAnalysis, 5);

      // Semantic diff summarization for large diffs
      let semanticSummary: string | undefined;
      const summaryThreshold =
        SIZE_LIMITS.MAX_DIFF_LENGTH * SIZE_LIMITS.SEMANTIC_SUMMARY_THRESHOLD;
      if (diffForAI.length > summaryThreshold) {
        try {
          semanticSummary = await this.summarizeDiffSemantics(
            diffForAI,
            diffAnalysis,
            request.provider,
          );
        } catch (error) {
          // If summarization fails, continue without it (graceful degradation)
          console.warn(
            `Semantic diff summarization failed: ${error instanceof Error ? error.message : String(error)}. Continuing without summary.`,
          );
        }
      }

      // Chain-of-Thought Step 1: Generate structured reasoning analysis
      let reasoningAnalysis: ReasoningAnalysis | undefined;
      try {
        const reasoningSystemPrompt = generateReasoningSystemPrompt();
        const reasoningUserPrompt = generateReasoningUserPrompt(
          diffForAI,
          diffAnalysis,
          diffContext.files,
        );

        const reasoningResponse = await request.provider.generateText(
          reasoningSystemPrompt,
          reasoningUserPrompt,
          {
            temperature: 0.4, // Lower temperature for more structured reasoning
            maxTokens: 800,
            format: "json",
          },
        );

        // Parse the reasoning analysis
        const cleanedReasoning = reasoningResponse
          .trim()
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        reasoningAnalysis = JSON.parse(cleanedReasoning) as ReasoningAnalysis;
      } catch (error) {
        // If reasoning fails, continue without it (graceful degradation)
        // Log the error but don't fail the entire generation
        console.warn(
          `Chain-of-Thought reasoning failed: ${error instanceof Error ? error.message : String(error)}. Continuing with standard generation.`,
        );
      }

      // Build AI generation context with diff analysis, reasoning, and few-shot examples
      const aiContext: AIGenerationContext = {
        diff: diffForAI,
        files: diffContext.files,
        branch: diffContext.branch,
        recentCommits: diffContext.recentCommits,
        availableTypes: getCommitTypeValues(),
        availableScopes,
        analysis: diffAnalysis,
        // Add reasoning analysis to context (will be used in prompt generation)
        reasoning: reasoningAnalysis
          ? {
              architecturalContext: reasoningAnalysis.architecturalContext,
              changeIntention: reasoningAnalysis.changeIntention,
              changeNature: reasoningAnalysis.changeNature,
              keySymbols: reasoningAnalysis.keySymbols || [],
              suggestedType: reasoningAnalysis.suggestedType,
            }
          : undefined,
        // Add few-shot examples for better guidance
        fewShotExamples,
        // Add semantic summary if available (for large diffs)
        semanticSummary,
      };

      // Chain-of-Thought Step 2: Generate commit message using the reasoning analysis
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

  /**
   * Summarizes a large diff semantically before sending to AI
   * This helps the AI understand the "why" and architectural impact
   * rather than getting lost in implementation details
   */
  private async summarizeDiffSemantics(
    diff: string,
    analysis: DiffAnalysis,
    provider: IAIProvider,
  ): Promise<string> {
    const summarySystemPrompt = `Tu es un expert en analyse architecturale de code.
Ta tâche est de résumer des changements de code au niveau SÉMANTIQUE, en te concentrant sur l'architecture et l'intention plutôt que sur les détails d'implémentation.

Génère un résumé structuré et concis (${SIZE_LIMITS.MAX_SEMANTIC_SUMMARY_TOKENS} tokens maximum) qui couvre:
1. QUOI: Les composants/systèmes créés ou modifiés (noms de classes, services, modules)
2. POURQUOI: L'intention architecturale derrière ces changements
3. COMMENT: Les transformations clés au niveau conceptuel
4. IMPACT: Les conséquences sur le reste du système

Sois concis, focus sur l'ARCHITECTURE, pas les détails techniques.`;

    const summaryUserPrompt = `Résume ces changements de code au niveau SÉMANTIQUE:

ANALYSE AUTOMATIQUE:
- Symboles modifiés: ${analysis.modifiedSymbols.map((s: ModifiedSymbol) => s.name).join(", ") || "Aucun"}
- Pattern dominant: ${analysis.changePatterns[0]?.description || "N/A"}
- Complexité: ${analysis.complexity}
- Fichiers modifiés: ${analysis.summary.filesChanged}

DIFF COMPLET:
\`\`\`
${diff.substring(0, Math.floor(SIZE_LIMITS.MAX_DIFF_LENGTH * 0.8))}${diff.length > Math.floor(SIZE_LIMITS.MAX_DIFF_LENGTH * 0.8) ? "\n[... diff tronqué ...]" : ""}
\`\`\`

Génère un résumé structuré en 3-5 points concis qui capture l'essence architecturale de ces changements.`;

    try {
      const summaryResponse = await provider.generateText(
        summarySystemPrompt,
        summaryUserPrompt,
        {
          temperature: 0.6, // Slightly higher for more creative summarization
          maxTokens: SIZE_LIMITS.MAX_SEMANTIC_SUMMARY_TOKENS,
          format: "text",
        },
      );

      return summaryResponse.trim();
    } catch (error) {
      // If summarization fails, return undefined (will be handled by caller)
      throw new Error(
        `Failed to generate semantic summary: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
