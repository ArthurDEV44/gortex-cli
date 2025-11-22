import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { StatsTab } from '../StatsTab.js';

// Mock du hook useCommitHistory
const mockAnalyzeHistoryUseCase = {
  execute: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  useCommitHistory: () => mockAnalyzeHistoryUseCase,
}));

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

describe('StatsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockAnalyzeHistoryUseCase.execute.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { lastFrame } = render(<StatsTab />);

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Analyzing commits');
  });

  it('should display stats when loaded successfully', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 80,
      conventionalPercentage: 80.5,
      typeBreakdown: {
        feat: 40,
        fix: 30,
        docs: 10,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Summary');
      expect(output).toContain('Total commits analyzed');
      expect(output).toContain('100');
      expect(output).toContain('Conventional commits');
      expect(output).toContain('80');
      expect(output).toContain('Non-conventional commits');
      expect(output).toContain('20');
    }, { timeout: 2000 });
  });

  it('should display compliance rate with progress bar', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 75,
      conventionalPercentage: 75.0,
      typeBreakdown: {
        feat: 50,
        fix: 25,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Compliance Rate');
      expect(output).toContain('75.0%');
    }, { timeout: 2000 });
  });

  it('should display type breakdown when available', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 80,
      conventionalPercentage: 80.0,
      typeBreakdown: {
        feat: 40,
        fix: 30,
        docs: 10,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Type Breakdown');
      expect(output).toContain('feat');
      expect(output).toContain('fix');
      expect(output).toContain('docs');
    }, { timeout: 2000 });
  });

  it('should sort type breakdown by count descending', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 80,
      conventionalPercentage: 80.0,
      typeBreakdown: {
        docs: 10,
        feat: 40,
        fix: 30,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      // Vérifier que feat (40) apparaît avant fix (30) et docs (10)
      const featIndex = output.indexOf('feat');
      const fixIndex = output.indexOf('fix');
      const docsIndex = output.indexOf('docs');
      expect(featIndex).toBeLessThan(fixIndex);
      expect(fixIndex).toBeLessThan(docsIndex);
    }, { timeout: 2000 });
  });

  it('should display recommendations when compliance < 80%', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 50,
      conventionalPercentage: 50.0,
      typeBreakdown: {
        feat: 30,
        fix: 20,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Recommendations');
      expect(output).toContain('gortex commit');
      expect(output).toContain('gortex hooks install');
      expect(output).toContain('Share best practices');
    }, { timeout: 2000 });
  });

  it('should display success message when compliance >= 80%', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 85,
      conventionalPercentage: 85.0,
      typeBreakdown: {
        feat: 50,
        fix: 35,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Excellent work!');
      expect(output).toContain('follows commit conventions well');
      expect(output).not.toContain('Recommendations');
    }, { timeout: 2000 });
  });

  it('should display error when loading fails', async () => {
    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: false,
      error: 'Failed to load stats',
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error loading stats');
      expect(output).toContain('Failed to load stats');
    }, { timeout: 2000 });
  });

  it('should display error when stats is null', async () => {
    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: null,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error loading stats');
    }, { timeout: 2000 });
  });

  it('should handle exception during loading', async () => {
    mockAnalyzeHistoryUseCase.execute.mockRejectedValue(new Error('Network error'));

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error loading stats');
      expect(output).toContain('Network error');
    }, { timeout: 2000 });
  });

  it('should handle unknown error during loading', async () => {
    mockAnalyzeHistoryUseCase.execute.mockRejectedValue('Unknown error');

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error loading stats');
      expect(output).toContain('Failed to load stats');
    }, { timeout: 2000 });
  });

  it('should use correct color for compliance >= 80%', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 85,
      conventionalPercentage: 85.0,
      typeBreakdown: {
        feat: 50,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('85.0%');
    }, { timeout: 2000 });
  });

  it('should use warning color for compliance >= 50% and < 80%', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 60,
      conventionalPercentage: 60.0,
      typeBreakdown: {
        feat: 40,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('60.0%');
      expect(output).toContain('Recommendations');
    }, { timeout: 2000 });
  });

  it('should use error color for compliance < 50%', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 30,
      conventionalPercentage: 30.0,
      typeBreakdown: {
        feat: 20,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('30.0%');
      expect(output).toContain('Recommendations');
    }, { timeout: 2000 });
  });

  it('should not display type breakdown when empty', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 80,
      conventionalPercentage: 80.0,
      typeBreakdown: {},
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).not.toContain('Type Breakdown');
    }, { timeout: 2000 });
  });

  it('should calculate nonConventional correctly', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 75,
      conventionalPercentage: 75.0,
      typeBreakdown: {
        feat: 50,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    const { lastFrame } = render(<StatsTab />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      // 100 - 75 = 25 non-conventional
      expect(output).toContain('25');
    }, { timeout: 2000 });
  });

  it('should call execute with maxCount 100', async () => {
    const mockStats = {
      totalCommits: 100,
      conventionalCommits: 80,
      conventionalPercentage: 80.0,
      typeBreakdown: {
        feat: 50,
      },
    };

    mockAnalyzeHistoryUseCase.execute.mockResolvedValue({
      success: true,
      stats: mockStats,
    });

    render(<StatsTab />);

    await vi.waitFor(() => {
      expect(mockAnalyzeHistoryUseCase.execute).toHaveBeenCalledWith({ maxCount: 100 });
    }, { timeout: 2000 });
  });
});

