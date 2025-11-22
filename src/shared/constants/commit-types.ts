/**
 * Commit type emoji mappings and definitions
 * Centralized source of truth for conventional commit types
 */

/**
 * Standard conventional commit emojis
 * These are the widely-recognized emojis for conventional commits
 */
export const COMMIT_TYPE_EMOJIS = {
  feat: "✨",
  fix: "🐛",
  docs: "📝",
  style: "💄",
  refactor: "♻️",
  perf: "⚡️",
  test: "✅",
  build: "📦",
  ci: "👷",
  chore: "🔧",
  revert: "⏪",
} as const;

/**
 * Stylized Unicode icons for commit types
 * Used in UI for a more subtle, professional appearance
 */
export const COMMIT_TYPE_ICONS = {
  feat: "✦", // Feature - Star spike
  fix: "◆", // Fix - Diamond
  docs: "◈", // Documentation - Empty diamond
  style: "◇", // Style - Lozenge
  refactor: "⟲", // Refactor - Circle arrow
  perf: "⚡", // Performance - Lightning
  test: "✓", // Test - Check
  build: "▣", // Build - Square with dot
  ci: "⚙", // CI - Gear
  chore: "○", // Chore - Circle
  revert: "↶", // Revert - Return arrow
} as const;

/**
 * Gets the emoji for a commit type
 * @param type - The commit type
 * @param fallback - Fallback emoji if type not found (default: 📌)
 * @returns The corresponding emoji
 */
export function getCommitTypeEmoji(type: string, fallback = "📌"): string {
  return (
    COMMIT_TYPE_EMOJIS[type as keyof typeof COMMIT_TYPE_EMOJIS] || fallback
  );
}

/**
 * Gets the icon for a commit type
 * @param type - The commit type
 * @param fallback - Fallback icon if type not found (default: ○)
 * @returns The corresponding icon
 */
export function getCommitTypeIcon(type: string, fallback = "○"): string {
  return COMMIT_TYPE_ICONS[type as keyof typeof COMMIT_TYPE_ICONS] || fallback;
}

/**
 * Commit type metadata
 */
export interface CommitTypeMetadata {
  value: string;
  emoji: string;
  icon: string;
  name: string;
  description: string;
}

/**
 * All available commit types with their metadata
 */
export const COMMIT_TYPES: CommitTypeMetadata[] = [
  {
    value: "feat",
    emoji: COMMIT_TYPE_EMOJIS.feat,
    icon: COMMIT_TYPE_ICONS.feat,
    name: "feat:     ✦ Nouvelle fonctionnalité",
    description: "Une nouvelle fonctionnalité",
  },
  {
    value: "fix",
    emoji: COMMIT_TYPE_EMOJIS.fix,
    icon: COMMIT_TYPE_ICONS.fix,
    name: "fix:      ◆ Correction de bug",
    description: "Une correction de bug",
  },
  {
    value: "docs",
    emoji: COMMIT_TYPE_EMOJIS.docs,
    icon: COMMIT_TYPE_ICONS.docs,
    name: "docs:     ◈ Documentation",
    description: "Changements de documentation uniquement",
  },
  {
    value: "style",
    emoji: COMMIT_TYPE_EMOJIS.style,
    icon: COMMIT_TYPE_ICONS.style,
    name: "style:    ◇ Style",
    description:
      "Changements qui n'affectent pas le sens du code (espaces, formatage, etc.)",
  },
  {
    value: "refactor",
    emoji: COMMIT_TYPE_EMOJIS.refactor,
    icon: COMMIT_TYPE_ICONS.refactor,
    name: "refactor: ⟲ Refactoring",
    description:
      "Changement de code qui ne corrige pas de bug ni n'ajoute de fonctionnalité",
  },
  {
    value: "perf",
    emoji: COMMIT_TYPE_EMOJIS.perf,
    icon: COMMIT_TYPE_ICONS.perf,
    name: "perf:     ⚡ Performance",
    description: "Amélioration des performances",
  },
  {
    value: "test",
    emoji: COMMIT_TYPE_EMOJIS.test,
    icon: COMMIT_TYPE_ICONS.test,
    name: "test:     ✓ Tests",
    description: "Ajout ou modification de tests",
  },
  {
    value: "build",
    emoji: COMMIT_TYPE_EMOJIS.build,
    icon: COMMIT_TYPE_ICONS.build,
    name: "build:    ▣ Build",
    description:
      "Changements qui affectent le système de build ou les dépendances",
  },
  {
    value: "ci",
    emoji: COMMIT_TYPE_EMOJIS.ci,
    icon: COMMIT_TYPE_ICONS.ci,
    name: "ci:       ⚙ CI",
    description: "Changements dans les fichiers de configuration CI",
  },
  {
    value: "chore",
    emoji: COMMIT_TYPE_EMOJIS.chore,
    icon: COMMIT_TYPE_ICONS.chore,
    name: "chore:    ○ Chore",
    description:
      "Autres changements qui ne modifient pas les fichiers src ou test",
  },
  {
    value: "revert",
    emoji: COMMIT_TYPE_EMOJIS.revert,
    icon: COMMIT_TYPE_ICONS.revert,
    name: "revert:   ↶ Revert",
    description: "Annulation d'un commit précédent",
  },
];

/**
 * Gets all available commit type values
 */
export function getCommitTypeValues(): string[] {
  return COMMIT_TYPES.map((type) => type.value);
}
