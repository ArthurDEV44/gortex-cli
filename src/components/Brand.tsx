import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

interface BrandProps {
  variant?: 'large' | 'small';
  tagline?: boolean;
}

export const Brand: React.FC<BrandProps> = ({ variant = 'small', tagline = false }) => {
  if (variant === 'large') {
    return (
      <Box flexDirection="column" alignItems="center" marginY={1}>
        <Gradient name="cristal">
          <BigText text="GORTEX" font="tiny" />
        </Gradient>
        {tagline && (
          <Box marginTop={1}>
            <Gradient name="passion">
              <Text>⚡ Git Workflow, Elevated ⚡</Text>
            </Gradient>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box marginBottom={1}>
      <Gradient name="cristal">
        <Text bold>▸ GORTEX</Text>
      </Gradient>
      <Text dimColor> | Git Workflow CLI</Text>
    </Box>
  );
};
