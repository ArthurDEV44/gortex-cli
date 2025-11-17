import chalk from 'chalk';
import { isGitRepository, analyzeCommitStats } from '../utils/git.js';

export async function statsCommand(maxCount: number = 100): Promise<void> {
  try {
    // Vérifier qu'on est dans un repo Git
    const isRepo = await isGitRepository();
    if (!isRepo) {
      console.error(chalk.red('❌ Erreur: Vous n\'êtes pas dans un dépôt Git'));
      process.exit(1);
    }

    console.log(chalk.blue(`\n📊 Analyse des ${maxCount} derniers commits...\n`));

    // Analyser les stats
    const stats = await analyzeCommitStats(maxCount);

    // Afficher les résultats
    console.log(chalk.bold('Résumé:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Total de commits analysés:      ${chalk.cyan(stats.total)}`);
    console.log(`Commits conventionnels:          ${chalk.green(stats.conventional)}`);
    console.log(`Commits non-conventionnels:      ${chalk.red(stats.nonConventional)}`);
    console.log();

    // Afficher le pourcentage avec une barre de progression
    const percentage = stats.percentage.toFixed(1);
    const color = stats.percentage >= 80 ? chalk.green : stats.percentage >= 50 ? chalk.yellow : chalk.red;

    console.log(chalk.bold('Taux de conformité:'));
    console.log(color(`${percentage}% ${getProgressBar(stats.percentage)}`));
    console.log();

    // Afficher la répartition par type
    if (Object.keys(stats.typeBreakdown).length > 0) {
      console.log(chalk.bold('Répartition par type:'));
      console.log(chalk.gray('─'.repeat(50)));

      const sortedTypes = Object.entries(stats.typeBreakdown)
        .sort((a, b) => b[1] - a[1]);

      for (const [type, count] of sortedTypes) {
        const percentage = ((count / stats.conventional) * 100).toFixed(1);
        const bar = getProgressBar((count / stats.conventional) * 100, 20);
        console.log(`  ${getTypeEmoji(type)} ${type.padEnd(10)} ${count.toString().padStart(3)} (${percentage}%) ${chalk.gray(bar)}`);
      }
      console.log();
    }

    // Recommandations
    if (stats.percentage < 80) {
      console.log(chalk.yellow('💡 Recommandations:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log('  • Utilisez "npx gortex" pour créer des commits guidés');
      console.log('  • Installez le hook Git: "npx gortex hooks install"');
      console.log('  • Partagez les bonnes pratiques avec votre équipe\n');
    } else {
      console.log(chalk.green('🎉 Excellent travail ! Votre repo suit bien les conventions de commits.\n'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Erreur:'), error);
    process.exit(1);
  }
}

function getProgressBar(percentage: number, length: number = 30): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    feat: '✨',
    fix: '🐛',
    docs: '📝',
    style: '💄',
    refactor: '♻️',
    perf: '⚡️',
    test: '✅',
    build: '📦',
    ci: '👷',
    chore: '🔧',
    revert: '⏪',
  };
  return emojis[type] || '📌';
}
