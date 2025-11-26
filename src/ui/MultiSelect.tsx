import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { colors, createGradient, icons } from "../theme/colors.js";

export interface MultiSelectItem {
  label: string;
  value: string;
  checked?: boolean;
  description?: string;
}

interface MultiSelectProps {
  message: string;
  items: MultiSelectItem[];
  onSubmit: (selected: string[]) => void;
  minSelection?: number;
}

export const MultiSelect = ({
  message,
  items: initialItems,
  onSubmit,
  minSelection = 1,
}: MultiSelectProps) => {
  const [items, setItems] = useState<MultiSelectItem[]>(
    initialItems.map((item) => ({ ...item, checked: item.checked ?? false })),
  );
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setCursor((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (key.downArrow || input === "j") {
      setCursor((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (input === " ") {
      setItems((prev) =>
        prev.map((item, i) =>
          i === cursor ? { ...item, checked: !item.checked } : item,
        ),
      );
    } else if (key.return) {
      const selected = items
        .filter((item) => item.checked)
        .map((item) => item.value);
      if (selected.length >= minSelection) {
        onSubmit(selected);
      }
    } else if (input === "a") {
      // Select all
      setItems((prev) => prev.map((item) => ({ ...item, checked: true })));
    } else if (input === "i") {
      // Invert selection
      setItems((prev) =>
        prev.map((item) => ({ ...item, checked: !item.checked })),
      );
    }
  });

  const selectedCount = items.filter((item) => item.checked).length;
  const isValid = selectedCount >= minSelection;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>{createGradient.commitMessage(`? ${message}`)}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Selected: </Text>
        <Text color={isValid ? colors.success : colors.warning} bold>
          {selectedCount}
        </Text>
        <Text dimColor> / {items.length}</Text>
        {!isValid && <Text color={colors.warning}> (min: {minSelection})</Text>}
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={1}
        paddingY={1}
      >
        {items.map((item, i) => {
          const isCursor = i === cursor;
          return (
            <Box key={i} flexDirection="column">
              <Box>
                {isCursor ? (
                  <Text bold>
                    {createGradient.commitMessage(`${icons.pointer} `)}
                  </Text>
                ) : (
                  <Text dimColor> </Text>
                )}
                <Text color={item.checked ? colors.success : undefined}>
                  {item.checked ? "◉ " : "◯ "}
                </Text>
                <Text bold={isCursor}>
                  {isCursor
                    ? createGradient.commitMessage(item.label)
                    : item.label}
                </Text>
              </Box>
              {isCursor && item.description && (
                <Box marginLeft={4} marginTop={0}>
                  <Text dimColor italic>
                    {item.description}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>↑↓ navigate • space toggle • enter submit</Text>
        <Text dimColor>a select all • i invert • j/k vim keys</Text>
      </Box>
    </Box>
  );
};
