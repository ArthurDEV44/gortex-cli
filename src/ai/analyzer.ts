import simpleGit from "simple-git";
import { GIT_LIMITS } from "../shared/constants/index.js";
import type { CommitContext } from "./providers/base.js";

const git = simpleGit();

/**
 * Analyse les changements et prépare le contexte pour l'AI
 */
export async function analyzeStagedChanges(): Promise<{
  diff: string;
  context: Omit<CommitContext, "availableTypes" | "availableScopes">;
}> {
  // Récupère les fichiers stagés
  const status = await git.status();
  const stagedFiles = [
    ...status.staged,
    ...status.modified.filter((f) => status.staged.includes(f)),
  ];

  if (stagedFiles.length === 0) {
    throw new Error(
      'Aucun fichier stagé. Utilisez "git add" pour stager des fichiers.',
    );
  }

  // Récupère le diff des fichiers stagés
  const diff = await git.diff(["--staged", "--no-color"]);

  if (!diff || diff.trim().length === 0) {
    throw new Error("Aucun changement détecté dans les fichiers stagés.");
  }

  // Récupère la branche courante
  const branch = await git.revparse(["--abbrev-ref", "HEAD"]);

  // Récupère quelques commits récents pour contexte
  const recentCommitsLog = await git.log({
    maxCount: GIT_LIMITS.RECENT_COMMITS_COUNT,
  });
  const recentCommits = recentCommitsLog.all.map((commit) => commit.message);

  return {
    diff: diff,
    context: {
      files: stagedFiles,
      branch: branch.trim(),
      recentCommits,
    },
  };
}
