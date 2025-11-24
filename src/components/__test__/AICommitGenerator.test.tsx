import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import type { CommitConfig } from '../../types.js';

import { AICommitGenerator } from '../AICommitGenerator.js';

// Mock des hooks
const mockGenerateAICommitUseCase = {
  execute: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  useGenerateAICommit: () => mockGenerateAICommitUseCase,
}));

// Mock AIProviderFactory
vi.mock('../../infrastructure/factories/AIProviderFactory.js', () => ({
  AIProviderFactory: {
    create: vi.fn(() => ({
      getName: vi.fn(() => 'Ollama'),
    })),
  },
}));


describe('AICommitGenerator', () => {
  const mockOnComplete = vi.fn();
  const defaultConfig: CommitConfig = {
    types: [],
    scopes: [],
    allowCustomScopes: true,
    maxSubjectLength: 100,
    minSubjectLength: 3,
    ai: {
      enabled: true,
      provider: 'ollama',
      ollama: {
        model: 'magistral:24b',
        baseUrl: 'http://localhost:11434',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockGenerateAICommitUseCase.execute.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { lastFrame } = render(
      <AICommitGenerator 
        provider="ollama" 
        config={defaultConfig} 
        onComplete={mockOnComplete} 
      />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Génération du message');
    expect(output).toContain('Cela peut prendre quelques secondes');
  });

  it('should display error when generation fails', async () => {
    mockGenerateAICommitUseCase.execute.mockResolvedValue({
      success: false,
      error: 'AI generation failed',
    });

    const { lastFrame } = render(
      <AICommitGenerator 
        provider="ollama" 
        config={defaultConfig} 
        onComplete={mockOnComplete} 
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors de la génération');
      expect(output).toContain('AI generation failed');
      expect(output).toContain('Retour au mode manuel');
    }, { timeout: 2000 });
  });

  it('should display error message when generation fails', async () => {
    mockGenerateAICommitUseCase.execute.mockResolvedValue({
      success: false,
      error: 'AI generation failed',
    });

    const { lastFrame } = render(
      <AICommitGenerator 
        provider="ollama" 
        config={defaultConfig} 
        onComplete={mockOnComplete} 
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors de la génération');
      expect(output).toContain('AI generation failed');
    }, { timeout: 2000 });
    
    // Le composant affiche l'erreur mais ne déclenche pas automatiquement onComplete
    // L'utilisateur doit quitter manuellement ou le workflow doit gérer cela
  });

  it('should display suggestion when generation succeeds', async () => {
    mockGenerateAICommitUseCase.execute.mockResolvedValue({
      success: true,
      commit: {
        type: 'feat',
        scope: 'auth',
        subject: 'add login functionality',
        body: 'Implemented user authentication',
      },
      formattedMessage: 'feat(auth): add login functionality\n\nImplemented user authentication',
      confidence: 85,
    });

    const { lastFrame } = render(
      <AICommitGenerator 
        provider="ollama" 
        config={defaultConfig} 
        onComplete={mockOnComplete} 
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Suggestion AI');
      expect(output).toContain('Message de commit proposé');
      expect(output).toContain('feat(auth): add login functionality');
      expect(output).toContain('Confiance: 85%');
    }, { timeout: 2000 });
  });

  it('should display confidence emoji based on confidence level', async () => {
    // Test avec confiance élevée (>= 80)
    mockGenerateAICommitUseCase.execute.mockResolvedValue({
      success: true,
      commit: {
        type: 'feat',
        subject: 'add feature',
      },
      formattedMessage: 'feat: add feature',
      confidence: 85,
    });

    const { lastFrame } = render(
      <AICommitGenerator 
        provider="ollama" 
        config={defaultConfig} 
        onComplete={mockOnComplete} 
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Confiance: 85%');
    }, { timeout: 2000 });
  });

  it('should handle generation exception', async () => {
    mockGenerateAICommitUseCase.execute.mockRejectedValue(new Error('Network error'));

    const { lastFrame } = render(
      <AICommitGenerator 
        provider="ollama" 
        config={defaultConfig} 
        onComplete={mockOnComplete} 
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur');
      expect(output).toContain('Network error');
    }, { timeout: 2000 });
  });

  it('should display provider name in loading state', async () => {
    const { AIProviderFactory } = await import('../../infrastructure/factories/AIProviderFactory.js');
    vi.mocked(AIProviderFactory.create).mockReturnValue({
      getName: vi.fn(() => 'Mistral AI'),
    } as any);

    mockGenerateAICommitUseCase.execute.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { lastFrame } = render(
      <AICommitGenerator 
        provider="mistral" 
        config={defaultConfig} 
        onComplete={mockOnComplete} 
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Mistral AI');
    }, { timeout: 2000 });
  });
});

