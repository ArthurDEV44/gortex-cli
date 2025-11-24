import { Box, Text } from "ink";
import { useState } from "react";
import { CommitMessageMapper } from "../application/mappers/CommitMessageMapper.js";
import { useCreateCommit } from "../infrastructure/di/hooks.js";
import { colors, createGradient, icons } from "../theme/colors.js";
import { Confirm } from "../ui/index.js";
import { LoadingSpinner } from "./LoadingSpinner.js";

interface CommitConfirmationProps {
  message: string;
  files: string[];
  onComplete: (success: boolean) => void;
}

export const CommitConfirmation = ({
  message,
  files,
  onComplete,
}: CommitConfirmationProps) => {
  const createCommitUseCase = useCreateCommit();

  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      onComplete(false);
      return;
    }

    setCommitting(true);

    try {
      // Files are already staged in CommitTab, no need to stage again
      // Just create the commit with the staged files

      // Parse formatted message string to DTO
      const messageDTO = CommitMessageMapper.fromFormattedString(message);

      // Create commit using clean architecture use case
      const commitResult = await createCommitUseCase.execute({
        message: messageDTO,
      });
      if (!commitResult.success) {
        setError(commitResult.error || "Failed to create commit");
        setCommitting(false);
        return;
      }

      onComplete(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setCommitting(false);
    }
  };

  if (committing) {
    return <LoadingSpinner message="Creating commit..." variant="success" />;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color={colors.error}>
          {icons.error} Error: {error}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.info}
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Box marginBottom={1}>
          <Text bold>
            {createGradient.titanium(`${icons.file} Commit Preview`)}
          </Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>Files ({files.length}):</Text>
          {files.slice(0, 3).map((file) => (
            <Box key={file} marginLeft={2}>
              <Text color={colors.success}>{icons.success}</Text>
              <Text dimColor> {file}</Text>
            </Box>
          ))}
          {files.length > 3 && (
            <Box marginLeft={2}>
              <Text dimColor italic>
                ... and {files.length - 3} more
              </Text>
            </Box>
          )}
        </Box>

        <Box flexDirection="column">
          <Text dimColor>Message:</Text>
          <Box marginLeft={2} marginTop={1}>
            <Text bold>{createGradient.flow(message.split("\n")[0])}</Text>
          </Box>
          {message.split("\n").length > 1 && (
            <Box marginLeft={2} marginTop={1}>
              <Text dimColor>
                {message.split("\n").slice(1).join("\n").trim()}
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      <Confirm
        message="Create this commit?"
        defaultValue={true}
        onSubmit={handleConfirm}
      />
    </Box>
  );
};
