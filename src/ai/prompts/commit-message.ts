import type { DiffAnalysis } from "../../domain/services/DiffAnalyzer.js";
import type { AIGeneratedCommit } from "../../types.js";
import type { CommitExample } from "../examples/commit-samples.js";
import type { CommitContext } from "../providers/base.js";

// Re-export CommitExample for convenience
export type { CommitExample } from "../examples/commit-samples.js";

/**
 * Interface pour l'analyse de raisonnement Chain-of-Thought
 */
export interface ReasoningAnalysis {
  architecturalContext: string;
  changeIntention: string;
  changeNature: string;
  keySymbols?: string[]; // Optionnel car l'AI peut ne pas toujours le retourner
  suggestedType: string;
  complexityJustification: string;
}

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

IMPORTANT: Tu recevras une analyse structurée du diff qui identifie:
- Les fonctions, classes et symboles modifiés (avec leurs NOMS EXACTS)
- Les patterns de changement détectés (tests, bug fixes, refactoring, etc.)
- Les relations entre fichiers (imports, dépendances)
- La complexité globale des changements

Génère un message de commit qui:
- UTILISE les NOMS EXACTS des fonctions/classes/types modifiés (pas de généralisations)
- Mentionne EXPLICITEMENT les symboles importants modifiés dans le subject ou body
- Reflète le PATTERN DE CHANGEMENT dominant identifié dans l'analyse
- Capture l'INTENTION derrière les changements, pas seulement ce qui a été fait
- Est concis mais informatif (50-72 caractères pour le subject)
- DOIT INCLURE un body détaillé si:
  * La complexité est "moderate" ou "complex"
  * Plusieurs fichiers sont modifiés (>3)
  * Un nouveau système/service est créé
  * Le changement impacte plusieurs composants

RÈGLES STRICTES pour un message SÉMANTIQUE (pas technique):
1. FOCUS SUR LE CONCEPT, pas les chemins de fichiers
   ❌ INTERDIT: "update src/domain/services/DiffAnalyzer.ts"
   ✅ REQUIS: "structured diff analysis for AI commit generation"

2. NOMME les composants/classes/systèmes créés ou modifiés
   ❌ VAGUE: "add new functionality to files"
   ✅ PRÉCIS: "introduce DiffAnalyzer for code change detection"

3. DÉCRIS la transformation ou l'intention
   ❌ VAGUE: "refactor code"
   ✅ PRÉCIS: "extract UserValidator class from UserService"

4. INCLUS un body si le changement est complexe
   - Explique POURQUOI (intention, bénéfice)
   - Décris CE QUI a été introduit au niveau architectural
   - Mentionne les impacts ou relations entre composants

Exemples de messages SÉMANTIQUES vs TECHNIQUES:
❌ TECHNIQUE: "update user service files"
✅ SÉMANTIQUE: "add email validation in createUser and updateUserProfile"

❌ TECHNIQUE: "modify DiffAnalyzer.ts and related files"
✅ SÉMANTIQUE: "enhance diff analysis with file importance ranking"

