import React from 'react';
import { render } from 'ink';
import { Text } from 'ink';
import chalk from 'chalk';
import { isGitRepository, hasChanges } from '../utils/git.js';
import { CommitWorkflow } from '../components/CommitWorkflow.js';

export async function commitCommand(): Promise<void> {
  try {
    // Vérifier qu'on est dans un repo Git
    const isRepo = await isGitRepository();
    if (!isRepo) {
      console.error(chalk.red('❌ Erreur: Vous n\'êtes pas dans un dépôt Git'));
      process.exit(1);
    }

    // Vérifier qu'il y a des changements
    const changes = await hasChanges();
    if (!changes) {
      console.log(chalk.yellow('⚠️  Aucun changement à commiter'));
      process.exit(0);
    }

    // Lancer le workflow Ink
    const { waitUntilExit } = render(<CommitWorkflow />);
    await waitUntilExit();

  } catch (error) {
    console.error(chalk.red('❌ Erreur:'), error);
    process.exit(1);
  }
}
