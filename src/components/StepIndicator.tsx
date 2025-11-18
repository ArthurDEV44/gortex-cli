import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';

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
  const barWidth = 30;
  const filledWidth = Math.round((barWidth * progress) / 100);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Gradient name="cristal">
          <Text bold>
            {icon} {stepName}
          </Text>
        </Gradient>
        <Text dimColor> [{currentStep}/{totalSteps}]</Text>
      </Box>

      <Box>
        <Box width={barWidth} borderStyle="round" borderColor="gray" paddingX={1}>
          <Gradient name="passion">
            <Text>{'█'.repeat(filledWidth)}</Text>
          </Gradient>
          <Text dimColor>{'░'.repeat(barWidth - filledWidth)}</Text>
        </Box>
        <Box marginLeft={1}>
          <Text color="cyan" bold>{Math.round(progress)}%</Text>
        </Box>
      </Box>
    </Box>
  );
};
