import { Box, Text } from "ink";
import { createGradient, icons } from "../theme/colors.js";
import { generateCompactLogo, generateLogo } from "../utils/logo.js";

interface BrandProps {
  variant?: "large" | "small";
  tagline?: boolean;
}

export const Brand = ({ variant = "small", tagline = false }: BrandProps) => {
  if (variant === "large") {
    const logoText = generateLogo("GORTEX", "large");
    const logoLines = logoText
      .split("\n")
      .filter((line) => line.trim().length > 0);

    return (
      <Box flexDirection="column" alignItems="center" marginY={1}>
        <Box flexDirection="column" alignItems="center">
          {logoLines.map((line, index) => (
            <Text key={index}>{createGradient.titanium(line)}</Text>
          ))}
        </Box>
        {tagline && (
          <Box marginTop={1}>
            <Text>
              {createGradient.nebula(
                `${icons.star} Git Workflow, Elevated ${icons.star}`,
              )}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  // Version compacte pour le workflow
  const compactLogo = generateCompactLogo();
  const compactLines = compactLogo
    .split("\n")
    .filter((line) => line.trim().length > 0);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="column">
        {compactLines.map((line, index) => (
          <Text key={index}>{createGradient.flow(line)}</Text>
        ))}
      </Box>
      <Box marginTop={0}>
        <Text dimColor>
          {icons.square} Git Workflow CLI {icons.star}
        </Text>
      </Box>
    </Box>
  );
};
