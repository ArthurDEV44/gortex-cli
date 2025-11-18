import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { loadConfig } from '../utils/config.js';
import { AISuggestWorkflow } from '../components/AISuggestWorkflow.js';

/**
 * Commande pour suggérer un message de commit avec AI
 * @deprecated Utilisez plutôt `gortex commit` qui intègre maintenant l'AI dans son workflow
 */
export async function aiSuggestCommand(): Promise<void> {
  // Show deprecation warning
  console.log(chalk.yellow('⚠️  DÉPRÉCIATION: Cette commande est maintenant obsolète.'));
  console.log(chalk.dim('La génération AI est maintenant intégrée dans le workflow principal.'));
  console.log(chalk.cyan('\n💡 Utilisez plutôt: ') + chalk.bold('gortex commit'));
  console.log(chalk.dim('   Vous pourrez choisir entre AI et manuel lors du workflow.\n'));

  const config = await loadConfig();

  // Vérifie si l'AI est activée
  if (!config.ai?.enabled) {
    console.error('❌ AI non activée dans la configuration.');
    console.log('\nPour activer l\'AI, ajoutez dans votre .gortexrc :');
    console.log(JSON.stringify({
      ai: {
        enabled: true,
        provider: 'ollama', // ou 'mistral' ou 'openai'
      },
    }, null, 2));
    process.exit(1);
  }

  render(<AISuggestWorkflow config={config} />);
}
