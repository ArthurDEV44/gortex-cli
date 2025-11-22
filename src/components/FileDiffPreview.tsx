import { Box, Text } from "ink";
import Gradient from "ink-gradient";
import { icons } from "../theme/colors.js";

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
    nouveau: { icon: icons.fileAdded, color: "green" },
    modifié: { icon: icons.fileChanged, color: "yellow" },
    supprimé: { icon: icons.fileDeleted, color: "red" },
  };

  const displayFiles = files.slice(0, maxDisplay);
  const remaining = files.length - maxDisplay;

  return (
    <Box flexDirection="column" marginY={1}>
      <Box marginBottom={1}>
        <Gradient name="cristal">
          <Text bold>{icons.fileChanged} Changed Files</Text>
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
        {displayFiles.map((file) => {
          const statusInfo = statusIcons[file.status] || {
            icon: "●",
            color: "gray",
          };
          return (
            <Box key={file.path}>
              <Text
                color={
                  statusInfo.color as
                    | "green"
                    | "yellow"
                    | "red"
                    | "blue"
                    | "gray"
                }
              >
                {statusInfo.icon}
              </Text>
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
