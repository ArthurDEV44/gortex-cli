import React, { useState } from 'react';
import { Box } from 'ink';
import { Brand } from './Brand.js';
import { CommitTab } from './CommitTab.js';
import type { CommitConfig } from '../types.js';

interface Props {
  config: CommitConfig;
}

export const InteractiveWorkflow: React.FC<Props> = ({ config: initialConfig }) => {
  const [config] = useState<CommitConfig>(initialConfig);

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Brand */}
      <Brand variant="small" />

      {/* Tab Content */}
      <Box marginTop={1}>
        <CommitTab config={config} />
      </Box>
    </Box>
  );
};
