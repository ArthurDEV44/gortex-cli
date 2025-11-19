import type { CommitContext } from '../providers/base.js';

/**
 * Génère le prompt système pour l'AI
 */
export function generateSystemPrompt(availableTypes: string[]): string {
  return `Tu es un assistant expert en Git et Conventional Commits.

Ta tâche est d'analyser les changements de code et de générer un message de commit au format Conventional Commits.

FORMAT REQUIS:
<type>(<scope>): <subject>

[optional body]

[optional footer]

⚠️ TYPES DISPONIBLES (UNIQUEMENT CEUX-CI) ⚠️
${availableTypes.join(', ')}

RAPPEL IMPORTANT: Le champ "type" DOIT être EXACTEMENT l'une de ces valeurs:
${availableTypes.map(t => `- "${t}"`).join('\n')}

❌ INTERDICTIONS ABSOLUES - N'utilise JAMAIS:
- "commit", "update", "change", "modification"
- "refactoring" (utilise "refactor")
- "feature" (utilise "feat")
- "bugfix" (utilise "fix")
- "documentation" (utilise "docs")
- "performance" (utilise "perf")
- "testing" ou "tests" (utilise "test")
- Toute autre variation ou forme longue

✅ UTILISE SEULEMENT ET EXACTEMENT: ${availableTypes.join(', ')}

RÈGLES STRICTES:
1. Le type DOIT être EXACTEMENT l'un de ces 11 mots (pas de variation): feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
2. AUCUNE forme longue acceptée: utilise "refactor" PAS "refactoring", "feat" PAS "feature"
3. Le scope est optionnel mais recommandé (par exemple: api, ui, auth, database)
4. Le subject doit être concis (max 50 caractères), impératif, COMMENCER PAR UNE MINUSCULE (lowercase), sans point final
5. Le body est optionnel mais utile pour expliquer POURQUOI le changement a été fait
6. Utilise "!" après le type/scope pour indiquer un breaking change
7. Si breaking change, DOIT inclure "BREAKING CHANGE:" dans le footer

IMPORTANT - RÈGLE CAPITALE POUR LE SUBJECT:
- Le subject DOIT ABSOLUMENT commencer par une lettre MINUSCULE (lowercase)
- ✓ CORRECT: "add user authentication"
- ✗ INCORRECT: "Add user authentication"
- ✓ CORRECT: "fix parsing error"
- ✗ INCORRECT: "Fix parsing error"

RÉPONSE ATTENDUE:
Tu dois répondre avec un objet JSON contenant EXACTEMENT ces champs:
- "type" (OBLIGATOIRE): string - Le type de commit EXACT parmi: ${availableTypes.join(', ')}
- "subject" (OBLIGATOIRE): string - Le sujet du commit (impératif, max 50 chars)
- "breaking" (OBLIGATOIRE): boolean - Si c'est un breaking change
- "confidence" (OBLIGATOIRE): integer - Niveau de confiance 0-100
- "scope" (optionnel): string - Le scope du commit
- "body" (optionnel): string - Description détaillée
- "breakingDescription" (optionnel): string - Description du breaking change
- "reasoning" (optionnel): string - Explication de tes choix

EXEMPLES DE RÉPONSES VALIDES:
{
  "type": "feat",
  "scope": "api",
  "subject": "add user authentication endpoint",
  "body": "Implement JWT-based authentication to secure API endpoints. This allows users to login and receive a token for subsequent requests.",
  "breaking": false,
  "breakingDescription": null,
  "confidence": 85,
  "reasoning": "The changes add new authentication functionality (feat), focused on the API layer (api scope). High confidence based on clear API endpoint additions."
}

{
  "type": "refactor",
  "scope": "dependencies",
  "subject": "remove unused dependencies and optimize package size",
  "body": "Removed unnecessary dependencies to reduce the overall package size.",
  "breaking": false,
  "confidence": 90,
  "reasoning": "Code restructuring without adding features or fixing bugs = refactor (NOT refactoring)"
}

{
  "type": "fix",
  "scope": "parser",
  "subject": "handle edge case in JSON parsing",
  "breaking": false,
  "confidence": 90
}

{
  "type": "docs",
  "subject": "update installation guide",
  "breaking": false,
  "confidence": 95
}

IMPORTANT - FORMAT DE RÉPONSE:
- Un JSON Schema est fourni à l'API pour garantir la structure
- Réponds avec un objet JSON valide contenant AU MINIMUM: type, subject, breaking, confidence
- Ne pas omettre les champs obligatoires
- Les champs optionnels peuvent être null ou omis
- Le champ "type" DOIT être l'un des types disponibles SANS EXCEPTION

INSTRUCTIONS D'ANALYSE:
- Analyse le CONTEXTE des changements pour choisir le bon type parmi: ${availableTypes.join(', ')}
- Sois précis dans le scope (identifie le module/composant affecté)
- Le subject doit décrire CE QUI a changé, le body POURQUOI
- La confidence doit être honnête (0-100)
- Le reasoning explique ton raisonnement pour choisir type/scope

⚠️⚠️⚠️ RAPPEL FINAL CRITIQUE ⚠️⚠️⚠️
Le champ "type" doit être EXACTEMENT l'un de ces 11 mots (ni plus ni moins):
${availableTypes.join(', ')}

ATTENTION AUX ERREURS COURANTES:
- ❌ "refactoring" → ✅ "refactor"
- ❌ "feature" → ✅ "feat"
- ❌ "bugfix" → ✅ "fix"
- ❌ "documentation" → ✅ "docs"
- ❌ "commit" → ✅ Choisis le bon type selon le changement

N'utilise AUCUNE variation, forme longue, ou synonyme. EXACTEMENT ces 11 mots.`;
}

