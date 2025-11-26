import { Box, Text } from "ink";
import { colors, createGradient, icons } from "../theme/colors.js";

interface FileDiffPreviewProps {
  files: Array<{
    path: string;
    status: string;
  }>;
  maxDisplay?: number;
}

export const FileDiffPreview = ({
  files,
  maxDisplay = 5,
}: FileDiffPreviewProps) => {
  const statusIcons: Record<string, { icon: string; color: string }> = {
    nouveau: { icon: icons.fileAdded, color: colors.success },
    modifié: { icon: icons.fileChanged, color: colors.warning },
    supprimé: { icon: icons.fileDeleted, color: colors.error },
  };

  const displayFiles = files.slice(0, maxDisplay);
  const remaining = files.length - maxDisplay;

  return (
    <Box flexDirection="column" marginY={1}>
      <Box marginBottom={1}>
        <Text bold>
          {createGradient.commitMessage(`${icons.fileChanged} Changed Files`)}
        </Text>
        <Text dimColor> ({files.length} total)</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={1}
        paddingY={1}
      >
        {displayFiles.map((file) => {
          const statusInfo = statusIcons[file.status] || {
            icon: "●",
            color: colors.muted,
          };
          return (
            <Box key={file.path}>
              <Text color={statusInfo.color}>{statusInfo.icon}</Text>
              <Text dimColor> {file.status.padEnd(10)}</Text>
              <Text>{file.path}</Text>
            </Box>
          );
        })}

        {remaining > 0 && (
          <Box marginTop={1}>
            <Text dimColor italic>
              ... and {remaining} more file{remaining > 1 ? "s" : ""}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
