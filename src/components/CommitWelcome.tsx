import { Box, Text, useInput } from "ink";
import { colors, createGradient, icons } from "../theme/colors.js";

interface CommitWelcomeProps {
  onStart: () => void;
}

export const CommitWelcome = ({ onStart }: CommitWelcomeProps) => {
  useInput((input, key) => {
    if (key.return || input === " ") {
      onStart();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="round"
        borderColor={colors.border}
        paddingX={3}
        paddingY={2}
        flexDirection="column"
      >
        <Box justifyContent="center" marginBottom={2}>
          <Text bold>
            {createGradient.commitMessage(
              `${icons.commit} Create a Conventional Commit`,
            )}
          </Text>
        </Box>

        <Box flexDirection="column" marginBottom={2}>
          <Box marginBottom={1}>
            <Text>
              {createGradient.titanium(
                "This workflow will guide you through creating a commit:",
              )}
            </Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>
              {createGradient.titanium(
                `${icons.branch} Select or create a branch`,
              )}
            </Text>
            <Text>
              {createGradient.titanium(
                `${icons.fileChanged} Choose files to stage`,
              )}
            </Text>
            <Text>
              {createGradient.titanium(
                `${icons.step} Generate commit message (AI or Manual)`,
              )}
            </Text>
            <Text>
              {createGradient.titanium(`${icons.success} Confirm and commit`)}
            </Text>
            <Text>
              {createGradient.titanium(
                `${icons.push} Push to remote (optional)`,
              )}
            </Text>
          </Box>
        </Box>

        <Box marginTop={1} marginBottom={1} justifyContent="center">
          <Box
            borderStyle="round"
            borderColor={colors.border}
            paddingX={2}
            paddingY={0}
          >
            <Text bold>
              {createGradient.commitMessage("Press Enter or Space to start")}
            </Text>
          </Box>
        </Box>

        <Box marginTop={1} justifyContent="center">
          <Text>
            {createGradient.titanium(
              "You can switch to the Stats tab anytime using ←/→ or 1/2",
            )}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
