/**
 * AI Provider default configurations
 */

/**
 * Ollama default configuration
 */
export const OLLAMA_DEFAULTS = {
  BASE_URL: "http://localhost:11434",
  MODEL: "devstral:24b",
  TIMEOUT: 30000,
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
  /** Default temperature for AI responses */
  TEMPERATURE: 0.3,

  /** Maximum tokens to generate */
  MAX_TOKENS: 500,
} as const;
