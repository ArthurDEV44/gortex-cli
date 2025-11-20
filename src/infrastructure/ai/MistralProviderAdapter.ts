/**
 * Adapter for Mistral AI Provider
 * Adapts the existing Mistral implementation to IAIProvider interface
 */

import { MistralProvider } from "../../ai/providers/mistral.js";
import type {
  AIGenerationContext,
  AIGenerationResult,
  IAIProvider,
} from "../../domain/repositories/IAIProvider.js";
import { CommitMessageService } from "../../domain/services/CommitMessageService.js";
import type { AIConfig } from "../../types.js";

export class MistralProviderAdapter implements IAIProvider {
  private readonly provider: MistralProvider;

  constructor(config: AIConfig) {
    this.provider = new MistralProvider(config);
  }

  getName(): string {
    return "Mistral";
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
    };

    // Call the legacy provider
    const result = await this.provider.generateCommitMessage(
      context.diff,
      legacyContext,
    );

    // Convert result to domain entity using service
    const commitMessage = CommitMessageService.createFromAIGenerated({
      type: result.type,
      subject: result.subject,
      scope: result.scope,
      body: result.body,
      breaking: result.breaking,
    });

    return {
      message: commitMessage,
      confidence: undefined, // Mistral doesn't provide confidence in current implementation
    };
  }

  async validateConfiguration(): Promise<boolean> {
    return await this.isAvailable();
  }
}
