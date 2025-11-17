import { cosmiconfig } from 'cosmiconfig';
import type { CommitConfig } from '../types.js';
import { DEFAULT_CONFIG } from '../types.js';

const explorer = cosmiconfig('gortex');

/**
 * Charge la configuration depuis les fichiers de config
 * Cherche dans l'ordre:
 * - .gortexrc
 * - .gortexrc.json
 * - .gortexrc.js
 * - gortex.config.js
 * - package.json (clé "gortex")
 */
export async function loadConfig(): Promise<CommitConfig> {
  try {
    const result = await explorer.search();

    if (result && result.config) {
      // Merge avec la config par défaut
      return {
        ...DEFAULT_CONFIG,
        ...result.config,
        types: result.config.types || DEFAULT_CONFIG.types,
      };
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn('Erreur lors du chargement de la configuration, utilisation de la config par défaut');
    return DEFAULT_CONFIG;
  }
}
