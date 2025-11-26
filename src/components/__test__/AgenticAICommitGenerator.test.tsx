import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { AgenticAICommitGenerator } from '../AgenticAICommitGenerator.js';
import type { AgenticGenerationResult } from '../../application/use-cases/AgenticCommitGenerationUseCase.js';

// Mock the hooks
const mockAgenticUseCase = {
  execute: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  useAgenticCommitGeneration: () => mockAgenticUseCase,
}));

// Mock AIProviderFactory
vi.mock('../../infrastructure/factories/AIProviderFactory.js', () => ({
  AIProviderFactory: {
    create: vi.fn(() => ({
      getName: () => 'Test Provider',
      generateCommitMessage: vi.fn(),
    })),
  },
}));

describe('AgenticAICommitGenerator', () => {
  const mockConfig = {
    ai: {
      enabled: true,
      provider: 'ollama' as const,
      ollama: {
        model: 'test-model',
        baseUrl: 'http://localhost:11434',
      },
    },
    types: [],
    scopes: [],
    allowCustomScopes: true,
    maxSubjectLength: 100,
    minSubjectLength: 3,
  };

  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display generating state initially', async () => {
    mockAgenticUseCase.execute.mockImplementation(
      async () => {
        // Delay long enough for test to check the loading state
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          success: true,
          formattedMessage: 'test',
          iterations: 1,
          finalQualityScore: 85,
          reflections: [],
          performance: {
            totalLatency: 1000,
            generationTime: 1000,
            reflectionTime: 0,
            refinementTime: 0,
          },
        };
      }
    );

    const { lastFrame } = render(
      <AgenticAICommitGenerator
        provider="ollama"
        config={mockConfig}
        onComplete={mockOnComplete}
      />
    );

    // Check immediately (before promise resolves)
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Mode Agentique');
    expect(output).toContain('Génération initiale du message');

    // Wait for async operation to complete so finally block runs and flag is reset
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  it('should display preview with generated commit message', async () => {
    const mockResult: AgenticGenerationResult = {
      success: true,
      formattedMessage: 'feat(test): add new feature',
      provider: 'ollama',
      iterations: 1,
      finalQualityScore: 85,
      confidence: 90,
      reflections: [],
      performance: {
        totalLatency: 2500,
        generationTime: 1500,
        reflectionTime: 500,
        refinementTime: 500,
      },
    };

    mockAgenticUseCase.execute.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockResult;
    });

    const { lastFrame } = render(
      <AgenticAICommitGenerator
        provider="ollama"
        config={mockConfig}
        onComplete={mockOnComplete}
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Suggestion AI');
      expect(output).toContain('feat(test): add new feature');
      expect(output).toContain('Confiance: 90%');
    }, { timeout: 3000 });
  });

  it('should display metadata with multiple iterations', async () => {
    const mockResult: AgenticGenerationResult = {
      success: true,
      formattedMessage: 'fix(api): resolve bug',
      provider: 'ollama',
      iterations: 2,
      finalQualityScore: 92,
      confidence: 95,
      reflections: [],
      performance: {
        totalLatency: 4000,
        generationTime: 1500,
        reflectionTime: 1000,
        refinementTime: 1500,
      },
    };

    mockAgenticUseCase.execute.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockResult;
    });

    const { lastFrame } = render(
      <AgenticAICommitGenerator
        provider="ollama"
        config={mockConfig}
        onComplete={mockOnComplete}
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Métadonnées Agentiques');
      expect(output).toContain('Itérations: 2');
      expect(output).toContain('raffiné');
      expect(output).toContain('Score qualité: 92/100');
    }, { timeout: 3000 });
  });

  it('should display error message when generation fails', async () => {
    mockAgenticUseCase.execute.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: false,
        error: 'API connection failed',
        iterations: 0,
        reflections: [],
        performance: {
          totalLatency: 100,
          generationTime: 100,
          reflectionTime: 0,
          refinementTime: 0,
        },
      };
    });

    const { lastFrame } = render(
      <AgenticAICommitGenerator
        provider="ollama"
        config={mockConfig}
        onComplete={mockOnComplete}
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors de la génération');
      expect(output).toContain('API connection failed');
    }, { timeout: 3000 });
  });

  it('should handle exception during generation', async () => {
    mockAgenticUseCase.execute.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      throw new Error('Network timeout');
    });

    const { lastFrame } = render(
      <AgenticAICommitGenerator
        provider="ollama"
        config={mockConfig}
        onComplete={mockOnComplete}
      />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Erreur lors de la génération');
      expect(output).toContain('Network timeout');
    }, { timeout: 3000 });
  });

  it('should call execute with correct parameters', async () => {
    mockAgenticUseCase.execute.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        formattedMessage: 'test: add test',
        iterations: 1,
        finalQualityScore: 85,
        reflections: [],
        performance: {
          totalLatency: 1000,
          generationTime: 1000,
          reflectionTime: 0,
          refinementTime: 0,
        },
      };
    });

    render(
      <AgenticAICommitGenerator
        provider="ollama"
        config={mockConfig}
        onComplete={mockOnComplete}
      />
    );

    await vi.waitFor(() => {
      expect(mockAgenticUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          includeScope: true,
          maxReflectionIterations: 2,
          onProgress: expect.any(Function),
        })
      );
    }, { timeout: 3000 });
  });
});
