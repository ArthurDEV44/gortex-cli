import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { colors, createGradient, icons } from "../theme/colors.js";

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
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Box marginBottom={1}>
          <Text bold>
            {createGradient.commitMessage(`${icons.question} What's next?`)}
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text dimColor>Choose an option:</Text>
        </Box>

        <Box flexDirection="column">
          <Box>
            {selected === "continue" ? (
              <Text bold>
                {createGradient.commitMessage(
                  `${icons.pointer} Make another commit`,
                )}
              </Text>
            ) : (
              <Text dimColor> Make another commit</Text>
            )}
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
