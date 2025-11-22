/**
 * @deprecated This file contains legacy Git utilities
 *
 * MIGRATION STATUS: Most functionality has been migrated to Clean Architecture
 *
 * NEW CODE SHOULD USE:
 * - Domain: `IGitRepository` interface (src/domain/repositories/IGitRepository.ts)
 * - Infrastructure: `GitRepositoryImpl` (src/infrastructure/repositories/GitRepositoryImpl.ts)
 * - React Hooks: `useGitRepository()` (src/infrastructure/di/hooks.ts)
 *
 * This file is kept temporarily for:
 * - Backward compatibility with some legacy components
 * - Components that directly check provider availability (CommitModeSelector)
 *
 * TODO Phase 11: Complete removal after all components are migrated
 */

import { type LogResult, type SimpleGit, simpleGit } from "simple-git";
import type { CommitStats } from "../types.js";
import { isConventionalCommit, parseConventionalCommit } from "./validate.js";

const git: SimpleGit = simpleGit();

/**
 * Vérifie si on est dans un repo Git
 */
export async function isGitRepository(): Promise<boolean> {
  try {
    await git.revparse(["--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie s'il y a des changements à commiter
 */
export async function hasChanges(): Promise<boolean> {
  const status = await git.status();
  return status.files.length > 0;
}

/**
 * Récupère les fichiers modifiés
 */
export async function getModifiedFiles(): Promise<string[]> {
  const status = await git.status();
  return status.files.map((file) => file.path);
}

/**
 * Stage tous les fichiers
 */
export async function stageAll(): Promise<void> {
  await git.add(".");
}

/**
 * Crée un commit avec le message donné
 */
export async function createCommit(message: string): Promise<void> {
  await git.commit(message);
}

/**
 * Récupère l'historique des commits
 */
export async function getCommitHistory(maxCount = 100): Promise<LogResult> {
  return await git.log({ maxCount });
}

/**
 * Analyse les statistiques des commits
 */
export async function analyzeCommitStats(maxCount = 100): Promise<CommitStats> {
  const log = await getCommitHistory(maxCount);
  const commits = log.all;

  let conventional = 0;
  const typeBreakdown: Record<string, number> = {};

  for (const commit of commits) {
    const message = commit.message;

    if (isConventionalCommit(message)) {
      conventional++;

      const parsed = parseConventionalCommit(message);
      if (parsed) {
        typeBreakdown[parsed.type] = (typeBreakdown[parsed.type] || 0) + 1;
      }
    }
  }

  const total = commits.length;
  const nonConventional = total - conventional;
  const percentage = total > 0 ? (conventional / total) * 100 : 0;

  return {
    total,
    conventional,
    nonConventional,
    percentage,
    typeBreakdown,
  };
}

/**
 * Récupère le chemin du dossier .git
 */
export async function getGitDir(): Promise<string> {
  const gitDir = await git.revparse(["--git-dir"]);
  return gitDir.trim();
}

/**
 * Récupère la branche actuelle
 */
export async function getCurrentBranch(): Promise<string> {
  const branch = await git.revparse(["--abbrev-ref", "HEAD"]);
  return branch.trim();
}

/**
 * Récupère toutes les branches locales
 */
export async function getAllBranches(): Promise<string[]> {
  const result = await git.branchLocal();
  return result.all;
}

/**
 * Change de branche
 */
export async function checkoutBranch(branch: string): Promise<void> {
  await git.checkout(branch);
}

/**
 * Crée une nouvelle branche et bascule dessus
 */
export async function createAndCheckoutBranch(
  branchName: string,
): Promise<void> {
  await git.checkoutLocalBranch(branchName);
}

/**
 * Vérifie si une branche existe
 */
export async function branchExists(branchName: string): Promise<boolean> {
  const branches = await getAllBranches();
  return branches.includes(branchName);
}

/**
 * Récupère les fichiers modifiés avec leur statut
 */
export async function getModifiedFilesWithStatus(): Promise<
  Array<{ path: string; status: string }>
> {
  const status = await git.status();
  return status.files.map((file) => ({
    path: file.path,
    status: getStatusLabel(file.working_dir, file.index),
  }));
}

/**
 * Convertit les codes de statut Git en labels lisibles
 */
function getStatusLabel(workingDir: string, index: string): string {
  if (index === "A") return "nouveau";
  if (index === "M") return "modifié";
  if (index === "D") return "supprimé";
  if (workingDir === "M") return "modifié";
  if (workingDir === "D") return "supprimé";
  if (workingDir === "?") return "non suivi";
  return "modifié";
}

/**
 * Stage des fichiers spécifiques
 */
export async function stageFiles(files: string[]): Promise<void> {
  if (files.length === 0) return;

  // Pour gérer les fichiers supprimés, on utilise une approche simple :
  // git add -u . pour mettre à jour tous les fichiers modifiés/supprimés
  // puis on vérifie si tous nos fichiers sont bien staged

  // D'abord, essayer de stage tous les fichiers normalement
  for (const file of files) {
    try {
      await git.add(file);
    } catch (error: unknown) {
      // Si le fichier est supprimé, git add échoue
      // On ignore l'erreur, on gèrera les suppressions après
      if (
        error instanceof Error &&
        !error.message?.includes("did not match any files")
      ) {
        throw error;
      }
    }
  }

  // Ensuite, stage explicitement tous les fichiers supprimés avec git add -u .
  // Cette commande ne génère pas d'erreur même si aucun fichier n'est supprimé
  try {
    await git.raw(["add", "-u", "."]);
  } catch {
    // Ignorer les erreurs de git add -u
  }
}

/**
 * Vérifie si le remote existe
 */
export async function hasRemote(): Promise<boolean> {
  try {
    const remotes = await git.getRemotes();
    return remotes.length > 0;
  } catch {
    return false;
  }
}

/**
 * Récupère le nom du remote par défaut (généralement 'origin')
 */
export async function getDefaultRemote(): Promise<string> {
  const remotes = await git.getRemotes();
  if (remotes.length === 0) {
    throw new Error("Aucun remote configuré");
  }
  // Chercher 'origin' en priorité
  const origin = remotes.find((r) => r.name === "origin");
  return origin ? origin.name : remotes[0].name;
}

/**
 * Récupère l'URL du remote
 */
export async function getRemoteUrl(remote = "origin"): Promise<string | null> {
  try {
    const remotes = await git.getRemotes(true);
    const remoteObj = remotes.find((r) => r.name === remote);
    return remoteObj?.refs.push || null;
  } catch {
    return null;
  }
}

/**
 * Push la branche actuelle vers le remote
 */
export async function pushToRemote(
  remote: string,
  branch: string,
  setUpstream = false,
): Promise<void> {
  if (setUpstream) {
    await git.push(["-u", remote, branch]);
  } else {
    await git.push(remote, branch);
  }
}

/**
 * Vérifie si la branche actuelle track un remote
 */
export async function hasUpstream(): Promise<boolean> {
  try {
    await git.revparse(["--abbrev-ref", "@{upstream}"]);
    return true;
  } catch {
    return false;
  }
}
