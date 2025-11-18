import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Gradient from 'ink-gradient';

export interface SelectItem {
  label: string;
  value: string;
  description?: string;
}

interface SelectProps {
  message: string;
  items: SelectItem[];
  initialIndex?: number;
  onSelect: (item: SelectItem) => void;
}

export const Select: React.FC<SelectProps> = ({ message, items, initialIndex = 0, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelect(items[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Gradient name="cristal">
          <Text bold>? {message}</Text>
        </Gradient>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
        paddingY={1}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={index} flexDirection="column">
              <Box>
                {isSelected ? (
                  <Gradient name="passion">
                    <Text bold>❯ </Text>
                  </Gradient>
                ) : (
                  <Text dimColor>  </Text>
                )}
                <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                  {item.label}
                </Text>
              </Box>
              {isSelected && item.description && (
                <Box marginLeft={2} marginTop={0}>
                  <Text dimColor italic>{item.description}</Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate • enter select • j/k vim keys</Text>
      </Box>
    </Box>
  );
};
