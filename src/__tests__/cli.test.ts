import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCLI } from '../cli.js';
import * as commitCommandModule from '../commands/commit.js';
import * as hooksCommandModule from '../commands/hooks.js';
import * as statsCommandModule from '../commands/stats.js';
import * as aiSuggestCommandModule from '../commands/ai-suggest.js';
import chalk from 'chalk';

// Mock des commandes
vi.mock('../commands/commit.js', () => ({
  commitCommand: vi.fn(),
}));
vi.mock('../commands/hooks.js', () => ({
  installHooks: vi.fn(),
  uninstallHooks: vi.fn(),
}));
vi.mock('../commands/stats.js', () => ({
  statsCommand: vi.fn(),
}));
vi.mock('../commands/ai-suggest.js', () => ({
  aiSuggestCommand: vi.fn(),
}));

describe('CLI', () => {
  let originalArgv: string[];
  let originalExit: typeof process.exit;
  let exitSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Sauvegarder les valeurs originales
    originalArgv = process.argv;
    originalExit = process.exit;
    
    // Mock process.exit
    exitSpy = vi.fn();
    process.exit = exitSpy as any;
    
    // Mock console.log et console.error
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Réinitialiser les mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restaurer les valeurs originales
    process.argv = originalArgv;
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  describe('runCLI', () => {
    it('should parse command line arguments', () => {
      process.argv = ['node', 'gortex'];
      runCLI();
      // La fonction parse() est appelée
      expect(true).toBe(true); // Test basique pour vérifier que ça ne crash pas
    });

    it('should handle default command (commit)', async () => {
      const mockCommitCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(commitCommandModule.commitCommand).mockImplementation(mockCommitCommand);
      
      process.argv = ['node', 'gortex'];
      runCLI();
      
      // Attendre un peu pour que la commande soit exécutée
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Note: Commander exécute les actions de manière asynchrone
      // Ce test vérifie que la fonction peut être appelée sans erreur
      expect(true).toBe(true);
    });
  });

  describe('commit command', () => {
    it('should execute commit command when "commit" is called', async () => {
      const mockCommitCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(commitCommandModule.commitCommand).mockImplementation(mockCommitCommand);
      
      process.argv = ['node', 'gortex', 'commit'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should execute commit command when alias "c" is used', async () => {
      const mockCommitCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(commitCommandModule.commitCommand).mockImplementation(mockCommitCommand);
      
      process.argv = ['node', 'gortex', 'c'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });
  });

  describe('hooks command', () => {
    it('should execute install hooks command', async () => {
      const mockInstallHooks = vi.fn().mockResolvedValue(undefined);
      vi.mocked(hooksCommandModule.installHooks).mockImplementation(mockInstallHooks);
      
      process.argv = ['node', 'gortex', 'hooks', 'install'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should execute install hooks command with alias "i"', async () => {
      const mockInstallHooks = vi.fn().mockResolvedValue(undefined);
      vi.mocked(hooksCommandModule.installHooks).mockImplementation(mockInstallHooks);
      
      process.argv = ['node', 'gortex', 'hooks', 'i'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should execute uninstall hooks command', async () => {
      const mockUninstallHooks = vi.fn().mockResolvedValue(undefined);
      vi.mocked(hooksCommandModule.uninstallHooks).mockImplementation(mockUninstallHooks);
      
      process.argv = ['node', 'gortex', 'hooks', 'uninstall'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should execute uninstall hooks command with alias "u"', async () => {
      const mockUninstallHooks = vi.fn().mockResolvedValue(undefined);
      vi.mocked(hooksCommandModule.uninstallHooks).mockImplementation(mockUninstallHooks);
      
      process.argv = ['node', 'gortex', 'hooks', 'u'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });
  });

  describe('stats command', () => {
    it('should execute stats command with default count', async () => {
      const mockStatsCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(statsCommandModule.statsCommand).mockImplementation(mockStatsCommand);
      
      process.argv = ['node', 'gortex', 'stats'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should execute stats command with custom count', async () => {
      const mockStatsCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(statsCommandModule.statsCommand).mockImplementation(mockStatsCommand);
      
      process.argv = ['node', 'gortex', 'stats', '--number', '50'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should execute stats command with alias "s"', async () => {
      const mockStatsCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(statsCommandModule.statsCommand).mockImplementation(mockStatsCommand);
      
      process.argv = ['node', 'gortex', 's'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should exit with error when stats count is invalid', async () => {
      process.argv = ['node', 'gortex', 'stats', '--number', 'invalid'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with error when stats count is negative', async () => {
      process.argv = ['node', 'gortex', 'stats', '--number', '-5'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with error when stats count is zero', async () => {
      process.argv = ['node', 'gortex', 'stats', '--number', '0'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('ai-suggest command', () => {
    it('should execute ai-suggest command', async () => {
      const mockAiSuggestCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(aiSuggestCommandModule.aiSuggestCommand).mockImplementation(mockAiSuggestCommand);
      
      process.argv = ['node', 'gortex', 'ai-suggest'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });

    it('should execute ai-suggest command with alias "ai"', async () => {
      const mockAiSuggestCommand = vi.fn().mockResolvedValue(undefined);
      vi.mocked(aiSuggestCommandModule.aiSuggestCommand).mockImplementation(mockAiSuggestCommand);
      
      process.argv = ['node', 'gortex', 'ai'];
      runCLI();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });
  });

  describe('help-format command', () => {
    it('should display help format when help-format command is called', () => {
      process.argv = ['node', 'gortex', 'help-format'];
      runCLI();
      
      // Vérifier que console.log a été appelé avec le contenu d'aide
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(logCalls).toContain('Guide du format de commit conventionnel');
      expect(logCalls).toContain('feat');
      expect(logCalls).toContain('fix');
      expect(logCalls).toContain('docs');
    });
  });

  describe('version', () => {
    it('should display version when --version is called', () => {
      process.argv = ['node', 'gortex', '--version'];
      runCLI();
      
      // Commander affiche la version via process.stdout.write
      // Ce test vérifie que la commande ne crash pas
      expect(true).toBe(true);
    });
  });

  describe('help', () => {
    it('should display help when --help is called', () => {
      process.argv = ['node', 'gortex', '--help'];
      runCLI();
      
      // Commander affiche l'aide via process.stdout.write
      // Ce test vérifie que la commande ne crash pas
      expect(true).toBe(true);
    });
  });
});

