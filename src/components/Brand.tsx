import { Box, Text } from "ink";
import { createGradient, icons } from "../theme/colors.js";

interface BrandProps {
  variant?: "large" | "small";
  tagline?: boolean;
}

export const Brand = ({ variant = "small", tagline = false }: BrandProps) => {
  if (variant === "large") {
    return (
      <Box flexDirection="column" alignItems="center" marginY={1}>
        <Text>{createGradient.dune("GORTEX")}</Text>
        {tagline && (
          <Box marginTop={1}>
            <Text>
              {createGradient.warmth(
                `${icons.spice} Git Workflow, Elevated ${icons.spice}`,
              )}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box marginBottom={1}>
      <Text bold>{createGradient.spice(`${icons.pointer} GORTEX`)}</Text>
      <Text dimColor> {icons.desert} Git Workflow CLI</Text>
    </Box>
  );
};
