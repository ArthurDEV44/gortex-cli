import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';

interface FileDiffPreviewProps {
  files: Array<{
    path: string;
    status: string;
  }>;
  maxDisplay?: number;
}

export const FileDiffPreview: React.FC<FileDiffPreviewProps> = ({ files, maxDisplay = 5 }) => {
  const statusIcons: Record<string, { icon: string; color: string }> = {
    nouveau: { icon: '✚', color: 'green' },
    modifié: { icon: '●', color: 'yellow' },
    supprimé: { icon: '✖', color: 'red' },
  };

  const displayFiles = files.slice(0, maxDisplay);
  const remaining = files.length - maxDisplay;

  return (
    <Box flexDirection="column" marginY={1}>
      <Box marginBottom={1}>
        <Gradient name="cristal">
          <Text bold>📝 Changed Files</Text>
        </Gradient>
        <Text dimColor> ({files.length} total)</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
        paddingY={1}
      >
        {displayFiles.map((file, i) => {
          const statusInfo = statusIcons[file.status] || { icon: '●', color: 'gray' };
          return (
            <Box key={i}>
              <Text color={statusInfo.color as any}>{statusInfo.icon}</Text>
              <Text dimColor> {file.status.padEnd(10)}</Text>
              <Text>{file.path}</Text>
            </Box>
          );
        })}

        {remaining > 0 && (
          <Box marginTop={1}>
            <Text dimColor italic>... and {remaining} more file{remaining > 1 ? 's' : ''}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
