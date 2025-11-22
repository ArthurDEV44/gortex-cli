import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { colors, icons } from "../theme/colors.js";

interface ContinuePromptProps {
  onComplete: (shouldContinue: boolean) => void;
}

export const ContinuePrompt = ({ onComplete }: ContinuePromptProps) => {
  const [selected, setSelected] = useState<"continue" | "quit">("continue");

  useInput((input, key) => {
    if (key.return) {
      onComplete(selected === "continue");
      return;
    }

    if (key.leftArrow || key.rightArrow || input === "h" || input === "l") {
      setSelected(selected === "continue" ? "quit" : "continue");
    }
  });

  return (
    <Box flexDirection="column" marginY={1}>
      <Box
        borderStyle="round"
        borderColor={colors.primary}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {icons.question} What's next?
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text dimColor>Choose an option:</Text>
        </Box>

        <Box flexDirection="column" gap={1}>
          <Box>
            <Text
              color={selected === "continue" ? colors.success : colors.muted}
            >
              {selected === "continue" ? icons.pointer : " "} Make another
              commit
            </Text>
          </Box>
          <Box>
            <Text color={selected === "quit" ? colors.error : colors.muted}>
              {selected === "quit" ? icons.pointer : " "} Exit
            </Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>Use ←/→ or h/l to select, Enter to confirm</Text>
        </Box>
      </Box>
    </Box>
  );
};
