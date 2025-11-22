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
}));
vi.mock('../components/StatsDisplay.js', () => ({
  StatsDisplay: () => null,
}));
vi.mock('../components/ErrorMessage.js', () => ({
  ErrorMessage: () => null,
}));
vi.mock('../infrastructure/di/DIContext.js', () => ({
  DIProvider: ({ children }: { children: any }) => children,
}));

// Imports après les mocks
import { statsCommand } from './stats.js';

describe('statsCommand', () => {
  let mockGitRepo: any;
  let originalExit: typeof process.exit;
  let exitSpy: any;
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

  it('should exit with error when not in a git repository', async () => {
    mockGitRepo.isRepository.mockResolvedValue(false);

    await statsCommand();

    expect(mockGitRepo.isRepository).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
  });

  it('should render stats display when repository is valid', async () => {
    mockGitRepo.isRepository.mockResolvedValue(true);

    const { render } = await import('ink');
    const mockWaitUntilExit = vi.fn().mockResolvedValue(undefined);
    vi.mocked(render).mockReturnValue({
      waitUntilExit: mockWaitUntilExit,
    } as any);

    await statsCommand();

    expect(mockGitRepo.isRepository).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();
    expect(mockWaitUntilExit).toHaveBeenCalled();
    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should use default maxCount of 100 when not specified', async () => {
    mockGitRepo.isRepository.mockResolvedValue(true);

    const { render } = await import('ink');
    const renderSpy = vi.mocked(render);
    renderSpy.mockReturnValue({
      waitUntilExit: vi.fn().mockResolvedValue(undefined),
    } as any);

    await statsCommand();

    expect(renderSpy).toHaveBeenCalled();
    // Vérifier que StatsDisplay est rendu avec maxCount=100
    // Le render est appelé avec <DIProvider><StatsDisplay maxCount={100} /></DIProvider>
    const renderCall = renderSpy.mock.calls[renderSpy.mock.calls.length - 1]?.[0];
    expect(renderCall).toBeDefined();
    // Le composant rendu est DIProvider, qui contient StatsDisplay comme enfant
    if (renderCall && typeof renderCall === 'object' && 'props' in renderCall && 'type' in renderCall) {
      const statsDisplay = (renderCall as any).props?.children;
      expect(statsDisplay?.props?.maxCount).toBe(100);
    }
  });

  it('should use custom maxCount when specified', async () => {
    mockGitRepo.isRepository.mockResolvedValue(true);

    const { render } = await import('ink');
    const renderSpy = vi.mocked(render);
    renderSpy.mockReturnValue({
      waitUntilExit: vi.fn().mockResolvedValue(undefined),
    } as any);

    await statsCommand(50);

    expect(renderSpy).toHaveBeenCalled();
    // Vérifier que StatsDisplay est rendu avec maxCount=50
    const renderCall = renderSpy.mock.calls[renderSpy.mock.calls.length - 1]?.[0];
    expect(renderCall).toBeDefined();
    if (renderCall && typeof renderCall === 'object' && 'props' in renderCall) {
      const statsDisplay = (renderCall as any).props?.children;
      expect(statsDisplay?.props?.maxCount).toBe(50);
    }
  });

  it('should handle errors and exit with code 1', async () => {
    const error = new Error('Test error');
    mockGitRepo.isRepository.mockRejectedValue(error);

    await statsCommand();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
  });

  it('should dispose composition root even if error occurs', async () => {
    const error = new Error('Test error');
    mockGitRepo.isRepository.mockRejectedValue(error);
    // dispose est appelé dans le finally, donc même si une erreur se produit avant,
    // dispose devrait être appelé
    await statsCommand();

    expect(mockCompositionRootRef.current.dispose).toHaveBeenCalled();
  });
});

