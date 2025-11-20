/**
 * Factory for creating AI Provider instances
 * Handles instantiation and configuration of different AI providers
 */

import type { IAIProvider } from "../../domain/repositories/IAIProvider.js";
import type { AIConfig } from "../../types.js";
import { DEFAULT_AI_CONFIG } from "../../types.js";
import { MistralProviderAdapter } from "../ai/MistralProviderAdapter.js";
import { OllamaProviderAdapter } from "../ai/OllamaProviderAdapter.js";
import { OpenAIProviderAdapter } from "../ai/OpenAIProviderAdapter.js";

export type AIProviderType = "ollama" | "mistral" | "openai";

export class AIProviderFactory {
  /**
   * Creates an AI provider instance based on the specified type
   * @param type The type of AI provider to create
   * @param config Optional configuration for the provider
   * @returns An instance implementing IAIProvider
   * @throws Error if the provider type is unsupported
   */
  static create(type: AIProviderType, config?: AIConfig): IAIProvider {
    const effectiveConfig = config || DEFAULT_AI_CONFIG;

    switch (type.toLowerCase()) {
      case "ollama":
        return new OllamaProviderAdapter(effectiveConfig);

      case "mistral":
        return new MistralProviderAdapter(effectiveConfig);

      case "openai":
        if (!config) {
          throw new Error(
            "OpenAI provider requires configuration with API key",
          );
        }
        return new OpenAIProviderAdapter(config);

      default:
        throw new Error(`Unsupported AI provider type: ${type}`);
    }
  }

  /**
   * Creates an AI provider instance with automatic availability checking
   * @param type The type of AI provider to create
   * @param config Optional configuration for the provider
   * @returns An instance implementing IAIProvider if available, null otherwise
   */
  static async createIfAvailable(
    type: AIProviderType,
    config?: AIConfig,
  ): Promise<IAIProvider | null> {
    try {
      const provider = AIProviderFactory.create(type, config);
      const isAvailable = await provider.isAvailable();
      return isAvailable ? provider : null;
    } catch {
      return null;
    }
  }

  /**
   * Gets a list of all supported provider types
   * @returns Array of supported provider type names
   */
  static getSupportedProviders(): AIProviderType[] {
    return ["ollama", "mistral", "openai"];
  }

  /**
   * Finds the first available provider from a list of preferred types
   * @param preferredOrder Array of provider types in order of preference
   * @param config Optional configuration for providers
   * @returns The first available provider instance, or null if none available
   */
  static async findFirstAvailable(
    preferredOrder: AIProviderType[],
    config?: AIConfig,
  ): Promise<IAIProvider | null> {
    for (const type of preferredOrder) {
      const provider = await AIProviderFactory.createIfAvailable(type, config);
      if (provider) {
        return provider;
      }
    }
    return null;
  }
}
