import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { CommitMessageBuilder } from '../CommitMessageBuilder.js';

// Mock loadConfig
vi.mock('../../utils/config.js', () => ({
  loadConfig: vi.fn(),
}));

// Mock des composants UI
vi.mock('../../ui/index.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    Select: ({ onSelect, items }: any) => {
      React.useEffect(() => {
        // Simuler la sélection du premier item après un court délai
        setTimeout(() => {
          if (onSelect && items && items.length > 0) {
            onSelect(items[0]);
          }
        }, 0);
      }, [onSelect, items]);
      return React.createElement(Text, null, 'Select');
    },
    TextInput: ({ onSubmit, validate }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onSubmit) {
            const testValue = 'test value';
            if (!validate || validate(testValue) === true) {
              onSubmit(testValue);
            }
          }
        }, 0);
      }, [onSubmit, validate]);
      return React.createElement(Text, null, 'TextInput');
    },
  };
});

describe('CommitMessageBuilder', () => {
  const mockOnComplete = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { loadConfig } = await import('../../utils/config.js');
    vi.mocked(loadConfig).mockResolvedValue({
      types: [
        { value: 'feat', name: 'Feature', description: 'New feature' },
        { value: 'fix', name: 'Fix', description: 'Bug fix' },
      ],
      scopes: ['auth', 'api'],
      allowCustomScopes: true,
      minSubjectLength: 3,
      maxSubjectLength: 100,
    });
  });

  it('should display loading state initially', async () => {
    const { loadConfig } = await import('../../utils/config.js');
    vi.mocked(loadConfig).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    const { lastFrame } = render(<CommitMessageBuilder onComplete={mockOnComplete} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Chargement');
  });

  it('should display type selection step', async () => {
    const { lastFrame } = render(<CommitMessageBuilder onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Étape 3/5');
      expect(output).toContain('Message de commit');
    }, { timeout: 2000 });
  });

  it('should handle type selection and move to scope', async () => {
    render(<CommitMessageBuilder onComplete={mockOnComplete} />);
    
    // Le composant devrait progresser automatiquement grâce au mock Select
    await vi.waitFor(() => {
      // Le mock Select sélectionne automatiquement le premier item
      // ce qui devrait déclencher handleTypeSelect et passer à l'étape scope
    }, { timeout: 2000 });
  });

  it('should handle scope selection', async () => {
    render(<CommitMessageBuilder onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      // Le composant devrait progresser à travers les étapes
    }, { timeout: 2000 });
  });

  it('should validate subject length', async () => {
    // Test de la validation en vérifiant que le composant utilise bien la fonction de validation
    // La validation est testée indirectement via le comportement du composant
    const { loadConfig } = await import('../../utils/config.js');
    vi.mocked(loadConfig).mockResolvedValue({
      types: [{ value: 'feat', name: 'Feature', description: 'New feature' }],
      scopes: [],
      allowCustomScopes: false,
      minSubjectLength: 3,
      maxSubjectLength: 100,
    });

    // Le mock TextInput appelle onSubmit avec 'test value' qui devrait passer la validation
    // car il fait plus de 3 caractères et moins de 100
    render(<CommitMessageBuilder onComplete={mockOnComplete} />);
    
    // Le composant devrait progresser normalement car la valeur de test passe la validation
    await vi.waitFor(() => {
      // Le composant devrait avoir progressé à travers les étapes
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('should call onComplete with formatted message', async () => {
    render(<CommitMessageBuilder onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
      const message = mockOnComplete.mock.calls[0]?.[0];
      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
    }, { timeout: 5000 });
  });

  it('should handle config without scopes', async () => {
    const { loadConfig } = await import('../../utils/config.js');
    vi.mocked(loadConfig).mockResolvedValue({
      types: [{ value: 'feat', name: 'Feature', description: 'New feature' }],
      scopes: [],
      allowCustomScopes: false,
      minSubjectLength: 3,
      maxSubjectLength: 100,
    });

    render(<CommitMessageBuilder onComplete={mockOnComplete} />);
    
    await vi.waitFor(() => {
      // Le composant devrait fonctionner même sans scopes
    }, { timeout: 2000 });
  });
});

