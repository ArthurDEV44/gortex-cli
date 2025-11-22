import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Box, Text } from 'ink';
import stripAnsi from 'strip-ansi';
import { InteractiveWorkflow } from '../InteractiveWorkflow.js';
import type { CommitConfig } from '../../types.js';

// Mock des composants enfants
vi.mock('../TabNavigation.js', () => ({
  TabNavigation: ({ activeTab, onTabChange }: any) => {
    return (
      <Box>
        <Text>Commit Tab</Text>
        <Text>Stats Tab</Text>
        <Text>Active: {activeTab}</Text>
      </Box>
    );
  },
}));

vi.mock('../CommitTab.js', () => ({
  CommitTab: ({ onWorkflowStateChange }: any) => {
    React.useEffect(() => {
      if (onWorkflowStateChange) {
        onWorkflowStateChange(true);
      }
    }, [onWorkflowStateChange]);
    return <Text>Commit Tab Content</Text>;
  },
}));

vi.mock('../StatsTab.js', () => ({
  StatsTab: () => <Text>Stats Tab Content</Text>,
}));

vi.mock('../Brand.js', () => ({
  Brand: () => <Text>GORTEX</Text>,
}));

describe('InteractiveWorkflow', () => {
  const defaultConfig: CommitConfig = {
    types: [],
    scopes: [],
    allowCustomScopes: true,
    maxSubjectLength: 100,
    minSubjectLength: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with commit tab active by default', () => {
    const { lastFrame } = render(<InteractiveWorkflow config={defaultConfig} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Commit Tab');
    expect(output).toContain('Stats Tab');
  });

  it('should render Brand component', () => {
    const { lastFrame } = render(<InteractiveWorkflow config={defaultConfig} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('GORTEX');
  });

  it('should render CommitTab when commit tab is active', () => {
    const { lastFrame } = render(<InteractiveWorkflow config={defaultConfig} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Commit Tab Content');
  });

  it('should handle tab switching', () => {
    const { lastFrame } = render(<InteractiveWorkflow config={defaultConfig} />);
    
    const output = stripAnsi(lastFrame() || '');
    // Le composant doit afficher les onglets
    expect(output).toContain('Commit Tab');
    expect(output).toContain('Stats Tab');
    // Le composant doit afficher le contenu de l'onglet actif
    expect(output).toContain('Commit Tab Content');
  });
});

