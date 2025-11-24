import type { DiffAnalysis } from "../../domain/services/DiffAnalyzer.js";
import { COMMIT_LIMITS } from "../../shared/constants/index.js";
import type { AIGeneratedCommit } from "../../types.js";
import type { AIProvider, CommitContext } from "./base.js";

/**
 * Type pour une réponse AI partielle (utilisé pour la validation)
 */
type PartialAIResponse = {
  type?: unknown;
  subject?: unknown;
  scope?: unknown;
  body?: unknown;
  breaking?: unknown;
  breakingDescription?: unknown;
  confidence?: unknown;
  reasoning?: unknown;
  [key: string]: unknown;
};

/**
 * Base abstract class for AI providers
 * Provides common functionality to eliminate code duplication across providers
 */
export abstract class BaseAIProvider implements AIProvider {
  protected model: string = "";
  protected temperature: number = 0.5;
  protected topP: number = 0.9;
  protected maxTokens: number = 500;
  /**
   * Abstract method to generate commit message - must be implemented by subclasses
   */
  abstract generateCommitMessage(
    diff: string,
    context: CommitContext,
    analysis?: DiffAnalysis,
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
   * @param availableTypes - Optional list of valid commit types to validate against
   * @throws {Error} If the response is invalid
   *
   * @protected - Available to subclasses
   */
  protected validateResponse(
    response: PartialAIResponse | AIGeneratedCommit | Record<string, unknown>,
    availableTypes?: string[],
  ): void {
    if (!response.type || typeof response.type !== "string") {
      throw new Error('Réponse invalide: "type" manquant ou invalide');
    }

    // Validate type is in the list of available types if provided
    if (availableTypes && !availableTypes.includes(response.type)) {
      throw new Error(
        `Réponse invalide: Le type "${response.type}" n'est pas valide.\nTypes autorisés: ${availableTypes.join(", ")}\nL'IA a généré un type incorrect. Cela peut arriver avec certains modèles.\nVeuillez réessayer ou utiliser le mode manuel.`,
      );
    }

    if (!response.subject || typeof response.subject !== "string") {
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
  protected parseJSON(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Impossible de parser la réponse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
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
