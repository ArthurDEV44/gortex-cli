import React, { useState } from 'react';
import { Box } from 'ink';
import { Brand } from './Brand.js';
import { TabNavigation, type TabId } from './TabNavigation.js';
import { CredentialsTab } from './CredentialsTab.js';
import { CommitTab } from './CommitTab.js';
import type { CommitConfig, AIConfig } from '../types.js';

interface Props {
  config: CommitConfig;
}

export const InteractiveWorkflow: React.FC<Props> = ({ config: initialConfig }) => {
  const [activeTab, setActiveTab] = useState<TabId>('commit');
  const [config, setConfig] = useState<CommitConfig>(initialConfig);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  const handleConfigUpdate = (aiConfig: AIConfig) => {
    setConfig({
      ...config,
      ai: aiConfig,
    });
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Brand */}
      <Brand variant="small" />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <Box marginTop={1}>
        {activeTab === 'credentials' && (
          <CredentialsTab onConfigUpdate={handleConfigUpdate} />
        )}

        {activeTab === 'commit' && (
          <CommitTab config={config} />
        )}
      </Box>
    </Box>
  );
};
