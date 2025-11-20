import type { AIGeneratedCommit } from "../../types.js";
import type { CommitContext } from "../providers/base.js";

/**
 * Génère le prompt système pour l'AI
 */
export function generateSystemPrompt(availableTypes: string[]): string {
  const systemPrompt = `Tu es un assistant expert en Git et Conventional Commits.
Ta tâche est de générer un message de commit au format Conventional Commits.

Le format de réponse doit être un objet JSON valide contenant les champs suivants:
- "type": string (doit être l'un de: ${availableTypes.join(", ")})
- "scope": string (optionnel, concis)
- "subject": string (doit commencer par une minuscule)
- "body": string (optionnel, explique le pourquoi du changement)
- "breaking": boolean
- "breakingDescription": string (optionnel)
- "confidence": integer (0-100)
- "reasoning": string (ton raisonnement pour le commit)

IMPORTANT: Analyse ATTENTIVEMENT le diff fourni pour comprendre:
1. La nature exacte des changements (nouveaux fichiers, modifications, suppressions)
2. Le but et l'impact de chaque changement
3. Les relations entre les différents fichiers modifiés
4. Le contexte technique (noms de fonctions, classes, variables modifiées)

Génère un message de commit qui:
- Est PRÉCIS et DESCRIPTIF (évite les généralisations vagues)
- Capture l'INTENTION derrière les changements, pas seulement ce qui a été fait
- Utilise la terminologie correcte du code modifié
- Est concis mais informatif (50-72 caractères pour le subject)
- Inclut un body détaillé si les changements sont complexes ou multiples

Si le diff contient plusieurs types de changements, choisis le type dominant et mentionne les autres dans le body.
`;

  return systemPrompt;
}

/**
 * Génère le prompt utilisateur avec le diff et le contexte
 */
export function generateUserPrompt(
  diff: string,
  context: CommitContext,
): string {
  const parts = ["<context>"];
  parts.push(`  <branch>${context.branch}</branch>`);
  parts.push(`  <files count="${context.files.length}">`);
  context.files.forEach((file) => {
    parts.push(`    <file>${file}</file>`);
  });
  parts.push("  </files>");

  if (context.availableScopes && context.availableScopes.length > 0) {
    parts.push("  <suggested_scopes>");
    context.availableScopes.forEach((scope) => {
      parts.push(`    <scope>${scope}</scope>`);
    });
    parts.push("  </suggested_scopes>");
  }
  parts.push("</context>");

  if (context.recentCommits && context.recentCommits.length > 0) {
    parts.push("");
    parts.push("<recent_commits>");
    parts.push(
      "  <!-- Exemples de style de commits récents dans ce projet -->",
    );
    context.recentCommits.slice(0, 5).forEach((commit) => {
      parts.push(`  <commit>${commit}</commit>`);
    });
    parts.push("</recent_commits>");
  }

  parts.push("");
  parts.push("<diff>");
  parts.push(
    "  <!-- Analyse CHAQUE fichier et TOUS les changements pour créer un message précis -->",
  );
  parts.push(`<![CDATA[
`);
  parts.push(diff);
  parts.push(`
]]>`);
  parts.push("</diff>");
  parts.push("");
  parts.push(
    "Analyse ATTENTIVEMENT ces changements:\n" +
      "1. Examine TOUS les fichiers listés ci-dessus\n" +
      "2. Comprends le CONTEXTE de chaque modification dans le diff\n" +
      "3. Identifie le BUT principal de ces changements\n" +
      "4. Génère un message de commit conventionnel PRÉCIS et DESCRIPTIF au format JSON comme spécifié.\n\n" +
      "Le message doit refléter CE QUI a été changé et POURQUOI, pas seulement une description générique.",
  );

  return parts.join("\n");
}

/**
 * Parse la réponse JSON de l'AI
 */
export function parseAIResponse(response: string): AIGeneratedCommit {
  // Nettoie la réponse de tout markdown ou texte supplémentaire
  let cleanedResponse = response.trim();

  // Supprime les blocs de code markdown si présents
  cleanedResponse = cleanedResponse.replace(/```json\s*/g, "");
  cleanedResponse = cleanedResponse.replace(/```\s*/g, "");

  // Supprime les retours à la ligne excessifs
  cleanedResponse = cleanedResponse.trim();

  // Cherche du JSON dans la réponse (au cas où l'AI ajoute du texte avant/après)
  // Pattern amélioré pour capturer le JSON même avec du texte autour
  const jsonMatch = cleanedResponse.match(
    /\{[\s\S]*?\}(?=\s*$|\s*\n\s*[^}\s])/,
  );

  if (!jsonMatch) {
    // Essaie une approche plus aggressive: trouve le premier { et le dernier }
    const firstBrace = cleanedResponse.indexOf("{");
    const lastBrace = cleanedResponse.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = cleanedResponse.substring(
        firstBrace,
        lastBrace + 1,
      );

      try {
        return JSON.parse(potentialJson) as AIGeneratedCommit;
      } catch (_error) {
        // Continue vers l'erreur finale
      }
    }

    throw new Error(
      `Réponse AI invalide: aucun JSON trouvé dans la réponse.\n\nRéponse reçue: ${response.substring(0, 200)}${response.length > 200 ? "..." : ""}`,
    );
  }

  try {
    return JSON.parse(jsonMatch[0]) as AIGeneratedCommit;
  } catch (error) {
    throw new Error(
      `Impossible de parser la réponse JSON: ${error instanceof Error ? error.message : String(error)}\n\nJSON extrait: ${jsonMatch[0].substring(0, 200)}${jsonMatch[0].length > 200 ? "..." : ""}`,
    );
  }
}
