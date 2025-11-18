import inquirer from 'inquirer';
import chalk from 'chalk';
import type { CommitConfig, CommitAnswers } from '../types.js';
import { loadConfig } from '../utils/config.js';
import { formatCommitMessage } from '../utils/validate.js';
import {
  isGitRepository,
  hasChanges,
  getModifiedFilesWithStatus,
  getCurrentBranch,
  getAllBranches,
  checkoutBranch,
  createAndCheckoutBranch,
  branchExists,
  stageFiles,
  createCommit,
  hasRemote,
  getDefaultRemote,
  pushToRemote,
  hasUpstream,
} from '../utils/git.js';

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

    console.log(chalk.blue.bold('\n🚀 Gortex CLI - Workflow Git complet\n'));

    // ÉTAPE 1: Sélection de la branche
    const selectedBranch = await selectBranch();

    // ÉTAPE 2: Sélection des fichiers à stage
    const stagedFiles = await selectFilesToStage();

    // ÉTAPE 3: Création du message de commit
    const message = await createCommitMessage();

    // ÉTAPE 4: Confirmer et créer le commit
    const commitCreated = await confirmAndCommit(message, stagedFiles);

    if (!commitCreated) {
      console.log(chalk.yellow('❌ Commit annulé'));
      process.exit(0);
    }

    // ÉTAPE 5: Demander si on veut push
    await askToPush(selectedBranch);

  } catch (error) {
    console.error(chalk.red('❌ Erreur:'), error);
    process.exit(1);
  }
}

/**
 * ÉTAPE 1: Sélection de la branche
 */
async function selectBranch(): Promise<string> {
  let currentBranch = await getCurrentBranch();
  let satisfied = false;
  let selectedBranch = currentBranch;

  console.log(chalk.blue('📍 Étape 1/5: Sélection de la branche'));

  while (!satisfied) {
    // Rafraîchir la liste des branches
    const allBranches = await getAllBranches();
    currentBranch = await getCurrentBranch();

    console.log(chalk.gray(`   Branche actuelle: ${chalk.cyan(currentBranch)}\n`));

    // Créer les choix avec option de créer une nouvelle branche
    const choices = [
      ...allBranches.map(branch => ({
        name: branch === currentBranch ? `${branch} ${chalk.green('(actuelle)')}` : branch,
        value: branch,
      })),
      { name: chalk.green('➕ Créer une nouvelle branche'), value: '__CREATE_NEW__' },
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Que voulez-vous faire ?',
        choices: choices,
        default: currentBranch,
      },
    ]);

    // Si l'utilisateur veut créer une nouvelle branche
    if (action === '__CREATE_NEW__') {
      const { newBranchName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newBranchName',
          message: 'Nom de la nouvelle branche:',
          validate: async (input: string) => {
            const trimmed = input.trim();
            if (trimmed.length === 0) {
              return 'Le nom de la branche ne peut pas être vide';
            }
            if (trimmed.includes(' ')) {
              return 'Le nom de la branche ne peut pas contenir d\'espaces';
            }
            if (await branchExists(trimmed)) {
              return `La branche "${trimmed}" existe déjà`;
            }
            return true;
          },
        },
      ]);

      const branchName = newBranchName.trim();
      await createAndCheckoutBranch(branchName);
      console.log(chalk.green(`   ✓ Branche "${branchName}" créée et active\n`));
      selectedBranch = branchName;

      // Demander si l'utilisateur est satisfait
      const { confirmBranch } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmBranch',
          message: 'Continuer avec cette branche ?',
          default: true,
        },
      ]);

      if (confirmBranch) {
        satisfied = true;
      } else {
        console.log(chalk.yellow('\n   ↻ Retour à la sélection de branche...\n'));
      }
    } else {
      // L'utilisateur a choisi une branche existante
      selectedBranch = action;

      // Changer de branche si nécessaire
      if (selectedBranch !== currentBranch) {
        await checkoutBranch(selectedBranch);
        console.log(chalk.green(`   ✓ Basculé sur la branche: ${selectedBranch}\n`));
      } else {
        console.log(chalk.gray(`   → Branche: ${selectedBranch}\n`));
      }

      // Demander si l'utilisateur est satisfait
      const { confirmBranch } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmBranch',
          message: 'Continuer avec cette branche ?',
          default: true,
        },
      ]);

      if (confirmBranch) {
        satisfied = true;
      } else {
        console.log(chalk.yellow('\n   ↻ Retour à la sélection de branche...\n'));
      }
    }
  }

  console.log(chalk.green(`   ✅ Branche finale: ${chalk.cyan(selectedBranch)}\n`));
  return selectedBranch;
}