❌ TECHNIQUE: "add tests to test folder"
✅ SÉMANTIQUE: "add unit tests for authentication error handling"
`;

  return systemPrompt;
}

/**
 * Formate des exemples few-shot annotés pour le prompt
 */
export function formatFewShotExamples(examples: CommitExample[]): string {
  const parts: string[] = [];

  parts.push("");
  parts.push("<few_shot_examples>");
  parts.push(
    "  <!-- Exemples annotés de qualité pour guider la génération -->",
  );
  parts.push(
    "  <!-- Ces exemples montrent des messages SÉMANTIQUES (focus sur le concept, pas les fichiers) -->",
  );

  examples.forEach((example, index) => {
    parts.push(
      `  <example number="${index + 1}" quality="${example.qualityScore}/5">`,
    );
    parts.push(`    <change_summary>${example.diffSummary}</change_summary>`);
    parts.push(`    <commit_message>`);
    parts.push(`      <type>${example.message.type}</type>`);
    if (example.message.scope) {
      parts.push(`      <scope>${example.message.scope}</scope>`);
    }
    parts.push(`      <subject>${example.message.subject}</subject>`);
    if (example.message.body) {
      parts.push(`      <body>${example.message.body}</body>`);
    }
    parts.push(`    </commit_message>`);
    parts.push(`    <reasoning>${example.reasoning}</reasoning>`);
    parts.push(`  </example>`);
  });

  parts.push("</few_shot_examples>");

  return parts.join("\n");
}

/**
 * Génère le prompt utilisateur avec le diff et le contexte
 */
export function generateUserPrompt(
  diff: string,
  context: CommitContext,
  analysis?: DiffAnalysis,
  reasoning?: ReasoningAnalysis,
  fewShotExamples?: CommitExample[],
): string {
  const parts = ["<context>"];
  parts.push(`  <branch>${context.branch}</branch>`);
  parts.push(`  <files count="${context.files?.length || 0}">`);
  if (context.files && Array.isArray(context.files)) {
    context.files.forEach((file) => {
      parts.push(`    <file>${file}</file>`);
    });
  }
  parts.push("  </files>");

  if (context.availableScopes && context.availableScopes.length > 0) {
    parts.push("  <suggested_scopes>");
    context.availableScopes.forEach((scope) => {
      parts.push(`    <scope>${scope}</scope>`);
    });
    parts.push("  </suggested_scopes>");
  }
  parts.push("</context>");

  // Add few-shot examples if provided (preferred over recent commits)
  if (fewShotExamples && fewShotExamples.length > 0) {
    parts.push(formatFewShotExamples(fewShotExamples));
  }

  // Recent commits are kept as fallback for project-specific style
  if (context.recentCommits && context.recentCommits.length > 0) {
    parts.push("");
    parts.push("<recent_commits>");
    parts.push(
      "  <!-- Exemples de style de commits récents dans ce projet (fallback) -->",
    );
    context.recentCommits.slice(0, 5).forEach((commit) => {
      parts.push(`  <commit>${commit}</commit>`);
    });
    parts.push("</recent_commits>");
  }

  // Add Chain-of-Thought reasoning if available
  if (reasoning) {
    parts.push("");
    parts.push("<reasoning_analysis>");
    parts.push(
      "  <!-- Analyse structurée Chain-of-Thought pour guider la génération -->",
    );
    parts.push(
      `  <architectural_context>${reasoning.architecturalContext}</architectural_context>`,
    );
    parts.push(
      `  <change_intention>${reasoning.changeIntention}</change_intention>`,
    );
    parts.push(`  <change_nature>${reasoning.changeNature}</change_nature>`);
    parts.push("  <key_symbols>");
    if (reasoning.keySymbols && Array.isArray(reasoning.keySymbols)) {
      reasoning.keySymbols.forEach((symbol) => {
        parts.push(`    <symbol>${symbol}</symbol>`);
      });
    }
    parts.push("  </key_symbols>");
    parts.push(`  <suggested_type>${reasoning.suggestedType}</suggested_type>`);
    parts.push(
      `  <complexity_justification>${reasoning.complexityJustification}</complexity_justification>`,
    );
    parts.push("</reasoning_analysis>");
  }

  // Add structured diff analysis if available
  if (analysis) {
    parts.push("");
    parts.push("<diff_analysis>");
    parts.push(
      "  <!-- Analyse automatique du diff pour guider la génération -->",
    );

    // Summary
    parts.push("  <summary>");
    parts.push(`    <complexity>${analysis.complexity}</complexity>`);
    parts.push(
      `    <files_changed>${analysis.summary.filesChanged}</files_changed>`,
    );
    parts.push(`    <lines_added>${analysis.summary.linesAdded}</lines_added>`);
    parts.push(
      `    <lines_removed>${analysis.summary.linesRemoved}</lines_removed>`,
    );
    parts.push("  </summary>");

    // Modified symbols (functions, classes, etc.)
    if (
      analysis.modifiedSymbols &&
      Array.isArray(analysis.modifiedSymbols) &&
      analysis.modifiedSymbols.length > 0
    ) {
      parts.push("  <modified_symbols>");
      parts.push(
        "    <!-- UTILISE ces NOMS EXACTS dans ton message de commit -->",
      );
      analysis.modifiedSymbols.forEach((symbol) => {
        parts.push(
          `    <symbol type="${symbol.type}" file="${symbol.file}">${symbol.name}</symbol>`,
        );
      });
      parts.push("  </modified_symbols>");
    }

    // Change patterns
    if (
      analysis.changePatterns &&
      Array.isArray(analysis.changePatterns) &&
      analysis.changePatterns.length > 0
    ) {
      parts.push("  <change_patterns>");
      parts.push(
        "    <!-- Patterns détectés, triés par confiance (le premier est le dominant) -->",
      );
      analysis.changePatterns.forEach((pattern) => {
        parts.push(
          `    <pattern type="${pattern.type}" confidence="${pattern.confidence.toFixed(2)}" count="${pattern.count}">`,
        );
        parts.push(`      ${pattern.description}`);
        parts.push("    </pattern>");
      });
      parts.push("  </change_patterns>");
    }

    // File relationships
    if (
      analysis.fileRelationships &&
      Array.isArray(analysis.fileRelationships) &&
      analysis.fileRelationships.length > 0
    ) {
      parts.push("  <file_relationships>");
      analysis.fileRelationships.slice(0, 10).forEach((rel) => {
        // Limit to 10
        parts.push(
          `    <relationship from="${rel.from}" to="${rel.to}" type="${rel.type}" />`,
        );
      });
      parts.push("  </file_relationships>");
    }

    parts.push("</diff_analysis>");
  }

  parts.push("");
  parts.push("<diff>");
  parts.push(
    "  <!-- Diff complet pour vérifier les détails de l'implémentation -->",
  );
  parts.push(`<![CDATA[
`);
  parts.push(diff);
  parts.push(`
]]>`);
  parts.push("</diff>");
  parts.push("");

  // Enhanced instructions using the analysis
  if (analysis) {
    // Use file-level analysis (research-proven approach)
    const highPriorityFiles =
      analysis.fileChanges && Array.isArray(analysis.fileChanges)
        ? analysis.fileChanges.filter((f) => f.importance === "high")
        : [];
    const _newFiles =
      analysis.fileChanges && Array.isArray(analysis.fileChanges)
        ? analysis.fileChanges.filter((f) => f.isNew)
        : [];

    // Smart pattern selection: prioritize feature_addition over technical patterns
    let dominantPattern =
      analysis.changePatterns &&
      Array.isArray(analysis.changePatterns) &&
      analysis.changePatterns.length > 0
        ? analysis.changePatterns[0]
        : undefined;
    const featurePattern =
      analysis.changePatterns && Array.isArray(analysis.changePatterns)
        ? analysis.changePatterns.find((p) => p.type === "feature_addition")
        : undefined;

    if (
      featurePattern &&
      featurePattern.confidence >= 0.7 &&
      analysis.changePatterns &&
      Array.isArray(analysis.changePatterns) &&
      analysis.changePatterns.indexOf(featurePattern) <= 2
    ) {
      dominantPattern = featurePattern;
    }

    parts.push("ANALYSE STRUCTURÉE:");
    parts.push("");

    // Show key components/modules created or modified (semantic focus)
    if (highPriorityFiles.length > 0) {
      parts.push("Composants principaux:");
      highPriorityFiles.slice(0, 5).forEach((f) => {
        // Extract component/class name from file path
        const fileName =
          f.path
            .split("/")
            .pop()
            ?.replace(/\.(ts|tsx|js|jsx)$/, "") || f.path;
        const status = f.isNew
          ? "NOUVEAU"
          : `modifié (+${f.linesAdded}/-${f.linesRemoved})`;

        // Show component name (semantic) with path as context
        parts.push(`  - ${fileName} (${status})`);
        if (f.importance === "high") {
          parts.push(`    Localisation: ${f.path}`);
        }
      });
      parts.push("");
    }

    if (dominantPattern) {
      parts.push(`Nature: ${dominantPattern.description}`);
      const suggestedType =
        dominantPattern.type === "feature_addition"
          ? "feat"
          : dominantPattern.type === "bug_fix"
            ? "fix"
            : dominantPattern.type === "refactoring"
              ? "refactor"
              : dominantPattern.type === "test_addition" ||
                  dominantPattern.type === "test_modification"
                ? "test"
                : dominantPattern.type === "documentation"
                  ? "docs"
                  : "chore";
      parts.push(`Type suggéré: ${suggestedType}`);
      parts.push("");
    }

    parts.push("INSTRUCTIONS POUR LE COMMIT MESSAGE:");
    parts.push("1. SUBJECT (50-72 chars):");
    parts.push(
      "   - Décris QUEL système/fonctionnalité/composant a été créé/modifié",
    );
    parts.push(
      "   - Utilise les NOMS de classes/services/modules du diff (ex: 'DiffAnalyzer', 'AIProvider')",
    );
    parts.push(
      "   - NE liste PAS les chemins de fichiers (ex: ❌ 'src/domain/services/...')",
    );
    parts.push(
      "   - Sois descriptif et sémantique (ex: ✅ 'structured diff analysis for AI commits')",
    );
    parts.push("");
    parts.push(
      `2. BODY (REQUIS car complexité=${analysis.complexity} avec ${analysis.summary.filesChanged} fichiers):`,
    );
    parts.push(
      "   - Explique POURQUOI ce changement (intention, bénéfice architectural)",
    );
    parts.push(
      "   - Décris CE QUI a été introduit/modifié au niveau conceptuel",
    );
    parts.push("   - Mentionne les composants impactés et leurs interactions");
    parts.push("   - 2-4 phrases minimum pour les changements complexes");
    parts.push("");
    parts.push("3. RÈGLES STRICTES:");
    parts.push("   - Focus sur l'INTENTION et le CONCEPT, pas les fichiers");
    parts.push("   - Si 1 classe principale créée → nomme-la dans le subject");
    parts.push(
      "   - Si pattern clair (ex: 'refactor X to use Y') → décris la transformation",
    );
    parts.push("   - N'invente PAS de détails non présents dans le diff");
    parts.push("");
    parts.push("Génère le commit JSON maintenant.");
  } else {
    // Fallback if no analysis (shouldn't happen)
    parts.push(
      "Analyse ATTENTIVEMENT ces changements:\n" +
        "1. Examine TOUS les fichiers listés ci-dessus\n" +
        "2. Comprends le CONTEXTE de chaque modification dans le diff\n" +
        "3. Identifie le BUT principal de ces changements\n" +
        "4. Génère un message de commit conventionnel PRÉCIS et DESCRIPTIF au format JSON comme spécifié.\n\n" +
        "Le message doit refléter CE QUI a été changé et POURQUOI, pas seulement une description générique.",
    );
  }

  return parts.join("\n");
}

/**
 * Génère le prompt système pour l'étape de raisonnement Chain-of-Thought
 */
export function generateReasoningSystemPrompt(): string {
  return `Tu es un expert en analyse de code et architecture logicielle.
