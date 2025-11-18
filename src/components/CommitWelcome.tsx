import React from 'react';
import { Box, Text, useInput } from 'ink';
import Gradient from 'ink-gradient';
import { colors, createGradient, icons } from '../theme/colors.js';

interface CommitWelcomeProps {
  onStart: () => void;
}

export const CommitWelcome: React.FC<CommitWelcomeProps> = ({ onStart }) => {
  useInput((input, key) => {
    if (key.return || input === ' ') {
      onStart();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="round"
        borderColor={colors.primary}
        paddingX={3}
        paddingY={2}
        flexDirection="column"
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color={colors.primary}>
            {createGradient.warmth(`${icons.commit} Create a Conventional Commit`)}
          </Text>
        </Box>

        <Box flexDirection="column" marginTop={1} marginBottom={1}>
          <Text dimColor>
            This workflow will guide you through creating a commit:
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>  {icons.branch} Select or create a branch</Text>
            <Text dimColor>  {icons.fileChanged} Choose files to stage</Text>
            <Text dimColor>  {icons.step} Generate commit message (AI or Manual)</Text>
            <Text dimColor>  {icons.success} Confirm and commit</Text>
            <Text dimColor>  {icons.push} Push to remote (optional)</Text>
          </Box>
        </Box>

        <Box marginTop={1} justifyContent="center">
          <Box
            borderStyle="round"
            borderColor={colors.success}
            paddingX={2}
            paddingY={0}
          >
            <Text bold color={colors.success}>Press Enter or Space to start</Text>
          </Box>
        </Box>

        <Box marginTop={1} justifyContent="center">
          <Text dimColor>
            You can switch to the Stats tab anytime using ←/→ or 1/2
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
