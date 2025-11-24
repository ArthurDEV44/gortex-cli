import figlet from "figlet";

/**
 * Logo ASCII moderne et haut de gamme pour GORTEX CLI
 * Style tech/cyberpunk élégant avec des polices figlet premium
 */

const LOGO_FONTS = {
  large: "ANSI Shadow", // Style moderne et imposant avec ombre
  medium: "ANSI Shadow", // Style moderne avec ombre
  small: "Small", // Style compact
} as const;

// Polices alternatives à essayer si la police principale n'est pas disponible
const FALLBACK_FONTS = ["ANSI Shadow", "Big", "Standard", "Small"] as const;

/**
 * Génère le logo ASCII de GORTEX avec une police figlet
 * Essaie plusieurs polices pour trouver la meilleure disponible
 */
export function generateLogo(
  text: string = "GORTEX",
  size: keyof typeof LOGO_FONTS = "large",
): string {
  const fontsToTry = [
    LOGO_FONTS[size],
    ...FALLBACK_FONTS.filter((f) => f !== LOGO_FONTS[size]),
  ];

  for (const font of fontsToTry) {
    try {
      const logo = figlet.textSync(text, {
        font,
        horizontalLayout: "default",
        verticalLayout: "default",
        width: size === "large" ? 80 : size === "medium" ? 60 : 40,
        whitespaceBreak: true,
      });
      // Vérifier que le logo n'est pas vide
      if (logo && logo.trim().length > 0) {
        return logo;
      }
    } catch (_error) {
      // Essayer la police suivante
    }
  }

  // Fallback si aucune police n'est disponible
  return generateFallbackLogo(text, size);
}

/**
 * Logo ASCII moderne et haut de gamme - Design personnalisé
 * Style tech/cyberpunk avec caractères Unicode avancés
 */
function generateFallbackLogo(
  _text: string = "GORTEX",
  size: keyof typeof LOGO_FONTS = "large",
): string {
  if (size === "small") {
    return generateCompactLogo();
  }

  if (size === "medium") {
    return `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    ██████╗  ██████╗ ██████╗ ████████╗███████╗██╗  ██╗    ║
║    ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝    ║
║    ██████╔╝██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝     ║
║    ██╔══██╗██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗     ║
║    ██║  ██║╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗    ║
║    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`.trim();
  } // Large version avec design moderne et élégant - Style tech premium
  return `
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ██████╗  ██████╗ ██████╗ ████████╗███████╗██╗  ██╗                   ║
║     ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝                   ║
║     ██████╔╝██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝                    ║
║     ██╔══██╗██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗                    ║
║     ██║  ██║╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗                   ║
║     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`.trim();
}

/**
 * Logo ASCII moderne avec style tech/cyberpunk
 * Version alternative avec caractères Unicode avancés
 */
export function generateModernLogo(): string {
  return `
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ██████╗  ██████╗ ██████╗ ████████╗███████╗██╗  ██╗                   ║
║     ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝                   ║
║     ██████╔╝██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝                    ║
║     ██╔══██╗██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗                    ║
║     ██║  ██║╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗                   ║
║     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`.trim();
}

/**
 * Logo compact pour les espaces réduits
 * Design moderne et élégant avec style tech premium
 */
export function generateCompactLogo(): string {
  return `
╔═══════════════════════════════════════════════╗
║  ██████╗  ██████╗ ██████╗ ████████╗          ║
║  ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝          ║
║  ██████╔╝██║   ██║██████╔╝   ██║             ║
║  ██╔══██╗██║   ██║██╔══██╗   ██║             ║
║  ██║  ██║╚██████╔╝██║  ██║   ██║             ║
║  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝             ║
╚═══════════════════════════════════════════════╝
`.trim();
}

/**
 * Logo ASCII ultra-moderne avec style tech/cyberpunk
 * Version premium avec effets visuels avancés
 */
export function generatePremiumLogo(): string {
  return `
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ██████╗  ██████╗ ██████╗ ████████╗███████╗██╗  ██╗                   ║
║     ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝                   ║
║     ██████╔╝██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝                    ║
║     ██╔══██╗██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗                    ║
║     ██║  ██║╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗                   ║
║     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`.trim();
}
