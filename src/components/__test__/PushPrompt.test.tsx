import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { PushPrompt } from '../PushPrompt.js';

// Mock des hooks
const mockPushOperationsUseCase = {
  checkRemote: vi.fn(),
  pushToRemote: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  usePushOperations: () => mockPushOperationsUseCase,
}));

// Mock Confirm - utiliser un objet mutable pour le comportement
const confirmMockConfig = { behavior: 'default' as 'default' | 'cancel' };

vi.mock('../../ui/index.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    Confirm: ({ onSubmit, defaultValue }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onSubmit) {
            const value = confirmMockConfig.behavior === 'cancel' ? false : (defaultValue !== undefined ? defaultValue : true);
            onSubmit(value);
          }
        }, 0);
      }, [onSubmit, defaultValue]);
      return React.createElement(Text, null, `Confirm: ${confirmMockConfig.behavior === 'cancel' ? 'No' : 'Yes'}`);
    },
  };
});

// Mock Spinner
vi.mock('ink-spinner', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    default: ({ type }: any) => {
      return React.createElement(Text, null, '⏳');
    },
  };
});

describe('PushPrompt', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    confirmMockConfig.behavior = 'default';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display checking state initially', async () => {
    mockPushOperationsUseCase.checkRemote.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Étape 5/5: Push vers le remote');
      expect(output).toContain('Vérification du remote');
    }, { timeout: 1000 });
  });

  it('should display no-remote message when no remote is configured', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: false,
    });

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Aucun remote configuré');
      expect(output).toContain('git remote add origin');
    }, { timeout: 1000 });
  });

  it('should display confirm step when remote exists', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    // Ne pas appeler pushToRemote pour ce test
    mockPushOperationsUseCase.pushToRemote.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    // Le mock Confirm appelle onSubmit rapidement, mais on peut vérifier que le remote est affiché
    // avant que le push ne commence
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      // Vérifier que le remote est affiché (peut être dans l'état confirm ou pushing)
      expect(output).toContain('https://github.com/user/repo.git');
    }, { timeout: 1000 });
  });

  it('should call onComplete when user cancels push', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    confirmMockConfig.behavior = 'cancel';

    render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should push when user confirms', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    mockPushOperationsUseCase.pushToRemote.mockResolvedValue({
      success: true,
    });

    render(
      <PushPrompt branch="feature/test" onComplete={mockOnComplete} />
    );

    // Attendre que pushToRemote soit appelé (le mock Confirm appelle onSubmit automatiquement)
    await vi.waitFor(() => {
      expect(mockPushOperationsUseCase.pushToRemote).toHaveBeenCalledWith({
        branch: 'feature/test',
      });
    }, { timeout: 2000 });
  });

  it('should display success message after successful push', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    mockPushOperationsUseCase.pushToRemote.mockResolvedValue({
      success: true,
    });

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    // Attendre le succès
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Push réussi');
      expect(output).toContain('https://github.com/user/repo.git');
    }, { timeout: 3000 });
  });

  it('should call onComplete after successful push', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    mockPushOperationsUseCase.pushToRemote.mockResolvedValue({
      success: true,
    });

    render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    // Attendre que onComplete soit appelé (après le délai UI_DELAYS.INTRO)
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('should display error when checkRemote fails', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: false,
      error: 'Failed to check remote',
    });

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors du push');
      expect(output).toContain('Failed to check remote');
    }, { timeout: 1000 });
  });

  it('should display error when push fails', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    mockPushOperationsUseCase.pushToRemote.mockResolvedValue({
      success: false,
      error: 'Push failed: authentication required',
    });

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    // Attendre que l'erreur soit affichée
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors du push');
      expect(output).toContain('Push failed: authentication required');
    }, { timeout: 3000 });
  });

  it('should display error message with manual push instructions', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    mockPushOperationsUseCase.pushToRemote.mockResolvedValue({
      success: false,
      error: 'Push failed',
    });

    const { lastFrame } = render(
      <PushPrompt branch="feature/test" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('git push origin feature/test');
      expect(output).toContain('SSH');
      expect(output).toContain('HTTPS');
    }, { timeout: 3000 });
  });

  it('should handle exception during push', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    mockPushOperationsUseCase.pushToRemote.mockRejectedValue(
      new Error('Network error')
    );

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors du push');
      expect(output).toContain('Network error');
    }, { timeout: 3000 });
  });

  it('should display pushing state during push', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    // Créer une promesse qui ne se résout pas immédiatement
    let resolvePush: (value: any) => void;
    const pushPromise = new Promise((resolve) => {
      resolvePush = resolve;
    });

    mockPushOperationsUseCase.pushToRemote.mockImplementation(() => pushPromise);

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    // Attendre que le push soit en cours (le mock Confirm appelle onSubmit automatiquement)
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Push en cours');
      expect(output).toContain('https://github.com/user/repo.git');
    }, { timeout: 2000 });

    // Résoudre la promesse pour nettoyer
    resolvePush!({ success: true });
  });

  it('should handle checkRemote error with default message', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: false,
      // error is undefined
    });

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors du push');
      expect(output).toContain('Failed to check remote');
    }, { timeout: 1000 });
  });

  it('should handle pushToRemote error with default message', async () => {
    mockPushOperationsUseCase.checkRemote.mockResolvedValue({
      success: true,
      hasRemote: true,
      remoteUrl: 'https://github.com/user/repo.git',
    });

    mockPushOperationsUseCase.pushToRemote.mockResolvedValue({
      success: false,
      // error is undefined
    });

    const { lastFrame } = render(
      <PushPrompt branch="main" onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors du push');
      expect(output).toContain('Failed to push to remote');
    }, { timeout: 3000 });
  });
});

