/**
 * Refactored Commit Command with DI
 * Uses clean architecture with dependency injection
 */

import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { InteractiveWorkflow } from '../components/InteractiveWorkflow.js';
import { Brand } from '../components/Brand.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { loadConfig } from '../utils/config.js';
import { UI_DELAYS } from '../shared/constants/index.js';
import { DIProvider } from '../infrastructure/di/DIContext.js';
import { CompositionRoot } from '../infrastructure/di/CompositionRoot.js';
import { ServiceIdentifiers } from '../infrastructure/di/ServiceRegistry.js';
import type { IGitRepository } from '../domain/repositories/IGitRepository.js';

export async function commitCommandRefactored(): Promise<void> {
  // Create composition root
  const root = new CompositionRoot();

  try {
    // Get repository from DI
    const gitRepo = root.getContainer().resolve<IGitRepository>(ServiceIdentifiers.GitRepository);

    // Vérifier qu'on est dans un repo Git
    const isRepo = await gitRepo.isRepository();
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
    const hasChanges = await gitRepo.hasChanges();
    if (!hasChanges) {
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
    await new Promise(resolve => setTimeout(resolve, UI_DELAYS.INTRO));
    intro.unmount();

    // Lancer le workflow interactif avec DI
    const { waitUntilExit } = render(
      <DIProvider root={root}>
        <InteractiveWorkflow config={config} />
      </DIProvider>
    );
    await waitUntilExit();

  } catch (error) {
    console.error(chalk.red('❌ Erreur:'), error);
    process.exit(1);
  } finally {
    // Cleanup
    root.dispose();
  }
}
