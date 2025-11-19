import type { AIGeneratedCommit } from '../../types.js';
import type { AIProvider, CommitContext } from './base.js';
import { COMMIT_LIMITS } from '../../shared/constants/index.js';

/**
 * Base abstract class for AI providers
 * Provides common functionality to eliminate code duplication across providers
 */
export abstract class BaseAIProvider implements AIProvider {
  /**
   * Abstract method to generate commit message - must be implemented by subclasses
   */
  abstract generateCommitMessage(
    diff: string,
    context: CommitContext,
  ): Promise<AIGeneratedCommit>;

  /**
   * Abstract method to check provider availability - must be implemented by subclasses
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Abstract method to get provider name - must be implemented by subclasses
   */
  abstract getName(): string;

  /**
   * Validates the AI response structure and content
   * This method is shared across all providers to ensure consistent validation
   *
   * @param response - The response object to validate
   * @throws {Error} If the response is invalid
   *
   * @protected - Available to subclasses
   */
  protected validateResponse(response: any): void {
    if (!response.type || typeof response.type !== 'string') {
      throw new Error('Réponse invalide: "type" manquant ou invalide');
    }

    if (!response.subject || typeof response.subject !== 'string') {
      throw new Error('Réponse invalide: "subject" manquant ou invalide');
    }

    if (response.subject.length > COMMIT_LIMITS.MAX_SUBJECT_LENGTH) {
      throw new Error(
        `Réponse invalide: "subject" trop long (>${COMMIT_LIMITS.MAX_SUBJECT_LENGTH} chars)`,
      );
    }
  }

  /**
   * Parses JSON from AI response, handling potential parsing errors
   *
   * @param text - The text to parse as JSON
   * @returns The parsed JSON object
   * @throws {Error} If JSON parsing fails
   *
   * @protected - Available to subclasses
   */
  protected parseJSON(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Impossible de parser la réponse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Extracts JSON from text that may contain markdown code blocks or other formatting
   *
   * @param text - The text that may contain JSON
   * @returns Extracted and cleaned JSON string
   *
   * @protected - Available to subclasses
   */
  protected extractJSON(text: string): string {
    // Remove markdown code blocks if present
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find JSON object in text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return text.trim();
  }
}
