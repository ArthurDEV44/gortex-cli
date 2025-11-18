import React from 'react';
import { Box, Text } from 'ink';
import { colors, createGradient } from '../theme/colors.js';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  icon?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepName,
  icon = '●',
}) => {
  const progress = (currentStep / totalSteps) * 100;
  const barWidth = 25;
  const filledWidth = Math.round((barWidth * progress) / 100);
  const emptyWidth = barWidth - filledWidth;

  // Créer la barre complète en une seule ligne
  const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold>
          {createGradient.spice(`${icon} ${stepName}`)}
        </Text>
        <Text dimColor> [{currentStep}/{totalSteps}]</Text>
      </Box>

      <Box>
        <Box borderStyle="round" borderColor={colors.muted} paddingX={1}>
          <Text>
            {createGradient.warmth(progressBar)}
          </Text>
        </Box>
        <Box marginLeft={1}>
          <Text color={colors.primary} bold>{Math.round(progress)}%</Text>
        </Box>
      </Box>
    </Box>
  );
};
