import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { getGitDir, isGitRepository } from '../utils/git.js';

const COMMIT_MSG_HOOK = `#!/bin/sh
# gortex hook - valide le format des commits

# Lire le message de commit
commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Pattern pour commits conventionnels
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?!?: .{3,}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
    echo ""
    echo "❌ Erreur: Le message de commit ne suit pas le format conventionnel"
    echo ""
    echo "Format attendu: <type>(<scope>): <description>"
    echo ""
    echo "Types valides: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
    echo ""
    echo "Exemples:"
    echo "  feat(auth): add login functionality"
    echo "  fix: resolve crash on startup"
    echo "  docs(readme): update installation steps"
    echo ""
    echo "💡 Utilisez 'npx gortex' pour créer un commit guidé"
    echo ""
    exit 1
fi
`;

export async function installHooks(): Promise<void> {
  try {
    // Vérifier qu'on est dans un repo Git
    const isRepo = await isGitRepository();
    if (!isRepo) {
      console.error(chalk.red('❌ Erreur: Vous n\'êtes pas dans un dépôt Git'));
      process.exit(1);
    }

    // Récupérer le dossier .git
    const gitDir = await getGitDir();
    const hooksDir = path.join(gitDir, 'hooks');

    // Créer le dossier hooks s'il n'existe pas
    await fs.mkdir(hooksDir, { recursive: true });

    // Chemin du hook commit-msg
    const hookPath = path.join(hooksDir, 'commit-msg');

    // Vérifier si le hook existe déjà
    try {
      await fs.access(hookPath);
      const { default: inquirer } = await import('inquirer');
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Un hook commit-msg existe déjà. Voulez-vous le remplacer ?',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('❌ Installation annulée'));
        process.exit(0);
      }
    } catch {
      // Le hook n'existe pas, on peut continuer
    }

    // Écrire le hook
    await fs.writeFile(hookPath, COMMIT_MSG_HOOK, { mode: 0o755 });

    console.log(chalk.green('✅ Hook Git installé avec succès !'));
    console.log(chalk.gray(`\nLe hook a été installé dans: ${hookPath}`));
    console.log(
      chalk.gray('Tous les commits seront maintenant validés pour suivre le format conventionnel')
    );
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de l\'installation du hook:'), error);
    process.exit(1);
  }
}

export async function uninstallHooks(): Promise<void> {
  try {
    // Vérifier qu'on est dans un repo Git
    const isRepo = await isGitRepository();
    if (!isRepo) {
      console.error(chalk.red('❌ Erreur: Vous n\'êtes pas dans un dépôt Git'));
      process.exit(1);
    }

    // Récupérer le dossier .git
    const gitDir = await getGitDir();
    const hookPath = path.join(gitDir, 'hooks', 'commit-msg');

    // Vérifier si le hook existe
    try {
      const content = await fs.readFile(hookPath, 'utf-8');

      // Vérifier que c'est bien notre hook
      if (!content.includes('gortex hook')) {
        console.log(
          chalk.yellow('⚠️  Le hook commit-msg n\'a pas été créé par gortex')
        );
        const { default: inquirer } = await import('inquirer');
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Voulez-vous quand même le supprimer ?',
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('❌ Désinstallation annulée'));
          process.exit(0);
        }
      }

      // Supprimer le hook
      await fs.unlink(hookPath);
      console.log(chalk.green('✅ Hook Git désinstallé avec succès !'));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow('⚠️  Aucun hook commit-msg trouvé'));
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la désinstallation du hook:'), error);
    process.exit(1);
  }
}
