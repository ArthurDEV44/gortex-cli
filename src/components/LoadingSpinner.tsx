import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { colors } from "../theme/colors.js";

interface LoadingSpinnerProps {
  message?: string;
  variant?: "primary" | "success" | "warning";
}

// Planète en rotation - Animation fluide et élégante
const rotatingSphere = [
  // Frame 1 - Vue face (continents visibles)
  [
    "                          ",
    "       ░░▓▓░░             ",
    "     ░░▓████▓░░           ",
    "     ░▓███▓▓███▓░         ",
    "    ░▓██▓░░░▓██▓░         ",
    "     ░▓███▓▓███▓░         ",
    "     ░░▓████▓░░           ",
    "       ░░▓▓░░             ",
    "                          ",
  ],
  // Frame 2 - Rotation 45° (transition)
  [
    "                          ",
    "      ░▓▓▓░░░             ",
    "    ░▓████▓▓░░            ",
    "    ░▓███▓░▓███▓░         ",
    "    ▓██▓░░░░▓██▓░         ",
    "    ░▓███▓░▓███▓░         ",
    "    ░░▓████▓▓░░           ",
    "      ░░░▓▓▓░             ",
    "                          ",
  ],
  // Frame 3 - Vue profil (ligne équatoriale)
  [
    "                          ",
    "      ▓▓▓▓░░░             ",
    "    ▓████▓▓░░░            ",
    "    ▓███▓░░▓███▓░         ",
    "    ██▓░░░░░▓███░         ",
    "    ▓███▓░░▓███▓░         ",
    "    ▓████▓▓░░░            ",
    "      ▓▓▓▓░░░             ",
    "                          ",
  ],
  // Frame 4 - Rotation 135° (autre hémisphère)
  [
    "                          ",
    "      ░░░▓▓▓▓             ",
    "    ░░░▓▓████▓            ",
    "    ░▓███▓░▓███▓          ",
    "    ░███▓░░░░▓██          ",
    "    ░▓███▓░▓███▓          ",
    "    ░░░▓▓████▓            ",
    "      ░░░▓▓▓▓             ",
    "                          ",
  ],
  // Frame 5 - Vue arrière (océans)
  [
    "                          ",
    "      ░░░░▓▓░░            ",
    "    ░░░▓▓▓▓▓▓░░           ",
    "    ░░▓███▓▓███▓░░        ",
    "    ░▓██▓░░░▓██▓░         ",
    "    ░░▓███▓▓███▓░░        ",
    "    ░░░▓▓▓▓▓▓░░           ",
    "      ░░░▓▓░░             ",
    "                          ",
  ],
  // Frame 6 - Retour rotation 225°
  [
    "                          ",
    "      ░░░▓▓▓░             ",
    "    ░░▓▓████▓░            ",
    "    ░▓███▓░███▓▓          ",
    "    ░██▓░░░░▓██▓          ",
    "    ░▓███▓░███▓▓          ",
    "    ░░▓▓████▓░            ",
    "      ░░░▓▓▓░             ",
    "                          ",
  ],
  // Frame 7 - Retour graduel
  [
    "                          ",
    "      ░░▓▓▓░░             ",
    "    ░▓████▓░░░            ",
    "    ░▓███▓▓███▓░          ",
    "    ▓██▓░░░▓██▓░          ",
    "    ░▓███▓▓███▓░          ",
    "    ░▓████▓░░░            ",
    "      ░░▓▓▓░░             ",
    "                          ",
  ],
  // Frame 8 - Presque revenu au début
  [
    "                          ",
    "       ░▓▓░░░             ",
    "     ░▓███▓░░░            ",
    "     ░▓███▓███▓░          ",
    "    ░▓██▓░░▓██▓░          ",
    "     ░▓███▓███▓░          ",
    "     ░▓███▓░░░            ",
    "       ░▓▓░░░             ",
    "                          ",
  ],
];

// Couleurs du gradient: #4796e2 → #6680de → #8c77c8 → #c66678
const gradientColors = ["#4796e2", "#6680de", "#8c77c8", "#c66678"];

export const LoadingSpinner = ({
  message = "Loading...",
  variant = "primary",
}: LoadingSpinnerProps) => {
  const [frameIndex, setFrameIndex] = useState(0);

  const _color =
    variant === "success"
      ? colors.success
      : variant === "warning"
        ? colors.warning
        : colors.primary;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % rotatingSphere.length);
    }, 350);

    return () => clearInterval(interval);
  }, []);

  const currentFrame = rotatingSphere[frameIndex];

  // Fonction pour obtenir la couleur du gradient en fonction de l'index de ligne
  const getGradientColor = (lineIndex: number, totalLines: number) => {
    const position = lineIndex / totalLines;
    const colorIndex = Math.min(
      Math.floor(position * gradientColors.length),
      gradientColors.length - 1,
    );
    return gradientColors[colorIndex];
  };

  return (
    <Box flexDirection="column" alignItems="center">
      {/* Planète avec gradient */}
      <Box flexDirection="column" marginBottom={1}>
        {currentFrame.map((line, index) => (
          <Text
            key={index}
            color={getGradientColor(index, currentFrame.length)}
          >
            {line}
          </Text>
        ))}
      </Box>

      {/* Message avec style minimaliste */}
      <Box>
        <Text dimColor>▸ {message}</Text>
      </Box>
    </Box>
  );
};
