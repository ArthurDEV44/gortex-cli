import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';

interface SuccessMessageProps {
  title: string;
  subtitle?: string;
  details?: string[];
  icon?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  subtitle,
  details,
  icon = '✓',
}) => {
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
        borderColor="green"
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Box marginBottom={1} justifyContent="center">
          <Gradient name="summer">
            <Text bold>
              {icon} {title}
            </Text>
          </Gradient>
        </Box>

        {subtitle && (
          <Box justifyContent="center" marginBottom={details ? 1 : 0}>
            <Text dimColor>{subtitle}</Text>
          </Box>
        )}

        {details && details.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {details.map((detail, i) => (
              <Box key={i}>
                <Text color="green">▸</Text>
                <Text dimColor> {detail}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
