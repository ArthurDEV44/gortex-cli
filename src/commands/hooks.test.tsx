import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Créer une instance mockée pour CompositionRoot AVANT les mocks
const createMockCompositionRoot = () => {
  const mockResolve = vi.fn();
  return {
    getContainer: vi.fn(() => ({
      resolve: mockResolve,
    })),
    dispose: vi.fn(),
    _getResolve: () => mockResolve, // Helper pour accéder au resolve depuis les tests
  };
};

const mockCompositionRootRef: { current: ReturnType<typeof createMockCompositionRoot> } = {
  current: createMockCompositionRoot(),
};

// Mock des dépendances - doivent être définis AVANT les imports
vi.mock('../infrastructure/di/CompositionRoot.js', () => {
  class MockCompositionRoot {
    constructor() {
      return mockCompositionRootRef.current;
    }
  }
  return {
    CompositionRoot: MockCompositionRoot,
  };
});
vi.mock('ink', () => ({
  render: vi.fn(() => ({
    waitUntilExit: vi.fn().mockResolvedValue(undefined),
  })),
  default: {},
  Text: () => null,
}));
vi.mock('../components/HooksInstaller.js', () => ({
  HooksInstaller: ({ onComplete }: { onComplete: (success: boolean) => void }) => {
    // Simuler l'appel à onComplete pour les tests
    return null;
  },
}));
vi.mock('../components/HooksUninstaller.js', () => ({
  HooksUninstaller: ({ onComplete }: { onComplete: (success: boolean) => void }) => {
    return null;
  },
}));
vi.mock('../components/ErrorMessage.js', () => ({
  ErrorMessage: () => null,
}));
vi.mock('../infrastructure/di/DIContext.js', () => ({
  DIProvider: ({ children }: { children: any }) => children,
}));

// Imports après les mocks
import { installHooks, uninstallHooks } from './hooks.js';

describe('hooks commands', () => {
  let mockGitRepo: any;
  let originalExit: typeof process.exit;
  let exitSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Réinitialiser l'instance mockée
    mockCompositionRootRef.current = createMockCompositionRoot();
    const container = mockCompositionRootRef.current.getContainer();

    // Mock process.exit
    originalExit = process.exit;
    exitSpy = vi.fn();
    process.exit = exitSpy as any;

    // Mock console
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Git Repository
    mockGitRepo = {
      isRepository: vi.fn(),
    };

    // Configurer le container pour retourner le mockGitRepo
    // Le resolve doit retourner mockGitRepo pour n'importe quel argument
    const resolveFn = (mockCompositionRootRef.current as any)._getResolve();
    resolveFn.mockReturnValue(mockGitRepo);
  });

  afterEach(() => {
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  describe('installHooks', () => {
    it('should exit with error when not in a git repository', async () => {
      mockGitRepo.isRepository.mockResolvedValue(false);

      await installHooks();

      expect(mockGitRepo.isRepository).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });

    it('should render HooksInstaller when repository is valid', async () => {
      mockGitRepo.isRepository.mockResolvedValue(true);

      const { render } = await import('ink');
      const mockWaitUntilExit = vi.fn().mockResolvedValue(undefined);
      vi.mocked(render).mockReturnValue({
        waitUntilExit: mockWaitUntilExit,
      } as any);

      await installHooks();

      expect(mockGitRepo.isRepository).toHaveBeenCalled();
      expect(render).toHaveBeenCalled();
      expect(mockWaitUntilExit).toHaveBeenCalled();
      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });

    it('should handle errors and exit with code 1', async () => {
      const error = new Error('Test error');
      mockGitRepo.isRepository.mockRejectedValue(error);

      await installHooks();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });

    it('should dispose composition root even if error occurs', async () => {
      const error = new Error('Test error');
      mockGitRepo.isRepository.mockRejectedValue(error);
      // dispose est appelé dans le finally, donc même si une erreur se produit avant,
      // dispose devrait être appelé
      await installHooks();

      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });
  });

  describe('uninstallHooks', () => {
    it('should exit with error when not in a git repository', async () => {
      mockGitRepo.isRepository.mockResolvedValue(false);

      await uninstallHooks();

      expect(mockGitRepo.isRepository).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });

    it('should render HooksUninstaller when repository is valid', async () => {
      mockGitRepo.isRepository.mockResolvedValue(true);

      const { render } = await import('ink');
      const mockWaitUntilExit = vi.fn().mockResolvedValue(undefined);
      vi.mocked(render).mockReturnValue({
        waitUntilExit: mockWaitUntilExit,
      } as any);

      await uninstallHooks();

      expect(mockGitRepo.isRepository).toHaveBeenCalled();
      expect(render).toHaveBeenCalled();
      expect(mockWaitUntilExit).toHaveBeenCalled();
      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });

    it('should handle errors and exit with code 1', async () => {
      const error = new Error('Test error');
      mockGitRepo.isRepository.mockRejectedValue(error);

      await uninstallHooks();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });

    it('should dispose composition root even if error occurs', async () => {
      const error = new Error('Test error');
      mockGitRepo.isRepository.mockRejectedValue(error);
      // dispose est appelé dans le finally, donc même si une erreur se produit avant,
      // dispose devrait être appelé
      await uninstallHooks();

      expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    });
  });
});

