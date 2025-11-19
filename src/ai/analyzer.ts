import simpleGit from 'simple-git';
import type { CommitContext } from './providers/base.js';
import { SIZE_LIMITS, GIT_LIMITS } from '../shared/constants/index.js';

const git = simpleGit();

/**
 * Analyse les changements et prépare le contexte pour l'AI
 */
export async function analyzeStagedChanges(): Promise<{
  diff: string;
  context: Omit<CommitContext, 'availableTypes' | 'availableScopes'>;
}> {
  // Récupère les fichiers stagés
  const status = await git.status();
  const stagedFiles = [
    ...status.staged,
    ...status.modified.filter((f) => status.staged.includes(f)),
  ];

  if (stagedFiles.length === 0) {
    throw new Error('Aucun fichier stagé. Utilisez "git add" pour stager des fichiers.');
  }

  // Récupère le diff des fichiers stagés
  const diff = await git.diff(['--staged', '--no-color']);

  if (!diff || diff.trim().length === 0) {
    throw new Error('Aucun changement détecté dans les fichiers stagés.');
  }

  // Limite la taille du diff (pour éviter de dépasser les limites des modèles)
  const truncatedDiff = truncateDiff(diff, SIZE_LIMITS.MAX_DIFF_SIZE);

  // Récupère la branche courante
  const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

  // Récupère quelques commits récents pour contexte
  const recentCommitsLog = await git.log({ maxCount: GIT_LIMITS.RECENT_COMMITS_COUNT });
  const recentCommits = recentCommitsLog.all.map((commit) => commit.message);

  return {
    diff: truncatedDiff,
    context: {
      files: stagedFiles,
      branch: branch.trim(),
      recentCommits,
    },
  };
}

/**
 * Tronque le diff si trop long (garde le début et la fin)
 */
function truncateDiff(diff: string, maxChars: number): string {
  if (diff.length <= maxChars) {
    return diff;
  }

  const keepChars = Math.floor(maxChars / 2);
  const start = diff.slice(0, keepChars);
  const end = diff.slice(-keepChars);

  const truncatedLines = diff.split('\n').length - start.split('\n').length - end.split('\n').length;

  return `${start}\n\n... [${truncatedLines} lignes tronquées pour économiser les tokens] ...\n\n${end}`;
}

/**
 * Détecte le scope potentiel basé sur les fichiers modifiés
 */
export function detectScopeFromFiles(files: string[]): string | undefined {
  // Patterns communs pour détecter le scope
  const patterns: Record<string, RegExp> = {
    api: /^(src\/|lib\/)?(api|routes|endpoints)/i,
    ui: /^(src\/|lib\/)?(components|ui|views|pages)/i,
    auth: /^(src\/|lib\/)?(auth|authentication|login)/i,
    database: /^(src\/|lib\/)?(db|database|models|migrations)/i,
    config: /^(config|\.env|\.config)/i,
    test: /\.(test|spec)\.(ts|js|tsx|jsx)$/i,
    docs: /^(docs|documentation|readme)/i,
    ci: /^\.github|^\.gitlab|^\.circleci|^\.travis/i,
    build: /^(webpack|vite|rollup|tsconfig|package\.json|pnpm-lock)/i,
  };

  // Compte les matchs pour chaque scope
  const scopeCounts: Record<string, number> = {};

  for (const file of files) {
    for (const [scope, pattern] of Object.entries(patterns)) {
      if (pattern.test(file)) {
        scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
      }
    }
  }

  // Retourne le scope le plus fréquent
  const entries = Object.entries(scopeCounts);
  if (entries.length === 0) {
    return undefined;
  }

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
