import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IGitRepository } from '../domain/repositories/IGitRepository.js';

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

vi.mock('../utils/config.js');
vi.mock('ink', () => ({
  render: vi.fn(() => ({
    waitUntilExit: vi.fn().mockResolvedValue(undefined),
    unmount: vi.fn(),
  })),
  default: {},
}));
vi.mock('../components/InteractiveWorkflow.js', () => ({
  InteractiveWorkflow: () => null,
}));
vi.mock('../components/Brand.js', () => ({
  Brand: () => null,
}));
vi.mock('../components/ErrorMessage.js', () => ({
  ErrorMessage: () => null,
}));
vi.mock('../infrastructure/di/DIContext.js', () => ({
  DIProvider: ({ children }: { children: any }) => children,
}));

// Imports après les mocks
import { commitCommand } from './commit.js';
import { loadConfig } from '../utils/config.js';

describe('commitCommand', () => {
  let mockGitRepo: any;
  let originalExit: typeof process.exit;
  let exitSpy: any;
  let consoleClearSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Réinitialiser l'instance mockée
    mockCompositionRootRef.current = createMockCompositionRoot();

    // Mock Git Repository
    mockGitRepo = {
      isRepository: vi.fn(),
      hasChanges: vi.fn(),
    };

    // Configurer le container pour retourner le mockGitRepo
    const container = mockCompositionRootRef.current.getContainer();
    // Le resolve doit retourner mockGitRepo pour n'importe quel argument
    const resolveFn = (mockCompositionRootRef.current as any)._getResolve();
    resolveFn.mockReturnValue(mockGitRepo);

    // Mock process.exit
    originalExit = process.exit;
    exitSpy = vi.fn();
    process.exit = exitSpy as any;

    // Mock console
    consoleClearSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock loadConfig
    vi.mocked(loadConfig).mockResolvedValue({
      types: [],
      scopes: [],
      ai: { enabled: false },
    } as any);
  });

  afterEach(() => {
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  it('should exit with error when not in a git repository', async () => {
    mockGitRepo.isRepository.mockResolvedValue(false);

    await commitCommand();

    expect(mockGitRepo.isRepository).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
  });

  it('should exit with success when no changes are detected', async () => {
    mockGitRepo.isRepository.mockResolvedValue(true);
    mockGitRepo.hasChanges.mockResolvedValue(false);

    await commitCommand();

    expect(mockGitRepo.isRepository).toHaveBeenCalled();
    expect(mockGitRepo.hasChanges).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
  });

  it('should start interactive workflow when repository is valid and has changes', async () => {
    mockGitRepo.isRepository.mockResolvedValue(true);
    mockGitRepo.hasChanges.mockResolvedValue(true);

    const { render } = await import('ink');
    const mockWaitUntilExit = vi.fn().mockResolvedValue(undefined);
    vi.mocked(render).mockReturnValue({
      waitUntilExit: mockWaitUntilExit,
      unmount: vi.fn(),
    } as any);

    await commitCommand();

    expect(mockGitRepo.isRepository).toHaveBeenCalled();
    expect(mockGitRepo.hasChanges).toHaveBeenCalled();
    expect(loadConfig).toHaveBeenCalled();
    expect(consoleClearSpy).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();
    expect(mockWaitUntilExit).toHaveBeenCalled();
    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should handle errors and exit with code 1', async () => {
    const error = new Error('Test error');
    mockGitRepo.isRepository.mockRejectedValue(error);

    await commitCommand();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
  });

  it('should dispose composition root even if error occurs', async () => {
    const error = new Error('Test error');
    mockGitRepo.isRepository.mockRejectedValue(error);
    // dispose est appelé dans le finally, donc même si une erreur se produit avant,
    // dispose devrait être appelé
    await commitCommand();

    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
  });
});

