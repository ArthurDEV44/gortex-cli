import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { BranchSelector } from '../BranchSelector.js';

// Mock des hooks
const mockBranchOperationsUseCase = {
  getAllBranches: vi.fn(),
  checkoutBranch: vi.fn(),
  createBranch: vi.fn(),
  branchExists: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  useBranchOperations: () => mockBranchOperationsUseCase,
}));

// Mock des composants UI
const selectMockConfig = { selectIndex: -1, delay: 0 }; // -1 = last item by default
const textInputMockConfig = { autoSubmit: true, delay: 0 }; // Contrôle si TextInput appelle onSubmit automatiquement

vi.mock('../../ui/index.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    Select: ({ onSelect, items }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onSelect && items && items.length > 0 && selectMockConfig.selectIndex !== -2) {
            // -2 = ne pas sélectionner automatiquement
            const index = selectMockConfig.selectIndex >= 0 
              ? selectMockConfig.selectIndex 
              : items.length - 1; // Dernier item par défaut
            onSelect(items[index]);
          }
        }, selectMockConfig.delay);
      }, [onSelect, items]);
      return React.createElement(Text, null, 'Select');
    },
    TextInput: ({ onSubmit, validate, message }: any) => {
      React.useEffect(() => {
        setTimeout(async () => {
          if (onSubmit && textInputMockConfig.autoSubmit) {
            const testValue = 'feature/test-branch';
            if (!validate || (await validate(testValue)) === true) {
              onSubmit(testValue);
            }
          }
        }, textInputMockConfig.delay);
      }, [onSubmit, validate]);
      return React.createElement(Text, null, message || 'TextInput');
    },
    Confirm: ({ onSubmit, defaultValue }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onSubmit) onSubmit(defaultValue);
        }, 0);
      }, [onSubmit, defaultValue]);
      return React.createElement(Text, null, `Confirm: ${defaultValue ? 'Yes' : 'No'}`);
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

describe('BranchSelector', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    selectMockConfig.selectIndex = -1; // Reset to last item
    selectMockConfig.delay = 0; // Reset delay
    textInputMockConfig.autoSubmit = true; // Reset auto submit
    textInputMockConfig.delay = 0; // Reset delay
    mockBranchOperationsUseCase.getAllBranches.mockResolvedValue({
      success: true,
      branches: ['main', 'develop', 'feature/test'],
      currentBranch: 'main',
    });
    mockBranchOperationsUseCase.checkoutBranch.mockResolvedValue({
      success: true,
    });
    mockBranchOperationsUseCase.createBranch.mockResolvedValue({
      success: true,
    });
    mockBranchOperationsUseCase.branchExists.mockResolvedValue({
      success: true,
      exists: false,
    });
  });

  it('should display loading state initially', () => {
    mockBranchOperationsUseCase.getAllBranches.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { lastFrame } = render(<BranchSelector onComplete={mockOnComplete} />);

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Loading branches');
  });

  it('should display error when loading branches fails', async () => {
    mockBranchOperationsUseCase.getAllBranches.mockResolvedValue({
      success: false,
      error: 'Failed to load branches',
    });

    // Empêcher le Select de s'exécuter automatiquement
    selectMockConfig.selectIndex = -2;

    const { lastFrame } = render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error');
      expect(output).toContain('Failed to load branches');
    }, { timeout: 2000 });
  });

  it('should display current branch', async () => {
    // Empêcher le Select de s'exécuter automatiquement pour voir la branche courante
    selectMockConfig.selectIndex = -2;
    selectMockConfig.delay = 200; // Délai pour capturer l'état avant la sélection

    const { lastFrame } = render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Current:');
      expect(output).toContain('main');
    }, { timeout: 2000 });
  });

  it('should call onComplete when user confirms branch selection', async () => {
    // Sélectionner la branche courante (premier item)
    selectMockConfig.selectIndex = 0;

    render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('main');
    }, { timeout: 3000 });
  });

  it('should checkout branch when different branch is selected', async () => {
    // Sélectionner une branche différente (deuxième item)
    selectMockConfig.selectIndex = 1;

    render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      expect(mockBranchOperationsUseCase.checkoutBranch).toHaveBeenCalledWith({
        branchName: 'develop',
      });
      expect(mockOnComplete).toHaveBeenCalledWith('develop');
    }, { timeout: 3000 });
  });

  it('should switch to create step when create option is selected', async () => {
    // Sélectionner l'option "Create new branch" (dernier item)
    selectMockConfig.selectIndex = -1; // Dernier item
    selectMockConfig.delay = 100; // Petit délai pour capturer l'état
    // Empêcher TextInput d'appeler onSubmit automatiquement pour voir l'étape "create"
    textInputMockConfig.autoSubmit = false;

    const { lastFrame } = render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('New branch name');
    }, { timeout: 3000 });
  });

  it('should validate branch name', async () => {
    // Sélectionner l'option "Create new branch"
    selectMockConfig.selectIndex = -1;

    render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      expect(mockBranchOperationsUseCase.branchExists).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should display error when branch creation fails', async () => {
    selectMockConfig.selectIndex = -1; // Create new branch
    mockBranchOperationsUseCase.createBranch.mockResolvedValue({
      success: false,
      error: 'Failed to create branch',
    });

    const { lastFrame } = render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error');
      expect(output).toContain('Failed to create branch');
    }, { timeout: 3000 });
  });

  it('should display error when checkout fails', async () => {
    selectMockConfig.selectIndex = 1; // Select different branch
    mockBranchOperationsUseCase.checkoutBranch.mockResolvedValue({
      success: false,
      error: 'Failed to checkout branch',
    });

    const { lastFrame } = render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error');
      expect(output).toContain('Failed to checkout branch');
    }, { timeout: 3000 });
  });

  it('should call onComplete with new branch name when branch is created', async () => {
    selectMockConfig.selectIndex = -1; // Create new branch

    render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      expect(mockBranchOperationsUseCase.createBranch).toHaveBeenCalledWith({
        branchName: 'feature/test-branch',
        checkout: true,
      });
      expect(mockOnComplete).toHaveBeenCalledWith('feature/test-branch');
    }, { timeout: 3000 });
  });

  it('should handle exception when loading branches', async () => {
    mockBranchOperationsUseCase.getAllBranches.mockRejectedValue(new Error('Network error'));
    
    // Empêcher le Select de s'exécuter automatiquement
    selectMockConfig.selectIndex = -2;

    const { lastFrame } = render(<BranchSelector onComplete={mockOnComplete} />);

    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      expect(output).toContain('Error');
      expect(output).toContain('Network error');
    }, { timeout: 2000 });
  });
});

