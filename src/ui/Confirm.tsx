import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { colors, createGradient, icons } from "../theme/colors.js";

interface ConfirmProps {
  message: string;
  defaultValue?: boolean;
  onSubmit: (value: boolean) => void;
}

export const Confirm = ({
  message,
  defaultValue = true,
  onSubmit,
}: ConfirmProps) => {
  const [value, setValue] = useState(defaultValue);

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow || input === "h" || input === "l") {
      setValue(!value);
    } else if (input === "y" || input === "Y") {
      setValue(true);
    } else if (input === "n" || input === "N") {
      setValue(false);
    } else if (key.return) {
      onSubmit(value);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>{createGradient.commitMessage(`? ${message}`)}</Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
      >
        {value ? (
          <Box>
            <Text bold>
              {createGradient.commitMessage(`${icons.success} Yes`)}
            </Text>
            <Text dimColor> / No</Text>
          </Box>
        ) : (
          <Box>
            <Text dimColor>Yes / </Text>
            <Text bold>
              {createGradient.commitMessage(`${icons.error} No`)}
            </Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>←→ toggle • y/n quick • h/l vim • enter confirm</Text>
      </Box>
    </Box>
  );
};