/**
 * ÉTAPE 2: Sélection des fichiers à stage
 */
async function selectFilesToStage(): Promise<string[]> {
  const files = await getModifiedFilesWithStatus();

  console.log(chalk.blue('📝 Étape 2/5: Sélection des fichiers'));
  console.log(chalk.gray(`   ${files.length} fichier(s) modifié(s)\n`));

  // Afficher les fichiers
  files.forEach(file => {
    const statusColor = file.status === 'nouveau' ? chalk.green :
                       file.status === 'supprimé' ? chalk.red : chalk.yellow;
    console.log(chalk.gray(`   ${statusColor(`[${file.status}]`)} ${file.path}`));
  });
  console.log();

  const { stageChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stageChoice',
      message: 'Quels fichiers voulez-vous inclure dans le commit ?',
      choices: [
        { name: '📦 Tous les fichiers', value: 'all' },
        { name: '🎯 Sélectionner les fichiers', value: 'select' },
      ],
    },
  ]);

  let selectedFiles: string[];

  if (stageChoice === 'all') {
    selectedFiles = files.map(f => f.path);
    console.log(chalk.green(`   ✓ Tous les fichiers sélectionnés (${selectedFiles.length})\n`));
  } else {
    const { filesToStage } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'filesToStage',
        message: 'Sélectionnez les fichiers à inclure:',
        choices: files.map(file => {
          const statusColor = file.status === 'nouveau' ? chalk.green :
                             file.status === 'supprimé' ? chalk.red : chalk.yellow;
          return {
            name: `${statusColor(`[${file.status}]`)} ${file.path}`,
            value: file.path,
            checked: false,
          };
        }),
        validate: (answer: string[]) => {
          if (answer.length === 0) {
            return 'Vous devez sélectionner au moins un fichier';
          }
          return true;
        },
      },
    ]);

    selectedFiles = filesToStage;
    console.log(chalk.green(`   ✓ ${selectedFiles.length} fichier(s) sélectionné(s)\n`));
  }

  return selectedFiles;
}

/**
 * ÉTAPE 3: Création du message de commit
 */
async function createCommitMessage(): Promise<string> {
  console.log(chalk.blue('💬 Étape 3/5: Message de commit\n'));

  const config: CommitConfig = await loadConfig();
  const answers = await askCommitQuestions(config);

  // Générer le message de commit (sans breaking change)
  const message = formatCommitMessage(
    answers.type,
    answers.scope || undefined,
    answers.subject,
    answers.body
  );

  return message;
}

/**
 * Questions pour le commit (simplifiées, sans breaking change)
 */
