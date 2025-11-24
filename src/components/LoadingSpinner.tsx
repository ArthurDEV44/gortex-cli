import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { colors } from "../theme/colors.js";

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
    <Box>
      <Box marginRight={1}>
        <Text color={color}>
          <Spinner type="dots" />
        </Text>
      </Box>
      <Text dimColor>{message}</Text>
    </Box>
  );
};
