import { Box, Text } from "ink";
import { icons } from "../theme/colors.js";

interface ErrorMessageProps {
  title: string;
  message?: string;
  suggestions?: string[];
}

export const ErrorMessage = ({
  title,
  message,
  suggestions,
}: ErrorMessageProps) => {
  return (
    <Box flexDirection="column" marginY={1}>
      <Box
        borderStyle="round"
        borderColor="red"
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Box marginBottom={message || suggestions ? 1 : 0}>
          <Text bold color="red">
            {icons.error} {title}
          </Text>
        </Box>

        {message && (
          <Box marginBottom={suggestions ? 1 : 0}>
            <Text dimColor>{message}</Text>
          </Box>
        )}

        {suggestions && suggestions.length > 0 && (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color="yellow">
                {icons.info} Suggestions:
              </Text>
            </Box>
            {suggestions.map((suggestion, index) => (
              <Box key={`suggestion-${index}-${suggestion.substring(0, 20)}`}>
                <Text color="yellow">{icons.pointer}</Text>
                <Text dimColor> {suggestion}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
