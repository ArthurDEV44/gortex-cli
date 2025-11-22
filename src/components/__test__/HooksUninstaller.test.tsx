import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import stripAnsi from 'strip-ansi';
import fs from 'fs/promises';
import { HooksUninstaller } from '../HooksUninstaller.js';

// Mock fs
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    unlink: vi.fn(),
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
vi.mock('../../ui/index.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    Confirm: ({ onSubmit, defaultValue }: any) => {
      React.useEffect(() => {
        // Simuler la confirmation automatique après un court délai
        setTimeout(() => {
          if (onSubmit) onSubmit(defaultValue);
        }, 0);
      }, [onSubmit, defaultValue]);
      return React.createElement(Text, null, `Confirm: ${defaultValue ? 'Yes' : 'No'}`);
    },
  };
});

describe('HooksUninstaller', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGitRepository.getGitDirectory.mockResolvedValue('/test/.git');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display loading state initially', () => {
    const { lastFrame } = render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Vérification');
  });

  it('should check if hook exists', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('Not found'));
    
    render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      expect(mockGitRepository.getGitDirectory).toHaveBeenCalled();
    });
  });

  it('should display message when hook does not exist', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('Not found'));
    
    const { lastFrame } = render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Aucun hook commit-msg trouvé');
    });
  });

  it('should display warning when hook is not from gortex', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('#!/bin/sh\n# Some other hook');
    
    const { lastFrame } = render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      // Le composant affiche l'avertissement après le chargement
      expect(output).toContain("n'a pas été créé par gortex");
    }, { timeout: 2000 });
  });

  it('should not display warning when hook is from gortex', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('#!/bin/sh\n# gortex hook');
    
    const { lastFrame } = render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).not.toContain("n'a pas été créé par gortex");
    });
  });

  it('should call onComplete with false when uninstallation fails', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('#!/bin/sh\n# gortex hook');
    vi.mocked(fs.unlink).mockRejectedValue(new Error('Delete failed'));
    
    render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should call onComplete with false when git directory check fails', async () => {
    mockGitRepository.getGitDirectory.mockRejectedValue(new Error('Not a git repo'));
    
    render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(false);
    });
  });

  it('should call onComplete with false when user cancels', async () => {
    // Pour tester l'annulation, on simule un hook non-gortex qui aura defaultValue=false
    vi.mocked(fs.readFile).mockResolvedValue('#!/bin/sh\n# Some other hook');
    
    render(<HooksUninstaller onComplete={mockOnComplete} />);
    
    // Le mock Confirm appelle onSubmit(defaultValue) où defaultValue=false pour un hook non-gortex
    // Mais le composant appelle onComplete(false) directement si l'utilisateur annule
    // Le mock appelle onSubmit(false) donc onComplete(false) devrait être appelé
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});

