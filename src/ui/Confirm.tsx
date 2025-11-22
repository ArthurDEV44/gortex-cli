import { Box, Text, useInput } from "ink";
import Gradient from "ink-gradient";
import { useState } from "react";
import { icons } from "../theme/colors.js";

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
        <Gradient name="cristal">
          <Text bold>? {message}</Text>
        </Gradient>
      </Box>

      <Box
        borderStyle="round"
        borderColor={value ? "green" : "red"}
        paddingX={2}
        paddingY={1}
      >
        {value ? (
          <Box>
            <Gradient name="summer">
              <Text bold>{icons.success} Yes</Text>
            </Gradient>
            <Text dimColor> / No</Text>
          </Box>
        ) : (
          <Box>
            <Text dimColor>Yes / </Text>
            <Text color="red" bold>
              {icons.error} No
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
