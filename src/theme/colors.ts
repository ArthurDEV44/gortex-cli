import gradient from "gradient-string";
import { COMMIT_TYPE_ICONS } from "../shared/constants/index.js";

/**
 * Thème de couleurs Gortex CLI
 * Inspiré de l'univers de Dune avec des tons orangés haut de gamme et élégants
 */

// Palette de couleurs du gradient héro Dune
export const duneColors = {
  white: "#ffffff",
  sand1: "#ffedb2", // Sable clair
  sand2: "#ffce86", // Sable moyen
  sand3: "#ffaf5a", // Sable foncé
  spice: "#f28236", // Orange épice
  deep: "#b53800", // Orange profond
  highlight: "#f97316", // Orange vif
};

// Couleurs principales
export const colors = {
  // Primaires (tons orangés Dune)
  primary: duneColors.spice, // #f28236
  primaryLight: duneColors.sand3, // #ffaf5a
  primaryDark: duneColors.deep, // #b53800

  // Secondaires (tons dorés)
  secondary: duneColors.sand2, // #ffce86
  secondaryLight: duneColors.sand1, // #ffedb2

  // Accentuation
  accent: duneColors.highlight, // #f97316

  // Statuts
  success: "#10b981", // Vert émeraude
  error: "#ef4444", // Rouge
  warning: "#f59e0b", // Ambre
  info: "#3b82f6", // Bleu

  // Neutres (tons sombres élégants)
  background: "#0a0a0a", // Noir profond
  foreground: "#fafafa", // Blanc cassé
  muted: "#737373", // Gris
  mutedLight: "#a3a3a3", // Gris clair
  mutedDark: "#525252", // Gris foncé
  border: "#262626", // Bordure sombre
  borderLight: "#404040", // Bordure claire

  // Dégradés de l'univers Dune
  gradients: {
    // Gradient principal (sable du désert)
    dune: [
      duneColors.white,
      duneColors.sand1,
      duneColors.sand2,
      duneColors.sand3,
      duneColors.spice,
      duneColors.deep,
    ],
    // Gradient chaleur
    warmth: [
      duneColors.sand1,
      duneColors.sand2,
      duneColors.sand3,
      duneColors.spice,
    ],
    // Gradient épice
    spice: [duneColors.spice, duneColors.deep],
    // Gradient aube du désert
    dawn: [duneColors.sand2, duneColors.sand3, duneColors.spice],
    // Gradient or
    gold: [duneColors.sand1, duneColors.sand2],
    // Gradients pour les statuts
    success: ["#10b981", "#059669"],
    error: ["#ef4444", "#dc2626"],
    info: [duneColors.sand3, duneColors.spice],
  },
};

// Créateurs de gradients Ink
// Note: Using 'as any' is necessary due to gradient-string library typing limitations
export const createGradient = {
  dune: gradient(colors.gradients.dune) as any,
  warmth: gradient(colors.gradients.warmth) as any,
  spice: gradient(colors.gradients.spice) as any,
  dawn: gradient(colors.gradients.dawn) as any,
  gold: gradient(colors.gradients.gold) as any,
  success: gradient(colors.gradients.success) as any,
  error: gradient(colors.gradients.error) as any,
  info: gradient(colors.gradients.info) as any,
};

// Palette pour les types de commit (conventional commits)
export const commitColors = {
  feat: colors.accent, // ✨ Features - Orange vif
  fix: colors.error, // 🐛 Fixes - Rouge
  docs: colors.info, // 📝 Documentation - Bleu
  style: colors.secondary, // 💄 Style - Doré
  refactor: colors.warning, // ♻️  Refactor - Ambre
  perf: colors.primaryLight, // ⚡ Performance - Orange clair
  test: colors.success, // ✅ Tests - Vert
  build: colors.muted, // 📦 Build - Gris
  ci: colors.info, // 👷 CI - Bleu
  chore: colors.mutedLight, // 🔧 Chores - Gris clair
};

// Palette pour les branches
export const branchColors = {
  main: colors.primary, // Branche principale - Orange épice
  master: colors.primary, // Master - Orange épice
  dev: colors.accent, // Développement - Orange vif
  develop: colors.accent, // Develop - Orange vif
  feature: colors.info, // Feature - Bleu
  fix: colors.error, // Fix - Rouge
  hotfix: colors.error, // Hotfix - Rouge
  release: colors.success, // Release - Vert
  default: colors.secondary, // Défaut - Doré
};

