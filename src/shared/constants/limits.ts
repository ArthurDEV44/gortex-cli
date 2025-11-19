/**
 * Size and length limits
 */

/**
 * Diff and content size limits
 */
export const SIZE_LIMITS = {
  /** Maximum diff size in characters before truncation */
  MAX_DIFF_SIZE: 8000,
} as const;

/**
 * Commit message length limits
 */
export const COMMIT_LIMITS = {
  /** Maximum subject line length in characters */
  MAX_SUBJECT_LENGTH: 100,

  /** Recommended maximum subject length (conventional commits) */
  RECOMMENDED_SUBJECT_LENGTH: 50,

  /** Maximum body line length */
  MAX_BODY_LINE_LENGTH: 100,
} as const;

/**
 * Git history limits
 */
export const GIT_LIMITS = {
  /** Number of recent commits to fetch for context */
  RECENT_COMMITS_COUNT: 5,

  /** Default number of commits to analyze for stats */
  DEFAULT_STATS_COUNT: 100,
} as const;
