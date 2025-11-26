/**
 * Timing-related constants (timeouts, delays, durations)
 */

/**
 * UI animation and display delays
 */
export const UI_DELAYS = {
  /** Intro animation delay in milliseconds */
  INTRO: 1500,
} as const;

/**
 * Request timeouts
 */
export const TIMEOUTS = {
  /** Default timeout for AI API requests in milliseconds */
  AI_REQUEST: 30000,
  /** Timeout for agentic workflow with multiple AI calls (reflection + refinement) */
  AGENTIC_AI_REQUEST: 120000, // 2 minutes for multiple sequential AI calls
} as const;
