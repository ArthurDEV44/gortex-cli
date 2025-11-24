/**
 * Utilities for loading project-specific commit guidelines
 * Supports multiple file locations for flexibility
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Candidate paths for project commit guidelines files
 * Searched in order of priority
 */
const GUIDELINES_CANDIDATES = [
  ".claude/commands/commit.md",
  ".gortex/commit-guidelines.md",
  "COMMIT_GUIDELINES.md",
  ".github/COMMIT_GUIDELINES.md",
] as const;

/**
 * Loads project-specific commit guidelines from common locations
 * @param workingDirectory Optional working directory (defaults to process.cwd())
 * @returns The content of the guidelines file if found, undefined otherwise
 */
export async function loadProjectCommitGuidelines(
  workingDirectory?: string,
): Promise<string | undefined> {
  const baseDir = workingDirectory || process.cwd();

  for (const relativePath of GUIDELINES_CANDIDATES) {
    try {
      const fullPath = join(baseDir, relativePath);
      const content = await readFile(fullPath, "utf-8");
      // Return content if file exists and is not empty
      if (content.trim().length > 0) {
        return content.trim();
      }
    } catch {
      // File doesn't exist or can't be read, try next candidate
    }
  }

  return undefined;
}

/**
 * Checks if project guidelines exist without loading them
 * Useful for conditional logic
 * @param workingDirectory Optional working directory (defaults to process.cwd())
 * @returns true if any guidelines file exists, false otherwise
 */
export async function hasProjectCommitGuidelines(
  workingDirectory?: string,
): Promise<boolean> {
  const guidelines = await loadProjectCommitGuidelines(workingDirectory);
  return guidelines !== undefined;
}
