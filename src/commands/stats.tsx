/**
 * Stats Command with Clean Architecture DI
 * Migrated from legacy utils/git to DI-based architecture
 */

import chalk from "chalk";
import { render } from "ink";
import { ErrorMessage } from "../components/ErrorMessage.js";
import { StatsDisplay } from "../components/StatsDisplay.js";
import type { IGitRepository } from "../domain/repositories/IGitRepository.js";
import { CompositionRoot } from "../infrastructure/di/CompositionRoot.js";
import { DIProvider } from "../infrastructure/di/DIContext.js";
import { ServiceIdentifiers } from "../infrastructure/di/ServiceRegistry.js";

export async function statsCommand(maxCount = 100): Promise<void> {
  // Create composition root for DI
  const root = new CompositionRoot();

  try {
    // Get repository from DI container
    const gitRepo = root
      .getContainer()
      .resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

    // Vérifier qu'on est dans un repo Git
    const isRepo = await gitRepo.isRepository();
    if (!isRepo) {
      const { waitUntilExit } = render(
        <ErrorMessage
          title="Not a Git Repository"
          message="This directory is not a Git repository"
          suggestions={[
            "Navigate to a directory with a Git repository",
            "Initialize a Git repository with: git init",
          ]}
        />,
      );
      await waitUntilExit();
      process.exit(1);
    }

    // Render stats with DI
    const { waitUntilExit } = render(
      <DIProvider root={root}>
        <StatsDisplay maxCount={maxCount} />
      </DIProvider>,
    );

    await waitUntilExit();
  } catch (error) {
    console.error(chalk.red("❌ Erreur:"), error);
    process.exit(1);
  } finally {
    // Cleanup DI container
    root.dispose();
  }
}