async function askCommitQuestions(config: CommitConfig): Promise<CommitAnswers> {
  const questions: any[] = [
    {
      type: 'list',
      name: 'type',
      message: 'Type de commit:',
      choices: config.types?.map(t => ({
        name: t.name,
        value: t.value,
      })),
    },
  ];

  // Question pour le scope
  if (config.scopes && config.scopes.length > 0) {
    const scopeChoices = [...config.scopes];
    if (config.allowCustomScopes) {
      scopeChoices.push('(aucun / personnalisé)');
    }

    questions.push({
      type: 'list',
      name: 'scope',
      message: 'Scope (optionnel):',
      choices: scopeChoices,
      default: '(aucun / personnalisé)',
    });

    questions.push({
      type: 'input',
      name: 'customScope',
      message: 'Scope personnalisé:',
      when: (answers: any) => answers.scope === '(aucun / personnalisé)',
    });
  } else if (config.allowCustomScopes) {
    questions.push({
      type: 'input',
      name: 'customScope',
      message: 'Scope (optionnel):',
    });
  }

  // Question pour le sujet
  questions.push({
    type: 'input',
    name: 'subject',
    message: `Description courte (${config.minSubjectLength}-${config.maxSubjectLength} caractères):`,
    validate: (input: string) => {
      const length = input.trim().length;
      if (length < (config.minSubjectLength || 3)) {
        return `La description doit contenir au moins ${config.minSubjectLength} caractères`;
      }
      if (length > (config.maxSubjectLength || 100)) {
        return `La description ne doit pas dépasser ${config.maxSubjectLength} caractères`;
      }
      return true;
    },
  });

  // Question pour le body (optionnel)
  questions.push({
    type: 'input',
    name: 'body',
    message: 'Description longue (optionnel, Entrée pour passer):',
  });

  const answers = await inquirer.prompt(questions);

  // Déterminer le scope final
  let finalScope = '';
  if (answers.customScope) {
    finalScope = answers.customScope.trim();
  } else if (answers.scope && answers.scope !== '(aucun / personnalisé)') {
    finalScope = answers.scope;
  }

  return {
    type: answers.type,
    scope: finalScope,
    subject: answers.subject.trim(),
    body: answers.body?.trim(),
  };
}

/**
 * ÉTAPE 4: Confirmer et créer le commit
 */
async function confirmAndCommit(message: string, files: string[]): Promise<boolean> {
  console.log(chalk.blue('\n📋 Étape 4/5: Confirmation\n'));

  // Afficher le résumé
  console.log(chalk.gray('   Fichiers à commiter:'));
  files.forEach(file => console.log(chalk.gray(`     - ${file}`)));
  console.log();
  console.log(chalk.gray('   Message de commit:'));
  console.log(chalk.cyan(`     ${message.split('\n')[0]}`));
  console.log();

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Créer ce commit ?',
      default: true,
    },
  ]);

  if (!confirm) {
    return false;
  }

  // Stage les fichiers sélectionnés et créer le commit
  await stageFiles(files);
  await createCommit(message);

  console.log(chalk.green('\n   ✅ Commit créé avec succès !\n'));
  return true;
}

/**
 * ÉTAPE 5: Demander si on veut push
 */
async function askToPush(branch: string): Promise<void> {
  console.log(chalk.blue('🚀 Étape 5/5: Push vers le remote\n'));

  // Vérifier si un remote existe
  const remoteExists = await hasRemote();

  if (!remoteExists) {
    console.log(chalk.yellow('   ⚠️  Aucun remote configuré, impossible de push'));
    return;
  }

  const { shouldPush } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldPush',
      message: 'Voulez-vous push vers le remote ?',
      default: true,
    },
  ]);

  if (!shouldPush) {
    console.log(chalk.gray('\n   → Commit local uniquement\n'));
    return;
  }

  try {
    const remote = await getDefaultRemote();
    const upstream = await hasUpstream();

    console.log(chalk.gray(`   → Push vers ${remote}/${branch}...`));

    if (upstream) {
      // La branche track déjà un remote
      await pushToRemote(remote, branch, false);
    } else {
      // Première fois qu'on push cette branche
      await pushToRemote(remote, branch, true);
      console.log(chalk.gray(`   → Upstream configuré: ${remote}/${branch}`));
    }

    console.log(chalk.green('\n   ✅ Push réussi !\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n   ❌ Erreur lors du push: ${error.message}\n`));
    console.log(chalk.yellow('   💡 Vous pouvez push manuellement avec: git push\n'));
  }
}
