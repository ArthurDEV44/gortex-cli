import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { colors, createGradient, icons } from "../theme/colors.js";

interface SuccessMessageProps {
  title: string;
  subtitle?: string;
  details?: string[];
  icon?: string;
}

export const SuccessMessage = ({
  title,
  subtitle,
  details,
  icon = icons.success,
}: SuccessMessageProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Box flexDirection="column" marginY={1}>
      <Box
        borderStyle="round"
        borderColor={colors.success}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Box marginBottom={1} justifyContent="center">
          <Text bold color={colors.success}>
            {createGradient.nebula(`${icon} ${title}`)}
          </Text>
        </Box>

        {subtitle && (
          <Box justifyContent="center" marginBottom={details ? 1 : 0}>
            <Text dimColor>{subtitle}</Text>
          </Box>
        )}

        {details && details.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {details.map((detail, index) => (
              <Box key={`detail-${index}-${detail.substring(0, 20)}`}>
                <Text color={colors.success}>{icons.pointer}</Text>
                <Text dimColor> {detail}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
