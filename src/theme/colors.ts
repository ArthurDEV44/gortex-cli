import gradient from "gradient-string";
import { COMMIT_TYPE_ICONS } from "../shared/constants/index.js";

/**
 * Thème de couleurs Gortex CLI - Titanium & Gradient Edition
 * Un design moderne, épuré et vibrant.
 */

// Palette de base (Teintes Titane - Neutres)
export const titaniumColors = {
  white: "#ffffff",
  titanium100: "#eeeef2", // Texte secondaire
  titanium200: "#cccdd4", // Muted, Placeholders
  titanium300: "#9c9ea8", // Icones, Séparateurs
  titanium400: "#6f717d", // Bordures sombres
  titanium500: "#454655", // Backgrounds, Panels
};

// Palette d'accentuation (Gradients - Fonctionnels)
// Inspirée de Gemini avec des teintes pastel plus douces
export const accentColors = {
  blue: "#6BA8E8", // Info, Primaire - Bleu pastel doux
  indigo: "#8A9EE8", // Focus, Secondaire - Indigo lavande
  purple: "#B5A5DD", // Succès, Highlights - Violet pastel
  rose: "#E09DAA", // Erreur, Warning - Rose poudré
};

// Couleurs principales mappées
export const colors = {
  // Primaires
  primary: accentColors.blue, // #4796e2
  primaryLight: accentColors.indigo, // #6680de
  primaryDark: titaniumColors.titanium500, // #454655

  // Secondaires
  secondary: accentColors.purple, // #8c77c8
  secondaryLight: titaniumColors.titanium200, // #cccdd4

  // Accentuation
  accent: accentColors.rose, // #c66678

  // Statuts
  success: accentColors.purple, // #8c77c8 (Modern Success)
  error: accentColors.rose, // #c66678
  warning: accentColors.indigo, // #6680de (Used as notice/warning)
  info: accentColors.blue, // #4796e2

  // Neutres
  background: titaniumColors.titanium500, // #454655
  foreground: titaniumColors.white, // #ffffff
  muted: titaniumColors.titanium300, // #9c9ea8
  mutedLight: titaniumColors.titanium200, // #cccdd4
  mutedDark: titaniumColors.titanium400, // #6f717d
  border: titaniumColors.titanium400, // #6f717d
  borderLight: titaniumColors.titanium200, // #cccdd4

  // Dégradés
  gradients: {
    // Gradient principal
    titanium: [
      titaniumColors.white,
      titaniumColors.titanium100,
      titaniumColors.titanium200,
      titaniumColors.titanium300,
    ],
    // Gradient fonctionnel (Blue -> Indigo)
    flow: [accentColors.blue, accentColors.indigo],
    // Gradient créatif (Purple -> Rose)
    nebula: [accentColors.purple, accentColors.rose],
    // Gradient aube (Blue -> Purple)
    aurora: [accentColors.blue, accentColors.purple],
    // Gradient message de commit (Blue -> Indigo -> Purple -> Rose)
    commitMessage: [
      accentColors.blue, // #4796e2
      accentColors.indigo, // #6680de
      accentColors.purple, // #8c77c8
      accentColors.rose, // #c66678
    ],

    // Mapped standard gradients
    dune: [accentColors.blue, accentColors.indigo], // Replaces old dune
    warmth: [accentColors.purple, accentColors.rose], // Replaces old warmth
    spice: [accentColors.rose, accentColors.purple], // Replaces old spice
    dawn: [accentColors.blue, accentColors.purple], // Replaces old dawn
    gold: [titaniumColors.white, titaniumColors.titanium100], // Replaces old gold

    /**
     * Ultra-smooth shimmer gradient for loading animations
     * Optimized for CLI skeleton loaders with 12 color stops
     *
     * Inspired by tech leaders (Claude, Gemini, OpenAI, GitHub Copilot):
     * - Bell curve luminosity (dim → bright → dim)
     * - Optimal contrast ratio (30% base → 100% peak → 30% base)
     * - Smooth transitions every ~8-10% for imperceptible color shifts
     * - Cool color temperature for modern, professional feel
     *
     * Color progression:
     * 1. Base dim (titanium300) - Starting state
     * 2-3. Gentle rise (titanium200 variants) - Pre-shimmer
     * 4-5. Bright transition (titanium100 variants) - Entry to peak
     * 6-7. Peak luminosity (white variants) - Maximum brightness
     * 8-9. Bright transition (titanium100 variants) - Exit from peak
     * 10-11. Gentle fall (titanium200 variants) - Post-shimmer
     * 12. Base dim (titanium300) - Return to base
     */
    shimmer: [
      titaniumColors.titanium300, // Base dim: #9c9ea8 (Step 1)
      "#b0b2bb", // Rise 1: Lighter titanium
      titaniumColors.titanium200, // Rise 2: #cccdd4
      "#d9dade", // Transition 1: Between titanium200-100
      titaniumColors.titanium100, // Bright 1: #eeeef2
      "#f4f4f7", // Peak approach: Near white
      titaniumColors.white, // Peak center: #ffffff (Maximum)
      "#f4f4f7", // Peak exit: Near white
      titaniumColors.titanium100, // Bright 2: #eeeef2
      "#d9dade", // Transition 2: Between titanium100-200
      titaniumColors.titanium200, // Fall 1: #cccdd4
      "#b0b2bb", // Fall 2: Lighter titanium
      titaniumColors.titanium300, // Base dim: #9c9ea8 (Step 12 - return)
    ],

    /**
     * Premium shimmer gradient with subtle blue tint
     * Alternative for environments where color richness is preferred
     * Maintains same luminosity curve but with cool blue undertones
     */
    shimmerBlue: [
      "#9da4b8", // Base: Titanium with blue tint
      "#b2b8c8", // Rise 1
      "#c8cdd9", // Rise 2
      "#dce0e9", // Transition 1
      "#eff1f7", // Bright 1
      "#f7f8fc", // Peak approach
      "#ffffff", // Peak center
      "#f7f8fc", // Peak exit
      "#eff1f7", // Bright 2
      "#dce0e9", // Transition 2
      "#c8cdd9", // Fall 1
      "#b2b8c8", // Fall 2
      "#9da4b8", // Base return
    ],

    // Statuts
    success: [accentColors.purple, "#a78bfa"],
    error: [accentColors.rose, "#f43f5e"],
    info: [accentColors.blue, "#60a5fa"],
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
  // New ones
  titanium: gradient(colors.gradients.titanium) as any,
  flow: gradient(colors.gradients.flow) as any,
  nebula: gradient(colors.gradients.nebula) as any,
  aurora: gradient(colors.gradients.aurora) as any,
  commitMessage: gradient(colors.gradients.commitMessage) as any,
  // Premium shimmer gradients for loading animations
  shimmer: gradient(colors.gradients.shimmer) as any,
  shimmerBlue: gradient(colors.gradients.shimmerBlue) as any,
};

// Palette pour les types de commit (conventional commits)
export const commitColors = {
  feat: accentColors.blue, // ✨ Features
  fix: accentColors.rose, // 🐛 Fixes
  docs: accentColors.indigo, // 📝 Documentation
  style: accentColors.purple, // 💄 Style
  refactor: titaniumColors.titanium200, // ♻️  Refactor
  perf: accentColors.blue, // ⚡ Performance
  test: accentColors.purple, // ✅ Tests
  build: titaniumColors.titanium300, // 📦 Build
  ci: accentColors.indigo, // 👷 CI
  chore: titaniumColors.titanium300, // 🔧 Chores
};

// Palette pour les branches
export const branchColors = {
  main: accentColors.blue,
  master: accentColors.blue,
  dev: accentColors.purple,
  develop: accentColors.purple,
  feature: accentColors.indigo,
  fix: accentColors.rose,
  hotfix: accentColors.rose,
  release: accentColors.purple,
  default: titaniumColors.titanium200,
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
