/**
 * Verifier Agent Prompts - Phase 2
 * Factual accuracy verification against the real diff
 */

import type { DiffAnalysis } from "../../domain/services/DiffAnalyzer.js";

/**
 * Interface pour le résultat de vérification factuelle (Verifier Agent - Phase 2)
 */
export interface VerificationResult {
  factualAccuracy: number; // 0-100: Score de précision factuelle
  hasCriticalIssues: boolean; // true si hallucinations ou erreurs critiques
  issues: Array<{
    type: "hallucination" | "omission" | "inaccuracy";
    severity: "critical" | "major" | "minor";
    description: string;
    evidence: string; // Preuve depuis le diff
  }>;
  verifiedSymbols: string[]; // Symboles mentionnés ET présents dans le diff
  missingSymbols: string[]; // Symboles importants dans le diff mais non mentionnés
  hallucinatedSymbols: string[]; // Symboles mentionnés mais absents du diff
  recommendations: string[]; // Actions pour corriger
  reasoning: string; // Explication de la vérification
}

/**
 * Génère le prompt système pour le Verifier Agent
 * Vérifie la précision factuelle du commit par rapport au diff réel
 */
export function generateVerifierSystemPrompt(): string {
  return `Tu es un VERIFIER pragmatique. Ta tâche : comparer le commit avec le DIFF réel pour détecter hallucinations CRITIQUES et erreurs factuelles MAJEURES.

VÉRIFICATIONS OBLIGATOIRES:

1. HALLUCINATION CRITIQUE (seulement si évidente):
   - Le commit mentionne des composants/classes/fonctions QUI N'EXISTENT CLAIREMENT PAS dans le diff
   - Exemple: "Add UserService" mais UserService n'apparaît NULLE PART (ni nom de fichier, ni dans le code)
   - ⚠️  TOLÈRE les généralisations raisonnables (ex: "debug documentation" pour des fichiers de debug)
   - ⚠️  TOLÈRE les descriptions génériques de fichiers supprimés/ajoutés

2. OMISSION MAJEURE (seulement si impact significatif):
   - Le commit OMET des composants CENTRAUX du diff (>50% du changement)
   - Exemple: Diff modifie 3 fichiers majeurs, commit n'en mentionne qu'1
   - ⚠️  Les détails mineurs omis ne sont PAS des problèmes

3. INEXACTITUDE MAJEURE (seulement si contradiction claire):
   - Le commit décrit incorrectement la NATURE PRINCIPALE du changement
   - Exemple: Dit "refactor" mais c'est clairement une "nouvelle feature"
   - ⚠️  Les variations mineures de formulation sont acceptables

Retourne JSON (SANS \`\`\`json):
{
  "factualAccuracy": number (0-100),
  "hasCriticalIssues": boolean,
  "issues": [
    {
      "type": "hallucination" | "omission" | "inaccuracy",
      "severity": "critical" | "major" | "minor",
      "description": "string",
      "evidence": "string"
    }
  ],
  "verifiedSymbols": ["string"],
  "missingSymbols": ["string"],
  "hallucinatedSymbols": ["string"],
  "recommendations": ["string"],
  "reasoning": "string"
}

Règles:
- factualAccuracy = 100 si AUCUNE hallucination critique, symboles majeurs mentionnés
- factualAccuracy = 80-99 si omissions mineures ou généralisations acceptables
- factualAccuracy = 60-79 si omissions majeures MAIS pas d'hallucinations
- factualAccuracy = 0-59 si hallucinations critiques OU multiples erreurs majeures
- hasCriticalIssues = true SEULEMENT si:
  * Au moins 1 hallucination CRITIQUE (severity: "critical")
  * OU factualAccuracy < 50 (pas 70)
  * OU 3+ erreurs "major"
- Sois PRAGMATIQUE : préfère accepter un commit légèrement imprécis qu'halluciner des problèmes
- IMPORTANT: Les fichiers SUPPRIMÉS (deleted) dans le diff ne sont PAS des hallucinations si le commit mentionne "updated" ou "removed" documentation`;
}

/**
 * Génère le prompt utilisateur pour le Verifier Agent
 */
export function generateVerifierUserPrompt(
  commit: {
    type: string;
    scope?: string;
    subject: string;
    body?: string;
  },
  diff: string,
  analysis: DiffAnalysis,
): string {
  const parts: string[] = [];

  parts.push("COMMIT À VÉRIFIER:");
  parts.push(`Type: ${commit.type}`);
  parts.push(`Subject: ${commit.subject}`);
  if (commit.body) {
    parts.push(`Body: ${commit.body}`);
  }
  parts.push("");

  parts.push("DIFF RÉEL (source de vérité):");
  parts.push("```");
  // Limiter le diff pour ne pas dépasser les tokens
  const truncatedDiff =
    diff.length > 8000
      ? `${diff.substring(0, 8000)}\n... [diff tronqué]`
      : diff;
  parts.push(truncatedDiff);
  parts.push("```");
  parts.push("");

  parts.push("ANALYSE STRUCTURÉE (référence):");
  parts.push(`- Fichiers: ${analysis.summary.filesChanged}`);
  parts.push(`- Pattern: ${analysis.changePatterns[0]?.type ?? "unknown"}`);

  if (analysis.modifiedSymbols.length > 0) {
    parts.push(
      `- Symboles RÉELS modifiés (${analysis.modifiedSymbols.length} total):`,
    );
    analysis.modifiedSymbols.slice(0, 10).forEach((sym) => {
      parts.push(`  * ${sym.name} (${sym.type})`);
    });
    if (analysis.modifiedSymbols.length > 10) {
      parts.push(`  ... et ${analysis.modifiedSymbols.length - 10} autres`);
    }
  }
  parts.push("");

  parts.push("QUESTIONS DE VÉRIFICATION:");
  parts.push(
    "1. HALLUCINATION: Le commit mentionne-t-il des composants absents du diff?",
  );
  parts.push("2. OMISSION: Le commit omet-il des symboles majeurs du diff?");
  parts.push(
    "3. EXACTITUDE: Le type et la description correspondent-ils au pattern détecté?",
  );
  parts.push("");
  parts.push("Compare rigoureusement le commit avec le diff. Sois STRICT.");

  return parts.join("\n");
}
