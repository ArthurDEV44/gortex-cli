import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { colors } from "../theme/colors.js";

/**
 * Standard Loading Spinner
 *
 * Simple, elegant loading spinner using the classic "dots8Bit" animation.
 * Used for standard loading states across the application (branches, files, commits).
 *
 * @see AgenticLoadingAnimation for the premium animation used in Agentic AI workflow
 */
interface LoadingSpinnerProps {
  message?: string;
  variant?: "primary" | "success" | "warning";
}

export const LoadingSpinner = ({
  message = "Loading...",
  variant = "primary",
}: LoadingSpinnerProps) => {
  const color =
    variant === "success"
      ? colors.success
      : variant === "warning"
        ? colors.warning
        : colors.primary;

  return (
    <Box flexDirection="row" gap={1}>
      <Text color={color}>
        <Spinner type="dots8Bit" />
      </Text>
      <Text>{message}</Text>
    </Box>
  );
};
