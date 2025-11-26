/**
 * AI Provider default configurations
 */

/**
 * Ollama default configuration
 * OPTIMIZED: Switched to mistral-small for better speed, reduced timeout
 */
export const OLLAMA_DEFAULTS = {
  BASE_URL: "http://localhost:11434",
  MODEL: "mistral-small:24b-instruct-2501-q4_K_M", // OPTIMIZATION: Faster than magistral, Q4 quantization
  TIMEOUT: 45000, // OPTIMIZATION: Reduced from 120s (no CoT/Verification needed)
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
 * OPTIMIZED: More deterministic and faster sampling
 */
export const AI_GENERATION = {
  /** OPTIMIZATION: Lower temperature for more deterministic, faster generation */
  TEMPERATURE: 0.3,

  /** OPTIMIZATION: Reduced top-p for faster sampling with minimal quality loss */
  TOP_P: 0.85,

  /** OPTIMIZATION: Reduced max tokens (commits are typically short) */
  MAX_TOKENS: 300,
} as const;
