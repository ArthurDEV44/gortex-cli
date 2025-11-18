import React from 'react';
import { render, Text } from 'ink';
import chalk from 'chalk';
import { isGitRepository } from '../utils/git.js';
import { HooksInstaller } from '../components/HooksInstaller.js';
import { HooksUninstaller } from '../components/HooksUninstaller.js';

export async function installHooks(): Promise<void> {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      console.error(chalk.red('❌ Erreur: Vous n\'êtes pas dans un dépôt Git'));
      process.exit(1);
    }

    const { waitUntilExit } = render(
      <HooksInstaller
        onComplete={(success) => {
          if (success) {
            console.log(chalk.green('\n✅ Hook Git installé avec succès !'));
            console.log(chalk.gray('Tous les commits seront validés pour suivre le format conventionnel'));
          } else {
            console.log(chalk.yellow('\n❌ Installation annulée'));
          }
          process.exit(success ? 0 : 1);
        }}
      />
    );

    await waitUntilExit();
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de l\'installation du hook:'), error);
    process.exit(1);
  }
}

export async function uninstallHooks(): Promise<void> {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      console.error(chalk.red('❌ Erreur: Vous n\'êtes pas dans un dépôt Git'));
      process.exit(1);
    }

    const { waitUntilExit } = render(
      <HooksUninstaller
        onComplete={(success) => {
          if (success) {
            console.log(chalk.green('\n✅ Hook Git désinstallé avec succès !'));
          } else {
            console.log(chalk.yellow('\n❌ Désinstallation annulée'));
          }
          process.exit(success ? 0 : 1);
        }}
      />
    );

    await waitUntilExit();
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la désinstallation du hook:'), error);
    process.exit(1);
  }
}
