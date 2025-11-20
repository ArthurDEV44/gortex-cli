import { Box, Text } from "ink";
import Gradient from "ink-gradient";
import Spinner from "ink-spinner";

interface LoadingSpinnerProps {
  message?: string;
  variant?: "primary" | "success" | "warning";
}

export const LoadingSpinner = ({
  message = "Loading...",
  variant = "primary",
}: LoadingSpinnerProps) => {
  const gradientName =
    variant === "success"
      ? "summer"
      : variant === "warning"
        ? "fruit"
        : "cristal";

  return (
    <Box>
      <Box marginRight={1}>
        <Gradient name={gradientName}>
          <Spinner type="dots" />
        </Gradient>
      </Box>
      <Text dimColor>{message}</Text>
    </Box>
  );
};
