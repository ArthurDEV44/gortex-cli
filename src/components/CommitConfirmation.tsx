import React, { useState } from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { Confirm } from '../ui/index.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { stageFiles, createCommit } from '../utils/git.js';

interface CommitConfirmationProps {
  message: string;
  files: string[];
  onComplete: (success: boolean) => void;
}

export const CommitConfirmation: React.FC<CommitConfirmationProps> = ({
  message,
  files,
  onComplete,
}) => {
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      onComplete(false);
      return;
    }

    setCommitting(true);

    try {
      await stageFiles(files);
      await createCommit(message);
      onComplete(true);
    } catch (err: any) {
      setError(err.message);
      setCommitting(false);
    }
  };

  if (committing) {
    return <LoadingSpinner message="Creating commit..." variant="success" />;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">✖ Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Box marginBottom={1}>
          <Gradient name="cristal">
            <Text bold>📋 Commit Preview</Text>
          </Gradient>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>Files ({files.length}):</Text>
          {files.slice(0, 3).map((file, i) => (
            <Box key={i} marginLeft={2}>
              <Text color="green">✓</Text>
              <Text dimColor> {file}</Text>
            </Box>
          ))}
          {files.length > 3 && (
            <Box marginLeft={2}>
              <Text dimColor italic>... and {files.length - 3} more</Text>
            </Box>
          )}
        </Box>

        <Box flexDirection="column">
          <Text dimColor>Message:</Text>
          <Box marginLeft={2} marginTop={1}>
            <Gradient name="passion">
              <Text bold>{message.split('\n')[0]}</Text>
            </Gradient>
          </Box>
          {message.split('\n').length > 1 && (
            <Box marginLeft={2} marginTop={1}>
              <Text dimColor>{message.split('\n').slice(1).join('\n').trim()}</Text>
            </Box>
          )}
        </Box>
      </Box>

      <Confirm message="Create this commit?" defaultValue={true} onSubmit={handleConfirm} />
    </Box>
  );
};