Ta tâche est d'analyser les changements de code et de fournir une analyse structurée qui guidera la génération d'un message de commit.

Réponds UNIQUEMENT en JSON avec cette structure exacte:
{
  "architecturalContext": "string - Couche/Module affecté (domain, application, infrastructure, presentation) et rôle de chaque fichier",
  "changeIntention": "string - Pourquoi ce changement était nécessaire, problème résolu, bénéfice",
  "changeNature": "string - Type de changement (feature, fix, refactor, etc.) et impact sur l'API",
  "keySymbols": ["string"] - Liste des symboles centraux (classes, fonctions, interfaces) modifiés,
  "suggestedType": "feat|fix|refactor|..." - Type de commit suggéré,
  "complexityJustification": "string - Justification de la complexité (simple/moderate/complex)"
}`;
}

/**
 * Génère le prompt utilisateur pour l'étape de raisonnement Chain-of-Thought
 */
export function generateReasoningUserPrompt(
  diff: string,
  analysis?: DiffAnalysis,
  files: string[] = [],
): string {
  const parts: string[] = [];

  parts.push(
    "Analyse ces changements de code et fournis une analyse structurée:",
  );
  parts.push("");

  if (analysis) {
    parts.push("ANALYSE AUTOMATIQUE:");
    parts.push(`- Complexité: ${analysis.complexity}`);
    parts.push(`- Fichiers modifiés: ${analysis.summary.filesChanged}`);
    parts.push(
      `- Pattern dominant: ${
        analysis.changePatterns &&
        Array.isArray(analysis.changePatterns) &&
        analysis.changePatterns.length > 0
          ? analysis.changePatterns[0]?.description || "N/A"
          : "N/A"
      }`,
    );

    if (
      analysis.modifiedSymbols &&
      Array.isArray(analysis.modifiedSymbols) &&
      analysis.modifiedSymbols.length > 0
    ) {
      parts.push("- Symboles modifiés:");
      analysis.modifiedSymbols.slice(0, 10).forEach((symbol) => {
        parts.push(`  * ${symbol.name} (${symbol.type}) dans ${symbol.file}`);
      });
    }
    parts.push("");
  }

  parts.push("FICHIERS MODIFIÉS:");
  files.forEach((file) => {
    parts.push(`- ${file}`);
  });
  parts.push("");

  parts.push("DIFF:");
  parts.push("```");
  parts.push(diff);
  parts.push("```");
  parts.push("");

  parts.push("INSTRUCTIONS:");
  parts.push(
    "1. CONTEXTE ARCHITECTURAL: Identifie la couche/le module affecté et le rôle de chaque fichier",
  );
  parts.push(
    "2. INTENTION DU CHANGEMENT: Explique pourquoi ce changement était nécessaire",
  );
  parts.push("3. NATURE DU CHANGEMENT: Décris le type et l'impact sur l'API");
  parts.push(
    "4. SYMBOLES CLÉS: Liste les classes/fonctions/interfaces principales modifiées",
  );
  parts.push(
    "5. TYPE SUGGÉRÉ: Recommande un type de commit (feat, fix, refactor, etc.)",
  );
  parts.push(
    "6. JUSTIFICATION COMPLEXITÉ: Explique pourquoi le changement est simple/moderate/complex",
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
