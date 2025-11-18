import { Command } from 'commander';
import chalk from 'chalk';
import { commitCommand } from './commands/commit.js';
import { installHooks, uninstallHooks } from './commands/hooks.js';
import { statsCommand } from './commands/stats.js';
import { aiSuggestCommand } from './commands/ai-suggest.js';

const program = new Command();

program
  .name('gortex')
  .description('CLI interactif pour créer des commits conventionnels')
  .version('1.1.0');

// Commande par défaut (commit interactif)
program
  .action(async () => {
    await commitCommand();
  });

// Commande explicite pour commit
program
  .command('commit')
  .alias('c')
  .description('Créer un commit interactif au format conventionnel')
  .action(async () => {
    await commitCommand();
  });

// Gestion des hooks
const hooksCommand = program
  .command('hooks')
  .description('Gérer les hooks Git pour valider le format des commits');

hooksCommand
  .command('install')
  .alias('i')
  .description('Installer le hook commit-msg pour valider le format')
  .action(async () => {
    await installHooks();
  });

hooksCommand
  .command('uninstall')
  .alias('u')
  .description('Désinstaller le hook commit-msg')
  .action(async () => {
    await uninstallHooks();
  });

// Statistiques
program
  .command('stats')
  .alias('s')
  .description('Afficher les statistiques des commits du repository')
  .option('-n, --number <count>', 'Nombre de commits à analyser', '100')
  .action(async (options) => {
    const count = parseInt(options.number, 10);
    if (isNaN(count) || count <= 0) {
      console.error(chalk.red('❌ Le nombre de commits doit être un nombre positif'));
      process.exit(1);
    }
    await statsCommand(count);
  });

// AI Suggestion
program
  .command('ai-suggest')
  .alias('ai')
  .description('Générer un message de commit avec l\'IA basé sur les changements stagés')
  .action(async () => {
    await aiSuggestCommand();
  });

// Aide personnalisée
program
  .command('help-format')
  .description('Afficher l\'aide sur le format des commits conventionnels')
  .action(() => {
    console.log(chalk.blue.bold('\n📚 Guide du format de commit conventionnel\n'));

    console.log(chalk.bold('Structure:'));
    console.log(chalk.gray('  <type>(<scope>): <description>\n'));
    console.log(chalk.gray('  [corps optionnel]\n'));
    console.log(chalk.gray('  [footer optionnel]\n'));

    console.log(chalk.bold('Types courants:'));
    console.log('  ✨ feat:     Nouvelle fonctionnalité');
    console.log('  🐛 fix:      Correction de bug');
    console.log('  📝 docs:     Documentation');
    console.log('  💄 style:    Formatage, points-virgules manquants, etc.');
    console.log('  ♻️  refactor: Refactorisation du code');
    console.log('  ⚡️ perf:     Amélioration des performances');
    console.log('  ✅ test:     Ajout ou modification de tests');
    console.log('  📦 build:    Changements du système de build');
    console.log('  👷 ci:       Changements de configuration CI');
    console.log('  🔧 chore:    Autres changements (mise à jour dépendances, etc.)\n');

    console.log(chalk.bold('Exemples:'));
    console.log(chalk.green('  feat(auth): add password reset functionality'));
    console.log(chalk.green('  fix(api): resolve timeout on large requests'));
    console.log(chalk.green('  docs(readme): update installation instructions'));
    console.log(chalk.green('  refactor(core): simplify error handling\n'));

    console.log(chalk.bold('Breaking Changes:'));
    console.log(chalk.gray('  Ajoutez ! après le type/scope:'));
    console.log(chalk.yellow('  feat(api)!: change authentication method\n'));

    console.log(chalk.blue('💡 Utilisez "npx gortex" pour un assistant interactif\n'));
  });

export function runCLI(): void {
  program.parse();
}
