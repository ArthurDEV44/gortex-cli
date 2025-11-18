import React from 'react';
import { Box, Text, useInput } from 'ink';
import Gradient from 'ink-gradient';

export type TabId = 'credentials' | 'commit';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'credentials',
    label: 'Credentials',
    icon: '🔑',
    description: 'Configure AI API keys',
  },
  {
    id: 'commit',
    label: 'Commit',
    icon: '📝',
    description: 'Create commits with AI or manually',
  },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  useInput((input, key) => {
    if (key.tab || key.rightArrow || input === 'l') {
      // Next tab
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      const nextIndex = (currentIndex + 1) % TABS.length;
      onTabChange(TABS[nextIndex].id);
    } else if (key.leftArrow || input === 'h') {
      // Previous tab
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      onTabChange(TABS[prevIndex].id);
    } else if (input === '1') {
      onTabChange('credentials');
    } else if (input === '2') {
      onTabChange('commit');
    }
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Tab Headers */}
      <Box>
        {TABS.map((tab, index) => {
          const isActive = tab.id === activeTab;
          return (
            <Box key={tab.id} marginRight={1}>
              <Box
                borderStyle="round"
                borderColor={isActive ? 'cyan' : 'gray'}
                paddingX={2}
                paddingY={0}
              >
                {isActive ? (
                  <Gradient name="cristal">
                    <Text bold>
                      {tab.icon} {tab.label}
                    </Text>
                  </Gradient>
                ) : (
                  <Text dimColor>
                    {tab.icon} {tab.label}
                  </Text>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Active Tab Description */}
      <Box marginTop={1}>
        <Text dimColor>
          {TABS.find((t) => t.id === activeTab)?.description}
        </Text>
      </Box>

      {/* Navigation Help */}
      <Box marginTop={1}>
        <Text dimColor>
          ←→ switch tabs • h/l vim • tab next • 1-2 direct
        </Text>
      </Box>
    </Box>
  );
};
