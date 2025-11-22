import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Box, Text } from 'ink';
import stripAnsi from 'strip-ansi';
import { CommitWorkflow } from '../CommitWorkflow.js';

// Mock des composants enfants
vi.mock('../Brand.js', () => ({
  Brand: () => <Text>GORTEX</Text>,
}));

vi.mock('../StepIndicator.js', () => ({
  StepIndicator: ({ stepName }: any) => <Text>Step: {stepName}</Text>,
}));

vi.mock('../BranchSelector.js', () => ({
  BranchSelector: ({ onComplete }: any) => {
    React.useEffect(() => {
      // Simuler la sélection d'une branche après un court délai
      setTimeout(() => {
        if (onComplete) onComplete('main');
      }, 0);
    }, [onComplete]);
    return <Text>Branch Selector</Text>;
  },
}));

vi.mock('../FileSelector.js', () => ({
  FileSelector: ({ onComplete }: any) => {
    React.useEffect(() => {
      setTimeout(() => {
        if (onComplete) onComplete(['file1.ts', 'file2.ts']);
      }, 0);
    }, [onComplete]);
    return <Text>File Selector</Text>;
  },
}));

vi.mock('../CommitMessageBuilder.js', () => ({
  CommitMessageBuilder: ({ onComplete }: any) => {
    React.useEffect(() => {
      setTimeout(() => {
        if (onComplete) onComplete('feat: test commit message');
      }, 0);
    }, [onComplete]);
    return <Text>Commit Message Builder</Text>;
  },
}));

vi.mock('../CommitConfirmation.js', () => ({
  CommitConfirmation: ({ onComplete }: any) => {
    React.useEffect(() => {
      setTimeout(() => {
        if (onComplete) onComplete(true);
      }, 0);
    }, [onComplete]);
    return <Text>Commit Confirmation</Text>;
  },
}));

vi.mock('../PushPrompt.js', () => ({
  PushPrompt: ({ onComplete }: any) => {
    React.useEffect(() => {
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 0);
    }, [onComplete]);
    return <Text>Push Prompt</Text>;
  },
}));

vi.mock('../SuccessMessage.js', () => ({
  SuccessMessage: ({ title }: any) => <Text>Success: {title}</Text>,
}));

vi.mock('../ErrorMessage.js', () => ({
  ErrorMessage: ({ title }: any) => <Text>Error: {title}</Text>,
}));

describe('CommitWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Brand component', () => {
    const { lastFrame } = render(<CommitWorkflow />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('GORTEX');
  });

  it('should start with branch selection step', () => {
    const { lastFrame } = render(<CommitWorkflow />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Branch Selector');
  });

  it('should display step indicator', () => {
    const { lastFrame } = render(<CommitWorkflow />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Step:');
  });
});

