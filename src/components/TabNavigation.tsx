import { Box, Text, useInput } from "ink";
import { colors, createGradient, icons } from "../theme/colors.js";

export type TabId = "commit" | "stats";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "commit",
    label: "Commit",
    icon: icons.commit,
    description: "Create commits with AI or manually",
  },
  {
    id: "stats",
    label: "Stats",
    icon: icons.stats,
    description: "View repository commit statistics",
  },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  disabled?: boolean;
}

export const TabNavigation = ({
  activeTab,
  onTabChange,
  disabled = false,
}: TabNavigationProps) => {
  useInput((input, key) => {
    // Don't handle input if navigation is disabled
    if (disabled) return;
    if (key.tab || key.rightArrow || input === "l") {
      // Next tab
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      const nextIndex = (currentIndex + 1) % TABS.length;
      onTabChange(TABS[nextIndex].id);
    } else if (key.leftArrow || input === "h") {
      // Previous tab
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      onTabChange(TABS[prevIndex].id);
    } else if (input === "1") {
      onTabChange("commit");
    } else if (input === "2") {
      onTabChange("stats");
    }
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Tab Headers */}
      <Box>
        {TABS.map((tab, _index) => {
          const isActive = tab.id === activeTab;
          return (
            <Box key={tab.id} marginRight={1}>
              <Box
                borderStyle="round"
                borderColor={isActive ? colors.primary : colors.muted}
                paddingX={2}
                paddingY={0}
              >
                {isActive ? (
                  <Text bold color={colors.primary}>
                    {createGradient.flow(`${tab.icon} ${tab.label}`)}
                  </Text>
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
        <Text dimColor>←→ switch tabs • h/l vim • tab next • 1-2 direct</Text>
      </Box>
    </Box>
  );
};
