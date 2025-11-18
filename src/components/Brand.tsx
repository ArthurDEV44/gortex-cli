import React from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import { createGradient, icons } from '../theme/colors.js';

interface BrandProps {
  variant?: 'large' | 'small';
  tagline?: boolean;
}

export const Brand: React.FC<BrandProps> = ({ variant = 'small', tagline = false }) => {
  if (variant === 'large') {
    return (
      <Box flexDirection="column" alignItems="center" marginY={1}>
        <Text>
          {createGradient.dune('GORTEX')}
        </Text>
        {tagline && (
          <Box marginTop={1}>
            <Text>
              {createGradient.warmth(`${icons.spice} Git Workflow, Elevated ${icons.spice}`)}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box marginBottom={1}>
      <Text bold>
        {createGradient.spice(`${icons.pointer} GORTEX`)}
      </Text>
      <Text dimColor> {icons.desert} Git Workflow CLI</Text>
    </Box>
  );
};