/**
 * Génère le prompt utilisateur avec le diff et le contexte
 */
export function generateUserPrompt(
  diff: string,
  context: CommitContext,
): string {
  const parts = [
    '=== CONTEXTE ===',
    `Branche: ${context.branch}`,
    `Fichiers modifiés: ${context.files.join(', ')}`,
  ];

  if (context.availableScopes && context.availableScopes.length > 0) {
    parts.push(`Scopes suggérés: ${context.availableScopes.join(', ')}`);
  }

  if (context.recentCommits && context.recentCommits.length > 0) {
    parts.push('');
    parts.push('=== COMMITS RÉCENTS (pour contexte) ===');
    context.recentCommits.slice(0, 5).forEach((commit, i) => {
      parts.push(`${i + 1}. ${commit}`);
    });
  }

  parts.push('');
  parts.push('=== CHANGEMENTS (git diff) ===');
  parts.push(diff);
  parts.push('');
  parts.push(
    'Analyse ces changements et génère un message de commit conventionnel au format JSON comme spécifié dans les instructions système.',
  );

  return parts.join('\n');
}

/**
 * Parse la réponse JSON de l'AI
 */
export function parseAIResponse(response: string): any {
  // Nettoie la réponse de tout markdown ou texte supplémentaire
  let cleanedResponse = response.trim();

  // Supprime les blocs de code markdown si présents
  cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
  cleanedResponse = cleanedResponse.replace(/```\s*/g, '');

  // Supprime les retours à la ligne excessifs
  cleanedResponse = cleanedResponse.trim();

  // Cherche du JSON dans la réponse (au cas où l'AI ajoute du texte avant/après)
  // Pattern amélioré pour capturer le JSON même avec du texte autour
  const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}(?=\s*$|\s*\n\s*[^}\s])/);

  if (!jsonMatch) {
    // Essaie une approche plus aggressive: trouve le premier { et le dernier }
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = cleanedResponse.substring(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(potentialJson);
      } catch (error) {
        // Continue vers l'erreur finale
      }
    }

    throw new Error(
      `Réponse AI invalide: aucun JSON trouvé dans la réponse.\n\nRéponse reçue: ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`,
    );
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(
      `Impossible de parser la réponse JSON: ${error instanceof Error ? error.message : String(error)}\n\nJSON extrait: ${jsonMatch[0].substring(0, 200)}${jsonMatch[0].length > 200 ? '...' : ''}`,
    );
  }
}
