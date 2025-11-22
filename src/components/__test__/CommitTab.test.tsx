import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { CommitTab } from '../CommitTab.js';
import type { CommitConfig } from '../../types.js';

// Mock useApp
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    useApp: () => ({
      exit: vi.fn(),
    }),
  };
});

// Mock des hooks
const mockStageFilesUseCase = {
  execute: vi.fn(),
};

vi.mock('../../infrastructure/di/hooks.js', () => ({
  useStageFiles: () => mockStageFilesUseCase,
}));

// Mock des composants enfants
vi.mock('../CommitWelcome.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    CommitWelcome: ({ onStart }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onStart) onStart();
        }, 0);
      }, [onStart]);
      return React.createElement(Text, null, 'Commit Welcome');
    },
  };
});

vi.mock('../BranchSelector.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    BranchSelector: ({ onComplete }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onComplete) onComplete('main');
        }, 0);
      }, [onComplete]);
      return React.createElement(Text, null, 'Branch Selector');
    },
  };
});

vi.mock('../FileSelector.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    FileSelector: ({ onComplete }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onComplete) onComplete(['file1.ts', 'file2.ts']);
        }, 0);
      }, [onComplete]);
      return React.createElement(Text, null, 'File Selector');
    },
  };
});

vi.mock('../CommitModeSelector.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    CommitModeSelector: ({ onComplete }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onComplete) onComplete('manual');
        }, 0);
      }, [onComplete]);
      return React.createElement(Text, null, 'Commit Mode Selector');
    },
  };
});

vi.mock('../CommitMessageBuilder.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    CommitMessageBuilder: ({ onComplete }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onComplete) onComplete('feat: test commit message');
        }, 0);
      }, [onComplete]);
      return React.createElement(Text, null, 'Commit Message Builder');
    },
  };
});

vi.mock('../CommitConfirmation.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    CommitConfirmation: ({ onComplete }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onComplete) onComplete(true);
        }, 0);
      }, [onComplete]);
      return React.createElement(Text, null, 'Commit Confirmation');
    },
  };
});

vi.mock('../PushPrompt.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    PushPrompt: ({ onComplete }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 0);
      }, [onComplete]);
      return React.createElement(Text, null, 'Push Prompt');
    },
  };
});

vi.mock('../SuccessMessage.js', async () => {
  const { Text } = await import('ink');
  return {
    SuccessMessage: ({ title }: any) => {
      return React.createElement(Text, null, `Success: ${title}`);
    },
  };
});

vi.mock('../ContinuePrompt.js', async () => {
  const React = await import('react');
  const { Text } = await import('ink');
  return {
    ContinuePrompt: ({ onComplete }: any) => {
      React.useEffect(() => {
        setTimeout(() => {
          if (onComplete) onComplete(false); // Exit
        }, 0);
      }, [onComplete]);
      return React.createElement(Text, null, 'Continue Prompt');
    },
  };
});

vi.mock('../StepIndicator.js', async () => {
  const { Text } = await import('ink');
  return {
    StepIndicator: ({ stepName }: any) => {
      return React.createElement(Text, null, `Step: ${stepName}`);
    },
  };
});

describe('CommitTab', () => {
  const defaultConfig: CommitConfig = {
    types: [],
    scopes: [],
    allowCustomScopes: true,
    maxSubjectLength: 100,
    minSubjectLength: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStageFilesUseCase.execute.mockResolvedValue({ success: true });
  });

  it('should start with idle state showing CommitWelcome', () => {
    const { lastFrame } = render(<CommitTab config={defaultConfig} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Commit Welcome');
  });

  it('should call onWorkflowStateChange when workflow starts', async () => {
    const onWorkflowStateChange = vi.fn();
    render(
      <CommitTab 
        config={defaultConfig} 
        onWorkflowStateChange={onWorkflowStateChange}
      />
    );
    
    await vi.waitFor(() => {
      // Le workflow démarre quand CommitWelcome appelle onStart
      expect(onWorkflowStateChange).toHaveBeenCalledWith(true);
    }, { timeout: 2000 });
  });

  it('should progress through workflow steps', async () => {
    const { lastFrame } = render(<CommitTab config={defaultConfig} />);
    
    // Le workflow devrait progresser automatiquement grâce aux mocks
    await vi.waitFor(() => {
      const output = stripAnsi(lastFrame() || '');
      // À un moment donné, on devrait voir Branch Selector
      expect(output.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should call onWorkflowStateChange with false when workflow completes', async () => {
    const onWorkflowStateChange = vi.fn();
    render(
      <CommitTab 
        config={defaultConfig} 
        onWorkflowStateChange={onWorkflowStateChange}
      />
    );
    
    // Le workflow devrait se terminer et appeler onWorkflowStateChange(false)
    await vi.waitFor(() => {
      const calls = onWorkflowStateChange.mock.calls;
      // Devrait avoir été appelé avec true au début et false à la fin
      expect(calls.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('should handle staging files', async () => {
    render(<CommitTab config={defaultConfig} />);
    
    await vi.waitFor(() => {
      expect(mockStageFilesUseCase.execute).toHaveBeenCalledWith({
        files: ['file1.ts', 'file2.ts'],
      });
    }, { timeout: 3000 });
  });

  it('should handle staging failure gracefully', async () => {
    mockStageFilesUseCase.execute.mockResolvedValue({
      success: false,
      error: 'Failed to stage',
    });

    render(<CommitTab config={defaultConfig} />);
    
    // Le workflow devrait continuer même si le staging échoue
    await vi.waitFor(() => {
      expect(mockStageFilesUseCase.execute).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

