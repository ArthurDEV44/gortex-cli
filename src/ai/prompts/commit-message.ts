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

TYPES DISPONIBLES: ${availableTypes.join(', ')}

RÈGLES STRICTES:
1. Le type DOIT être l'un des types disponibles ci-dessus
2. Le scope est optionnel mais recommandé (par exemple: api, ui, auth, database)
3. Le subject doit être concis (max 50 caractères), impératif, sans majuscule au début, sans point final
4. Le body est optionnel mais utile pour expliquer POURQUOI le changement a été fait
5. Utilise "!" après le type/scope pour indiquer un breaking change
6. Si breaking change, DOIT inclure "BREAKING CHANGE:" dans le footer

RÉPONSE ATTENDUE:
Tu dois répondre UNIQUEMENT avec un JSON valide dans ce format exact:
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

IMPORTANT:
- Analyse le CONTEXTE des changements pour choisir le bon type
- Sois précis dans le scope (identifie le module/composant affecté)
- Le subject doit décrire CE QUI a changé, le body POURQUOI
- La confidence doit être honnête (0-100)
- Le reasoning explique ton raisonnement pour choisir type/scope
- TOUJOURS répondre en JSON valide, rien d'autre`;
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
  // Cherche du JSON dans la réponse (au cas où l'AI ajoute du texte avant/après)
  const jsonMatch = response.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      'Réponse AI invalide: aucun JSON trouvé dans la réponse',
    );
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(
      `Impossible de parser la réponse JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
