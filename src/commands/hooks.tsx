/**
 * Git Hooks Commands with Clean Architecture DI
 * Migrated from legacy utils/git to DI-based architecture
 */

import chalk from "chalk";
import { render } from "ink";
import { ErrorMessage } from "../components/ErrorMessage.js";
import { HooksInstaller } from "../components/HooksInstaller.js";
import { HooksUninstaller } from "../components/HooksUninstaller.js";
import type { IGitRepository } from "../domain/repositories/IGitRepository.js";
import { CompositionRoot } from "../infrastructure/di/CompositionRoot.js";
import { DIProvider } from "../infrastructure/di/DIContext.js";
import { ServiceIdentifiers } from "../infrastructure/di/ServiceRegistry.js";

export async function installHooks(): Promise<void> {
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

    const { waitUntilExit } = render(
      <DIProvider root={root}>
        <HooksInstaller
          onComplete={(success) => {
            if (success) {
              console.log(chalk.green("\n✅ Hook Git installé avec succès !"));
              console.log(
                chalk.gray(
                  "Tous les commits seront validés pour suivre le format conventionnel",
                ),
              );
            } else {
              console.log(chalk.yellow("\n❌ Installation annulée"));
            }
            process.exit(success ? 0 : 1);
          }}
        />
      </DIProvider>,
    );

    await waitUntilExit();
  } catch (error) {
    console.error(
      chalk.red("❌ Erreur lors de l'installation du hook:"),
      error,
    );
    process.exit(1);
  } finally {
    // Cleanup DI container
    root.dispose();
  }
}

export async function uninstallHooks(): Promise<void> {
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

    const { waitUntilExit } = render(
      <DIProvider root={root}>
        <HooksUninstaller
          onComplete={(success) => {
            if (success) {
              console.log(
                chalk.green("\n✅ Hook Git désinstallé avec succès !"),
              );
            } else {
              console.log(chalk.yellow("\n❌ Désinstallation annulée"));
            }
            process.exit(success ? 0 : 1);
          }}
        />
      </DIProvider>,
    );

    await waitUntilExit();
  } catch (error) {
    console.error(
      chalk.red("❌ Erreur lors de la désinstallation du hook:"),
      error,
    );
    process.exit(1);
  } finally {
    // Cleanup DI container
    root.dispose();
  }
}
