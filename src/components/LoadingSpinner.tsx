import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';

interface LoadingSpinnerProps {
  message?: string;
  variant?: 'primary' | 'success' | 'warning';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  variant = 'primary',
}) => {
  const gradientName = variant === 'success' ? 'summer' : variant === 'warning' ? 'fruit' : 'cristal';

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
