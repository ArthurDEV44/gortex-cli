/**
 * Adapter for OpenAI Provider
 * Adapts the existing OpenAI implementation to IAIProvider interface
 */

import { OpenAIProvider } from "../../ai/providers/openai.js";
import type {
  AIGenerationContext,
  AIGenerationResult,
  IAIProvider,
} from "../../domain/repositories/IAIProvider.js";
import { CommitMessageService } from "../../domain/services/CommitMessageService.js";
import type { AIConfig } from "../../types.js";

export class OpenAIProviderAdapter implements IAIProvider {
  private readonly provider: OpenAIProvider;

  constructor(config: AIConfig) {
    this.provider = new OpenAIProvider(config);
  }

  getName(): string {
    return "OpenAI";
  }

  async isAvailable(): Promise<boolean> {
    return await this.provider.isAvailable();
  }

  async generateCommitMessage(
    context: AIGenerationContext,
  ): Promise<AIGenerationResult> {
    // Convert context to the format expected by the legacy provider
    const legacyContext = {
      files: context.files,
      branch: context.branch,
      recentCommits: context.recentCommits,
      availableTypes: context.availableTypes,
      availableScopes: context.availableScopes,
      reasoning: context.reasoning
        ? {
            architecturalContext: context.reasoning.architecturalContext,
            changeIntention: context.reasoning.changeIntention,
            changeNature: context.reasoning.changeNature,
            keySymbols: context.reasoning.keySymbols,
            suggestedType: context.reasoning.suggestedType,
            complexityJustification: "", // Not needed in legacy context
          }
        : undefined,
      fewShotExamples: context.fewShotExamples,
      semanticSummary: context.semanticSummary,
      projectStyle: context.projectStyle,
      projectGuidelines: context.projectGuidelines,
    };

    // Call the legacy provider with diff analysis
    const result = await this.provider.generateCommitMessage(
      context.diff,
      legacyContext,
      context.analysis,
    );

    // Convert result to domain entity using service
    const commitMessage = CommitMessageService.createFromAIGenerated({
      type: result.type,
      subject: result.subject,
      scope: result.scope,
      body: result.body,
      breaking: result.breaking,
      breakingChangeDescription: result.breakingDescription,
    });

    return {
      message: commitMessage,
      confidence: result.confidence,
    };
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      format?: "json" | "text";
    },
  ): Promise<string> {
    return await this.provider.generateText(systemPrompt, userPrompt, options);
  }

  async validateConfiguration(): Promise<boolean> {
    return await this.isAvailable();
  }
}
