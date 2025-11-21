import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { CommitConfirmation } from '../CommitConfirmation.js';

// Mock des hooks
const mockStageFilesUseCase = {
  execute: vi.fn(),
};

const mockCreateCommitUseCase = {
  execute: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  useStageFiles: () => mockStageFilesUseCase,
  useCreateCommit: () => mockCreateCommitUseCase,
}));

// Mock du composant Confirm - utiliser un objet mutable pour le comportement
const confirmMockConfig = { behavior: 'default' as 'default' | 'cancel' };

vi.mock('../../ui/index.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    Confirm: ({ onSubmit, defaultValue }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onSubmit) {
            // Si le comportement est 'cancel', appeler avec false
            // Sinon utiliser defaultValue
            onSubmit(confirmMockConfig.behavior === 'cancel' ? false : defaultValue);
          }
        }, 0);
      }, [onSubmit, defaultValue]);
      return React.createElement(Text, null, `Confirm: ${confirmMockConfig.behavior === 'cancel' ? 'No' : (defaultValue ? 'Yes' : 'No')}`);
    },
  };
});

// Mock LoadingSpinner
vi.mock('../LoadingSpinner.js', async () => {
  const { Text } = await import('ink');
  return {
    LoadingSpinner: ({ message }: any) => {
      return React.createElement(Text, null, message);
    },
  };
});

describe('CommitConfirmation', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    confirmMockConfig.behavior = 'default'; // Reset to default behavior
    mockStageFilesUseCase.execute.mockResolvedValue({ success: true });
    mockCreateCommitUseCase.execute.mockResolvedValue({ success: true });
  });

  it('should display commit preview', () => {
    const files = ['file1.ts', 'file2.ts'];
    const message = 'feat: add new feature';
    
    const { lastFrame } = render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Commit Preview');
    expect(output).toContain('Files (2)');
    expect(output).toContain('file1.ts');
    expect(output).toContain('file2.ts');
  });

  it('should display commit message', () => {
    const files = ['file1.ts'];
    const message = 'feat: add new feature';
    
    const { lastFrame } = render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Message:');
    expect(output).toContain('feat: add new feature');
  });

  it('should display truncated file list when more than 3 files', () => {
    const files = ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts', 'file5.ts'];
    const message = 'feat: add new feature';
    
    const { lastFrame } = render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Files (5)');
    expect(output).toContain('... and 2 more');
  });

  it('should display multi-line commit message', () => {
    const files = ['file1.ts'];
    const message = 'feat: add new feature\n\nThis is a longer description\nwith multiple lines';
    
    const { lastFrame } = render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('feat: add new feature');
  });

  it('should call onComplete with false when user cancels', async () => {
    const files = ['file1.ts'];
    const message = 'feat: add new feature';
    
    // Changer le comportement du mock pour simuler une annulation
    confirmMockConfig.behavior = 'cancel';
    
    render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );
    
    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(false);
    }, { timeout: 2000 });
  });

  it('should call onComplete with true when commit succeeds', async () => {
    const files = ['file1.ts'];
    const message = 'feat: add new feature';

    render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      // Files are already staged in CommitTab, so stageFiles should NOT be called here
      expect(mockStageFilesUseCase.execute).not.toHaveBeenCalled();
      expect(mockCreateCommitUseCase.execute).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalledWith(true);
    }, { timeout: 2000 });
  });

  it('should display error when commit creation fails', async () => {
    mockCreateCommitUseCase.execute.mockResolvedValue({
      success: false,
      error: 'Failed to create commit',
    });
    
    const files = ['file1.ts'];
    const message = 'feat: add new feature';
    
    const { lastFrame } = render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );
    
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error');
      expect(output).toContain('Failed to create commit');
    }, { timeout: 2000 });
  });

  it('should display loading state when committing', async () => {
    mockCreateCommitUseCase.execute.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const files = ['file1.ts'];
    const message = 'feat: add new feature';

    const { lastFrame } = render(
      <CommitConfirmation message={message} files={files} onComplete={mockOnComplete} />
    );

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Creating commit');
    }, { timeout: 2000 });
  });
});

