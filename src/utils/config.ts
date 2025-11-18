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
        ai: result.config.ai ? {
          ...DEFAULT_CONFIG.ai,
          ...result.config.ai,
          ollama: result.config.ai.ollama ? {
            ...DEFAULT_CONFIG.ai?.ollama,
            ...result.config.ai.ollama,
          } : DEFAULT_CONFIG.ai?.ollama,
          mistral: result.config.ai.mistral ? {
            ...DEFAULT_CONFIG.ai?.mistral,
            ...result.config.ai.mistral,
          } : DEFAULT_CONFIG.ai?.mistral,
          openai: result.config.ai.openai ? {
            ...DEFAULT_CONFIG.ai?.openai,
            ...result.config.ai.openai,
          } : DEFAULT_CONFIG.ai?.openai,
        } : DEFAULT_CONFIG.ai,
      };
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn('Erreur lors du chargement de la configuration, utilisation de la config par défaut');
    return DEFAULT_CONFIG;
  }
}
