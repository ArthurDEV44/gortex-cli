import { Box, Text } from "ink";
import Gradient from "ink-gradient";
import InkTextInput from "ink-text-input";
import { useState } from "react";
import { icons } from "../theme/colors.js";

interface TextInputProps {
  message: string;
  placeholder?: string;
  defaultValue?: string;
  validate?: (value: string) => string | true | Promise<string | true>;
  onSubmit: (value: string) => void;
}

export const TextInput = ({
  message,
  placeholder = "",
  defaultValue = "",
  validate,
  onSubmit,
}: TextInputProps) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (submittedValue: string) => {
    if (validate) {
      const result = await validate(submittedValue);
      if (result !== true) {
        setError(result);
        return;
      }
    }
    setError(null);
    onSubmit(submittedValue);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Gradient name="cristal">
          <Text bold>? {message}</Text>
        </Gradient>
      </Box>

      <Box
        borderStyle="round"
        borderColor={error ? "red" : "cyan"}
        paddingX={1}
        paddingY={1}
      >
        <Gradient name="passion">
          <Text bold>{icons.pointer} </Text>
        </Gradient>
        <InkTextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder={placeholder}
        />
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">
            {icons.error} {error}
          </Text>
        </Box>
      )}

      {!error && (
        <Box marginTop={1}>
          <Text dimColor>enter submit • esc cancel</Text>
        </Box>
      )}
    </Box>
  );
};
