import React from 'react';
import { Box, Text } from 'ink';

interface ErrorMessageProps {
  title: string;
  message?: string;
  suggestions?: string[];
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ title, message, suggestions }) => {
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
          <Text bold color="red">✖ {title}</Text>
        </Box>

        {message && (
          <Box marginBottom={suggestions ? 1 : 0}>
            <Text dimColor>{message}</Text>
          </Box>
        )}

        {suggestions && suggestions.length > 0 && (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color="yellow">💡 Suggestions:</Text>
            </Box>
            {suggestions.map((suggestion, i) => (
              <Box key={i}>
                <Text color="yellow">▸</Text>
                <Text dimColor> {suggestion}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
