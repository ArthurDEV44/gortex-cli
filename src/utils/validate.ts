/**
 * Valide si un message de commit suit le format conventionnel
 * Format: <type>(<scope>): <subject>
 * ou: <type>: <subject>
 */
export function isConventionalCommit(message: string): boolean {
  // Pattern pour commits conventionnels
  // Exemples valides:
  // - feat: add new feature
  // - feat(auth): add login
  // - fix!: breaking change
  // - feat(api)!: breaking change in api
  const conventionalPattern =
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .{3,}/;

  return conventionalPattern.test(message.trim());
}

/**
 * Extrait les composants d'un commit conventionnel
 */
export function parseConventionalCommit(message: string): {
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
} | null {
  const match = message.match(/^(\w+)(\((.+)\))?(!)?: (.+)/);

  if (!match) return null;

  return {
    type: match[1],
    scope: match[3],
    breaking: !!match[4],
    subject: match[5],
  };
}

/**
 * Formate un message de commit selon les conventions
 */
export function formatCommitMessage(
  type: string,
  scope: string | undefined,
  subject: string,
  body?: string,
  breaking?: boolean,
  breakingDescription?: string,
): string {
  let message = type;

  if (scope) {
    message += `(${scope})`;
  }

  if (breaking) {
    message += "!";
  }

  message += `: ${subject}`;

  if (body) {
    message += `\n\n${body}`;
  }

  if (breaking && breakingDescription) {
    message += `\n\nBREAKING CHANGE: ${breakingDescription}`;
  }

  return message;
}
