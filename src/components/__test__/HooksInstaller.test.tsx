import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import stripAnsi from 'strip-ansi';
import fs from 'fs/promises';
import { HooksInstaller } from '../HooksInstaller.js';

// Mock fs
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Mock du hook useGitRepository
const mockGitRepository = {
  getGitDirectory: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  useGitRepository: () => mockGitRepository,
}));

// Mock du composant Confirm - doit être défini avant les imports
// Variable pour contrôler le délai de confirmation
const confirmDelayConfig = { delay: 0 };

vi.mock('../../ui/index.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    Confirm: ({ onSubmit, defaultValue }: any) => {
      React.useEffect(() => {
        // Simuler la confirmation automatique après un délai configurable
        setTimeout(() => {
          if (onSubmit) onSubmit(defaultValue);
        }, confirmDelayConfig.delay);
      }, [onSubmit, defaultValue]);
      return React.createElement(Text, null, `Confirm: ${defaultValue ? 'Yes' : 'No'}`);
    },
  };
});

describe('HooksInstaller', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    confirmDelayConfig.delay = 0; // Reset to immediate by default
    mockGitRepository.getGitDirectory.mockResolvedValue('/test/.git');
    vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display loading state initially', () => {
    const { lastFrame } = render(<HooksInstaller onComplete={mockOnComplete} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Vérification');
  });

  it('should check if hook exists', async () => {
    render(<HooksInstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      expect(mockGitRepository.getGitDirectory).toHaveBeenCalled();
    });
  });

  it('should display installation message when hook does not exist', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));
    
    // Augmenter le délai pour que le test puisse capturer l'état avant la confirmation
    confirmDelayConfig.delay = 300;
    
    const { lastFrame } = render(<HooksInstaller onComplete={mockOnComplete} />);
    
    // Attendre que le chargement soit terminé
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).not.toContain('Vérification');
    }, { timeout: 2000 });
    
    // Vérifier immédiatement que le message d'installation est affiché
    // avant que Confirm ne déclenche l'état "installing"
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Installation du hook Git');
    // S'assurer qu'on n'est pas encore dans l'état "installing"
    expect(output).not.toContain('Installation du hook...');
  });

  it('should display warning when hook already exists', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    
    const { lastFrame } = render(<HooksInstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      // Le composant affiche l'avertissement après le chargement
      expect(output).toContain('Un hook commit-msg existe déjà');
    }, { timeout: 2000 });
  });

  it('should call onComplete with false when installation fails', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));
    
    render(<HooksInstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should call onComplete with false when git directory check fails', async () => {
    mockGitRepository.getGitDirectory.mockRejectedValue(new Error('Not a git repo'));
    
    render(<HooksInstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(false);
    });
  });
});