// Styles de bordures
export const boxStyles = {
  rounded: "round" as const,
  bold: "bold" as const,
  single: "single" as const,
  double: "double" as const,
  classic: "classic" as const,
};

/**
 * Icônes professionnelles Unicode pour CLI
 * Utilise des caractères Unicode élégants compatibles avec tous les terminaux
 */
export const icons = {
  // Statuts (symboles professionnels)
  success: "✔", // Checkmark élégant
  error: "✖", // Croix fine
  warning: "⚠", // Triangle d'avertissement
  info: "ℹ", // Information
  question: "?", // Question

  // Indicateurs de statut alternatifs
  tick: "✓", // Tick simple
  cross: "✗", // Croix simple
  bullet: "•", // Point
  circle: "◯", // Cercle vide
  circleFilled: "●", // Cercle plein
  square: "▢", // Carré vide
  squareFilled: "◼", // Carré plein

  // Flèches et directions
  arrowRight: "→", // Flèche droite
  arrowLeft: "←", // Flèche gauche
  arrowUp: "↑", // Flèche haut
  arrowDown: "↓", // Flèche bas
  pointer: "▸", // Pointeur triangle
  chevronRight: "›", // Chevron droit
  chevronLeft: "‹", // Chevron gauche

  // Git operations (symboles professionnels)
  branch: "⎇", // Symbole Git branch (Option-Shift-7 on Mac)
  commit: "◉", // Commit (cercle avec point)
  merge: "⎇", // Merge
  tag: "⚑", // Tag/Flag
  pull: "↓", // Pull
  push: "↑", // Push
  fetch: "⇣", // Fetch
  diff: "±", // Diff

  // États et progressions
  pending: "○", // En attente
  inProgress: "◐", // En cours
  loading: "◌", // Chargement
  spinner: "◠", // Spinner

  // Workflow et processus
  step: "▸", // Étape
  substep: "▹", // Sous-étape
  completed: "✔", // Complété
  skipped: "−", // Sauté

  // UI et navigation
  menu: "☰", // Menu hamburger
  settings: "⚙", // Paramètres
  search: "⌕", // Recherche
  filter: "⚑", // Filtre
  sort: "⇅", // Tri
  stats: "◫", // Statistiques (barres)

  // Priorités et importance
  high: "⬆", // Haute
  medium: "▬", // Moyenne
  low: "⬇", // Basse
  star: "★", // Étoile pleine
  starEmpty: "☆", // Étoile vide

  // Fichiers et dossiers
  folder: "▣", // Dossier
  file: "▢", // Fichier
  fileChanged: "◆", // Fichier modifié
  fileAdded: "✚", // Fichier ajouté
  fileDeleted: "✖", // Fichier supprimé

  // Statut de build/CI
  building: "⚒", // En construction
  deployed: "◉", // Déployé
  failed: "✖", // Échoué
  passed: "✔", // Réussi

  // Notifications
  alert: "⚠", // Alerte
  notice: "ⓘ", // Notice
  bell: "🔔", // Cloche (si emoji accepté)

  // Séparateurs et décorations
  separator: "─", // Ligne horizontale
  ellipsis: "…", // Points de suspension
  middot: "·", // Point médian

  // Thème Dune (caractères élégants)
  sand: "∼", // Vague de sable
  spice: "✦", // Étoile à 4 branches (épice)
  desert: "▭", // Désert stylisé
};

/**
 * Icônes colorées pour les types de commit (conventional commits)
 * @deprecated Use COMMIT_TYPE_ICONS from shared/constants/commit-types instead
 * Kept for backward compatibility
 */
export const commitIcons = COMMIT_TYPE_ICONS;

// Helper pour obtenir la couleur d'un type de commit
export function getCommitColor(type: string): string {
  return commitColors[type as keyof typeof commitColors] || colors.muted;
}

// Helper pour obtenir l'icône d'un type de commit
export function getCommitIcon(type: string): string {
  return commitIcons[type as keyof typeof commitIcons] || icons.commit;
}

// Helper pour obtenir la couleur d'une branche
export function getBranchColor(branch: string): string {
  const lowerBranch = branch.toLowerCase();
  for (const [key, color] of Object.entries(branchColors)) {
    if (lowerBranch.includes(key)) {
      return color;
    }
  }
  return branchColors.default;
}

// Export des types
export type ColorName = keyof typeof colors;
export type CommitType = keyof typeof commitColors;
export type BranchType = keyof typeof branchColors;
export type IconName = keyof typeof icons;
