/**
 * AI Provider default configurations
 */

/**
 * Ollama default configuration
 */
export const OLLAMA_DEFAULTS = {
  BASE_URL: "http://localhost:11434",
  MODEL: "magistral:24b",
  TIMEOUT: 120000, // 120s for Chain-of-Thought + Verification mode
} as const;

/**
 * Mistral AI default configuration
 */
export const MISTRAL_DEFAULTS = {
  BASE_URL: "https://api.mistral.ai",
  MODEL: "mistral-small-latest",
  TIMEOUT: 30000,
} as const;

/**
 * OpenAI default configuration
 */
export const OPENAI_DEFAULTS = {
  BASE_URL: "https://api.openai.com",
  MODEL: "gpt-4o-mini",
  TIMEOUT: 30000,
} as const;

/**
 * AI generation parameters
 */
export const AI_GENERATION = {
  /** Default temperature for AI responses (0.4 recommended for reasoning models like Magistral) */
  TEMPERATURE: 0.4,

  /** Top-p sampling parameter (0.9 recommended for focused but diverse outputs) */
  TOP_P: 0.9,

  /** Maximum tokens to generate */
  MAX_TOKENS: 500,
} as const;
