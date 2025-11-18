import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { isGitRepository, hasChanges } from '../utils/git.js';
import { InteractiveWorkflow } from '../components/InteractiveWorkflow.js';
import { Brand } from '../components/Brand.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { loadConfig } from '../utils/config.js';

export async function commitCommand(): Promise<void> {
  try {
    // Vérifier qu'on est dans un repo Git
    const isRepo = await isGitRepository();
    if (!isRepo) {
      const { waitUntilExit } = render(
        <ErrorMessage
          title="Not a Git Repository"
          message="This directory is not a Git repository"
          suggestions={[
            'Initialize a Git repository with: git init',
            'Navigate to a directory with a Git repository',
          ]}
        />
      );
      await waitUntilExit();
      process.exit(1);
    }

    // Vérifier qu'il y a des changements
    const changes = await hasChanges();
    if (!changes) {
      const { waitUntilExit } = render(
        <ErrorMessage
          title="No Changes to Commit"
          message="There are no staged or unstaged changes"
          suggestions={[
            'Make some changes to your files',
            'Use git status to check repository status',
          ]}
        />
      );
      await waitUntilExit();
      process.exit(0);
    }

    // Load configuration
    const config = await loadConfig();

    // Show intro brand
    console.clear();
    const intro = render(<Brand variant="large" tagline={true} />);
    await new Promise(resolve => setTimeout(resolve, 1500));
    intro.unmount();

    // Lancer le workflow interactif avec onglets
    const { waitUntilExit } = render(<InteractiveWorkflow config={config} />);
    await waitUntilExit();

  } catch (error) {
    console.error(chalk.red('❌ Erreur:'), error);
    process.exit(1);
  }
}
