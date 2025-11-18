import React, { useState } from 'react';
import { Box } from 'ink';
import { Brand } from './Brand.js';
import { TabNavigation, type TabId } from './TabNavigation.js';
import { CommitTab } from './CommitTab.js';
import { StatsTab } from './StatsTab.js';
import type { CommitConfig } from '../types.js';

interface Props {
  config: CommitConfig;
}

export const InteractiveWorkflow: React.FC<Props> = ({ config: initialConfig }) => {
  const [activeTab, setActiveTab] = useState<TabId>('commit');
  const [config] = useState<CommitConfig>(initialConfig);
  const [isCommitWorkflowActive, setIsCommitWorkflowActive] = useState(true);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  const handleWorkflowStateChange = (isInWorkflow: boolean) => {
    setIsCommitWorkflowActive(isInWorkflow);
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Brand */}
      <Brand variant="small" />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        disabled={activeTab === 'commit' && isCommitWorkflowActive}
      />

      {/* Tab Content */}
      <Box marginTop={1}>
        {activeTab === 'commit' && (
          <CommitTab
            config={config}
            onWorkflowStateChange={handleWorkflowStateChange}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab />
        )}
      </Box>
    </Box>
  );
};
