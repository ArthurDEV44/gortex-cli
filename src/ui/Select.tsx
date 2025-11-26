import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { colors, createGradient, icons } from "../theme/colors.js";

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

export const Select = ({
  message,
  items,
  initialIndex = 0,
  onSelect,
}: SelectProps) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelect(items[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>{createGradient.commitMessage(`? ${message}`)}</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={1}
        paddingY={1}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={index} flexDirection="column">
              <Box>
                {isSelected ? (
                  <Text bold>
                    {createGradient.commitMessage(`${icons.pointer} `)}
                  </Text>
                ) : (
                  <Text dimColor> </Text>
                )}
                <Text bold={isSelected}>
                  {isSelected
                    ? createGradient.commitMessage(item.label)
                    : item.label}
                </Text>
              </Box>
              {isSelected && item.description && (
                <Box marginLeft={2} marginTop={0}>
                  <Text dimColor italic>
                    {item.description}
                  </Text>
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
